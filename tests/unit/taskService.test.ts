import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { FocusHistoryService } from '../../src/main/services/FocusHistoryService';
import { TaskService } from '../../src/main/services/TaskService';
import { TimerSupervisor, type ClockProvider } from '../../src/main/services/TimerSupervisor';

class FakeClock implements ClockProvider {
  private monotonicMs = 10_000;
  private wallMs = Date.UTC(2026, 10, 18, 9, 0, 0);

  advanceMs(ms: number): void {
    this.monotonicMs += ms;
    this.wallMs += ms;
  }

  nowMonotonicMs(): number {
    return this.monotonicMs;
  }

  nowIsoString(): string {
    return new Date(this.wallMs).toISOString();
  }

  localDateKey(): string {
    return '2026-11-18';
  }
}

describe('TaskService & session linking', () => {
  let db: Database.Database;
  let taskService: TaskService;
  let historyService: FocusHistoryService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    taskService = new TaskService(db);
    historyService = new FocusHistoryService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates, updates, and validates tasks cleanly', () => {
    const created = taskService.createTask({
      title: '  Algorithms Review ',
      category: 'Study',
      priority: 'high',
      estimatedMinutes: 50,
      deadlineAt: '2026-11-20',
      notes: 'Dynamic programming'
    });

    expect(created.title).toBe('Algorithms Review');
    expect(created.priority).toBe('high');
    expect(created.estimatedMinutes).toBe(50);
    expect(created.deadlineAt).toBe('2026-11-20');
    expect(created.isCompleted).toBe(false);

    const updated = taskService.updateTask(created.id, {
      title: 'Algorithms Practice',
      priority: 'medium',
      estimatedMinutes: 30
    });
    expect(updated.title).toBe('Algorithms Practice');
    expect(updated.priority).toBe('medium');
    expect(updated.estimatedMinutes).toBe(30);

    expect(() => taskService.createTask({ title: '   ' })).toThrow();
    expect(() =>
      taskService.createTask({ title: 'Invalid est', estimatedMinutes: 0 })
    ).toThrow();
  });

  it('toggles task completion and updates daily_activities.completed_tasks_count', () => {
    const task = taskService.createTask({ title: 'Read Paper' });

    const done = taskService.toggleTaskCompletion({
      taskId: task.id,
      isCompleted: true,
      localDate: '2026-11-18'
    });
    expect(done.isCompleted).toBe(true);
    expect(done.completedAt).not.toBeNull();

    let daily = db
      .prepare('SELECT completed_tasks_count FROM daily_activities WHERE local_date = ?')
      .get('2026-11-18') as { completed_tasks_count: number };
    expect(daily.completed_tasks_count).toBe(1);

    const undone = taskService.toggleTaskCompletion({
      taskId: task.id,
      isCompleted: false,
      localDate: '2026-11-18'
    });
    expect(undone.isCompleted).toBe(false);
    expect(undone.completedAt).toBeNull();

    daily = db
      .prepare('SELECT completed_tasks_count FROM daily_activities WHERE local_date = ?')
      .get('2026-11-18') as { completed_tasks_count: number };
    expect(daily.completed_tasks_count).toBe(0);
  });

  it('filters tasks by today, incomplete, completed, overdue, and all views', () => {
    const overdue = taskService.createTask({
      title: 'Overdue Essay',
      deadlineAt: '2026-11-10',
      priority: 'high'
    });
    const dueToday = taskService.createTask({
      title: 'Math Drill',
      deadlineAt: '2026-11-18',
      priority: 'medium'
    });
    const completed = taskService.createTask({
      title: 'Morning Reading',
      priority: 'low'
    });
    taskService.toggleTaskCompletion({
      taskId: completed.id,
      isCompleted: true,
      localDate: '2026-11-18'
    });

    expect(
      taskService.listTasks({ view: 'overdue', referenceLocalDate: '2026-11-18' }).map((t) => t.id)
    ).toEqual([overdue.id]);

    expect(
      taskService.listTasks({ view: 'incomplete', referenceLocalDate: '2026-11-18' }).map((t) => t.id)
    ).toEqual([overdue.id, dueToday.id]);

    expect(
      taskService.listTasks({ view: 'completed', referenceLocalDate: '2026-11-18' }).map((t) => t.id)
    ).toEqual([completed.id]);

    const summary = taskService.getTaskSummary('2026-11-18');
    expect(summary.totalTasks).toBe(3);
    expect(summary.incompleteTasks).toBe(2);
    expect(summary.completedTasks).toBe(1);
    expect(summary.overdueTasks).toBe(1);
  });

  it('aggregates tracked focus time from both pre-linked and post-linked sessions', () => {
    const clock = new FakeClock();
    const supervisor = new TimerSupervisor(db, { clock, enableAutoTick: false });
    const task = taskService.createTask({ title: 'TypeScript Refactor' });

    // Pre-session linking
    supervisor.start({ taskId: task.id });
    clock.advanceMs(1500_000); // 25m
    supervisor.tick();

    let fetched = taskService.getTaskById(task.id);
    expect(fetched.trackedFocusSeconds).toBe(1500);
    expect(fetched.trackedSessionsCount).toBe(1);

    // Unlinked session, linked afterward
    supervisor.setMode({ mode: 'stopwatch' });
    supervisor.start();
    clock.advanceMs(600_000); // 10m
    const unlinked = supervisor.stop();

    const linkedSession = historyService.linkSessionToTask(unlinked.session!.id, task.id);
    expect(linkedSession.taskId).toBe(task.id);
    expect(linkedSession.taskTitle).toBe('TypeScript Refactor');

    fetched = taskService.getTaskById(task.id);
    expect(fetched.trackedFocusSeconds).toBe(2100);
    expect(fetched.trackedSessionsCount).toBe(2);
  });

  it('preserves recorded focus sessions with task_id = null when a task is deleted', () => {
    const clock = new FakeClock();
    const supervisor = new TimerSupervisor(db, { clock, enableAutoTick: false });
    const task = taskService.createTask({ title: 'Temporary Task' });

    supervisor.start({ taskId: task.id });
    clock.advanceMs(300_000);
    const completion = supervisor.stop();

    taskService.deleteTask(task.id);

    expect(() => taskService.getTaskById(task.id)).toThrow();
    const row = db
      .prepare('SELECT task_id, recorded_seconds FROM focus_sessions WHERE id = ?')
      .get(completion.session!.id) as { task_id: string | null; recorded_seconds: number };
    expect(row.task_id).toBeNull();
    expect(row.recorded_seconds).toBe(300);
  });
});

