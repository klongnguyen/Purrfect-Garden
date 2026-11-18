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
}

