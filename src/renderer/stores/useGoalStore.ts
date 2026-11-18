import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type { DailyGoalItemDTO, StreakOverviewDTO } from '@shared/types/domain';
import { getLocalDateKey, useAppStore } from './useAppStore';

interface GoalStoreState {
  dailyGoals: DailyGoalItemDTO[];
  weeklyGoals: DailyGoalItemDTO[];
  streakOverview: StreakOverviewDTO | null;
  isLoadingGoals: boolean;
  claimingGoalId: string | null;
  goalError: string | null;
  lastClaimBanner: string | null;
  loadGoalsAndStreak: () => Promise<void>;
  claimReward: (goalInstanceId: string) => Promise<void>;
  clearClaimBanner: () => void;
}

const FALLBACK_DAILY_GOALS: DailyGoalItemDTO[] = [
  {
    id: 'preview-daily-focus',
    templateId: 'daily_focus_30m',
    periodKey: 'preview',
    title: 'Complete 30 minutes of focus study',
    metricType: 'focus_minutes',
    targetValue: 30,
    currentValue: 20,
    isCompleted: false,
    rewardClaimed: false,
    rewardXp: 25,
    completedAt: null
  },
  {
    id: 'preview-daily-sessions',
    templateId: 'daily_sessions_2',
    periodKey: 'preview',
    title: 'Finish 2 focus sessions today',
    metricType: 'focus_sessions',
    targetValue: 2,
    currentValue: 2,
    isCompleted: true,
    rewardClaimed: false,
    rewardXp: 20,
    completedAt: '2026-11-18T10:00:00.000Z'
  }
];

const FALLBACK_WEEKLY_GOALS: DailyGoalItemDTO[] = [
  {
    id: 'preview-weekly-focus',
    templateId: 'weekly_focus_180m',
    periodKey: 'preview-week',
    title: 'Accumulate 180 focus minutes this week',
    metricType: 'focus_minutes',
    targetValue: 180,
    currentValue: 95,
    isCompleted: false,
    rewardClaimed: false,
    rewardXp: 75,
    completedAt: null
  }
];

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
  weeklyGoals: [],
  streakOverview: null,
  isLoadingGoals: false,
  claimingGoalId: null,
  goalError: null,
  lastClaimBanner: null,

  loadGoalsAndStreak: async () => {
    const api = window.purrfectAPI;
    const localDate = getLocalDateKey();

    if (!api) {
      set((s) => ({
        dailyGoals: s.dailyGoals.length > 0 ? s.dailyGoals : FALLBACK_DAILY_GOALS,
        weeklyGoals: s.weeklyGoals.length > 0 ? s.weeklyGoals : FALLBACK_WEEKLY_GOALS,
        streakOverview: s.streakOverview ?? FALLBACK_STREAK,
        isLoadingGoals: false,
        goalError: null
      }));
      return;
    }

    set({ isLoadingGoals: true, goalError: null });
    try {
      const [dailyGoals, weeklyGoals, streakOverview] = await Promise.all([
        api.goals.getDailyGoals(localDate),
        api.goals.getWeeklyGoals(localDate),
        api.goals.getStreakOverview(localDate)
      ]);
      set({
        isLoadingGoals: false,
        dailyGoals,
        weeklyGoals,
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
    if (!api) {
      set((state) => {
        const all = [...state.dailyGoals, ...state.weeklyGoals];
        const target = all.find((g) => g.id === goalInstanceId);
        if (!target || !target.isCompleted || target.rewardClaimed) return state;
        return {
          dailyGoals: state.dailyGoals.map((g) =>
            g.id === goalInstanceId ? { ...g, rewardClaimed: true } : g
          ),
          weeklyGoals: state.weeklyGoals.map((g) =>
            g.id === goalInstanceId ? { ...g, rewardClaimed: true } : g
          ),
          lastClaimBanner: `Preview Mode: Claimed +${target.rewardXp} XP!`
        };
      });
      return;
    }

    set({ claimingGoalId: goalInstanceId, goalError: null, lastClaimBanner: null });
    try {
      const result = await api.goals.claimGoalReward(goalInstanceId);
      set((state) => ({
        claimingGoalId: null,
        dailyGoals: state.dailyGoals.map((g) => (g.id === goalInstanceId ? result.goal : g)),
        weeklyGoals: state.weeklyGoals.map((g) => (g.id === goalInstanceId ? result.goal : g)),
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
