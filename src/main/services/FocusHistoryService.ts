import type Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  DailyFocusTrendPointDTO,
  DailyHeatmapCellDTO,
  FocusSessionFilterInput,
  FocusSessionHistoryItemDTO,
  FocusSessionStatus,
  FocusStatsSummaryDTO,
  HeatmapIntensityLevel,
  TaskFocusBreakdownDTO,
  TimerMode,
  TimerPhase
} from '@shared/types/domain';

interface AggregateRow {
  total_seconds: number;
  session_count: number;
  longest_seconds: number;
}

interface DailySessionAggregateRow {
  local_date: string;
  valid_focus_seconds: number;
  completed_sessions_count: number;
}

interface TaskBreakdownRow {
  task_id: string | null;
  task_title: string;
  task_category: string;
  total_focus_seconds: number;
  session_count: number;
}

interface SessionHistoryRow {
  id: string;
  mode: TimerMode;
  phase: TimerPhase;
  status: FocusSessionStatus;
  target_seconds: number | null;
  recorded_seconds: number;
  task_id: string | null;
  local_date: string;
  started_at: string;
  ended_at: string | null;
  xp_awarded: number;
  task_title: string | null;
  task_category: string | null;
}

export function shiftLocalDateKey(localDate: string, deltaDays: number): string {
  const parts = localDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) {
    throw new Error(`Invalid localDate format: ${localDate}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = parts;
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeHeatmapIntensity(validFocusSeconds: number): HeatmapIntensityLevel {
  if (validFocusSeconds <= 0) return 0;
  if (validFocusSeconds < 1200) return 1;
  if (validFocusSeconds < 2700) return 2;
  if (validFocusSeconds < 5400) return 3;
  return 4;
}

export class FocusHistoryService {
  constructor(private readonly db: Database.Database) {}

  getStatsSummary(referenceLocalDate: string): FocusStatsSummaryDTO {
    const weekStartDate = shiftLocalDateKey(referenceLocalDate, -6);
    const monthPrefix = referenceLocalDate.slice(0, 7);

    const todayAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS session_count,
          COALESCE(MAX(recorded_seconds), 0) AS longest_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date = ?
      `
      )
      .get(referenceLocalDate) as AggregateRow;

    const weekAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS session_count,
          COALESCE(MAX(recorded_seconds), 0) AS longest_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date BETWEEN ? AND ?
      `
      )
      .get(weekStartDate, referenceLocalDate) as AggregateRow;

    const monthAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS session_count,
          COALESCE(MAX(recorded_seconds), 0) AS longest_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND substr(local_date, 1, 7) = ?
      `
      )
      .get(monthPrefix) as AggregateRow;

    const totalAgg = this.db
      .prepare(
        `
        SELECT
          COALESCE(SUM(recorded_seconds), 0) AS total_seconds,
          COUNT(*) AS session_count,
          COALESCE(MAX(recorded_seconds), 0) AS longest_seconds
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
      `
      )
      .get() as AggregateRow;

    const streakRow = this.db
      .prepare('SELECT current_streak, longest_streak FROM streak_state WHERE id = 1')
      .get() as { current_streak: number; longest_streak: number } | undefined;

    const trendRows = this.db
      .prepare(
        `
        SELECT
          local_date,
          COALESCE(SUM(recorded_seconds), 0) AS valid_focus_seconds,
          COUNT(*) AS completed_sessions_count
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date BETWEEN ? AND ?
        GROUP BY local_date
      `
      )
      .all(weekStartDate, referenceLocalDate) as DailySessionAggregateRow[];

    const trendMap = new Map<string, DailySessionAggregateRow>();
    for (const row of trendRows) {
      trendMap.set(row.local_date, row);
    }

    const recentDailyTrend: DailyFocusTrendPointDTO[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const dateKey = shiftLocalDateKey(weekStartDate, offset);
      const match = trendMap.get(dateKey);
      recentDailyTrend.push({
        localDate: dateKey,
        validFocusSeconds: match?.valid_focus_seconds ?? 0,
        completedSessionsCount: match?.completed_sessions_count ?? 0
      });
    }

    const taskRows = this.db
      .prepare(
        `
        SELECT
          fs.task_id,
          COALESCE(t.title, 'Unassigned Focus') AS task_title,
          COALESCE(t.category, 'General') AS task_category,
          COALESCE(SUM(fs.recorded_seconds), 0) AS total_focus_seconds,
          COUNT(*) AS session_count
        FROM focus_sessions fs
        LEFT JOIN tasks t ON t.id = fs.task_id
        WHERE fs.phase = 'focus' AND fs.status IN ('completed', 'stopped')
        GROUP BY fs.task_id, COALESCE(t.title, 'Unassigned Focus'), COALESCE(t.category, 'General')
        ORDER BY total_focus_seconds DESC
      `
      )
      .all() as TaskBreakdownRow[];

    const taskBreakdown: TaskFocusBreakdownDTO[] = taskRows.map((row) => ({
      taskId: row.task_id,
      taskTitle: row.task_title,
      category: row.task_category,
      totalFocusSeconds: row.total_focus_seconds,
      sessionCount: row.session_count
    }));

    const averageSessionSeconds =
      totalAgg.session_count > 0
        ? Math.round(totalAgg.total_seconds / totalAgg.session_count)
        : 0;

    return {
      referenceLocalDate,
      todayFocusSeconds: todayAgg.total_seconds,
      todaySessionsCount: todayAgg.session_count,
      thisWeekFocusSeconds: weekAgg.total_seconds,
      thisWeekSessionsCount: weekAgg.session_count,
      thisMonthFocusSeconds: monthAgg.total_seconds,
      thisMonthSessionsCount: monthAgg.session_count,
      totalFocusSeconds: totalAgg.total_seconds,
      totalFocusSessionsCount: totalAgg.session_count,
      averageSessionSeconds,
      longestSessionSeconds: totalAgg.longest_seconds,
      currentStreak: streakRow?.current_streak ?? 0,
      longestStreak: streakRow?.longest_streak ?? 0,
      recentDailyTrend,
      taskBreakdown
    };
  }

  listSessions(filter?: FocusSessionFilterInput): FocusSessionHistoryItemDTO[] {
    const limit = Math.max(1, Math.min(500, Math.floor(filter?.limit ?? 50)));
    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (filter?.includeBreaksAndInterrupted) {
      conditions.push("fs.status IN ('completed', 'stopped', 'interrupted')");
    } else {
      conditions.push("fs.phase = 'focus'");
      conditions.push("fs.status IN ('completed', 'stopped')");
    }

    if (filter?.localDate) {
      conditions.push('fs.local_date = ?');
      params.push(filter.localDate);
    }

    if (filter?.taskId) {
      conditions.push('fs.task_id = ?');
      params.push(filter.taskId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    const rows = this.db
      .prepare(
        `
        SELECT
          fs.id,
          fs.mode,
          fs.phase,
          fs.status,
          fs.target_seconds,
          fs.recorded_seconds,
          fs.task_id,
          fs.local_date,
          fs.started_at,
          fs.ended_at,
          fs.xp_awarded,
          t.title AS task_title,
          t.category AS task_category
        FROM focus_sessions fs
        LEFT JOIN tasks t ON t.id = fs.task_id
        ${whereClause}
        ORDER BY fs.started_at DESC, fs.rowid DESC
        LIMIT ?
      `
      )
      .all(...params) as SessionHistoryRow[];

    return rows.map((row) => ({
      id: row.id,
      mode: row.mode,
      phase: row.phase,
      status: row.status,
      targetSeconds: row.target_seconds,
      recordedSeconds: row.recorded_seconds,
      taskId: row.task_id,
      localDate: row.local_date,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      xpAwarded: row.xp_awarded,
      taskTitle: row.task_title,
      taskCategory: row.task_category
    }));
  }

  getHeatmap(endLocalDate: string, daysCount = 84): DailyHeatmapCellDTO[] {
    const clampedDays = Math.max(7, Math.min(365, Math.floor(daysCount)));
    const startDate = shiftLocalDateKey(endLocalDate, -(clampedDays - 1));

    const sessionRows = this.db
      .prepare(
        `
        SELECT
          local_date,
          COALESCE(SUM(recorded_seconds), 0) AS valid_focus_seconds,
          COUNT(*) AS completed_sessions_count
        FROM focus_sessions
        WHERE phase = 'focus'
          AND status IN ('completed', 'stopped')
          AND local_date BETWEEN ? AND ?
        GROUP BY local_date
      `
      )
      .all(startDate, endLocalDate) as DailySessionAggregateRow[];

    const dailyActivityRows = this.db
      .prepare(
        `
        SELECT local_date, streak_qualified
        FROM daily_activities
        WHERE local_date BETWEEN ? AND ?
      `
      )
      .all(startDate, endLocalDate) as Array<{ local_date: string; streak_qualified: number }>;

    const sessionMap = new Map<string, DailySessionAggregateRow>();
    for (const row of sessionRows) {
      sessionMap.set(row.local_date, row);
    }

    const streakMap = new Map<string, boolean>();
    for (const row of dailyActivityRows) {
      streakMap.set(row.local_date, row.streak_qualified === 1);
    }

    const cells: DailyHeatmapCellDTO[] = [];
    for (let offset = 0; offset < clampedDays; offset++) {
      const dateKey = shiftLocalDateKey(startDate, offset);
      const agg = sessionMap.get(dateKey);
      const validFocusSeconds = agg?.valid_focus_seconds ?? 0;
      const completedSessionsCount = agg?.completed_sessions_count ?? 0;
      const streakQualified =
        streakMap.get(dateKey) === true ||
        validFocusSeconds >= DEFAULT_BALANCE_CONFIG.xp.minStreakDailyFocusSeconds;

      cells.push({
        localDate: dateKey,
        validFocusSeconds,
        completedSessionsCount,
        streakQualified,
        intensityLevel: computeHeatmapIntensity(validFocusSeconds)
      });
    }

    return cells;
  }
}
