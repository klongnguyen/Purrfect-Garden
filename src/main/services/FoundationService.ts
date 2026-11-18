import Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GardenAreaDTO,
  ProgressionOverviewDTO,
  SystemStatusDTO,
  TimerMode,
  TimerPreferencesDTO,
  UpdateTimerPreferencesInput
} from '@shared/types/domain';

interface TimerPrefRow {
  default_mode: TimerMode;
  pomodoro_work_minutes: number;
  pomodoro_short_break_minutes: number;
  pomodoro_long_break_minutes: number;
  pomodoro_cycles_before_long_break: number;
  auto_start_breaks: number;
  auto_start_work: number;
  custom_default_minutes: number;
  early_stop_min_xp_seconds: number;
  sound_on_complete: number;
  updated_at: string;
}

interface GardenAreaRow {
  user_garden_id: string;
  area_definition_id: string;
  name: string;
  custom_name: string;
  theme: string;
  description: string;
  grid_width: number;
  grid_height: number;
  unlock_xp_cost: number | null;
  is_unlocked: number;
  is_active_view: number;
}

const VALID_MODES: readonly TimerMode[] = ['pomodoro', 'stopwatch', 'custom'];

export class FoundationService {
  constructor(
    private readonly db: Database.Database,
    private readonly databasePath = ':memory:'
  ) {}

  getSystemStatus(): SystemStatusDTO {
    const versionRow = this.db
      .prepare('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations')
      .get() as { version: number };

    const tableCountRow = this.db
      .prepare(
        "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .get() as { count: number };

    const journalMode = this.db.pragma('journal_mode', { simple: true });

    return {
      schemaVersion: versionRow.version,
      tableCount: tableCountRow.count,
      walModeEnabled: String(journalMode).toLowerCase() === 'wal',
      databasePath: this.databasePath,
      config: DEFAULT_BALANCE_CONFIG
    };
  }

  getTimerPreferences(): TimerPreferencesDTO {
    const row = this.db
      .prepare('SELECT * FROM timer_preferences WHERE id = 1')
      .get() as TimerPrefRow | undefined;

    if (!row) {
      throw new Error('Timer preferences row (id=1) is missing. Run migrations first.');
    }

    return mapTimerPreferencesRow(row);
  }

  updateTimerPreferences(input: UpdateTimerPreferencesInput): TimerPreferencesDTO {
    const current = this.getTimerPreferences();

    const next: TimerPreferencesDTO = {
      defaultMode: input.defaultMode ?? current.defaultMode,
      pomodoroWorkMinutes: input.pomodoroWorkMinutes ?? current.pomodoroWorkMinutes,
      pomodoroShortBreakMinutes:
        input.pomodoroShortBreakMinutes ?? current.pomodoroShortBreakMinutes,
      pomodoroLongBreakMinutes:
        input.pomodoroLongBreakMinutes ?? current.pomodoroLongBreakMinutes,
      pomodoroCyclesBeforeLongBreak:
        input.pomodoroCyclesBeforeLongBreak ?? current.pomodoroCyclesBeforeLongBreak,
      autoStartBreaks: input.autoStartBreaks ?? current.autoStartBreaks,
      autoStartWork: input.autoStartWork ?? current.autoStartWork,
      customDefaultMinutes: input.customDefaultMinutes ?? current.customDefaultMinutes,
      earlyStopMinXpSeconds: input.earlyStopMinXpSeconds ?? current.earlyStopMinXpSeconds,
      soundOnComplete: input.soundOnComplete ?? current.soundOnComplete,
      updatedAt: new Date().toISOString()
    };

    validateTimerPreferences(next);

    const updateTx = this.db.transaction(() => {
      this.db
        .prepare(
          `
          UPDATE timer_preferences
          SET
            default_mode = ?,
            pomodoro_work_minutes = ?,
            pomodoro_short_break_minutes = ?,
            pomodoro_long_break_minutes = ?,
            pomodoro_cycles_before_long_break = ?,
            auto_start_breaks = ?,
            auto_start_work = ?,
            custom_default_minutes = ?,
            early_stop_min_xp_seconds = ?,
            sound_on_complete = ?,
            updated_at = ?
          WHERE id = 1
        `
        )
        .run(
          next.defaultMode,
          next.pomodoroWorkMinutes,
          next.pomodoroShortBreakMinutes,
          next.pomodoroLongBreakMinutes,
          next.pomodoroCyclesBeforeLongBreak,
          next.autoStartBreaks ? 1 : 0,
          next.autoStartWork ? 1 : 0,
          next.customDefaultMinutes,
          next.earlyStopMinXpSeconds,
          next.soundOnComplete ? 1 : 0,
          next.updatedAt
        );
    });

    updateTx();
    return this.getTimerPreferences();
  }

  getProgressionOverview(localDate: string): ProgressionOverviewDTO {
    const xpRow = this.db
      .prepare('SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1')
      .get() as { balance_after: number } | undefined;

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

    const dailyRow = this.db
      .prepare(
        'SELECT valid_focus_seconds, completed_sessions_count FROM daily_activities WHERE local_date = ?'
      )
      .get(localDate) as
      | { valid_focus_seconds: number; completed_sessions_count: number }
      | undefined;

    return {
      xpBalance: xpRow?.balance_after ?? 0,
      todayFocusSeconds: dailyRow?.valid_focus_seconds ?? 0,
      todaySessionsCount: dailyRow?.completed_sessions_count ?? 0,
      streak: {
        currentStreak: streakRow?.current_streak ?? 0,
        longestStreak: streakRow?.longest_streak ?? 0,
        lastQualifiedDate: streakRow?.last_qualified_date ?? null,
        streakFreezesOwned: streakRow?.streak_freezes_owned ?? 0
      }
    };
  }

  getActiveGardenArea(): GardenAreaDTO {
    const row = this.db
      .prepare(
        `
        SELECT
          ug.id AS user_garden_id,
          gad.id AS area_definition_id,
          gad.name,
          ug.custom_name,
          gad.theme,
          gad.description,
          gad.grid_width,
          gad.grid_height,
          gad.unlock_xp_cost,
          ug.is_unlocked,
          ug.is_active_view
        FROM user_gardens ug
        INNER JOIN garden_area_definitions gad
          ON gad.id = ug.area_definition_id
        ORDER BY ug.is_active_view DESC, ug.unlocked_at ASC
        LIMIT 1
      `
      )
      .get() as GardenAreaRow | undefined;

    if (!row) {
      throw new Error('No garden area found in database. Run migrations first.');
    }

    return {
      userGardenId: row.user_garden_id,
      areaDefinitionId: row.area_definition_id,
      name: row.name,
      customName: row.custom_name,
      theme: row.theme,
      description: row.description,
      gridWidth: row.grid_width,
      gridHeight: row.grid_height,
      baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
      baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
      unlockXpCost: row.unlock_xp_cost,
      isUnlocked: row.is_unlocked === 1,
      isActiveView: row.is_active_view === 1
    };
  }
}

function mapTimerPreferencesRow(row: TimerPrefRow): TimerPreferencesDTO {
  return {
    defaultMode: row.default_mode,
    pomodoroWorkMinutes: row.pomodoro_work_minutes,
    pomodoroShortBreakMinutes: row.pomodoro_short_break_minutes,
    pomodoroLongBreakMinutes: row.pomodoro_long_break_minutes,
    pomodoroCyclesBeforeLongBreak: row.pomodoro_cycles_before_long_break,
    autoStartBreaks: row.auto_start_breaks === 1,
    autoStartWork: row.auto_start_work === 1,
    customDefaultMinutes: row.custom_default_minutes,
    earlyStopMinXpSeconds: row.early_stop_min_xp_seconds,
    soundOnComplete: row.sound_on_complete === 1,
    updatedAt: row.updated_at
  };
}

function validateTimerPreferences(prefs: TimerPreferencesDTO): void {
  if (!VALID_MODES.includes(prefs.defaultMode)) {
    throw new Error(`Invalid timer mode: ${prefs.defaultMode}`);
  }

  assertPositiveInteger(prefs.pomodoroWorkMinutes, 'pomodoroWorkMinutes');
  assertPositiveInteger(prefs.pomodoroShortBreakMinutes, 'pomodoroShortBreakMinutes');
  assertPositiveInteger(prefs.pomodoroLongBreakMinutes, 'pomodoroLongBreakMinutes');
  assertPositiveInteger(
    prefs.pomodoroCyclesBeforeLongBreak,
    'pomodoroCyclesBeforeLongBreak'
  );
  assertPositiveInteger(prefs.customDefaultMinutes, 'customDefaultMinutes');

  if (!Number.isInteger(prefs.earlyStopMinXpSeconds) || prefs.earlyStopMinXpSeconds < 0) {
    throw new Error('earlyStopMinXpSeconds must be a non-negative integer.');
  }
}

function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

