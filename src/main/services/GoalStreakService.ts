import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  ClaimGoalRewardResultDTO,
  DailyGoalItemDTO,
  GoalMetricType,
  StreakOverviewDTO
} from '@shared/types/domain';
import { shiftLocalDateKey } from './FocusHistoryService';

interface GoalTemplateRow {
  id: string;
  metric_type: GoalMetricType;
  title: string;
  target_value: number;
  reward_xp: number;
}

interface GoalInstanceRow {
  id: string;
  template_id: string;
  period_key: string;
  title: string;
  metric_type: GoalMetricType;
  target_value: number;
  current_value: number;
  is_completed: number;
  reward_claimed: number;
  reward_xp: number;
  completed_at: string | null;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export class GoalStreakService {
  constructor(private readonly db: Database.Database) {}

  syncAndGetDailyGoals(localDate: string): DailyGoalItemDTO[] {
    const focusAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS sessions_count,
          COALESCE(MAX(recorded_seconds), 0) AS max_single_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date = ?
      `
      )
      .get(localDate) as {
      total_seconds: number;
      sessions_count: number;
      max_single_seconds: number;
    };

    const dailyRow = this.db
      .prepare('SELECT completed_tasks_count FROM daily_activities WHERE local_date = ?')
      .get(localDate) as { completed_tasks_count: number } | undefined;

    return this.syncAndGetGoalPeriod('daily', localDate, {
      focus_minutes: Math.floor(focusAgg.total_seconds / 60),
      focus_sessions: focusAgg.sessions_count,
      single_session_minutes: Math.floor(focusAgg.max_single_seconds / 60),
      tasks_completed: dailyRow?.completed_tasks_count ?? 0
    });
  }

  syncAndGetWeeklyGoals(localDate: string): DailyGoalItemDTO[] {
    const { weekKey, startDate, endDate } = getWeekDateRange(localDate);

    const focusAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS sessions_count,
          COALESCE(MAX(recorded_seconds), 0) AS max_single_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date BETWEEN ? AND ?
      `
      )
      .get(startDate, endDate) as {
      total_seconds: number;
      sessions_count: number;
      max_single_seconds: number;
    };

    const tasksRow = this.db
      .prepare(
        `
        SELECT COALESCE(SUM(completed_tasks_count), 0) AS total_tasks
        FROM daily_activities
        WHERE local_date BETWEEN ? AND ?
      `
      )
      .get(startDate, endDate) as { total_tasks: number };

    return this.syncAndGetGoalPeriod('weekly', weekKey, {
      focus_minutes: Math.floor(focusAgg.total_seconds / 60),
      focus_sessions: focusAgg.sessions_count,
      single_session_minutes: Math.floor(focusAgg.max_single_seconds / 60),
      tasks_completed: tasksRow.total_tasks
    });
  }

  private syncAndGetGoalPeriod(
    periodType: 'daily' | 'weekly',
    periodKey: string,
    metricValues: Record<GoalMetricType, number>
  ): DailyGoalItemDTO[] {
    const nowIso = new Date().toISOString();

    const syncTx = this.db.transaction(() => {
      const templates = this.db
        .prepare(
          `
          SELECT id, metric_type, title, target_value, reward_xp
          FROM goal_templates
          WHERE period_type = ? AND is_active = 1
          ORDER BY id ASC
        `
        )
        .all(periodType) as GoalTemplateRow[];

      const insertInstance = this.db.prepare(
        `
        INSERT OR IGNORE INTO goal_instances (
          id, template_id, period_type, period_key,
          target_value, current_value, is_completed, reward_claimed, completed_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, NULL)
      `
      );

      for (const tpl of templates) {
        insertInstance.run(randomUUID(), tpl.id, periodType, periodKey, tpl.target_value);
      }

      const instances = this.db
        .prepare(
          `
          SELECT
            gi.id,
            gi.template_id,
            gi.period_key,
            gt.title,
            gt.metric_type,
            gi.target_value,
            gi.current_value,
            gi.is_completed,
            gi.reward_claimed,
            gt.reward_xp,
            gi.completed_at
          FROM goal_instances gi
          INNER JOIN goal_templates gt ON gt.id = gi.template_id
          WHERE gi.period_type = ? AND gi.period_key = ?
          ORDER BY gt.id ASC
        `
        )
        .all(periodType, periodKey) as GoalInstanceRow[];

      const updateInstance = this.db.prepare(
        `
        UPDATE goal_instances
        SET
          current_value = ?,
          is_completed = ?,
          completed_at = ?
        WHERE id = ?
      `
      );

      for (const inst of instances) {
        const rawMetric = metricValues[inst.metric_type] ?? 0;
        const clamped = Math.min(inst.target_value, Math.max(0, rawMetric));
        const reached = rawMetric >= inst.target_value;
        const nextCompleted = inst.reward_claimed === 1 ? 1 : reached ? 1 : 0;
        const nextCompletedAt =
          nextCompleted === 1 ? inst.completed_at ?? nowIso : null;

        updateInstance.run(clamped, nextCompleted, nextCompletedAt, inst.id);
      }
    });

    syncTx();

    const rows = this.db
      .prepare(
        `
        SELECT
          gi.id,
          gi.template_id,
          gi.period_key,
          gt.title,
          gt.metric_type,
          gi.target_value,
          gi.current_value,
          gi.is_completed,
          gi.reward_claimed,
          gt.reward_xp,
          gi.completed_at
        FROM goal_instances gi
        INNER JOIN goal_templates gt ON gt.id = gi.template_id
        WHERE gi.period_type = ? AND gi.period_key = ?
        ORDER BY gt.id ASC
      `
      )
      .all(periodType, periodKey) as GoalInstanceRow[];

    return rows.map(mapGoalRow);
  }

  claimGoalReward(goalInstanceId: string): ClaimGoalRewardResultDTO {
    const nowIso = new Date().toISOString();
    let result: ClaimGoalRewardResultDTO | null = null;

    const claimTx = this.db.transaction(() => {
      const row = this.db
        .prepare(
          `
          SELECT
            gi.id,
            gi.template_id,
            gi.period_key,
            gt.title,
            gt.metric_type,
            gi.target_value,
            gi.current_value,
            gi.is_completed,
            gi.reward_claimed,
            gt.reward_xp,
            gi.completed_at
          FROM goal_instances gi
          INNER JOIN goal_templates gt ON gt.id = gi.template_id
          WHERE gi.id = ?
        `
        )
        .get(goalInstanceId) as GoalInstanceRow | undefined;

      if (!row) {
        throw new Error(`Goal instance not found: ${goalInstanceId}`);
      }
      if (row.is_completed !== 1) {
        throw new Error('Goal is not yet completed.');
      }
      if (row.reward_claimed === 1) {
        throw new Error('Reward has already been claimed for this goal.');
      }

      this.db
        .prepare('UPDATE goal_instances SET reward_claimed = 1 WHERE id = ? AND reward_claimed = 0')
        .run(goalInstanceId);

      const latestXp = this.db
        .prepare(
          'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
        )
        .get() as { balance_after: number } | undefined;

      const prevBalance = latestXp?.balance_after ?? 0;
      const newBalance = prevBalance + row.reward_xp;

      if (row.reward_xp > 0) {
        this.db
          .prepare(
            `
            INSERT INTO xp_transactions (
              id, delta_xp, balance_after, source_type, reference_id, description, created_at
            ) VALUES (?, ?, ?, 'goal_reward', ?, ?, ?)
          `
          )
          .run(
            randomUUID(),
            row.reward_xp,
            newBalance,
            goalInstanceId,
            `Daily goal completed: ${row.title}`,
            nowIso
          );
      }

      const updatedGoal = mapGoalRow({ ...row, reward_claimed: 1 });
      result = {
        goal: updatedGoal,
        xpAwarded: row.reward_xp,
        newXpBalance: newBalance
      };
    });

    claimTx();
    return result!;
  }

  getStreakOverview(localDate: string): StreakOverviewDTO {
    const streakRow = this.db
      .prepare(
        'SELECT current_streak, longest_streak, last_qualified_date, streak_freezes_owned FROM streak_state WHERE id = 1'
      )
      .get() as
      | {
          current_streak: number;
          longest_streak: number;
          last_qualified_date: string | null;
          streak_freezes_owned: number;
        }
      | undefined;

    const focusAgg = this.db
      .prepare(
        `
        SELECT COALESCE(SUM(recorded_seconds), 0) AS today_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date = ?
      `
      )
      .get(localDate) as { today_seconds: number };

    const dailyMinimumSeconds = DEFAULT_BALANCE_CONFIG.xp.minStreakDailyFocusSeconds;
    const todayFocusSeconds = focusAgg.today_seconds;
    const todayQualified = todayFocusSeconds >= dailyMinimumSeconds;

    const lastQualifiedDate = streakRow?.last_qualified_date ?? null;
    const yesterday = shiftLocalDateKey(localDate, -1);

    let effectiveStreak = streakRow?.current_streak ?? 0;
    if (
      lastQualifiedDate !== null &&
      lastQualifiedDate !== localDate &&
      lastQualifiedDate !== yesterday
    ) {
      effectiveStreak = 0;
    }

    const nextMilestoneDays =
      STREAK_MILESTONES.find((m) => m > effectiveStreak) ??
      Math.ceil((effectiveStreak + 1) / 50) * 50;

    return {
      currentStreak: effectiveStreak,
      longestStreak: streakRow?.longest_streak ?? 0,
      lastQualifiedDate,
      streakFreezesOwned: streakRow?.streak_freezes_owned ?? 0,
      todayFocusSeconds,
      dailyMinimumSeconds,
      todayQualified,
      nextMilestoneDays,
      daysToNextMilestone: Math.max(0, nextMilestoneDays - effectiveStreak)
    };
  }
}

function mapGoalRow(row: GoalInstanceRow): DailyGoalItemDTO {
  return {
    id: row.id,
    templateId: row.template_id,
    periodKey: row.period_key,
    title: row.title,
    metricType: row.metric_type,
    targetValue: row.target_value,
    currentValue: row.current_value,
    isCompleted: row.is_completed === 1,
    rewardClaimed: row.reward_claimed === 1,
    rewardXp: row.reward_xp,
    completedAt: row.completed_at
  };
}

export function getWeekDateRange(localDate: string): {
  weekKey: string;
  startDate: string;
  endDate: string;
} {
  const [year, month, day] = localDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utc.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = (dayOfWeek + 6) % 7;
  const startDate = shiftLocalDateKey(localDate, -diffToMonday);
  const endDate = shiftLocalDateKey(startDate, 6);
  return {
    weekKey: `week_${startDate}`,
    startDate,
    endDate
  };
}

