import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GardenAreaDTO,
  GardenInventoryItemDTO,
  GardenPlacementDTO,
  GardenStateDTO,
  MoveGardenItemInput,
  PlaceGardenItemInput,
  UnlockGardenResultDTO
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
  unlock_xp_cost: number | null;
  placed_items_count?: number;
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
              gad.unlock_xp_cost,
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
              gad.unlock_xp_cost,
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
      unlockXpCost: areaRow.unlock_xp_cost,
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

  listGardenAreas(): GardenAreaDTO[] {
    const rows = this.db
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
          gad.unlock_xp_cost,
          ug.is_unlocked,
          ug.is_active_view,
          COUNT(gp.id) AS placed_items_count
        FROM user_gardens ug
        INNER JOIN garden_area_definitions gad ON gad.id = ug.area_definition_id
        LEFT JOIN garden_placements gp ON gp.garden_id = ug.id
        GROUP BY ug.id
        ORDER BY COALESCE(gad.unlock_xp_cost, 0) ASC, gad.id ASC
      `
      )
      .all() as GardenAreaRow[];

    return rows.map((row) => ({
      userGardenId: row.user_garden_id,
      areaDefinitionId: row.area_definition_id,
      name: row.name,
      customName: row.custom_name,
      theme: row.theme,
      description: row.description,
      gridWidth: row.grid_width,
      gridHeight: row.grid_height,
      baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
      baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
      unlockXpCost: row.unlock_xp_cost,
      placedItemsCount: row.placed_items_count ?? 0,
      isUnlocked: row.is_unlocked === 1,
      isActiveView: row.is_active_view === 1
    }));
  }

  unlockGardenArea(userGardenId: string): UnlockGardenResultDTO {
    const nowIso = new Date().toISOString();
    let result: UnlockGardenResultDTO | null = null;

    const unlockTx = this.db.transaction(() => {
      const row = this.db
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
            gad.unlock_xp_cost,
            ug.is_unlocked,
            ug.is_active_view
          FROM user_gardens ug
          INNER JOIN garden_area_definitions gad ON gad.id = ug.area_definition_id
          WHERE ug.id = ?
        `
        )
        .get(userGardenId) as GardenAreaRow | undefined;

      if (!row) {
        throw new Error(`Garden area not found: ${userGardenId}`);
      }
      if (row.is_unlocked === 1) {
        throw new Error('Garden area is already unlocked.');
      }

      const cost = row.unlock_xp_cost ?? 0;
      const latestXp = this.db
        .prepare(
          'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
        )
        .get() as { balance_after: number } | undefined;
      const currentBalance = latestXp?.balance_after ?? 0;

      if (currentBalance < cost) {
        throw new Error('Insufficient XP balance to unlock this garden area.');
      }

      const newBalance = currentBalance - cost;
      if (cost > 0) {
        this.db
          .prepare(
            `
            INSERT INTO xp_transactions (
              id, delta_xp, balance_after, source_type, reference_id, description, created_at
            ) VALUES (?, ?, ?, 'shop_purchase', ?, ?, ?)
          `
          )
          .run(
            randomUUID(),
            -cost,
            newBalance,
            userGardenId,
            `Unlocked garden area: ${row.name}`,
            nowIso
          );
      }

      this.db
        .prepare('UPDATE user_gardens SET is_unlocked = 1, unlocked_at = ? WHERE id = ?')
        .run(nowIso, userGardenId);

      const unlockedArea = this.listGardenAreas().find(
        (a) => a.userGardenId === userGardenId
      )!;
      result = {
        area: unlockedArea,
        xpSpent: cost,
        newXpBalance: newBalance
      };
    });

    unlockTx();
    return result!;
  }

  switchActiveGarden(userGardenId: string): GardenStateDTO {
    const switchTx = this.db.transaction(() => {
      const target = this.db
        .prepare('SELECT id, is_unlocked FROM user_gardens WHERE id = ?')
        .get(userGardenId) as { id: string; is_unlocked: number } | undefined;

      if (!target) {
        throw new Error(`Garden area not found: ${userGardenId}`);
      }
      if (target.is_unlocked !== 1) {
        throw new Error('Cannot switch to a locked garden area.');
      }

      this.db
        .prepare('UPDATE user_gardens SET is_active_view = CASE WHEN id = ? THEN 1 ELSE 0 END')
        .run(userGardenId);
    });

    switchTx();
    return this.getGardenState(userGardenId);
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

