import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { AchievementService } from '../../src/main/services/AchievementService';
import { GardenService } from '../../src/main/services/GardenService';
import { GoalStreakService } from '../../src/main/services/GoalStreakService';
import { ProgressionService } from '../../src/main/services/ProgressionService';
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

describe('Phase 2: Progression, Multi-Area Gardens, Achievements & Weekly Goals', () => {
  let db: Database.Database;
  let clock: FakeClock;
  let supervisor: TimerSupervisor;
  let progressionService: ProgressionService;
  let gardenService: GardenService;
  let achievementService: AchievementService;
  let goalService: GoalStreakService;
  let taskService: TaskService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    clock = new FakeClock();
    supervisor = new TimerSupervisor(db, { clock, enableAutoTick: false });
    progressionService = new ProgressionService(db);
    gardenService = new GardenService(db);
    achievementService = new AchievementService(db);
    goalService = new GoalStreakService(db);
    taskService = new TaskService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('exchanges earned XP for catalog items and blocks negative XP balances', () => {
    // Earn 30 XP from a 25m Pomodoro completion
    supervisor.start();
    clock.advanceMs(1500_000);
    supervisor.tick();

    const exchange = progressionService.exchangeItem({
      itemId: 'item_sunflower_seed',
      quantity: 1
    });
    expect(exchange.xpSpent).toBe(15);
    expect(exchange.newXpBalance).toBe(15);
    expect(exchange.item.ownedQuantity).toBe(1);

    // Attempt to buy 120 XP lamp with only 15 XP -> must throw
    expect(() =>
      progressionService.exchangeItem({ itemId: 'item_greenhouse_lamp', quantity: 1 })
    ).toThrow();

    const transactions = progressionService.listTransactions(10);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].balanceAfter).toBe(15);
    expect(transactions[0].deltaXp).toBe(-15);

    const lamp = progressionService
      .getCatalog()
      .find((i) => i.itemId === 'item_greenhouse_lamp')!;
    expect(lamp.ownedQuantity).toBe(0);
  });

  it('unlocks and switches between multiple garden areas without replacing existing layouts', () => {
    // Place an item in starter meadow (12x12)
    gardenService.placeItem({
      gardenId: 'user_garden_starter',
      itemId: 'item_sprout_pot',
      tileX: 2,
      tileY: 2
    });

    // Grant 100 XP directly via 4 focus sessions (4 x 25m = 120 XP)
    for (let i = 0; i < 4; i++) {
      supervisor.setMode({ mode: 'custom', customDurationMinutes: 25 });
      supervisor.start();
      clock.advanceMs(1500_000);
      supervisor.tick();
    }

    const unlockRes = gardenService.unlockGardenArea('user_garden_autumn');
    expect(unlockRes.xpSpent).toBe(80);
    expect(unlockRes.newXpBalance).toBe(40);
    expect(unlockRes.area.isUnlocked).toBe(true);
    expect(unlockRes.area.gridWidth).toBe(14);
    expect(unlockRes.area.gridHeight).toBe(14);

    // Switch to Amber Autumn Grove and place an item at (13, 13)
    const autumnState = gardenService.switchActiveGarden('user_garden_autumn');
    expect(autumnState.area.userGardenId).toBe('user_garden_autumn');

    const afterAutumnPlace = gardenService.placeItem({
      gardenId: 'user_garden_autumn',
      itemId: 'item_sprout_pot',
      tileX: 13,
      tileY: 13
    });
    expect(afterAutumnPlace.placements).toHaveLength(1);
    expect(afterAutumnPlace.placements[0].tileX).toBe(13);

    // Switch back to starter meadow -> original (2, 2) placement must be intact
    const starterRestored = gardenService.switchActiveGarden('user_garden_starter');
    expect(starterRestored.area.userGardenId).toBe('user_garden_starter');
    expect(starterRestored.placements).toHaveLength(1);
    expect(starterRestored.placements[0].tileX).toBe(2);
    expect(starterRestored.placements[0].tileY).toBe(2);
  });

  it('evaluates achievements across categories and claims one-time rewards idempotently', () => {
    supervisor.start();
    clock.advanceMs(1500_000);
    supervisor.tick();

    const list = achievementService.listAchievements();
    const byId = new Map(list.map((a) => [a.id, a]));

    expect(byId.get('ach_focus_bronze')?.isUnlocked).toBe(true);
    expect(byId.get('ach_explorer_bronze')?.isUnlocked).toBe(true);
    expect(byId.get('ach_collector_bronze')?.isUnlocked).toBe(true);
    expect(byId.get('ach_early_bird')?.isUnlocked).toBe(true); // started at 09:00 UTC

    const claim = achievementService.claimReward('ach_focus_bronze');
    expect(claim.xpAwarded).toBe(15);
    expect(claim.newXpBalance).toBe(45); // 30 from session + 15 from achievement
    expect(claim.achievement.rewardClaimed).toBe(true);

    // Duplicate claim must throw
    expect(() => achievementService.claimReward('ach_focus_bronze')).toThrow();
  });

  it('tracks weekly goals across days in the same calendar week and grants reward XP', () => {
    const initialWeekly = goalService.syncAndGetWeeklyGoals('2026-11-18');
    expect(initialWeekly).toHaveLength(3);

    // Complete 5 tasks across two days in the week (Mon Nov 16 & Wed Nov 18)
    for (let i = 0; i < 3; i++) {
      const t = taskService.createTask({ title: `Mon Task ${i}` });
      taskService.toggleTaskCompletion({
        taskId: t.id,
        isCompleted: true,
        localDate: '2026-11-16'
      });
    }
    for (let i = 0; i < 2; i++) {
      const t = taskService.createTask({ title: `Wed Task ${i}` });
      taskService.toggleTaskCompletion({
        taskId: t.id,
        isCompleted: true,
        localDate: '2026-11-18'
      });
    }

    const updatedWeekly = goalService.syncAndGetWeeklyGoals('2026-11-18');
    const tasksWeekly = updatedWeekly.find((g) => g.templateId === 'goal_weekly_tasks_5')!;
    expect(tasksWeekly.currentValue).toBe(5);
    expect(tasksWeekly.isCompleted).toBe(true);

    const claim = goalService.claimGoalReward(tasksWeekly.id);
    expect(claim.xpAwarded).toBe(45);
    expect(claim.newXpBalance).toBe(45);
  });
});

