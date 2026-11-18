import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { TimerSupervisor, type ClockProvider } from '../../src/main/services/TimerSupervisor';
import type { FocusCompletionResult } from '@shared/types/domain';

class FakeClock implements ClockProvider {
  private monotonicMs = 10_000;
  private wallMs = Date.UTC(2026, 10, 18, 9, 0, 0);
  private dateKey = '2026-11-18';

  advanceMs(ms: number): void {
    this.monotonicMs += ms;
    this.wallMs += ms;
  }

  setLocalDateKey(dateKey: string): void {
    this.dateKey = dateKey;
  }

  nowMonotonicMs(): number {
    return this.monotonicMs;
  }

  nowIsoString(): string {
    return new Date(this.wallMs).toISOString();
  }

  localDateKey(): string {
    return this.dateKey;
  }
}

describe('TimerSupervisor', () => {
  let db: Database.Database;
  let clock: FakeClock;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    clock = new FakeClock();
  });

  afterEach(() => {
    db.close();
  });

  it('completes a 25m Pomodoro focus session, awards XP, updates streak, and moves to short break', () => {
    let completedEvent: FocusCompletionResult | null = null;
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false,
      onCompleted: (result) => {
        completedEvent = result;
      }
    });

    const started = supervisor.start();
    expect(started.status).toBe('running');
    expect(started.mode).toBe('pomodoro');
    expect(started.phase).toBe('focus');
    expect(started.targetDurationSeconds).toBe(1500);

    clock.advanceMs(1500_000);
    supervisor.tick();

    expect(completedEvent).not.toBeNull();
    expect(completedEvent!.session?.status).toBe('completed');
    expect(completedEvent!.session?.recordedSeconds).toBe(1500);
    expect(completedEvent!.xpEarned).toBe(30); // 25 * 1 + 5 bonus
    expect(completedEvent!.newXpBalance).toBe(30);
    expect(completedEvent!.todayFocusSeconds).toBe(1500);
    expect(completedEvent!.currentStreak).toBe(1);

    const next = supervisor.getSnapshot();
    expect(next.status).toBe('idle');
    expect(next.phase).toBe('short_break');
    expect(next.targetDurationSeconds).toBe(300);
    expect(next.pomodoroCycleCount).toBe(1);

    const daily = db
      .prepare('SELECT valid_focus_seconds, streak_qualified FROM daily_activities WHERE local_date = ?')
      .get('2026-11-18') as { valid_focus_seconds: number; streak_qualified: number };
    expect(daily.valid_focus_seconds).toBe(1500);
    expect(daily.streak_qualified).toBe(1);
  });

  it('excludes break phases from focus totals and XP rewards', () => {
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    // Skip focus to enter short_break directly
    const breakReady = supervisor.skipPhase();
    expect(breakReady.phase).toBe('short_break');
    expect(breakReady.targetDurationSeconds).toBe(300);

    supervisor.start();
    clock.advanceMs(300_000);
    supervisor.tick();

    const sessions = db
      .prepare('SELECT phase, status, recorded_seconds, xp_awarded FROM focus_sessions')
      .all() as Array<{
      phase: string;
      status: string;
      recorded_seconds: number;
      xp_awarded: number;
    }>;

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual({
      phase: 'short_break',
      status: 'completed',
      recorded_seconds: 300,
      xp_awarded: 0
    });

    const daily = db
      .prepare('SELECT * FROM daily_activities')
      .all();
    expect(daily).toHaveLength(0);

    const xpRows = db.prepare('SELECT * FROM xp_transactions').all();
    expect(xpRows).toHaveLength(0);
  });

  it('records focus sessions shorter than 60s in history with 0 XP', () => {
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    supervisor.start();
    clock.advanceMs(45_000);
    const result = supervisor.stop();

    expect(result.session?.status).toBe('stopped');
    expect(result.session?.recordedSeconds).toBe(45);
    expect(result.xpEarned).toBe(0);
    expect(result.newXpBalance).toBe(0);
    expect(result.todayFocusSeconds).toBe(45);

    const dbSession = db
      .prepare('SELECT status, recorded_seconds, xp_awarded FROM focus_sessions WHERE id = ?')
      .get(result.session!.id) as { status: string; recorded_seconds: number; xp_awarded: number };
    expect(dbSession).toEqual({
      status: 'stopped',
      recorded_seconds: 45,
      xp_awarded: 0
    });
  });

  it('awards per-minute XP without completion bonus when stopped early >= 60s', () => {
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    supervisor.start();
    clock.advanceMs(180_000);
    const result = supervisor.stop();

    expect(result.session?.status).toBe('stopped');
    expect(result.session?.recordedSeconds).toBe(180);
    expect(result.xpEarned).toBe(3); // 3 minutes * 1 XP, no +5 bonus
    expect(result.newXpBalance).toBe(3);
  });

  it('tracks stopwatch sessions accurately and ignores paused intervals', () => {
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    const modeSnap = supervisor.setMode({ mode: 'stopwatch' });
    expect(modeSnap.targetDurationSeconds).toBeNull();
    expect(modeSnap.remainingSeconds).toBeNull();

    supervisor.start();
    clock.advanceMs(720_000); // 12 minutes
    const paused = supervisor.pause('user');
    expect(paused.elapsedSeconds).toBe(720);

    clock.advanceMs(500_000); // paused time must not count
    expect(supervisor.getSnapshot().elapsedSeconds).toBe(720);

    supervisor.resume();
    clock.advanceMs(180_000); // +3 minutes
    const result = supervisor.stop();

    expect(result.session?.mode).toBe('stopwatch');
    expect(result.session?.status).toBe('stopped');
    expect(result.session?.recordedSeconds).toBe(900); // 15 minutes
    expect(result.xpEarned).toBe(15);
  });

  it('completes custom countdown timer and awards completion bonus', () => {
    let completed: FocusCompletionResult | null = null;
    const supervisor = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false,
      onCompleted: (res) => {
        completed = res;
      }
    });

    const modeSnap = supervisor.setMode({ mode: 'custom', customDurationMinutes: 10 });
    expect(modeSnap.targetDurationSeconds).toBe(600);

    supervisor.start();
    clock.advanceMs(600_000);
    supervisor.tick();

    expect(completed).not.toBeNull();
    expect(completed!.session?.mode).toBe('custom');
    expect(completed!.session?.status).toBe('completed');
    expect(completed!.session?.recordedSeconds).toBe(600);
    expect(completed!.xpEarned).toBe(15); // 10 * 1 + 5 bonus
  });

  it('pauses active session on app exit and restores it as paused without counting offline time', () => {
    const supervisor1 = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    const started = supervisor1.start();
    clock.advanceMs(300_000); // 5 minutes active
    const exited = supervisor1.pause('app_exit');
    expect(exited.status).toBe('paused');
    expect(exited.elapsedSeconds).toBe(300);

    // Simulate app closed for 1 full hour
    clock.advanceMs(3_600_000);

    const supervisor2 = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    const restored = supervisor2.getSnapshot();
    expect(restored.sessionId).toBe(started.sessionId);
    expect(restored.status).toBe('paused');
    expect(restored.pendingRecovery).toBe(true);
    expect(restored.elapsedSeconds).toBe(300); // Zero offline time added

    supervisor2.resume();
    clock.advanceMs(120_000); // +2 minutes
    const result = supervisor2.stop();

    expect(result.session?.recordedSeconds).toBe(420); // 7 minutes total
    expect(result.xpEarned).toBe(7);
  });

  it('recovers crashed active session from last checkpoint without extrapolating closed time', () => {
    const supervisor1 = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    const started = supervisor1.start();
    clock.advanceMs(120_000);
    supervisor1.tick(); // Writes 120s checkpoint to SQLite

    // Simulate sudden kill after advancing another 5s + 2 hours offline
    clock.advanceMs(7_200_000);

    const supervisor2 = new TimerSupervisor(db, {
      clock,
      enableAutoTick: false
    });

    const restored = supervisor2.getSnapshot();
    expect(restored.sessionId).toBe(started.sessionId);
    expect(restored.status).toBe('paused');
    expect(restored.pendingRecovery).toBe(true);
    expect(restored.elapsedSeconds).toBe(120);
  });
});

