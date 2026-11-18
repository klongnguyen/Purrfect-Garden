import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { GardenService } from '../../src/main/services/GardenService';
import {
  isTileWithinBounds,
  screenToTile,
  sortPlacementsByDepth,
  tileToScreen
} from '@shared/utils/isometricMath';

describe('isometricMath & GardenService', () => {
  let db: Database.Database;
  let gardenService: GardenService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    gardenService = new GardenService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('performs accurate 2:1 isometric coordinate projection and depth sorting', () => {
    const originX = 400;
    const originY = 60;

    for (const [tx, ty] of [
      [0, 0],
      [3, 5],
      [11, 11]
    ]) {
      const { screenX, screenY } = tileToScreen(tx, ty, originX, originY, 64, 32, 1);
      // Sample inside center of tile diamond
      const picked = screenToTile(screenX, screenY + 16, originX, originY, 64, 32, 1);
      expect(picked).toEqual({ tileX: tx, tileY: ty });
    }

    expect(isTileWithinBounds(0, 0, 12, 12)).toBe(true);
    expect(isTileWithinBounds(11, 11, 12, 12)).toBe(true);
    expect(isTileWithinBounds(-1, 0, 12, 12)).toBe(false);
    expect(isTileWithinBounds(12, 5, 12, 12)).toBe(false);

    const sorted = sortPlacementsByDepth([
      { id: 'front', tileX: 5, tileY: 5 },
      { id: 'back', tileX: 1, tileY: 2 },
      { id: 'mid', tileX: 2, tileY: 3 }
    ]);
    expect(sorted.map((s) => s.id)).toEqual(['back', 'mid', 'front']);
  });

  it('loads starter meadow garden and starter placeable inventory', () => {
    const state = gardenService.getGardenState();
    expect(state.area.areaDefinitionId).toBe('meadow_starter');
    expect(state.area.gridWidth).toBe(12);
    expect(state.area.gridHeight).toBe(12);
    expect(state.placements).toHaveLength(0);
    expect(state.inventory.length).toBeGreaterThanOrEqual(6);

    const sprout = state.inventory.find((i) => i.itemId === 'item_sprout_pot')!;
    expect(sprout.ownedQuantity).toBe(3);
    expect(sprout.availableQuantity).toBe(3);
  });

  it('places, moves, and removes items while enforcing bounds, occupancy, and inventory limits', () => {
    const initial = gardenService.getGardenState();
    const gardenId = initial.area.userGardenId;

    // Place lantern (ownedQuantity: 1)
    const afterPlace = gardenService.placeItem({
      gardenId,
      itemId: 'item_wooden_lantern',
      tileX: 2,
      tileY: 3
    });

    expect(afterPlace.placements).toHaveLength(1);
    const lanternInv = afterPlace.inventory.find((i) => i.itemId === 'item_wooden_lantern')!;
    expect(lanternInv.placedCount).toBe(1);
    expect(lanternInv.availableQuantity).toBe(0);

    // Reject placing a second lantern when availableQuantity == 0
    expect(() =>
      gardenService.placeItem({
        gardenId,
        itemId: 'item_wooden_lantern',
        tileX: 4,
        tileY: 4
      })
    ).toThrow();

    // Reject placing on occupied tile
    expect(() =>
      gardenService.placeItem({
        gardenId,
        itemId: 'item_sprout_pot',
        tileX: 2,
        tileY: 3
      })
    ).toThrow();

    // Reject out-of-bounds tile
    expect(() =>
      gardenService.placeItem({
        gardenId,
        itemId: 'item_sprout_pot',
        tileX: 12,
        tileY: 0
      })
    ).toThrow();

    // Move lantern to (5, 6)
    const placementId = afterPlace.placements[0].id;
    const afterMove = gardenService.moveItem({ placementId, tileX: 5, tileY: 6 });
    expect(afterMove.placements[0].tileX).toBe(5);
    expect(afterMove.placements[0].tileY).toBe(6);

    // Remove lantern -> restores availableQuantity to 1
    const afterRemove = gardenService.removeItem(placementId);
    expect(afterRemove.placements).toHaveLength(0);
    const lanternAfterRemove = afterRemove.inventory.find(
      (i) => i.itemId === 'item_wooden_lantern'
    )!;
    expect(lanternAfterRemove.availableQuantity).toBe(1);
  });
});

