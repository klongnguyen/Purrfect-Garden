import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import {
  DEFAULT_BALANCE_CONFIG,
  calculateSessionXpReward,
  type BalanceConfig
} from '@shared/config/balanceConfig';
import type {
  FocusCompletionResult,
  FocusSessionDTO,
  FocusSessionStatus,
  SetTimerModeInput,
  StartTimerInput,
  TimerMode,
  TimerPhase,
  TimerStateSnapshot,
  TimerStatus
} from '@shared/types/domain';

export interface ClockProvider {
  nowMonotonicMs(): number;
  nowIsoString(): string;
  localDateKey(): string;
}

export function formatLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const defaultClockProvider: ClockProvider = {
  nowMonotonicMs: () => performance.now(),
  nowIsoString: () => new Date().toISOString(),
  localDateKey: () => formatLocalDateKey(new Date())
};

export interface TimerSupervisorOptions {
  clock?: ClockProvider;
  enableAutoTick?: boolean;
  tickIntervalMs?: number;
  onTick?: (snapshot: TimerStateSnapshot) => void;
  onCompleted?: (result: FocusCompletionResult) => void;
}

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
}

interface FocusSessionRow {
  id: string;
  mode: TimerMode;
  phase: TimerPhase;
  status: FocusSessionStatus;
  target_seconds: number | null;
  recorded_seconds: number;
  last_checkpoint_seconds: number;
  task_id: string | null;
  local_date: string;
  started_at: string;
  ended_at: string | null;
  xp_awarded: number;
}

export class TimerSupervisor {
  private readonly clock: ClockProvider;
  private readonly enableAutoTick: boolean;
  private readonly tickIntervalMs: number;
  private readonly onTickCallback?: (snapshot: TimerStateSnapshot) => void;
  private readonly onCompletedCallback?: (result: FocusCompletionResult) => void;

  private tickHandle: ReturnType<typeof setInterval> | null = null;

  private sessionId: string | null = null;
  private mode: TimerMode = 'pomodoro';
  private phase: TimerPhase = 'focus';
  private status: TimerStatus = 'idle';
  private targetDurationSeconds: number | null = 1500;
  private customDurationMinutes = 30;
  private accumulatedElapsedMs = 0;
  private lastResumedMonotonicMs: number | null = null;
  private lastCheckpointedSeconds = 0;
  private pomodoroCycleCount = 0;
  private linkedTaskId: string | null = null;
  private startedAtIso: string | null = null;
  private pendingRecovery = false;

  constructor(
    private readonly db: Database.Database,
    options: TimerSupervisorOptions = {}
  ) {
    this.clock = options.clock ?? defaultClockProvider;
    this.enableAutoTick = options.enableAutoTick ?? true;
    this.tickIntervalMs = options.tickIntervalMs ?? 250;
    this.onTickCallback = options.onTick;
    this.onCompletedCallback = options.onCompleted;

    const prefs = this.loadPreferences();
    this.mode = prefs.default_mode;
    this.customDurationMinutes = prefs.custom_default_minutes;
    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    this.restoreInterruptedSession();
  }

  getSnapshot(): TimerStateSnapshot {
    const rawElapsedMs = this.getRawElapsedMs();
    const rawElapsedSeconds = Math.floor(rawElapsedMs / 1000);

    const elapsedSeconds =
      this.targetDurationSeconds !== null
        ? Math.min(rawElapsedSeconds, this.targetDurationSeconds)
        : rawElapsedSeconds;

    const remainingSeconds =
      this.targetDurationSeconds !== null
        ? Math.max(0, this.targetDurationSeconds - elapsedSeconds)
        : null;

    return {
      sessionId: this.sessionId,
      mode: this.mode,
      phase: this.phase,
      status: this.status,
      targetDurationSeconds: this.targetDurationSeconds,
      elapsedSeconds,
      remainingSeconds,
      pomodoroCycleCount: this.pomodoroCycleCount,
      linkedTaskId: this.linkedTaskId,
      startedAtIso: this.startedAtIso,
      pendingRecovery: this.pendingRecovery
    };
  }

  syncIdleDurationsFromPreferences(): TimerStateSnapshot {
    if (this.status !== 'idle') {
      return this.getSnapshot();
    }

    const prefs = this.loadPreferences();
    this.customDurationMinutes = prefs.custom_default_minutes;
    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );
    const snapshot = this.getSnapshot();
    this.emitTick(snapshot);
    return snapshot;
  }

  setMode(input: SetTimerModeInput): TimerStateSnapshot {
    if (this.status !== 'idle') {
      throw new Error('Cannot change timer mode while a session is active or paused.');
    }

    const prefs = this.loadPreferences();
    if (input.customDurationMinutes !== undefined) {
      if (!Number.isInteger(input.customDurationMinutes) || input.customDurationMinutes <= 0) {
        throw new Error('Custom duration minutes must be a positive integer.');
      }
      this.customDurationMinutes = input.customDurationMinutes;
    }

    this.mode = input.mode;
    this.phase = 'focus';
    this.accumulatedElapsedMs = 0;
    this.lastResumedMonotonicMs = null;
    this.sessionId = null;
    this.startedAtIso = null;
    this.pendingRecovery = false;
    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    const snapshot = this.getSnapshot();
    this.emitTick(snapshot);
    return snapshot;
  }

  start(input?: StartTimerInput): TimerStateSnapshot {
    if (this.status === 'running') {
      return this.getSnapshot();
    }

    if (this.status === 'paused') {
      if (input?.mode && input.mode !== this.mode) {
        throw new Error('Cannot switch mode while a paused session exists. Stop or reset first.');
      }
      return this.resume();
    }

    const prefs = this.loadPreferences();
    if (input?.mode) {
      this.mode = input.mode;
      this.phase = 'focus';
    }

    if (input?.customDurationMinutes !== undefined) {
      if (!Number.isInteger(input.customDurationMinutes) || input.customDurationMinutes <= 0) {
        throw new Error('Custom duration minutes must be a positive integer.');
      }
      this.customDurationMinutes = input.customDurationMinutes;
    }

    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    const nowIso = this.clock.nowIsoString();
    const localDate = this.clock.localDateKey();
    const sessionId = randomUUID();

    this.sessionId = sessionId;
    this.status = 'running';
    this.accumulatedElapsedMs = 0;
    this.lastResumedMonotonicMs = this.clock.nowMonotonicMs();
    this.lastCheckpointedSeconds = 0;
    this.linkedTaskId = input?.taskId ?? null;
    this.startedAtIso = nowIso;
    this.pendingRecovery = false;

    this.db
      .prepare(
        `
        INSERT INTO focus_sessions (
          id, mode, phase, status, target_seconds,
          recorded_seconds, last_checkpoint_seconds, task_id,
          local_date, started_at, ended_at, xp_awarded, updated_at
        ) VALUES (?, ?, ?, 'active', ?, 0, 0, ?, ?, ?, NULL, 0, ?)
      `
      )
      .run(
        sessionId,
        this.mode,
        this.phase,
        this.targetDurationSeconds,
        this.linkedTaskId,
        localDate,
        nowIso,
        nowIso
      );

    this.startAutoTick();
    const snapshot = this.getSnapshot();
    this.emitTick(snapshot);
    return snapshot;
  }

  pause(reason: 'user' | 'app_exit' | 'system_suspend' = 'user'): TimerStateSnapshot {
    if (this.status !== 'running' || !this.sessionId) {
      return this.getSnapshot();
    }

    this.stopAutoTick();
    this.accumulatedElapsedMs = this.getRawElapsedMs();
    this.lastResumedMonotonicMs = null;
    this.status = 'paused';
    this.pendingRecovery = reason !== 'user';

    const snapshot = this.getSnapshot();
    const nowIso = this.clock.nowIsoString();

    this.db
      .prepare(
        `
        UPDATE focus_sessions
        SET
          status = 'paused',
          recorded_seconds = ?,
          last_checkpoint_seconds = ?,
          updated_at = ?
        WHERE id = ?
      `
      )
      .run(snapshot.elapsedSeconds, snapshot.elapsedSeconds, nowIso, this.sessionId);

    this.lastCheckpointedSeconds = snapshot.elapsedSeconds;
    this.emitTick(snapshot);
    return snapshot;
  }

  resume(): TimerStateSnapshot {
    if (this.status !== 'paused' || !this.sessionId) {
      return this.getSnapshot();
    }

    const nowIso = this.clock.nowIsoString();
    this.status = 'running';
    this.lastResumedMonotonicMs = this.clock.nowMonotonicMs();
    this.pendingRecovery = false;

    this.db
      .prepare(
        `
        UPDATE focus_sessions
        SET status = 'active', updated_at = ?
        WHERE id = ?
      `
      )
      .run(nowIso, this.sessionId);

    this.startAutoTick();
    const snapshot = this.getSnapshot();
    this.emitTick(snapshot);
    return snapshot;
  }

  stop(): FocusCompletionResult {
    if (this.status === 'idle' || !this.sessionId) {
      throw new Error('No active or paused focus session to stop.');
    }

    this.stopAutoTick();
    const snapshot = this.getSnapshot();
    const completedTarget =
      this.targetDurationSeconds !== null &&
      snapshot.elapsedSeconds >= this.targetDurationSeconds;

    return this.finalizeSession(snapshot.elapsedSeconds, completedTarget, false);
  }

  reset(): TimerStateSnapshot {
    this.stopAutoTick();
    const snapshot = this.getSnapshot();
    const nowIso = this.clock.nowIsoString();

    if (this.sessionId) {
      this.db
        .prepare(
          `
          UPDATE focus_sessions
          SET
            status = 'interrupted',
            recorded_seconds = ?,
            last_checkpoint_seconds = ?,
            ended_at = ?,
            xp_awarded = 0,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(
          snapshot.elapsedSeconds,
          snapshot.elapsedSeconds,
          nowIso,
          nowIso,
          this.sessionId
        );
    }

    const prefs = this.loadPreferences();
    this.clearActiveSessionFields();
    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    const nextSnapshot = this.getSnapshot();
    this.emitTick(nextSnapshot);
    return nextSnapshot;
  }

  skipPhase(): TimerStateSnapshot {
    this.stopAutoTick();
    const snapshot = this.getSnapshot();
    const nowIso = this.clock.nowIsoString();

    if (this.sessionId) {
      this.db
        .prepare(
          `
          UPDATE focus_sessions
          SET
            status = 'interrupted',
            recorded_seconds = ?,
            last_checkpoint_seconds = ?,
            ended_at = ?,
            xp_awarded = 0,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(
          snapshot.elapsedSeconds,
          snapshot.elapsedSeconds,
          nowIso,
          nowIso,
          this.sessionId
        );
    }

    const prefs = this.loadPreferences();
    this.clearActiveSessionFields();

    if (this.mode === 'pomodoro') {
      this.phase = this.phase === 'focus' ? 'short_break' : 'focus';
    }

    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    const nextSnapshot = this.getSnapshot();
    this.emitTick(nextSnapshot);
    return nextSnapshot;
  }

  tick(): void {
    if (this.status !== 'running') {
      return;
    }

    const snapshot = this.getSnapshot();

    if (this.sessionId && snapshot.elapsedSeconds - this.lastCheckpointedSeconds >= 15) {
      const nowIso = this.clock.nowIsoString();
      this.db
        .prepare(
          `
          UPDATE focus_sessions
          SET
            recorded_seconds = ?,
            last_checkpoint_seconds = ?,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(snapshot.elapsedSeconds, snapshot.elapsedSeconds, nowIso, this.sessionId);
      this.lastCheckpointedSeconds = snapshot.elapsedSeconds;
    }

    if (
      this.targetDurationSeconds !== null &&
      snapshot.elapsedSeconds >= this.targetDurationSeconds
    ) {
      this.stopAutoTick();
      this.finalizeSession(this.targetDurationSeconds, true, true);
      return;
    }

    this.emitTick(snapshot);
  }

  restoreInterruptedSession(): TimerStateSnapshot | null {
    const activeRows = this.db
      .prepare(
        `
        SELECT *
        FROM focus_sessions
        WHERE status IN ('active', 'paused')
        ORDER BY updated_at DESC, started_at DESC
      `
      )
      .all() as FocusSessionRow[];

    if (activeRows.length === 0) {
      return null;
    }

    const latest = activeRows[0];
    const nowIso = this.clock.nowIsoString();
    const recoveredSeconds = Math.max(latest.recorded_seconds, latest.last_checkpoint_seconds);

    const recoverTx = this.db.transaction(() => {
      for (let i = 1; i < activeRows.length; i++) {
        const stale = activeRows[i];
        this.db
          .prepare(
            `
            UPDATE focus_sessions
            SET status = 'interrupted', ended_at = ?, updated_at = ?
            WHERE id = ?
          `
          )
          .run(nowIso, nowIso, stale.id);
      }

      if (latest.status === 'active') {
        this.db
          .prepare(
            `
            UPDATE focus_sessions
            SET
              status = 'paused',
              recorded_seconds = ?,
              last_checkpoint_seconds = ?,
              updated_at = ?
            WHERE id = ?
          `
          )
          .run(recoveredSeconds, recoveredSeconds, nowIso, latest.id);
      }
    });

    recoverTx();

    this.sessionId = latest.id;
    this.mode = latest.mode;
    this.phase = latest.phase;
    this.status = 'paused';
    this.targetDurationSeconds = latest.target_seconds;
    this.accumulatedElapsedMs = recoveredSeconds * 1000;
    this.lastResumedMonotonicMs = null;
    this.lastCheckpointedSeconds = recoveredSeconds;
    this.linkedTaskId = latest.task_id;
    this.startedAtIso = latest.started_at;
    this.pendingRecovery = true;

    return this.getSnapshot();
  }

  dispose(): void {
    this.stopAutoTick();
  }

  private finalizeSession(
    recordedSeconds: number,
    completedTarget: boolean,
    triggeredByAutoComplete: boolean
  ): FocusCompletionResult {
    const activeSessionId = this.sessionId;
    if (!activeSessionId) {
      throw new Error('Cannot finalize session without an active sessionId.');
    }

    const activePhase = this.phase;
    const activeMode = this.mode;
    const nowIso = this.clock.nowIsoString();
    const localDate = this.clock.localDateKey();
    const prefs = this.loadPreferences();

    const effectiveConfig: BalanceConfig = {
      ...DEFAULT_BALANCE_CONFIG,
      focusRules: {
        ...DEFAULT_BALANCE_CONFIG.focusRules,
        earlyStopMinXpSeconds: prefs.early_stop_min_xp_seconds
      }
    };

    const isFocusPhase = activePhase === 'focus';
    const xpEarned = calculateSessionXpReward(
      recordedSeconds,
      isFocusPhase,
      completedTarget,
      effectiveConfig
    );
    const finalStatus: FocusSessionStatus = completedTarget ? 'completed' : 'stopped';

    let newXpBalance = 0;
    let todayFocusSeconds = 0;
    let currentStreak = 0;

    const finalizeTx = this.db.transaction(() => {
      this.db
        .prepare(
          `
          UPDATE focus_sessions
          SET
            status = ?,
            recorded_seconds = ?,
            last_checkpoint_seconds = ?,
            ended_at = ?,
            xp_awarded = ?,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(
          finalStatus,
          recordedSeconds,
          recordedSeconds,
          nowIso,
          xpEarned,
          nowIso,
          activeSessionId
        );

      if (isFocusPhase) {
        this.db
          .prepare(
            `
            INSERT INTO daily_activities (
              local_date, valid_focus_seconds, completed_sessions_count,
              completed_tasks_count, streak_qualified, updated_at
            ) VALUES (?, ?, 1, 0, 0, ?)
            ON CONFLICT(local_date) DO UPDATE SET
              valid_focus_seconds = valid_focus_seconds + excluded.valid_focus_seconds,
              completed_sessions_count = completed_sessions_count + 1,
              updated_at = excluded.updated_at
          `
          )
          .run(localDate, recordedSeconds, nowIso);

        if (xpEarned > 0) {
          const latestXpRow = this.db
            .prepare(
              'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
            )
            .get() as { balance_after: number } | undefined;
          const prevBalance = latestXpRow?.balance_after ?? 0;
          const updatedBalance = prevBalance + xpEarned;

          this.db
            .prepare(
              `
              INSERT INTO xp_transactions (
                id, delta_xp, balance_after, source_type, reference_id, description, created_at
              ) VALUES (?, ?, ?, 'focus_session', ?, ?, ?)
            `
            )
            .run(
              randomUUID(),
              xpEarned,
              updatedBalance,
              activeSessionId,
              `Focus session (${Math.floor(recordedSeconds / 60)}m)`,
              nowIso
            );
        }

        const dailyRow = this.db
          .prepare(
            'SELECT valid_focus_seconds, streak_qualified FROM daily_activities WHERE local_date = ?'
          )
          .get(localDate) as { valid_focus_seconds: number; streak_qualified: number };

        todayFocusSeconds = dailyRow.valid_focus_seconds;

        if (
          dailyRow.valid_focus_seconds >= DEFAULT_BALANCE_CONFIG.xp.minStreakDailyFocusSeconds &&
          dailyRow.streak_qualified === 0
        ) {
          this.db
            .prepare(
              'UPDATE daily_activities SET streak_qualified = 1, updated_at = ? WHERE local_date = ?'
            )
            .run(nowIso, localDate);

          const streakRow = this.db
            .prepare(
              'SELECT current_streak, longest_streak, last_qualified_date FROM streak_state WHERE id = 1'
            )
            .get() as {
            current_streak: number;
            longest_streak: number;
            last_qualified_date: string | null;
          };

          const yesterday = getYesterdayDateKey(localDate);
          let nextStreak = 1;
          if (streakRow.last_qualified_date === localDate) {
            nextStreak = streakRow.current_streak;
          } else if (streakRow.last_qualified_date === yesterday) {
            nextStreak = streakRow.current_streak + 1;
          }
          const nextLongest = Math.max(streakRow.longest_streak, nextStreak);

          this.db
            .prepare(
              `
              UPDATE streak_state
              SET
                current_streak = ?,
                longest_streak = ?,
                last_qualified_date = ?,
                updated_at = ?
              WHERE id = 1
            `
            )
            .run(nextStreak, nextLongest, localDate, nowIso);
        }
      }

      const balanceRow = this.db
        .prepare(
          'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
        )
        .get() as { balance_after: number } | undefined;
      newXpBalance = balanceRow?.balance_after ?? 0;

      const todayRow = this.db
        .prepare('SELECT valid_focus_seconds FROM daily_activities WHERE local_date = ?')
        .get(localDate) as { valid_focus_seconds: number } | undefined;
      todayFocusSeconds = todayRow?.valid_focus_seconds ?? 0;

      const streakAfterRow = this.db
        .prepare('SELECT current_streak FROM streak_state WHERE id = 1')
        .get() as { current_streak: number } | undefined;
      currentStreak = streakAfterRow?.current_streak ?? 0;
    });

    finalizeTx();

    const savedRow = this.db
      .prepare('SELECT * FROM focus_sessions WHERE id = ?')
      .get(activeSessionId) as FocusSessionRow;

    const sessionDto: FocusSessionDTO = {
      id: savedRow.id,
      mode: savedRow.mode,
      phase: savedRow.phase,
      status: savedRow.status,
      targetSeconds: savedRow.target_seconds,
      recordedSeconds: savedRow.recorded_seconds,
      taskId: savedRow.task_id,
      localDate: savedRow.local_date,
      startedAt: savedRow.started_at,
      endedAt: savedRow.ended_at,
      xpAwarded: savedRow.xp_awarded
    };

    // Advance next phase for Pomodoro
    this.clearActiveSessionFields();
    if (activeMode === 'pomodoro') {
      if (activePhase === 'focus' && completedTarget) {
        this.pomodoroCycleCount += 1;
        this.phase =
          this.pomodoroCycleCount % prefs.pomodoro_cycles_before_long_break === 0
            ? 'long_break'
            : 'short_break';
      } else if (activePhase !== 'focus') {
        this.phase = 'focus';
      } else {
        this.phase = 'focus';
      }
    }

    this.targetDurationSeconds = this.resolveTargetDurationSeconds(
      this.mode,
      this.phase,
      prefs,
      this.customDurationMinutes
    );

    const nextTimerState = this.getSnapshot();
    const result: FocusCompletionResult = {
      session: sessionDto,
      xpEarned,
      newXpBalance,
      todayFocusSeconds,
      currentStreak,
      nextTimerState
    };

    this.emitCompleted(result);
    this.emitTick(nextTimerState);

    if (triggeredByAutoComplete && activeMode === 'pomodoro') {
      const enteringBreak = this.phase !== 'focus';
      if (enteringBreak && prefs.auto_start_breaks === 1) {
        result.nextTimerState = this.start();
      } else if (!enteringBreak && prefs.auto_start_work === 1) {
        result.nextTimerState = this.start();
      }
    }

    return result;
  }

  private clearActiveSessionFields(): void {
    this.sessionId = null;
    this.status = 'idle';
    this.accumulatedElapsedMs = 0;
    this.lastResumedMonotonicMs = null;
    this.lastCheckpointedSeconds = 0;
    this.linkedTaskId = null;
    this.startedAtIso = null;
    this.pendingRecovery = false;
  }

  private getRawElapsedMs(): number {
    if (this.status === 'running' && this.lastResumedMonotonicMs !== null) {
      return (
        this.accumulatedElapsedMs +
        Math.max(0, this.clock.nowMonotonicMs() - this.lastResumedMonotonicMs)
      );
    }
    return this.accumulatedElapsedMs;
  }

  private loadPreferences(): TimerPrefRow {
    const row = this.db
      .prepare('SELECT * FROM timer_preferences WHERE id = 1')
      .get() as TimerPrefRow | undefined;

    if (!row) {
      throw new Error('Timer preferences row (id=1) is missing. Run migrations first.');
    }
    return row;
  }

  private resolveTargetDurationSeconds(
    mode: TimerMode,
    phase: TimerPhase,
    prefs: TimerPrefRow,
    customMinutes: number
  ): number | null {
    if (mode === 'stopwatch') {
      return null;
    }

    if (mode === 'custom') {
      return customMinutes * 60;
    }

    switch (phase) {
      case 'focus':
        return prefs.pomodoro_work_minutes * 60;
      case 'short_break':
        return prefs.pomodoro_short_break_minutes * 60;
      case 'long_break':
        return prefs.pomodoro_long_break_minutes * 60;
    }
  }

  private startAutoTick(): void {
    if (!this.enableAutoTick || this.tickHandle !== null) {
      return;
    }
    this.tickHandle = setInterval(() => {
      this.tick();
    }, this.tickIntervalMs);
  }

  private stopAutoTick(): void {
    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private emitTick(snapshot: TimerStateSnapshot): void {
    try {
      this.onTickCallback?.(snapshot);
    } catch {
      // Never allow UI notification failures to corrupt timer state
    }
  }

  private emitCompleted(result: FocusCompletionResult): void {
    try {
      this.onCompletedCallback?.(result);
    } catch {
      // Never allow UI notification failures to corrupt timer state
    }
  }
}

function getYesterdayDateKey(localDate: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

