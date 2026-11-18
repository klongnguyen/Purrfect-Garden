import { afterEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';

const EXPECTED_TABLES = [
  'schema_migrations',
  'app_settings',
  'timer_preferences',
  'music_preferences',
  'tasks',
  'focus_sessions',
  'daily_activities',
  'streak_state',
  'goal_templates',
  'goal_instances',
  'achievement_definitions',
  'user_achievements',
  'xp_transactions',
  'item_definitions',
  'inventory_items',
  'garden_area_definitions',
  'user_gardens',
  'garden_placements',
  'pet_definitions',
  'user_pets',
  'gacha_history'
];

describe('SQLite migration engine', () => {
  let db: Database.Database | null = null;

  afterEach(() => {
    db?.close();
    db = null;
  });

  it('creates all 21 initial schema tables and seeds defaults', () => {
    db = createDatabaseConnection(':memory:');
    const result = runMigrations(db);

    expect(result.appliedVersions).toEqual([1]);
    expect(result.currentVersion).toBe(1);

    const rows = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as Array<{ name: string }>;
    const tableNames = rows.map((r) => r.name);

    for (const expected of EXPECTED_TABLES) {
      expect(tableNames).toContain(expected);
    }
    expect(tableNames).toHaveLength(21);

    const timerPrefs = db
      .prepare('SELECT * FROM timer_preferences WHERE id = 1')
      .get() as Record<string, unknown>;
    expect(timerPrefs.pomodoro_work_minutes).toBe(25);
    expect(timerPrefs.pomodoro_short_break_minutes).toBe(5);
    expect(timerPrefs.pomodoro_long_break_minutes).toBe(15);
    expect(timerPrefs.early_stop_min_xp_seconds).toBe(60);

    const starterArea = db
      .prepare('SELECT * FROM garden_area_definitions WHERE id = ?')
      .get('meadow_starter') as Record<string, unknown>;
    expect(starterArea.grid_width).toBe(12);
    expect(starterArea.grid_height).toBe(12);
  });

  it('is idempotent when runMigrations is invoked multiple times', () => {
    db = createDatabaseConnection(':memory:');
    const first = runMigrations(db);
    const second = runMigrations(db);

    expect(first.appliedVersions).toEqual([1]);
    expect(second.appliedVersions).toEqual([]);
    expect(second.currentVersion).toBe(1);
  });

  it('enforces CHECK constraints on XP balances and pet species', () => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);

    expect(() => {
      db!.prepare(
        `INSERT INTO xp_transactions (id, delta_xp, balance_after, source_type, reference_id, description, created_at)
         VALUES ('tx-neg', -10, -10, 'shop_purchase', 'item-1', 'Invalid negative spend', '2026-11-18T12:00:00.000Z')`
      ).run();
    }).toThrow();

    const insertPet = db.prepare(
      `INSERT INTO pet_definitions (id, species, name, rarity, description, sprite_key, gacha_weight)
       VALUES (?, ?, ?, 'common', 'Cozy companion', 'sprite', 10)`
    );

    expect(() => insertPet.run('pet-cat', 'cat', 'Mochi')).not.toThrow();
    expect(() => insertPet.run('pet-dog', 'dog', 'Biscuit')).not.toThrow();
    expect(() => insertPet.run('pet-capy', 'capybara', 'Yuzu')).not.toThrow();
    expect(() => insertPet.run('pet-bear', 'bear', 'Forbidden Bear')).toThrow();
  });
});

