import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GardenAreaDTO,
  GardenInventoryItemDTO,
  GardenPlacementDTO,
  GardenStateDTO,
  MoveGardenItemInput,
  PlaceGardenItemInput
} from '@shared/types/domain';
import { isTileWithinBounds, sortPlacementsByDepth } from '@shared/utils/isometricMath';

interface GardenAreaRow {
  user_garden_id: string;
  area_definition_id: string;
  name: string;
  custom_name: string;
  theme: string;
  description: string;
  grid_width: number;
  grid_height: number;
  is_unlocked: number;
  is_active_view: number;
}

interface PlacementRow {
  id: string;
  garden_id: string;
  item_id: string;
  item_name: string;
  category: string;
  sprite_key: string;
  tile_x: number;
  tile_y: number;
  rotation: number;
  placed_at: string;
}

interface InventoryRow {
  item_id: string;
  name: string;
  category: string;
  description: string;
  rarity: string;
  sprite_key: string;
  owned_quantity: number;
  placed_count: number;
}

export class GardenService {
  constructor(private readonly db: Database.Database) {}

  getGardenState(gardenId?: string): GardenStateDTO {
    const areaRow = gardenId
      ? (this.db
          .prepare(
            `
            SELECT
              ug.id AS user_garden_id,
              gad.id AS area_definition_id,
              gad.name,
              ug.custom_name,
              gad.theme,
              gad.description,
              gad.grid_width,
              gad.grid_height,
              ug.is_unlocked,
              ug.is_active_view
            FROM user_gardens ug
            INNER JOIN garden_area_definitions gad ON gad.id = ug.area_definition_id
            WHERE ug.id = ?
          `
          )
          .get(gardenId) as GardenAreaRow | undefined)
      : (this.db
          .prepare(
            `
            SELECT
              ug.id AS user_garden_id,
              gad.id AS area_definition_id,
              gad.name,
              ug.custom_name,
              gad.theme,
              gad.description,
              gad.grid_width,
              gad.grid_height,
              ug.is_unlocked,
              ug.is_active_view
            FROM user_gardens ug
            INNER JOIN garden_area_definitions gad ON gad.id = ug.area_definition_id
            ORDER BY ug.is_active_view DESC, ug.unlocked_at ASC
            LIMIT 1
          `
          )
          .get() as GardenAreaRow | undefined);

    if (!areaRow) {
      throw new Error('Garden area not found.');
    }

    const area: GardenAreaDTO = {
      userGardenId: areaRow.user_garden_id,
      areaDefinitionId: areaRow.area_definition_id,
      name: areaRow.name,
      customName: areaRow.custom_name,
      theme: areaRow.theme,
      description: areaRow.description,
      gridWidth: areaRow.grid_width,
      gridHeight: areaRow.grid_height,
      baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
      baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
      isUnlocked: areaRow.is_unlocked === 1,
      isActiveView: areaRow.is_active_view === 1
    };

    const placementRows = this.db
      .prepare(
        `
        SELECT
          gp.id,
          gp.garden_id,
          gp.item_id,
          id_def.name AS item_name,
          id_def.category,
          id_def.sprite_key,
          gp.tile_x,
          gp.tile_y,
          gp.rotation,
          gp.placed_at
        FROM garden_placements gp
        INNER JOIN item_definitions id_def ON id_def.id = gp.item_id
        WHERE gp.garden_id = ?
      `
      )
      .all(area.userGardenId) as PlacementRow[];

    const placements: GardenPlacementDTO[] = sortPlacementsByDepth(
      placementRows.map((row) => ({
        id: row.id,
        gardenId: row.garden_id,
        itemId: row.item_id,
        itemName: row.item_name,
        category: row.category,
        spriteKey: row.sprite_key,
        tileX: row.tile_x,
        tileY: row.tile_y,
        rotation: row.rotation,
        placedAt: row.placed_at
      }))
    );

    const inventoryRows = this.db
      .prepare(
        `
        SELECT
          inv.item_id,
          def.name,
          def.category,
          def.description,
          def.rarity,
          def.sprite_key,
          inv.quantity AS owned_quantity,
          COALESCE(placed.cnt, 0) AS placed_count
        FROM inventory_items inv
        INNER JOIN item_definitions def ON def.id = inv.item_id
        LEFT JOIN (
          SELECT item_id, COUNT(*) AS cnt
          FROM garden_placements
          GROUP BY item_id
        ) placed ON placed.item_id = inv.item_id
        WHERE def.is_placeable = 1
        ORDER BY def.category ASC, def.name ASC
      `
      )
      .all() as InventoryRow[];

    const inventory: GardenInventoryItemDTO[] = inventoryRows.map((row) => ({
      itemId: row.item_id,
      name: row.name,
      category: row.category,
      description: row.description,
      rarity: row.rarity,
      spriteKey: row.sprite_key,
      ownedQuantity: row.owned_quantity,
      placedCount: row.placed_count,
      availableQuantity: Math.max(0, row.owned_quantity - row.placed_count)
    }));

    return { area, placements, inventory };
  }

  placeItem(input: PlaceGardenItemInput): GardenStateDTO {
    const nowIso = new Date().toISOString();

    const placeTx = this.db.transaction(() => {
      const state = this.getGardenState(input.gardenId);
      if (!state.area.isUnlocked) {
        throw new Error('Cannot place items in a locked garden.');
      }

      if (
        !isTileWithinBounds(
          input.tileX,
          input.tileY,
          state.area.gridWidth,
          state.area.gridHeight
        )
      ) {
        throw new Error(
          `Tile (${input.tileX}, ${input.tileY}) is outside ${state.area.gridWidth}x${state.area.gridHeight} garden bounds.`
        );
      }

      const occupied = this.db
        .prepare(
          'SELECT id FROM garden_placements WHERE garden_id = ? AND tile_x = ? AND tile_y = ?'
        )
        .get(input.gardenId, input.tileX, input.tileY) as { id: string } | undefined;
      if (occupied) {
        throw new Error(`Tile (${input.tileX}, ${input.tileY}) is already occupied.`);
      }

      const invItem = state.inventory.find((item) => item.itemId === input.itemId);
      if (!invItem || invItem.availableQuantity <= 0) {
        throw new Error(`No available inventory left for item: ${input.itemId}`);
      }

      this.db
        .prepare(
          `
          INSERT INTO garden_placements (
            id, garden_id, item_id, tile_x, tile_y, rotation, placed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          randomUUID(),
          input.gardenId,
          input.itemId,
          input.tileX,
          input.tileY,
          input.rotation ?? 0,
          nowIso
        );
    });

    placeTx();
    return this.getGardenState(input.gardenId);
  }

  moveItem(input: MoveGardenItemInput): GardenStateDTO {
    let targetGardenId = '';

    const moveTx = this.db.transaction(() => {
      const existing = this.db
        .prepare('SELECT id, garden_id, tile_x, tile_y FROM garden_placements WHERE id = ?')
        .get(input.placementId) as
        | { id: string; garden_id: string; tile_x: number; tile_y: number }
        | undefined;

      if (!existing) {
        throw new Error(`Garden placement not found: ${input.placementId}`);
      }

      targetGardenId = existing.garden_id;
      if (existing.tile_x === input.tileX && existing.tile_y === input.tileY) {
        return;
      }

      const state = this.getGardenState(targetGardenId);
      if (
        !isTileWithinBounds(
          input.tileX,
          input.tileY,
          state.area.gridWidth,
          state.area.gridHeight
        )
      ) {
        throw new Error(
          `Target tile (${input.tileX}, ${input.tileY}) is outside garden bounds.`
        );
      }

      const occupied = this.db
        .prepare(
          'SELECT id FROM garden_placements WHERE garden_id = ? AND tile_x = ? AND tile_y = ? AND id != ?'
        )
        .get(targetGardenId, input.tileX, input.tileY, input.placementId) as
        | { id: string }
        | undefined;
      if (occupied) {
        throw new Error(`Target tile (${input.tileX}, ${input.tileY}) is already occupied.`);
      }

      this.db
        .prepare('UPDATE garden_placements SET tile_x = ?, tile_y = ? WHERE id = ?')
        .run(input.tileX, input.tileY, input.placementId);
    });

    moveTx();
    return this.getGardenState(targetGardenId);
  }

  removeItem(placementId: string): GardenStateDTO {
    const existing = this.db
      .prepare('SELECT garden_id FROM garden_placements WHERE id = ?')
      .get(placementId) as { garden_id: string } | undefined;

    if (!existing) {
      throw new Error(`Garden placement not found: ${placementId}`);
    }

    this.db.prepare('DELETE FROM garden_placements WHERE id = ?').run(placementId);
    return this.getGardenState(existing.garden_id);
  }

  clearGardenLayout(gardenId: string): GardenStateDTO {
    this.db.prepare('DELETE FROM garden_placements WHERE garden_id = ?').run(gardenId);
    return this.getGardenState(gardenId);
  }
}

