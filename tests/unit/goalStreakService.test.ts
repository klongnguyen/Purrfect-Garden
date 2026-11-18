import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { GoalStreakService } from '../../src/main/services/GoalStreakService';
import { TaskService } from '../../src/main/services/TaskService';
import { TimerSupervisor, type ClockProvider } from '../../src/main/services/TimerSupervisor';

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

describe('GoalStreakService', () => {
  let db: Database.Database;
  let clock: FakeClock;
  let goalService: GoalStreakService;
  let taskService: TaskService;
  let supervisor: TimerSupervisor;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    clock = new FakeClock();
    goalService = new GoalStreakService(db);
    taskService = new TaskService(db);
    supervisor = new TimerSupervisor(db, { clock, enableAutoTick: false });
  });

  afterEach(() => {
    db.close();
  });

  it('tracks daily goal progress automatically from focus sessions and completed tasks', () => {
    const initial = goalService.syncAndGetDailyGoals('2026-11-18');
    expect(initial.length).toBe(4);
    expect(initial.every((g) => g.currentValue === 0 && !g.isCompleted)).toBe(true);

    // Complete 1 task
    const task = taskService.createTask({ title: 'Study Biology' });
    taskService.toggleTaskCompletion({
      taskId: task.id,
      isCompleted: true,
      localDate: '2026-11-18'
    });

    // Complete a 25m focus session
    supervisor.start();
    clock.advanceMs(1500_000);
    supervisor.tick();

    const updated = goalService.syncAndGetDailyGoals('2026-11-18');
    const byTemplate = new Map(updated.map((g) => [g.templateId, g]));

    expect(byTemplate.get('goal_daily_focus_25m')?.isCompleted).toBe(true);
    expect(byTemplate.get('goal_daily_single_20m')?.isCompleted).toBe(true);
    expect(byTemplate.get('goal_daily_task_1')?.isCompleted).toBe(true);
    expect(byTemplate.get('goal_daily_sessions_2')?.currentValue).toBe(1);
    expect(byTemplate.get('goal_daily_sessions_2')?.isCompleted).toBe(false);
  });

  it('enforces idempotent goal reward claiming without duplicating XP', () => {
    const task = taskService.createTask({ title: 'Read Notes' });
    taskService.toggleTaskCompletion({
      taskId: task.id,
      isCompleted: true,
      localDate: '2026-11-18'
    });

    const goals = goalService.syncAndGetDailyGoals('2026-11-18');
    const taskGoal = goals.find((g) => g.templateId === 'goal_daily_task_1')!;
    expect(taskGoal.isCompleted).toBe(true);
    expect(taskGoal.rewardClaimed).toBe(false);

    const claimResult = goalService.claimGoalReward(taskGoal.id);
    expect(claimResult.xpAwarded).toBe(15);
    expect(claimResult.newXpBalance).toBe(15);
    expect(claimResult.goal.rewardClaimed).toBe(true);

    // Second claim must fail and balance must remain 15
    expect(() => goalService.claimGoalReward(taskGoal.id)).toThrow();
    const xpCount = db
      .prepare("SELECT COUNT(*) AS cnt FROM xp_transactions WHERE source_type = 'goal_reward'")
      .get() as { cnt: number };
    expect(xpCount.cnt).toBe(1);
  });

  it('computes streak overview across consecutive days and missed-day resets', () => {
    // Day 1: 25m focus
    supervisor.start();
    clock.advanceMs(1500_000);
    supervisor.tick();

    const day1 = goalService.getStreakOverview('2026-11-18');
    expect(day1.currentStreak).toBe(1);
    expect(day1.longestStreak).toBe(1);
    expect(day1.todayQualified).toBe(true);
    expect(day1.nextMilestoneDays).toBe(3);
    expect(day1.daysToNextMilestone).toBe(2);

    // Day 2: consecutive day, 20m focus
    clock.setLocalDateKey('2026-11-19');
    supervisor.setMode({ mode: 'custom', customDurationMinutes: 20 });
    supervisor.start();
    clock.advanceMs(1200_000);
    supervisor.tick();

    const day2 = goalService.getStreakOverview('2026-11-19');
    expect(day2.currentStreak).toBe(2);
    expect(day2.longestStreak).toBe(2);
    expect(day2.daysToNextMilestone).toBe(1);

    // Day 4 (skipped Nov 20): effective streak resets to 0
    const day4 = goalService.getStreakOverview('2026-11-21');
    expect(day4.currentStreak).toBe(0);
    expect(day4.longestStreak).toBe(2);
    expect(day4.todayQualified).toBe(false);
  });
});

