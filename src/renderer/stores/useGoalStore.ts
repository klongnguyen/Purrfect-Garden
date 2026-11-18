import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type { DailyGoalItemDTO, StreakOverviewDTO } from '@shared/types/domain';
import { getLocalDateKey, useAppStore } from './useAppStore';

interface GoalStoreState {
  dailyGoals: DailyGoalItemDTO[];
  streakOverview: StreakOverviewDTO | null;
  isLoadingGoals: boolean;
  claimingGoalId: string | null;
  goalError: string | null;
  lastClaimBanner: string | null;
  loadGoalsAndStreak: () => Promise<void>;
  claimReward: (goalInstanceId: string) => Promise<void>;
  clearClaimBanner: () => void;
}

const FALLBACK_STREAK: StreakOverviewDTO = {
  currentStreak: 0,
  longestStreak: 0,
  lastQualifiedDate: null,
  streakFreezesOwned: 0,
  todayFocusSeconds: 0,
  dailyMinimumSeconds: DEFAULT_BALANCE_CONFIG.xp.minStreakDailyFocusSeconds,
  todayQualified: false,
  nextMilestoneDays: 3,
  daysToNextMilestone: 3
};

export const useGoalStore = create<GoalStoreState>((set) => ({
  dailyGoals: [],
  streakOverview: null,
  isLoadingGoals: false,
  claimingGoalId: null,
  goalError: null,
  lastClaimBanner: null,

  loadGoalsAndStreak: async () => {
    const api = window.purrfectAPI;
    const localDate = getLocalDateKey();

    if (!api) {
      set({
        dailyGoals: [],
        streakOverview: FALLBACK_STREAK,
        isLoadingGoals: false,
        goalError: null
      });
      return;
    }

    set({ isLoadingGoals: true, goalError: null });
    try {
      const [dailyGoals, streakOverview] = await Promise.all([
        api.goals.getDailyGoals(localDate),
        api.goals.getStreakOverview(localDate)
      ]);
      set({
        isLoadingGoals: false,
        dailyGoals,
        streakOverview
      });
    } catch (error) {
      set({
        isLoadingGoals: false,
        goalError: error instanceof Error ? error.message : 'Failed to load goals & streak.'
      });
    }
  },

  claimReward: async (goalInstanceId) => {
    const api = window.purrfectAPI;
    if (!api) return;

    set({ claimingGoalId: goalInstanceId, goalError: null, lastClaimBanner: null });
    try {
      const result = await api.goals.claimGoalReward(goalInstanceId);
      set((state) => ({
        claimingGoalId: null,
        dailyGoals: state.dailyGoals.map((g) => (g.id === goalInstanceId ? result.goal : g)),
        lastClaimBanner: `Claimed +${result.xpAwarded} XP! New balance: ${result.newXpBalance} XP.`
      }));
      await useAppStore.getState().refreshProgression();
    } catch (error) {
      set({
        claimingGoalId: null,
        goalError: error instanceof Error ? error.message : 'Failed to claim goal reward.'
      });
    }
  },

  clearClaimBanner: () => {
    set({ lastClaimBanner: null });
  }
}));
