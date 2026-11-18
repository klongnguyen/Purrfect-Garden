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

  const insertGoalTemplate = db.prepare(`
    INSERT OR IGNORE INTO goal_templates (
      id, period_type, metric_type, title, target_value, reward_xp, reward_item_id, is_active
    ) VALUES (?, 'daily', ?, ?, ?, ?, NULL, 1)
  `);

  const starterGoals: Array<[string, string, string, number, number]> = [
    ['goal_daily_focus_25m', 'focus_minutes', 'Focus for at least 25 minutes today', 25, 15],
    ['goal_daily_sessions_2', 'focus_sessions', 'Complete 2 focus sessions today', 2, 20],
    ['goal_daily_task_1', 'tasks_completed', 'Complete at least 1 task today', 1, 15],
    ['goal_daily_single_20m', 'single_session_minutes', 'Finish a single focus session of 20+ minutes', 20, 20]
  ];

  for (const [id, metric, title, target, rewardXp] of starterGoals) {
    insertGoalTemplate.run(id, metric, title, target, rewardXp);
  }

  const insertItemDef = db.prepare(`
    INSERT OR IGNORE INTO item_definitions (
      id, category, name, description, rarity, xp_cost, sprite_key, tile_width, tile_height, is_placeable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
  `);

  const insertInventoryItem = db.prepare(`
    INSERT OR IGNORE INTO inventory_items (
      item_id, quantity, first_acquired_at, updated_at
    ) VALUES (?, ?, ?, ?)
  `);

  const starterItems: Array<[string, string, string, string, string, number, string, number]> = [
    [
      'item_sprout_pot',
      'plant',
      'Terracotta Sprout',
      'A cheerful little sprout in a warm clay pot.',
      'common',
      15,
      'sprout_pot',
      3
    ],
    [
      'item_sunlit_daisy',
      'plant',
      'Sunlit Daisy',
      'Bright white petals that love morning focus sessions.',
      'common',
      20,
      'sunlit_daisy',
      2
    ],
    [
      'item_lavender_bush',
      'plant',
      'Cozy Lavender',
      'Fragrant purple stems that bring calm to your meadow.',
      'uncommon',
      35,
      'lavender_bush',
      2
    ],
    [
      'item_stepping_stone',
      'decor',
      'Mossy Stepping Stone',
      'Flat garden stone edged with soft green moss.',
      'common',
      10,
      'stepping_stone',
      4
    ],
    [
      'item_wooden_lantern',
      'decor',
      'Warm Garden Lantern',
      'A handcrafted wooden lantern with a gentle glow.',
      'rare',
      45,
      'wooden_lantern',
      1
    ],
    [
      'item_watering_can',
      'tool',
      'Copper Watering Can',
      'A shiny vintage watering can resting on the grass.',
      'uncommon',
      30,
      'watering_can',
      1
    ]
  ];

  for (const [id, category, name, desc, rarity, cost, spriteKey, qty] of starterItems) {
    insertItemDef.run(id, category, name, desc, rarity, cost, spriteKey);
    insertInventoryItem.run(id, qty, nowIso, nowIso);
  }

  // Phase 2: Additional unlockable garden areas (expandable grids)
  const insertAreaDef = db.prepare(`
    INSERT OR IGNORE INTO garden_area_definitions (
      id, name, theme, description, grid_width, grid_height, unlock_xp_cost, unlock_condition_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `);

  const insertUserGarden = db.prepare(`
    INSERT OR IGNORE INTO user_gardens (
      id, area_definition_id, custom_name, is_unlocked, unlocked_at, is_active_view
    ) VALUES (?, ?, ?, 0, NULL, 0)
  `);

  const extraAreas: Array<[string, string, string, string, number, number, number, string, string]> = [
    [
      'autumn_grove',
      'Amber Autumn Grove',
      'autumn_grove',
      'Warm golden leaves and crisp study air across an expanded 14x14 meadow.',
      14,
      14,
      80,
      'user_garden_autumn',
      'Amber Autumn Grove'
    ],
    [
      'winter_sanctuary',
      'Snowdrop Winter Sanctuary',
      'winter_sanctuary',
      'Peaceful frost-kissed garden tiles for quiet deep-focus days.',
      14,
      14,
      140,
      'user_garden_winter',
      'Snowdrop Winter Sanctuary'
    ],
    [
      'starlight_conservatory',
      'Starlight Conservatory',
      'magical_garden',
      'A spacious 16x16 twilight sanctuary glowing with soft botanical light.',
      16,
      16,
      220,
      'user_garden_starlight',
      'Starlight Conservatory'
    ]
  ];

  for (const [areaId, name, theme, desc, w, h, cost, userGardenId, customName] of extraAreas) {
    insertAreaDef.run(areaId, name, theme, desc, w, h, cost);
    insertUserGarden.run(userGardenId, areaId, customName);
  }

  // Phase 2: Expanded catalog items (seeds, plants, tools, technologies)
  const catalogItems: Array<[string, string, string, string, string, number, string]> = [
    [
      'item_sunflower_seed',
      'seed',
      'Golden Sunflower Seeds',
      'Packet of plump sunflower seeds ready to sprout in warm soil.',
      'common',
      15,
      'sunflower_seed'
    ],
    [
      'item_moonflower_seed',
      'seed',
      'Moonflower Seed Tray',
      'Rare night-blooming seeds in a neat wooden starter tray.',
      'rare',
      40,
      'moonflower_seed'
    ],
    [
      'item_cherry_bonsai',
      'plant',
      'Cherry Blossom Bonsai',
      'Miniature pink-petaled bonsai tree symbolizing patience and focus.',
      'rare',
      65,
      'cherry_bonsai'
    ],
    [
      'item_crystal_lotus',
      'plant',
      'Crystal Pond Lotus',
      'Luminous water lotus that thrives on consistent study streaks.',
      'epic',
      110,
      'crystal_lotus'
    ],
    [
      'item_pruning_shears',
      'tool',
      'Artisan Pruning Shears',
      'Finely balanced brass shears for shaping cozy garden shrubs.',
      'uncommon',
      35,
      'pruning_shears'
    ],
    [
      'item_solar_dew_collector',
      'technology',
      'Solar Dew Collector',
      'Gentle glass condenser that harvests morning mist using sunlight.',
      'rare',
      85,
      'solar_dew_collector'
    ],
    [
      'item_greenhouse_lamp',
      'technology',
      'Cozy Greenhouse Grow-Lamp',
      'Soft-spectrum botanical lamp that keeps plants happy on cloudy days.',
      'epic',
      120,
      'greenhouse_lamp'
    ]
  ];

  for (const [id, category, name, desc, rarity, cost, spriteKey] of catalogItems) {
    insertItemDef.run(id, category, name, desc, rarity, cost, spriteKey);
  }

  // Phase 2: Weekly goal templates
  const insertWeeklyGoal = db.prepare(`
    INSERT OR IGNORE INTO goal_templates (
      id, period_type, metric_type, title, target_value, reward_xp, reward_item_id, is_active
    ) VALUES (?, 'weekly', ?, ?, ?, ?, NULL, 1)
  `);

  const weeklyGoals: Array<[string, string, string, number, number]> = [
    ['goal_weekly_focus_150m', 'focus_minutes', 'Focus for at least 150 minutes this week', 150, 60],
    ['goal_weekly_sessions_8', 'focus_sessions', 'Complete 8 focus sessions this week', 8, 50],
    ['goal_weekly_tasks_5', 'tasks_completed', 'Complete 5 tasks this week', 5, 45]
  ];

  for (const [id, metric, title, target, rewardXp] of weeklyGoals) {
    insertWeeklyGoal.run(id, metric, title, target, rewardXp);
  }

  // Phase 2: Achievements across all 8 PRD categories
  const insertAchievement = db.prepare(`
    INSERT OR IGNORE INTO achievement_definitions (
      id, category, tier, name, description, target_value, reward_xp, reward_tickets, icon_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const achievements: Array<[string, string, string, string, string, number, number, number, string]> = [
    ['ach_focus_bronze', 'focus_master', 'bronze', 'First Sprout of Focus', 'Complete 1 focus session', 1, 15, 0, 'timer'],
    ['ach_focus_silver', 'focus_master', 'silver', 'Steady Scholar', 'Accumulate 120 minutes of valid focus time', 120, 40, 0, 'timer'],
    ['ach_focus_gold', 'focus_master', 'gold', 'Master of Deep Work', 'Accumulate 600 minutes of valid focus time', 600, 100, 1, 'timer'],
    ['ach_streak_bronze', 'consistency', 'bronze', 'Three-Day Rhythm', 'Reach a 3-day focus streak', 3, 25, 0, 'flame'],
    ['ach_streak_silver', 'consistency', 'silver', 'Full Week Harmony', 'Reach a 7-day focus streak', 7, 60, 1, 'flame'],
    ['ach_streak_gold', 'consistency', 'gold', 'Unwavering Habit', 'Reach a 30-day focus streak', 30, 150, 2, 'flame'],
    ['ach_green_bronze', 'green_thumb', 'bronze', 'Budding Gardener', 'Place 3 items in your gardens', 3, 15, 0, 'flower'],
    ['ach_green_silver', 'green_thumb', 'silver', 'Flourishing Diorama', 'Place 10 items across your gardens', 10, 45, 0, 'flower'],
    ['ach_explorer_bronze', 'explorer', 'bronze', 'Meadow Settler', 'Have 1 unlocked garden area', 1, 10, 0, 'map'],
    ['ach_explorer_silver', 'explorer', 'silver', 'Realm Expander', 'Unlock 2 garden areas', 2, 50, 0, 'map'],
    ['ach_explorer_gold', 'explorer', 'gold', 'Grand Sanctuaries', 'Unlock all 4 garden areas', 4, 120, 1, 'map'],
    ['ach_collector_bronze', 'collector', 'bronze', 'Curious Collector', 'Own 6 distinct item types in your collection', 6, 20, 0, 'book'],
    ['ach_collector_silver', 'collector', 'silver', 'Botanical Archivist', 'Own 10 distinct item types in your collection', 10, 55, 1, 'book'],
    ['ach_pet_bronze', 'pet_lover', 'bronze', 'Cozy Companion', 'Collect your first pet companion', 1, 30, 0, 'cat'],
    ['ach_early_bird', 'early_bird', 'bronze', 'Morning Dew Focus', 'Complete a focus session started during morning hours (05:00-11:59)', 1, 20, 0, 'sun'],
    ['ach_night_owl', 'night_owl', 'bronze', 'Starlight Study', 'Complete a focus session started during evening/night hours (20:00-03:59)', 1, 20, 0, 'moon']
  ];

  for (const row of achievements) {
    insertAchievement.run(...row);
  }
}

