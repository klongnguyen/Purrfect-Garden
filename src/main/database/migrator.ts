import Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import { migration001, type MigrationDefinition } from './migrations/001_initial_schema';

const MIGRATIONS: readonly MigrationDefinition[] = [migration001];

export interface MigrationResult {
  appliedVersions: number[];
  currentVersion: number;
}

export function runMigrations(db: Database.Database): MigrationResult {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db
    .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
    .all() as Array<{ version: number }>;
  const appliedSet = new Set(appliedRows.map((row) => row.version));
  const appliedVersions: number[] = [];

  const applyAll = db.transaction(() => {
    const nowIso = new Date().toISOString();

    for (const migration of MIGRATIONS) {
      if (!appliedSet.has(migration.version)) {
        db.exec(migration.sql);
        db.prepare(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
        ).run(migration.version, migration.name, nowIso);
        appliedVersions.push(migration.version);
      }
    }

    seedDefaultData(db, nowIso);
  });

  applyAll();

  const latestRow = db
    .prepare('SELECT COALESCE(MAX(version), 0) AS currentVersion FROM schema_migrations')
    .get() as { currentVersion: number };

  return {
    appliedVersions,
    currentVersion: latestRow.currentVersion
  };
}

function seedDefaultData(db: Database.Database, nowIso: string): void {
  const { pomodoro, customTimer, focusRules, garden } = DEFAULT_BALANCE_CONFIG;

  db.prepare(`
    INSERT OR IGNORE INTO timer_preferences (
      id,
      default_mode,
      pomodoro_work_minutes,
      pomodoro_short_break_minutes,
      pomodoro_long_break_minutes,
      pomodoro_cycles_before_long_break,
      auto_start_breaks,
      auto_start_work,
      custom_default_minutes,
      early_stop_min_xp_seconds,
      sound_on_complete,
      updated_at
    ) VALUES (1, 'pomodoro', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    pomodoro.workMinutes,
    pomodoro.shortBreakMinutes,
    pomodoro.longBreakMinutes,
    pomodoro.cyclesBeforeLongBreak,
    pomodoro.autoStartBreaks ? 1 : 0,
    pomodoro.autoStartWork ? 1 : 0,
    customTimer.defaultMinutes,
    focusRules.earlyStopMinXpSeconds,
    nowIso
  );

  db.prepare(`
    INSERT OR IGNORE INTO music_preferences (
      id,
      active_playlist_id,
      master_volume,
      shuffle_enabled,
      fade_out_on_session_end,
      ambience_mix_json,
      favorite_track_ids_json,
      updated_at
    ) VALUES (1, NULL, 0.7, 0, 1, '{}', '[]', ?)
  `).run(nowIso);

  db.prepare(`
    INSERT OR IGNORE INTO streak_state (
      id,
      current_streak,
      longest_streak,
      last_qualified_date,
      streak_freezes_owned,
      updated_at
    ) VALUES (1, 0, 0, NULL, 0, ?)
  `).run(nowIso);

  db.prepare(`
    INSERT OR IGNORE INTO garden_area_definitions (
      id,
      name,
      theme,
      description,
      grid_width,
      grid_height,
      unlock_xp_cost,
      unlock_condition_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'meadow_starter',
    'Sunlit Meadow',
    'spring_meadow',
    'A bright, peaceful starter meadow ready to grow alongside your focus habit.',
    garden.initialGridWidth,
    garden.initialGridHeight,
    0,
    null
  );

  db.prepare(`
    INSERT OR IGNORE INTO user_gardens (
      id,
      area_definition_id,
      custom_name,
      is_unlocked,
      unlocked_at,
      is_active_view
    ) VALUES (?, ?, ?, 1, ?, 1)
  `).run('user_garden_starter', 'meadow_starter', 'My Cozy Meadow', nowIso);

  const insertGoalTemplate = db.prepare(`
    INSERT OR IGNORE INTO goal_templates (
      id, period_type, metric_type, title, target_value, reward_xp, reward_item_id, is_active
    ) VALUES (?, 'daily', ?, ?, ?, ?, NULL, 1)
  `);

  const starterGoals: Array<[string, string, string, number, number]> = [
    ['goal_daily_focus_25m', 'focus_minutes', 'Focus for at least 25 minutes today', 25, 15],
    ['goal_daily_sessions_2', 'focus_sessions', 'Complete 2 focus sessions today', 2, 20],
    ['goal_daily_task_1', 'tasks_completed', 'Complete at least 1 task today', 1, 15],
    ['goal_daily_single_20m', 'single_session_minutes', 'Finish a single focus session of 20+ minutes', 20, 20]
  ];

  for (const [id, metric, title, target, rewardXp] of starterGoals) {
    insertGoalTemplate.run(id, metric, title, target, rewardXp);
  }

  const insertItemDef = db.prepare(`
    INSERT OR IGNORE INTO item_definitions (
      id, category, name, description, rarity, xp_cost, sprite_key, tile_width, tile_height, is_placeable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
  `);

  const insertInventoryItem = db.prepare(`
    INSERT OR IGNORE INTO inventory_items (
      item_id, quantity, first_acquired_at, updated_at
    ) VALUES (?, ?, ?, ?)
  `);

  const starterItems: Array<[string, string, string, string, string, number, string, number]> = [
    [
      'item_sprout_pot',
      'plant',
      'Terracotta Sprout',
      'A cheerful little sprout in a warm clay pot.',
      'common',
      15,
      'sprout_pot',
      3
    ],
    [
      'item_sunlit_daisy',
      'plant',
      'Sunlit Daisy',
      'Bright white petals that love morning focus sessions.',
      'common',
      20,
      'sunlit_daisy',
      2
    ],
    [
      'item_lavender_bush',
      'plant',
      'Cozy Lavender',
      'Fragrant purple stems that bring calm to your meadow.',
      'uncommon',
      35,
      'lavender_bush',
      2
    ],
    [
      'item_stepping_stone',
      'decor',
      'Mossy Stepping Stone',
      'Flat garden stone edged with soft green moss.',
      'common',
      10,
      'stepping_stone',
      4
    ],
    [
      'item_wooden_lantern',
      'decor',
      'Warm Garden Lantern',
      'A handcrafted wooden lantern with a gentle glow.',
      'rare',
      45,
      'wooden_lantern',
      1
    ],
    [
      'item_watering_can',
      'tool',
      'Copper Watering Can',
      'A shiny vintage watering can resting on the grass.',
      'uncommon',
      30,
      'watering_can',
      1
    ]
  ];

  for (const [id, category, name, desc, rarity, cost, spriteKey, qty] of starterItems) {
    insertItemDef.run(id, category, name, desc, rarity, cost, spriteKey);
    insertInventoryItem.run(id, qty, nowIso, nowIso);
  }
}

