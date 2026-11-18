import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GachaHistoryItemDTO,
  GachaStateDTO,
  PetCatalogItemDTO,
  PetRarity,
  RollGachaInput,
  RollGachaResultDTO,
  UpdatePetNicknameInput,
  UpdatePetPlacementInput
} from '@shared/types/domain';

const DUPLICATE_BONUS_XP = 25;

const GACHA_TIER_RATES: Record<PetRarity, number> = {
  common: 65,
  rare: 25,
  epic: 8,
  legendary: 2
};

interface PetCatalogRow {
  pet_definition_id: string;
  species: 'cat' | 'dog' | 'capybara';
  name: string;
  rarity: PetRarity;
  description: string;
  sprite_key: string;
  gacha_weight: number;
  user_pet_id: string | null;
  nickname: string | null;
  duplicate_count: number | null;
  placed_garden_id: string | null;
  tile_x: number | null;
  tile_y: number | null;
  acquired_at: string | null;
}

interface GachaHistoryRow {
  id: string;
  currency_type: 'ticket' | 'xp';
  currency_spent: number;
  pet_definition_id: string;
  pet_name: string;
  species: 'cat' | 'dog' | 'capybara';
  rarity: PetRarity;
  sprite_key: string;
  was_duplicate: number;
  pity_counter_after: number;
  created_at: string;
}

function mapPetRow(row: PetCatalogRow): PetCatalogItemDTO {
  return {
    petDefinitionId: row.pet_definition_id,
    species: row.species,
    name: row.name,
    rarity: row.rarity,
    description: row.description,
    spriteKey: row.sprite_key,
    gachaWeight: row.gacha_weight,
    isOwned: row.user_pet_id !== null,
    userPetId: row.user_pet_id,
    nickname: row.nickname,
    duplicateCount: row.duplicate_count ?? 0,
    placedGardenId: row.placed_garden_id,
    tileX: row.tile_x,
    tileY: row.tile_y,
    acquiredAt: row.acquired_at
  };
}

export class PetService {
  constructor(private readonly db: Database.Database) {}

  getGachaState(): GachaStateDTO {
    const ticketCount = this.getTicketCount();
    const xpBalance = this.getCurrentXpBalance();
    const pityCounter = this.getLatestPityCounter();
    const catalog = this.listPetCatalog();
    const recentHistory = this.listRecentHistory(20);

    return {
      ticketCount,
      xpBalance,
      ticketCost: DEFAULT_BALANCE_CONFIG.pets.gachaTicketCost,
      xpCost: DEFAULT_BALANCE_CONFIG.pets.gachaXpCost,
      pityCounter,
      pityThreshold: DEFAULT_BALANCE_CONFIG.pets.pityRarePlusThreshold,
      rates: { ...GACHA_TIER_RATES },
      catalog,
      recentHistory
    };
  }

  rollGacha(input: RollGachaInput, rng: () => number = Math.random): RollGachaResultDTO {
    const nowIso = new Date().toISOString();
    let result: RollGachaResultDTO | null = null;

    const tx = this.db.transaction(() => {
      const {
        gachaTicketCost: ticketCost,
        gachaXpCost: xpCost,
        pityRarePlusThreshold,
        allowedSpecies
      } = DEFAULT_BALANCE_CONFIG.pets;

      let ticketCount = this.getTicketCount();
      let xpBalance = this.getCurrentXpBalance();

      if (input.currencyType === 'ticket') {
        if (ticketCount < ticketCost) {
          throw new Error('Not enough Pet Companion Tickets.');
        }
        ticketCount -= ticketCost;
        this.db
          .prepare(
            `UPDATE inventory_items SET quantity = ?, updated_at = ? WHERE item_id = 'item_gacha_ticket'`
          )
          .run(ticketCount, nowIso);
      } else {
        if (xpBalance < xpCost) {
          throw new Error(`Need at least ${xpCost} XP to roll Companion Gacha.`);
        }
        xpBalance -= xpCost;
        this.db
          .prepare(
            `
            INSERT INTO xp_transactions (
              id, delta_xp, balance_after, source_type, reference_id, description, created_at
            ) VALUES (?, ?, ?, 'gacha_roll', NULL, 'Pet Companion Gacha roll', ?)
          `
          )
          .run(randomUUID(), -xpCost, xpBalance, nowIso);
      }

      const currentPity = this.getLatestPityCounter();
      const enforceRarePlus = currentPity + 1 >= pityRarePlusThreshold;
      const catalog = this.listPetCatalog().filter((p) =>
        allowedSpecies.includes(p.species)
      );

      if (catalog.length === 0) {
        throw new Error('No pet companions configured in catalog.');
      }

      const chosen = this.pickWeightedPet(catalog, enforceRarePlus, rng);
      const pityCounterAfter = chosen.rarity === 'common' ? currentPity + 1 : 0;

      const existingOwned = this.db
        .prepare(
          'SELECT id, duplicate_count FROM user_pets WHERE pet_definition_id = ?'
        )
        .get(chosen.petDefinitionId) as { id: string; duplicate_count: number } | undefined;

      const wasDuplicate = existingOwned !== undefined;
      let duplicateBonusXp = 0;

      if (existingOwned) {
        this.db
          .prepare('UPDATE user_pets SET duplicate_count = duplicate_count + 1 WHERE id = ?')
          .run(existingOwned.id);
        duplicateBonusXp = DUPLICATE_BONUS_XP;
        xpBalance += duplicateBonusXp;
        this.db
          .prepare(
            `
            INSERT INTO xp_transactions (
              id, delta_xp, balance_after, source_type, reference_id, description, created_at
            ) VALUES (?, ?, ?, 'gacha_roll', ?, ?, ?)
          `
          )
          .run(
            randomUUID(),
            duplicateBonusXp,
            xpBalance,
            existingOwned.id,
            `Duplicate pet XP bonus: ${chosen.name}`,
            nowIso
          );
      } else {
        this.db
          .prepare(
            `
            INSERT INTO user_pets (
              id, pet_definition_id, nickname, duplicate_count, placed_garden_id, tile_x, tile_y, acquired_at
            ) VALUES (?, ?, NULL, 1, NULL, NULL, NULL, ?)
          `
          )
          .run(randomUUID(), chosen.petDefinitionId, nowIso);
      }

      const spentAmount = input.currencyType === 'ticket' ? ticketCost : xpCost;
      this.db
        .prepare(
          `
          INSERT INTO gacha_history (
            id, currency_type, currency_spent, pet_definition_id, was_duplicate, pity_counter_after, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        )
        .run(
          randomUUID(),
          input.currencyType,
          spentAmount,
          chosen.petDefinitionId,
          wasDuplicate ? 1 : 0,
          pityCounterAfter,
          nowIso
        );

      const updatedPet = this.listPetCatalog().find(
        (p) => p.petDefinitionId === chosen.petDefinitionId
      )!;

      result = {
        pet: updatedPet,
        wasDuplicate,
        duplicateBonusXp,
        pityCounterAfter,
        ticketCount,
        newXpBalance: xpBalance
      };
    });

    tx();
    return result!;
  }

  updatePetPlacement(input: UpdatePetPlacementInput): PetCatalogItemDTO {
    const owned = this.db
      .prepare('SELECT id, pet_definition_id FROM user_pets WHERE id = ?')
      .get(input.userPetId) as { id: string; pet_definition_id: string } | undefined;

    if (!owned) {
      throw new Error(`Owned pet not found: ${input.userPetId}`);
    }

    if (!input.placed) {
      this.db
        .prepare(
          'UPDATE user_pets SET placed_garden_id = NULL, tile_x = NULL, tile_y = NULL WHERE id = ?'
        )
        .run(input.userPetId);
    } else {
      const activeGarden = this.db
        .prepare(
          `
          SELECT ug.id, gad.grid_width, gad.grid_height
          FROM user_gardens ug
          INNER JOIN garden_area_definitions gad ON gad.id = ug.area_definition_id
          WHERE ug.is_unlocked = 1
          ORDER BY ug.is_active_view DESC, ug.unlocked_at ASC
          LIMIT 1
        `
        )
        .get() as { id: string; grid_width: number; grid_height: number } | undefined;

      if (!activeGarden) {
        throw new Error('No unlocked garden available for pet placement.');
      }

      const placedCount = (
        this.db
          .prepare('SELECT COUNT(*) AS cnt FROM user_pets WHERE placed_garden_id = ?')
          .get(activeGarden.id) as { cnt: number }
      ).cnt;

      const defaultX = Math.min(activeGarden.grid_width - 1, (placedCount * 2 + 1) % activeGarden.grid_width);
      const defaultY = Math.min(activeGarden.grid_height - 1, 1 + Math.floor(placedCount / 4));
      const tileX = Math.max(0, Math.min(activeGarden.grid_width - 1, input.tileX ?? defaultX));
      const tileY = Math.max(0, Math.min(activeGarden.grid_height - 1, input.tileY ?? defaultY));

      this.db
        .prepare(
          'UPDATE user_pets SET placed_garden_id = ?, tile_x = ?, tile_y = ? WHERE id = ?'
        )
        .run(activeGarden.id, tileX, tileY, input.userPetId);
    }

    return this.listPetCatalog().find((p) => p.petDefinitionId === owned.pet_definition_id)!;
  }

  updatePetNickname(input: UpdatePetNicknameInput): PetCatalogItemDTO {
    const owned = this.db
      .prepare('SELECT id, pet_definition_id FROM user_pets WHERE id = ?')
      .get(input.userPetId) as { id: string; pet_definition_id: string } | undefined;

    if (!owned) {
      throw new Error(`Owned pet not found: ${input.userPetId}`);
    }

    const trimmed = input.nickname.trim().slice(0, 24);
    this.db
      .prepare('UPDATE user_pets SET nickname = ? WHERE id = ?')
      .run(trimmed.length > 0 ? trimmed : null, input.userPetId);

    return this.listPetCatalog().find((p) => p.petDefinitionId === owned.pet_definition_id)!;
  }

  private pickWeightedPet(
    catalog: PetCatalogItemDTO[],
    enforceRarePlus: boolean,
    rng: () => number
  ): PetCatalogItemDTO {
    const allowedRarities: PetRarity[] = enforceRarePlus
      ? ['rare', 'epic', 'legendary']
      : ['common', 'rare', 'epic', 'legendary'];

    const availableTiers = allowedRarities.filter((r) =>
      catalog.some((p) => p.rarity === r)
    );
    const tierWeightTotal = availableTiers.reduce(
      (sum, r) => sum + GACHA_TIER_RATES[r],
      0
    );

    const rollValue = Math.max(0, Math.min(0.999999, rng())) * tierWeightTotal;
    let cursor = 0;
    let chosenTier: PetRarity = availableTiers[availableTiers.length - 1];
    for (const tier of availableTiers) {
      cursor += GACHA_TIER_RATES[tier];
      if (rollValue < cursor) {
        chosenTier = tier;
        break;
      }
    }

    const tierPool = catalog.filter((p) => p.rarity === chosenTier);
    const totalWeight = tierPool.reduce((sum, p) => sum + p.gachaWeight, 0);
    let petRoll = Math.max(0, Math.min(0.999999, rng())) * totalWeight;
    for (const pet of tierPool) {
      petRoll -= pet.gachaWeight;
      if (petRoll < 0) {
        return pet;
      }
    }
    return tierPool[tierPool.length - 1];
  }

  private getTicketCount(): number {
    const row = this.db
      .prepare("SELECT quantity FROM inventory_items WHERE item_id = 'item_gacha_ticket'")
      .get() as { quantity: number } | undefined;
    return row?.quantity ?? 0;
  }

  private getCurrentXpBalance(): number {
    const row = this.db
      .prepare(
        'SELECT balance_after FROM xp_transactions ORDER BY created_at DESC, rowid DESC LIMIT 1'
      )
      .get() as { balance_after: number } | undefined;
    return row?.balance_after ?? 0;
  }

  private getLatestPityCounter(): number {
    const row = this.db
      .prepare(
        'SELECT pity_counter_after FROM gacha_history ORDER BY created_at DESC, rowid DESC LIMIT 1'
      )
      .get() as { pity_counter_after: number } | undefined;
    return row?.pity_counter_after ?? 0;
  }

  private listPetCatalog(): PetCatalogItemDTO[] {
    const rows = this.db
      .prepare(
        `
        SELECT
          pd.id AS pet_definition_id,
          pd.species,
          pd.name,
          pd.rarity,
          pd.description,
          pd.sprite_key,
          pd.gacha_weight,
          up.id AS user_pet_id,
          up.nickname,
          up.duplicate_count,
          up.placed_garden_id,
          up.tile_x,
          up.tile_y,
          up.acquired_at
        FROM pet_definitions pd
        LEFT JOIN user_pets up ON up.pet_definition_id = pd.id
        ORDER BY
          CASE pd.rarity
            WHEN 'legendary' THEN 1
            WHEN 'epic' THEN 2
            WHEN 'rare' THEN 3
            ELSE 4
          END ASC,
          pd.species ASC,
          pd.name ASC
      `
      )
      .all() as PetCatalogRow[];

    return rows.map(mapPetRow);
  }

  private listRecentHistory(limit: number): GachaHistoryItemDTO[] {
    const rows = this.db
      .prepare(
        `
        SELECT
          gh.id,
          gh.currency_type,
          gh.currency_spent,
          gh.pet_definition_id,
          pd.name AS pet_name,
          pd.species,
          pd.rarity,
          pd.sprite_key,
          gh.was_duplicate,
          gh.pity_counter_after,
          gh.created_at
        FROM gacha_history gh
        INNER JOIN pet_definitions pd ON pd.id = gh.pet_definition_id
        ORDER BY gh.created_at DESC, gh.rowid DESC
        LIMIT ?
      `
      )
      .all(limit) as GachaHistoryRow[];

    return rows.map((row) => ({
      id: row.id,
      currencyType: row.currency_type,
      currencySpent: row.currency_spent,
      petDefinitionId: row.pet_definition_id,
      petName: row.pet_name,
      species: row.species,
      rarity: row.rarity,
      spriteKey: row.sprite_key,
      wasDuplicate: row.was_duplicate === 1,
      pityCounterAfter: row.pity_counter_after,
      createdAt: row.created_at
    }));
  }
}
