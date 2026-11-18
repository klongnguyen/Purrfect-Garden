import { create } from 'zustand';
import type {
  AchievementItemDTO,
  CatalogItemDTO,
  GardenAreaDTO,
  XPTransactionDTO
} from '@shared/types/domain';
import { useAppStore } from './useAppStore';

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
    if (!api) return;

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
    if (!api) return;

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
    if (!api) return;

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
    if (!api) return;

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

