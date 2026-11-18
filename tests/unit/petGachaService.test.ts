import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { AchievementService } from '../../src/main/services/AchievementService';
import { PetService } from '../../src/main/services/PetService';
import { TimerSupervisor, type ClockProvider } from '../../src/main/services/TimerSupervisor';

class FakeClock implements ClockProvider {
  private monotonicMs = 10_000;
  private wallMs = Date.UTC(2026, 10, 18, 22, 0, 0);
  private dateKey = '2026-11-18';

  advanceMs(ms: number): void {
    this.monotonicMs += ms;
    this.wallMs += ms;
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

describe('Phase 3: Pet Roster, Cozy Gacha, Pity Counter & Garden Deployment', () => {
  let db: Database.Database;
  let clock: FakeClock;
  let supervisor: TimerSupervisor;
  let petService: PetService;
  let achievementService: AchievementService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    clock = new FakeClock();
    supervisor = new TimerSupervisor(db, { clock, enableAutoTick: false });
    petService = new PetService(db);
    achievementService = new AchievementService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('seeds only Cat, Dog, and Capybara species (zero bears) with starter Miso', () => {
    const state = petService.getGachaState();
    expect(state.catalog).toHaveLength(9);
    expect(state.ticketCount).toBe(2);
    expect(state.rates).toEqual({ common: 65, rare: 25, epic: 8, legendary: 2 });

    for (const pet of state.catalog) {
      expect(['cat', 'dog', 'capybara']).toContain(pet.species);
    }

    const miso = state.catalog.find((p) => p.petDefinitionId === 'pet_cat_miso')!;
    expect(miso.isOwned).toBe(true);
    expect(miso.placedGardenId).toBe('user_garden_starter');
    expect(miso.duplicateCount).toBe(1);
  });

  it('handles ticket rolls, XP rolls, duplicate +25 XP rebate, and insufficient balance guards', () => {
    // 1. Roll with 1st ticket -> unlocks first common pool pet (rng = 0.0)
    const roll1 = petService.rollGacha({ currencyType: 'ticket' }, () => 0.0);
    expect(roll1.ticketCount).toBe(1);
    expect(roll1.wasDuplicate).toBe(false);
    expect(roll1.pet.duplicateCount).toBe(1);
    expect(roll1.pityCounterAfter).toBe(1);

    // 2. Roll with 2nd ticket using same rng = 0.0 -> triggers duplicate rebate (+25 XP)
    const roll2 = petService.rollGacha({ currencyType: 'ticket' }, () => 0.0);
    expect(roll2.ticketCount).toBe(0);
    expect(roll2.wasDuplicate).toBe(true);
    expect(roll2.duplicateBonusXp).toBe(25);
    expect(roll2.newXpBalance).toBe(25);
    expect(roll2.pet.duplicateCount).toBe(2);
    expect(roll2.pityCounterAfter).toBe(2);

    // 3. No tickets and only 25 XP -> both currencies reject cleanly
    expect(() => petService.rollGacha({ currencyType: 'ticket' })).toThrow();
    expect(() => petService.rollGacha({ currencyType: 'xp' })).toThrow();

    // 4. Earn 90 XP via 3 x 25m focus sessions (+90 XP -> 115 XP total) and roll legendary via 100 XP
    for (let i = 0; i < 3; i += 1) {
      supervisor.setMode({ mode: 'custom', customDurationMinutes: 25 });
      supervisor.start();
      clock.advanceMs(1500_000);
      supervisor.tick();
    }

    const xpRoll = petService.rollGacha({ currencyType: 'xp' }, () => 0.99); // legendary window (98..100)
    expect(xpRoll.pet.rarity).toBe('legendary');
    expect(xpRoll.pet.petDefinitionId).toBe('pet_cat_luna');
    expect(xpRoll.pityCounterAfter).toBe(0);
    expect(xpRoll.newXpBalance).toBe(15); // 115 - 100
  });

  it('enforces guaranteed Rare+ pity pull on the 10th consecutive roll after 9 common rolls', () => {
    // Grant 1000 XP to fund 10 pulls cleanly
    for (let i = 0; i < 34; i += 1) {
      supervisor.setMode({ mode: 'custom', customDurationMinutes: 25 });
      supervisor.start();
      clock.advanceMs(1500_000);
      supervisor.tick();
    }

    // 9 rolls forcing common outcome (rng = 0.0)
    for (let i = 1; i <= 9; i += 1) {
      const res = petService.rollGacha({ currencyType: 'xp' }, () => 0.0);
      expect(res.pet.rarity).toBe('common');
      expect(res.pityCounterAfter).toBe(i);
    }

    // 10th roll MUST trigger pity and return Rare+ even when rng returns 0.0
    const pityRes = petService.rollGacha({ currencyType: 'xp' }, () => 0.0);
    expect(['rare', 'epic', 'legendary']).toContain(pityRes.pet.rarity);
    expect(pityRes.pityCounterAfter).toBe(0);
  });

  it('deploys/recalls pets in garden, saves custom nicknames, and credits ticket achievement rewards', () => {
    // Unlock and claim Night Owl or Streak Silver? First test placement & nickname on starter Miso
    const miso = petService
      .getGachaState()
      .catalog.find((p) => p.petDefinitionId === 'pet_cat_miso')!;
    const renamed = petService.updatePetNickname({
      userPetId: miso.userPetId!,
      nickname: '  Sunbeam Miso  '
    });
    expect(renamed.nickname).toBe('Sunbeam Miso');

    const recalled = petService.updatePetPlacement({
      userPetId: miso.userPetId!,
      placed: false
    });
    expect(recalled.placedGardenId).toBeNull();

    const redeployed = petService.updatePetPlacement({
      userPetId: miso.userPetId!,
      placed: true,
      tileX: 5,
      tileY: 6
    });
    expect(redeployed.placedGardenId).toBe('user_garden_starter');
    expect(redeployed.tileX).toBe(5);
    expect(redeployed.tileY).toBe(6);

    // Achievement ticket grant integration: finish 600m focus (10 x 60m) to unlock ach_focus_gold (reward_tickets = 1)
    for (let i = 0; i < 10; i += 1) {
      supervisor.setMode({ mode: 'custom', customDurationMinutes: 60 });
      supervisor.start();
      clock.advanceMs(3600_000);
      supervisor.tick();
    }
    achievementService.listAchievements();
    const ticketsBefore = petService.getGachaState().ticketCount;
    achievementService.claimReward('ach_focus_gold');
    const ticketsAfter = petService.getGachaState().ticketCount;
    expect(ticketsAfter).toBe(ticketsBefore + 1);
  });
});
