import { afterEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { FoundationService } from '../../src/main/services/FoundationService';

describe('FoundationService', () => {
  let db: Database.Database | null = null;

  afterEach(() => {
    db?.close();
    db = null;
  });

  it('returns system status, progression overview, and starter garden metadata', () => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    const service = new FoundationService(db, ':memory:');

    const status = service.getSystemStatus();
    expect(status.schemaVersion).toBe(1);
    expect(status.tableCount).toBe(21);
    expect(status.config.xp.xpPerFocusMinute).toBe(1);

    const overview = service.getProgressionOverview('2026-11-18');
    expect(overview.xpBalance).toBe(0);
    expect(overview.todayFocusSeconds).toBe(0);
    expect(overview.streak.currentStreak).toBe(0);

    const garden = service.getActiveGardenArea();
    expect(garden.areaDefinitionId).toBe('meadow_starter');
    expect(garden.gridWidth).toBe(12);
    expect(garden.gridHeight).toBe(12);
    expect(garden.baseTileWidth).toBe(64);
    expect(garden.baseTileHeight).toBe(32);
    expect(garden.isUnlocked).toBe(true);
  });

  it('reads and updates user-configurable Pomodoro durations and early-stop threshold', () => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    const service = new FoundationService(db, ':memory:');

    const initial = service.getTimerPreferences();
    expect(initial.pomodoroWorkMinutes).toBe(25);
    expect(initial.earlyStopMinXpSeconds).toBe(60);

    const updated = service.updateTimerPreferences({
      pomodoroWorkMinutes: 50,
      pomodoroShortBreakMinutes: 10,
      pomodoroLongBreakMinutes: 20,
      earlyStopMinXpSeconds: 90,
      autoStartBreaks: true
    });

    expect(updated.pomodoroWorkMinutes).toBe(50);
    expect(updated.pomodoroShortBreakMinutes).toBe(10);
    expect(updated.pomodoroLongBreakMinutes).toBe(20);
    expect(updated.earlyStopMinXpSeconds).toBe(90);
    expect(updated.autoStartBreaks).toBe(true);
  });

  it('rejects invalid timer duration or negative early-stop threshold updates', () => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    const service = new FoundationService(db, ':memory:');

    expect(() => service.updateTimerPreferences({ pomodoroWorkMinutes: 0 })).toThrow();
    expect(() => service.updateTimerPreferences({ earlyStopMinXpSeconds: -5 })).toThrow();
  });
});

