import { create } from 'zustand';
import type {
  AchievementItemDTO,
  CatalogItemDTO,
  GardenAreaDTO,
  XPTransactionDTO
} from '@shared/types/domain';
import { useAppStore } from './useAppStore';

const FALLBACK_ACHIEVEMENTS: AchievementItemDTO[] = [
  {
    id: 'ach_focus_bronze',
    category: 'focus_master',
    tier: 'gold',
    name: 'First Steps',
    description: 'First 1-hour study milestone completed.',
    targetValue: 60,
    progressValue: 60,
    isUnlocked: true,
    unlockedAt: '2026-11-18T08:00:00.000Z',
    isViewed: true,
    rewardClaimed: true,
    rewardXp: 50,
    rewardTickets: 1,
    iconKey: 'trophy'
  },
  {
    id: 'ach_green_bronze',
    category: 'green_thumb',
    tier: 'silver',
    name: 'Gardener',
    description: 'Plant 10 thriving plants across your garden.',
    targetValue: 10,
    progressValue: 10,
    isUnlocked: true,
    unlockedAt: '2026-11-18T09:00:00.000Z',
    isViewed: true,
    rewardClaimed: false,
    rewardXp: 40,
    rewardTickets: 1,
    iconKey: 'watering_can'
  },
  {
    id: 'ach_streak_bronze',
    category: 'consistency',
    tier: 'bronze',
    name: 'Dedicated',
    description: 'Maintain a calm 7-day study streak.',
    targetValue: 7,
    progressValue: 3,
    isUnlocked: false,
    unlockedAt: null,
    isViewed: false,
    rewardClaimed: false,
    rewardXp: 60,
    rewardTickets: 2,
    iconKey: 'cat'
  },
  {
    id: 'ach_explorer_bronze',
    category: 'explorer',
    tier: 'bronze',
    name: 'Seasonal Wanderer',
    description: 'Unlock 2 seasonal garden areas.',
    targetValue: 2,
    progressValue: 1,
    isUnlocked: false,
    unlockedAt: null,
    isViewed: false,
    rewardClaimed: false,
    rewardXp: 45,
    rewardTickets: 1,
    iconKey: 'compass'
  },
  {
    id: 'ach_collector_bronze',
    category: 'collector',
    tier: 'silver',
    name: 'Botanical Keeper',
    description: 'Own 6 unique plants, seeds, or tools.',
    targetValue: 6,
    progressValue: 5,
    isUnlocked: false,
    unlockedAt: null,
    isViewed: false,
    rewardClaimed: false,
    rewardXp: 50,
    rewardTickets: 1,
    iconKey: 'book'
  },
  {
    id: 'ach_night_owl',
    category: 'night_owl',
    tier: 'bronze',
    name: 'Starlight Scholar',
    description: 'Complete an evening deep-focus block.',
    targetValue: 1,
    progressValue: 1,
    isUnlocked: true,
    unlockedAt: '2026-11-18T10:00:00.000Z',
    isViewed: true,
    rewardClaimed: false,
    rewardXp: 35,
    rewardTickets: 1,
    iconKey: 'moon'
  }
];

const FALLBACK_CATALOG: CatalogItemDTO[] = [
  {
    itemId: 'item_sprout_pot',
    name: 'Terracotta Sprout',
    category: 'plant',
    description: 'A cheerful little sprout in a warm clay pot.',
    rarity: 'common',
    xpCost: 15,
    spriteKey: 'sprout_pot',
    isPlaceable: true,
    ownedQuantity: 4,
    placedCount: 1,
    availableQuantity: 3,
    firstAcquiredAt: '2026-11-18T08:00:00.000Z'
  },
  {
    itemId: 'item_sunlit_daisy',
    name: 'Sunlit Daisy',
    category: 'plant',
    description: 'Bright white petals that love morning focus sessions.',
    rarity: 'common',
    xpCost: 20,
    spriteKey: 'sunlit_daisy',
    isPlaceable: true,
    ownedQuantity: 3,
    placedCount: 1,
    availableQuantity: 2,
    firstAcquiredAt: '2026-11-18T08:00:00.000Z'
  },
  {
    itemId: 'item_watering_can',
    name: 'Flower Watering Can',
    category: 'tool',
    description: 'Periwinkle watering can painted with a daisy blossom.',
    rarity: 'uncommon',
    xpCost: 30,
    spriteKey: 'watering_can',
    isPlaceable: true,
    ownedQuantity: 1,
    placedCount: 0,
    availableQuantity: 1,
    firstAcquiredAt: '2026-11-18T08:00:00.000Z'
  },
  {
    itemId: 'item_cherry_bonsai',
    name: 'Cherry Blossom Bonsai',
    category: 'plant',
    description: 'Miniature blooming sakura tree in a ceramic glaze dish.',
    rarity: 'rare',
    xpCost: 65,
    spriteKey: 'cherry_bonsai',
    isPlaceable: true,
    ownedQuantity: 1,
    placedCount: 0,
    availableQuantity: 1,
    firstAcquiredAt: '2026-11-18T08:00:00.000Z'
  },
  {
    itemId: 'item_crystal_lotus',
    name: 'Crystal Lotus',
    category: 'plant',
    description: 'Luminous cyan lotus blooming under twilight stars.',
    rarity: 'epic',
    xpCost: 90,
    spriteKey: 'crystal_lotus',
    isPlaceable: true,
    ownedQuantity: 0,
    placedCount: 0,
    availableQuantity: 0,
    firstAcquiredAt: null
  }
];

const FALLBACK_GARDEN_AREAS: GardenAreaDTO[] = [
  {
    userGardenId: 'user_garden_starter',
    areaDefinitionId: 'meadow_starter',
    name: 'Sunlit Meadow',
    customName: 'My Cozy Meadow',
    theme: 'spring_meadow',
    description: 'Starter sunny meadow.',
    gridWidth: 12,
    gridHeight: 12,
    baseTileWidth: 64,
    baseTileHeight: 32,
    unlockXpCost: 0,
    isUnlocked: true,
    isActiveView: true
  },
  {
    userGardenId: 'user_garden_autumn',
    areaDefinitionId: 'autumn_grove',
    name: 'Autumn Grove',
    customName: 'Amber Harvest Yard',
    theme: 'autumn_grove',
    description: 'Autumn pumpkin & maple grove.',
    gridWidth: 14,
    gridHeight: 14,
    baseTileWidth: 64,
    baseTileHeight: 32,
    unlockXpCost: 120,
    isUnlocked: false,
    isActiveView: false
  }
];

interface ProgressionStoreState {
  catalog: CatalogItemDTO[];
  transactions: XPTransactionDTO[];
  gardenAreas: GardenAreaDTO[];
  achievements: AchievementItemDTO[];
  isLoadingProgression: boolean;
  exchangingItemId: string | null;
  claimingAchievementId: string | null;
  progressionError: string | null;
  actionBanner: string | null;
  loadCollectionData: () => Promise<void>;
  exchangeItem: (itemId: string, quantity?: number) => Promise<void>;
  loadAchievements: () => Promise<void>;
  claimAchievementReward: (achievementId: string) => Promise<void>;
  clearActionBanner: () => void;
}

export const useProgressionStore = create<ProgressionStoreState>((set) => ({
  catalog: [],
  transactions: [],
  gardenAreas: [],
  achievements: [],
  isLoadingProgression: false,
  exchangingItemId: null,
  claimingAchievementId: null,
  progressionError: null,
  actionBanner: null,

  loadCollectionData: async () => {
    const api = window.purrfectAPI;
    if (!api) {
      set((s) => ({
        catalog: s.catalog.length > 0 ? s.catalog : FALLBACK_CATALOG,
        gardenAreas: s.gardenAreas.length > 0 ? s.gardenAreas : FALLBACK_GARDEN_AREAS,
        isLoadingProgression: false,
        progressionError: null
      }));
      return;
    }

    set({ isLoadingProgression: true, progressionError: null });
    try {
      const [catalog, transactions, gardenAreas] = await Promise.all([
        api.progression.getCatalog(),
        api.progression.listTransactions(50),
        api.garden.listAreas()
      ]);
      set({
        isLoadingProgression: false,
        catalog,
        transactions,
        gardenAreas
      });
    } catch (error) {
      set({
        isLoadingProgression: false,
        progressionError:
          error instanceof Error ? error.message : 'Failed to load collection data.'
      });
    }
  },

  exchangeItem: async (itemId, quantity = 1) => {
    const api = window.purrfectAPI;
    if (!api) {
      set((state) => {
        const target = state.catalog.find((i) => i.itemId === itemId);
        if (!target) return state;
        return {
          catalog: state.catalog.map((i) =>
            i.itemId === itemId
              ? {
                  ...i,
                  ownedQuantity: i.ownedQuantity + quantity,
                  availableQuantity: i.availableQuantity + quantity
                }
              : i
          ),
          actionBanner: `Preview Mode: Added ${quantity}x ${target.name} to collection.`
        };
      });
      return;
    }

    set({ exchangingItemId: itemId, progressionError: null, actionBanner: null });
    try {
      const res = await api.progression.exchangeItem({ itemId, quantity });
      const [catalog, transactions] = await Promise.all([
        api.progression.getCatalog(),
        api.progression.listTransactions(50)
      ]);
      set({
        exchangingItemId: null,
        catalog,
        transactions,
        actionBanner: `Added ${res.quantityPurchased}x ${res.item.name} (-${res.xpSpent} XP). Remaining balance: ${res.newXpBalance} XP.`
      });
      await useAppStore.getState().refreshProgression();
    } catch (error) {
      set({
        exchangingItemId: null,
        progressionError:
          error instanceof Error ? error.message : 'Unable to exchange XP for item.'
      });
    }
  },

  loadAchievements: async () => {
    const api = window.purrfectAPI;
    if (!api) {
      set((s) => ({
        achievements: s.achievements.length > 0 ? s.achievements : FALLBACK_ACHIEVEMENTS,
        isLoadingProgression: false,
        progressionError: null
      }));
      return;
    }

    set({ isLoadingProgression: true, progressionError: null });
    try {
      const achievements = await api.achievements.list();
      set({ isLoadingProgression: false, achievements });
    } catch (error) {
      set({
        isLoadingProgression: false,
        progressionError:
          error instanceof Error ? error.message : 'Failed to load achievements.'
      });
    }
  },

  claimAchievementReward: async (achievementId) => {
    const api = window.purrfectAPI;
    if (!api) {
      set((state) => {
        const target = state.achievements.find((a) => a.id === achievementId);
        if (!target || !target.isUnlocked || target.rewardClaimed) return state;
        return {
          achievements: state.achievements.map((a) =>
            a.id === achievementId ? { ...a, rewardClaimed: true } : a
          ),
          actionBanner: `Preview Mode: Claimed +${target.rewardXp} XP from "${target.name}".`
        };
      });
      return;
    }

    set({ claimingAchievementId: achievementId, progressionError: null, actionBanner: null });
    try {
      const res = await api.achievements.claimReward(achievementId);
      set((state) => ({
        claimingAchievementId: null,
        achievements: state.achievements.map((a) =>
          a.id === achievementId ? res.achievement : a
        ),
        actionBanner: `Achievement reward claimed: +${res.xpAwarded} XP! New balance: ${res.newXpBalance} XP.`
      }));
      await useAppStore.getState().refreshProgression();
    } catch (error) {
      set({
        claimingAchievementId: null,
        progressionError:
          error instanceof Error ? error.message : 'Unable to claim achievement reward.'
      });
    }
  },

  clearActionBanner: () => {
    set({ actionBanner: null });
  }
}));

