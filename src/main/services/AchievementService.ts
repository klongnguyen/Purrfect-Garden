import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  AchievementCategory,
  AchievementItemDTO,
  AchievementTier,
  ClaimAchievementRewardResultDTO
} from '@shared/types/domain';

interface AchievementRow {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  description: string;
  target_value: number;
  reward_xp: number;
  reward_tickets: number;
  icon_key: string;
  progress_value: number | null;
  is_unlocked: number | null;
  unlocked_at: string | null;
  is_viewed: number | null;
  reward_claimed: number | null;
}

export class AchievementService {
  constructor(private readonly db: Database.Database) {}

  listAchievements(): AchievementItemDTO[] {
    const nowIso = new Date().toISOString();

    const syncTx = this.db.transaction(() => {
      const focusAgg = this.db
        .prepare(
          `
          SELECT
            COUNT(*) AS sessions_count,
            COALESCE(SUM(recorded_seconds), 0) AS total_seconds
          FROM focus_sessions
          WHERE phase = 'focus' AND status IN ('completed', 'stopped')
        `
        )
        .get() as { sessions_count: number; total_seconds: number };

      const streakRow = this.db
        .prepare('SELECT current_streak, longest_streak FROM streak_state WHERE id = 1')
        .get() as { current_streak: number; longest_streak: number } | undefined;

      const placedRow = this.db
        .prepare('SELECT COUNT(*) AS cnt FROM garden_placements')
        .get() as { cnt: number };

      const gardensRow = this.db
        .prepare('SELECT COUNT(*) AS cnt FROM user_gardens WHERE is_unlocked = 1')
        .get() as { cnt: number };

      const itemsRow = this.db
        .prepare('SELECT COUNT(*) AS cnt FROM inventory_items WHERE quantity > 0')
        .get() as { cnt: number };

      const petsRow = this.db
        .prepare('SELECT COUNT(*) AS cnt FROM user_pets')
        .get() as { cnt: number };

      const earlyBirdRow = this.db
        .prepare(
          `
          SELECT COUNT(*) AS cnt
          FROM focus_sessions
          WHERE phase = 'focus'
            AND status IN ('completed', 'stopped')
            AND CAST(substr(started_at, 12, 2) AS INTEGER) BETWEEN 5 AND 11
        `
        )
        .get() as { cnt: number };

      const nightOwlRow = this.db
        .prepare(
          `
          SELECT COUNT(*) AS cnt
          FROM focus_sessions
          WHERE phase = 'focus'
            AND status IN ('completed', 'stopped')
            AND (
              CAST(substr(started_at, 12, 2) AS INTEGER) >= 20
              OR CAST(substr(started_at, 12, 2) AS INTEGER) <= 3
            )
        `
        )
        .get() as { cnt: number };

      const totalFocusMinutes = Math.floor(focusAgg.total_seconds / 60);
      const bestStreak = Math.max(
        streakRow?.current_streak ?? 0,
        streakRow?.longest_streak ?? 0
      );

      const defs = this.db
        .prepare(
          `
          SELECT
            ad.*,
            ua.progress_value,
            ua.is_unlocked,
            ua.unlocked_at,
            ua.is_viewed,
            ua.reward_claimed
          FROM achievement_definitions ad
          LEFT JOIN user_achievements ua ON ua.achievement_id = ad.id
        `
        )
        .all() as AchievementRow[];

      const upsertUserAch = this.db.prepare(
        `
        INSERT INTO user_achievements (
          achievement_id, progress_value, is_unlocked, unlocked_at, is_viewed, reward_claimed
        ) VALUES (?, ?, ?, ?, 0, 0)
        ON CONFLICT(achievement_id) DO UPDATE SET
          progress_value = excluded.progress_value,
          is_unlocked = MAX(user_achievements.is_unlocked, excluded.is_unlocked),
          unlocked_at = COALESCE(user_achievements.unlocked_at, excluded.unlocked_at)
      `
      );

      for (const row of defs) {
        let metric = 0;
        switch (row.category) {
          case 'focus_master':
            metric =
              row.id === 'ach_focus_bronze' ? focusAgg.sessions_count : totalFocusMinutes;
            break;
          case 'consistency':
            metric = bestStreak;
            break;
          case 'green_thumb':
            metric = placedRow.cnt;
            break;
          case 'explorer':
            metric = gardensRow.cnt;
            break;
          case 'collector':
            metric = itemsRow.cnt;
            break;
          case 'pet_lover':
            metric = petsRow.cnt;
            break;
          case 'early_bird':
            metric = earlyBirdRow.cnt;
            break;
          case 'night_owl':
            metric = nightOwlRow.cnt;
            break;
        }

        const clampedProgress = Math.min(row.target_value, Math.max(0, metric));
        const unlockedNow = row.is_unlocked === 1 || metric >= row.target_value;
        const unlockedAt = unlockedNow ? row.unlocked_at ?? nowIso : null;

        upsertUserAch.run(row.id, clampedProgress, unlockedNow ? 1 : 0, unlockedAt);
      }
    });

    syncTx();

    const rows = this.db
      .prepare(
        `
        SELECT
          ad.*,
          ua.progress_value,
          ua.is_unlocked,
          ua.unlocked_at,
          ua.is_viewed,
          ua.reward_claimed
        FROM achievement_definitions ad
        LEFT JOIN user_achievements ua ON ua.achievement_id = ad.id
        ORDER BY
          ad.category ASC,
          CASE ad.tier WHEN 'bronze' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END ASC
      `
      )
      .all() as AchievementRow[];

    return rows.map(mapAchievementRow);
  }

  claimReward(achievementId: string): ClaimAchievementRewardResultDTO {
    this.listAchievements();
    const nowIso = new Date().toISOString();
    let result: ClaimAchievementRewardResultDTO | null = null;

    const claimTx = this.db.transaction(() => {
      const row = this.db
        .prepare(
          `
          SELECT
            ad.*,
            ua.progress_value,
            ua.is_unlocked,
            ua.unlocked_at,
            ua.is_viewed,
            ua.reward_claimed
          FROM achievement_definitions ad
          INNER JOIN user_achievements ua ON ua.achievement_id = ad.id
          WHERE ad.id = ?
        `
        )
        .get(achievementId) as AchievementRow | undefined;

      if (!row) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }
      if (row.is_unlocked !== 1) {
        throw new Error('Achievement is not unlocked yet.');
      }
      if (row.reward_claimed === 1) {
        throw new Error('Achievement reward has already been claimed.');
      }

      this.db
        .prepare(
          `
          UPDATE user_achievements
          SET reward_claimed = 1, is_viewed = 1
          WHERE achievement_id = ? AND reward_claimed = 0
        `
        )
        .run(achievementId);

      const latestXp = this.db
        .prepare(
          'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
        )
        .get() as { balance_after: number } | undefined;
      const currentBalance = latestXp?.balance_after ?? 0;
      const newBalance = currentBalance + row.reward_xp;

      if (row.reward_xp > 0) {
        this.db
          .prepare(
            `
            INSERT INTO xp_transactions (
              id, delta_xp, balance_after, source_type, reference_id, description, created_at
            ) VALUES (?, ?, ?, 'achievement_reward', ?, ?, ?)
          `
          )
          .run(
            randomUUID(),
            row.reward_xp,
            newBalance,
            achievementId,
            `Achievement unlocked: ${row.name}`,
            nowIso
          );
      }

      if (row.reward_tickets > 0) {
        this.db
          .prepare(
            `
            INSERT INTO inventory_items (item_id, quantity, first_acquired_at, updated_at)
            VALUES ('item_gacha_ticket', ?, ?, ?)
            ON CONFLICT(item_id) DO UPDATE SET
              quantity = quantity + excluded.quantity,
              updated_at = excluded.updated_at
          `
          )
          .run(row.reward_tickets, nowIso, nowIso);
      }

      result = {
        achievement: mapAchievementRow({
          ...row,
          is_viewed: 1,
          reward_claimed: 1
        }),
        xpAwarded: row.reward_xp,
        newXpBalance: newBalance
      };
    });

    claimTx();
    return result!;
  }
}

function mapAchievementRow(row: AchievementRow): AchievementItemDTO {
  return {
    id: row.id,
    category: row.category,
    tier: row.tier,
    name: row.name,
    description: row.description,
    targetValue: row.target_value,
    progressValue: row.progress_value ?? 0,
    isUnlocked: row.is_unlocked === 1,
    unlockedAt: row.unlocked_at,
    isViewed: row.is_viewed === 1,
    rewardClaimed: row.reward_claimed === 1,
    rewardXp: row.reward_xp,
    rewardTickets: row.reward_tickets,
    iconKey: row.icon_key
  };
}

