import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { FocusHistoryService } from '../../src/main/services/FocusHistoryService';

function insertSession(
  db: Database.Database,
  params: {
    id: string;
    mode?: 'pomodoro' | 'stopwatch' | 'custom';
    phase?: 'focus' | 'short_break' | 'long_break';
    status?: 'active' | 'paused' | 'completed' | 'stopped' | 'interrupted';
    recordedSeconds: number;
    taskId?: string | null;
    localDate: string;
    startedAt: string;
    xpAwarded?: number;
  }
): void {
  db.prepare(
    `
    INSERT INTO focus_sessions (
      id, mode, phase, status, target_seconds,
      recorded_seconds, last_checkpoint_seconds, task_id,
      local_date, started_at, ended_at, xp_awarded, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    params.id,
    params.mode ?? 'pomodoro',
    params.phase ?? 'focus',
    params.status ?? 'completed',
    1500,
    params.recordedSeconds,
    params.recordedSeconds,
    params.taskId ?? null,
    params.localDate,
    params.startedAt,
    params.startedAt,
    params.xpAwarded ?? 0,
    params.startedAt
  );
}

describe('FocusHistoryService', () => {
  let db: Database.Database;
  let service: FocusHistoryService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    service = new FocusHistoryService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('computes daily, weekly, monthly, total summaries, averages, and 7-day trend', () => {
    insertSession(db, {
      id: 's-today-1',
      recordedSeconds: 1500,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:00:00.000Z',
      xpAwarded: 30
    });
    insertSession(db, {
      id: 's-week-1',
      recordedSeconds: 900,
      localDate: '2026-11-15',
      startedAt: '2026-11-15T10:00:00.000Z',
      xpAwarded: 15
    });
    insertSession(db, {
      id: 's-month-1',
      recordedSeconds: 1800,
      localDate: '2026-11-02',
      startedAt: '2026-11-02T14:00:00.000Z',
      xpAwarded: 35
    });
    insertSession(db, {
      id: 's-prev-month',
      recordedSeconds: 600,
      localDate: '2026-10-10',
      startedAt: '2026-10-10T11:00:00.000Z',
      xpAwarded: 10
    });

    const summary = service.getStatsSummary('2026-11-18');

    expect(summary.todayFocusSeconds).toBe(1500);
    expect(summary.todaySessionsCount).toBe(1);
    expect(summary.thisWeekFocusSeconds).toBe(2400); // 1500 + 900
    expect(summary.thisWeekSessionsCount).toBe(2);
    expect(summary.thisMonthFocusSeconds).toBe(4200); // 1500 + 900 + 1800
    expect(summary.thisMonthSessionsCount).toBe(3);
    expect(summary.totalFocusSeconds).toBe(4800); // all 4 sessions
    expect(summary.totalFocusSessionsCount).toBe(4);
    expect(summary.averageSessionSeconds).toBe(1200); // 4800 / 4
    expect(summary.longestSessionSeconds).toBe(1800);

    expect(summary.recentDailyTrend).toHaveLength(7);
    expect(summary.recentDailyTrend[0].localDate).toBe('2026-11-12');
    expect(summary.recentDailyTrend[6]).toEqual({
      localDate: '2026-11-18',
      validFocusSeconds: 1500,
      completedSessionsCount: 1
    });
  });

  it('strictly excludes break phases and interrupted sessions from focus statistics', () => {
    insertSession(db, {
      id: 's-focus',
      phase: 'focus',
      status: 'completed',
      recordedSeconds: 1500,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:00:00.000Z',
      xpAwarded: 30
    });
    insertSession(db, {
      id: 's-short-break',
      phase: 'short_break',
      status: 'completed',
      recordedSeconds: 300,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:30:00.000Z',
      xpAwarded: 0
    });
    insertSession(db, {
      id: 's-long-break',
      phase: 'long_break',
      status: 'completed',
      recordedSeconds: 900,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T10:00:00.000Z',
      xpAwarded: 0
    });
    insertSession(db, {
      id: 's-interrupted',
      phase: 'focus',
      status: 'interrupted',
      recordedSeconds: 600,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T11:00:00.000Z',
      xpAwarded: 0
    });

    const summary = service.getStatsSummary('2026-11-18');
    expect(summary.todayFocusSeconds).toBe(1500);
    expect(summary.totalFocusSeconds).toBe(1500);
    expect(summary.totalFocusSessionsCount).toBe(1);
    expect(summary.averageSessionSeconds).toBe(1500);
  });

  it('includes early-stopped focus sessions under 60s in history and totals with 0 XP', () => {
    insertSession(db, {
      id: 's-short-stop',
      phase: 'focus',
      status: 'stopped',
      recordedSeconds: 45,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:00:00.000Z',
      xpAwarded: 0
    });

    const summary = service.getStatsSummary('2026-11-18');
    expect(summary.todayFocusSeconds).toBe(45);
    expect(summary.todaySessionsCount).toBe(1);

    const history = service.listSessions();
    expect(history).toHaveLength(1);
    expect(history[0].recordedSeconds).toBe(45);
    expect(history[0].xpAwarded).toBe(0);
    expect(history[0].status).toBe('stopped');
  });

  it('supports session filtering and groups task focus breakdowns accurately', () => {
    db.prepare(
      `
      INSERT INTO tasks (
        id, title, notes, category, priority, is_completed, created_at, updated_at
      ) VALUES ('task-1', 'Linear Algebra', '', 'Study', 'high', 0, '2026-11-18T08:00:00.000Z', '2026-11-18T08:00:00.000Z')
    `
    ).run();

    insertSession(db, {
      id: 's-task',
      recordedSeconds: 1800,
      taskId: 'task-1',
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:00:00.000Z',
      xpAwarded: 35
    });
    insertSession(db, {
      id: 's-unassigned',
      recordedSeconds: 600,
      taskId: null,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T10:00:00.000Z',
      xpAwarded: 10
    });
    insertSession(db, {
      id: 's-break',
      phase: 'short_break',
      recordedSeconds: 300,
      localDate: '2026-11-18',
      startedAt: '2026-11-18T10:30:00.000Z',
      xpAwarded: 0
    });

    const summary = service.getStatsSummary('2026-11-18');
    expect(summary.taskBreakdown).toEqual([
      {
        taskId: 'task-1',
        taskTitle: 'Linear Algebra',
        category: 'Study',
        totalFocusSeconds: 1800,
        sessionCount: 1
      },
      {
        taskId: null,
        taskTitle: 'Unassigned Focus',
        category: 'General',
        totalFocusSeconds: 600,
        sessionCount: 1
      }
    ]);

    const focusOnly = service.listSessions({ includeBreaksAndInterrupted: false });
    expect(focusOnly).toHaveLength(2);
    expect(focusOnly.map((s) => s.id)).toEqual(['s-unassigned', 's-task']);

    const withBreaks = service.listSessions({ includeBreaksAndInterrupted: true });
    expect(withBreaks).toHaveLength(3);
    expect(withBreaks[0].id).toBe('s-break');
  });

  it('generates an 84-day activity heatmap with accurate intensity levels', () => {
    insertSession(db, {
      id: 'h-1',
      recordedSeconds: 600, // level 1 (< 1200)
      localDate: '2026-11-15',
      startedAt: '2026-11-15T09:00:00.000Z'
    });
    insertSession(db, {
      id: 'h-2',
      recordedSeconds: 1500, // level 2 (1200..2699)
      localDate: '2026-11-16',
      startedAt: '2026-11-16T09:00:00.000Z'
    });
    insertSession(db, {
      id: 'h-3',
      recordedSeconds: 3600, // level 3 (2700..5399)
      localDate: '2026-11-17',
      startedAt: '2026-11-17T09:00:00.000Z'
    });
    insertSession(db, {
      id: 'h-4',
      recordedSeconds: 6000, // level 4 (>= 5400)
      localDate: '2026-11-18',
      startedAt: '2026-11-18T09:00:00.000Z'
    });

    const heatmap = service.getHeatmap('2026-11-18', 84);
    expect(heatmap).toHaveLength(84);
    expect(heatmap[83].localDate).toBe('2026-11-18');

    const byDate = new Map(heatmap.map((cell) => [cell.localDate, cell]));
    expect(byDate.get('2026-11-14')?.intensityLevel).toBe(0);
    expect(byDate.get('2026-11-15')?.intensityLevel).toBe(1);
    expect(byDate.get('2026-11-16')?.intensityLevel).toBe(2);
    expect(byDate.get('2026-11-16')?.streakQualified).toBe(true);
    expect(byDate.get('2026-11-17')?.intensityLevel).toBe(3);
    expect(byDate.get('2026-11-18')?.intensityLevel).toBe(4);
  });
});

