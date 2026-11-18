import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  CatalogItemDTO,
  ExchangeItemInput,
  ExchangeItemResultDTO,
  ItemCategory,
  ItemRarity,
  XPTransactionDTO
} from '@shared/types/domain';

interface CatalogRow {
  item_id: string;
  name: string;
  category: ItemCategory;
  description: string;
  rarity: ItemRarity;
  xp_cost: number | null;
  sprite_key: string;
  is_placeable: number;
  owned_quantity: number;
  placed_count: number;
  first_acquired_at: string | null;
}

interface TransactionRow {
  id: string;
  delta_xp: number;
  balance_after: number;
  source_type: string;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export class ProgressionService {
  constructor(private readonly db: Database.Database) {}

  getCatalog(): CatalogItemDTO[] {
    const rows = this.db
      .prepare(
        `
        SELECT
          def.id AS item_id,
          def.name,
          def.category,
          def.description,
          def.rarity,
          def.xp_cost,
          def.sprite_key,
          def.is_placeable,
          COALESCE(inv.quantity, 0) AS owned_quantity,
          COALESCE(placed.cnt, 0) AS placed_count,
          inv.first_acquired_at
        FROM item_definitions def
        LEFT JOIN inventory_items inv ON inv.item_id = def.id
        LEFT JOIN (
          SELECT item_id, COUNT(*) AS cnt
          FROM garden_placements
          GROUP BY item_id
        ) placed ON placed.item_id = def.id
        ORDER BY COALESCE(def.xp_cost, 999999) ASC, def.name ASC
      `
      )
      .all() as CatalogRow[];

    return rows.map((row) => ({
      itemId: row.item_id,
      name: row.name,
      category: row.category,
      description: row.description,
      rarity: row.rarity,
      xpCost: row.xp_cost,
      spriteKey: row.sprite_key,
      isPlaceable: row.is_placeable === 1,
      ownedQuantity: row.owned_quantity,
      placedCount: row.placed_count,
      availableQuantity: Math.max(0, row.owned_quantity - row.placed_count),
      firstAcquiredAt: row.first_acquired_at
    }));
  }

  exchangeItem(input: ExchangeItemInput): ExchangeItemResultDTO {
    const quantity = input.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Exchange quantity must be a positive integer.');
    }

    const nowIso = new Date().toISOString();
    let result: ExchangeItemResultDTO | null = null;

    const exchangeTx = this.db.transaction(() => {
      const def = this.db
        .prepare('SELECT id, name, xp_cost FROM item_definitions WHERE id = ?')
        .get(input.itemId) as { id: string; name: string; xp_cost: number | null } | undefined;

      if (!def || def.xp_cost === null) {
        throw new Error(`Item is not available for XP exchange: ${input.itemId}`);
      }

      const xpSpent = def.xp_cost * quantity;
      const latestXp = this.db
        .prepare(
          'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
        )
        .get() as { balance_after: number } | undefined;
      const currentBalance = latestXp?.balance_after ?? 0;

      if (currentBalance < xpSpent) {
        throw new Error('Insufficient XP balance.');
      }

      const newXpBalance = currentBalance - xpSpent;

      if (xpSpent > 0) {
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
            -xpSpent,
            newXpBalance,
            def.id,
            `Exchanged ${quantity}x ${def.name}`,
            nowIso
          );
      }

      this.db
        .prepare(
          `
          INSERT INTO inventory_items (item_id, quantity, first_acquired_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(item_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            updated_at = excluded.updated_at
        `
        )
        .run(def.id, quantity, nowIso, nowIso);

      const updatedItem = this.getCatalog().find((c) => c.itemId === def.id)!;
      result = {
        item: updatedItem,
        quantityPurchased: quantity,
        xpSpent,
        newXpBalance
      };
    });

    exchangeTx();
    return result!;
  }

  listTransactions(limit = 50): XPTransactionDTO[] {
    const clamped = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `
        SELECT id, delta_xp, balance_after, source_type, reference_id, description, created_at
        FROM xp_transactions
        ORDER BY created_at DESC, rowid DESC
        LIMIT ?
      `
      )
      .all(clamped) as TransactionRow[];

    return rows.map((row) => ({
      id: row.id,
      deltaXp: row.delta_xp,
      balanceAfter: row.balance_after,
      sourceType: row.source_type,
      referenceId: row.reference_id,
      description: row.description,
      createdAt: row.created_at
    }));
  }
}

