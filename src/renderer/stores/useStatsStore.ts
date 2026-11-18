import { create } from 'zustand';
import type {
  DailyHeatmapCellDTO,
  FocusSessionHistoryItemDTO,
  FocusStatsSummaryDTO
} from '@shared/types/domain';
import { getLocalDateKey } from './useAppStore';

interface StatsStoreState {
  summary: FocusStatsSummaryDTO | null;
  sessions: FocusSessionHistoryItemDTO[];
  heatmap: DailyHeatmapCellDTO[];
  includeBreaksAndInterrupted: boolean;
  isLoadingStats: boolean;
  statsError: string | null;
  loadStatistics: () => Promise<void>;
  setIncludeBreaksAndInterrupted: (value: boolean) => Promise<void>;
}

export const useStatsStore = create<StatsStoreState>((set, get) => ({
  summary: null,
  sessions: [],
  heatmap: [],
  includeBreaksAndInterrupted: false,
  isLoadingStats: false,
  statsError: null,

  loadStatistics: async () => {
    const api = window.purrfectAPI;
    const todayKey = getLocalDateKey();
    const includeBreaksAndInterrupted = get().includeBreaksAndInterrupted;

    if (!api) {
      set({
        isLoadingStats: false,
        statsError: null,
        summary: {
          referenceLocalDate: todayKey,
          todayFocusSeconds: 0,
          todaySessionsCount: 0,
          thisWeekFocusSeconds: 0,
          thisWeekSessionsCount: 0,
          thisMonthFocusSeconds: 0,
          thisMonthSessionsCount: 0,
          totalFocusSeconds: 0,
          totalFocusSessionsCount: 0,
          averageSessionSeconds: 0,
          longestSessionSeconds: 0,
          currentStreak: 0,
          longestStreak: 0,
          recentDailyTrend: [],
          taskBreakdown: []
        },
        sessions: [],
        heatmap: []
      });
      return;
    }

    set({ isLoadingStats: true, statsError: null });
    try {
      const [summary, sessions, heatmap] = await Promise.all([
        api.focusHistory.getStatsSummary(todayKey),
        api.focusHistory.listSessions({
          limit: 50,
          includeBreaksAndInterrupted
        }),
        api.focusHistory.getHeatmap(todayKey, 84)
      ]);

      set({
        isLoadingStats: false,
        summary,
        sessions,
        heatmap
      });
    } catch (error) {
      set({
        isLoadingStats: false,
        statsError:
          error instanceof Error ? error.message : 'Failed to load focus statistics.'
      });
    }
  },

  setIncludeBreaksAndInterrupted: async (value) => {
    set({ includeBreaksAndInterrupted: value });
    const api = window.purrfectAPI;
    if (!api) return;

    try {
      const sessions = await api.focusHistory.listSessions({
        limit: 50,
        includeBreaksAndInterrupted: value
      });
      set({ sessions });
    } catch (error) {
      set({
        statsError:
          error instanceof Error ? error.message : 'Failed to refresh session history.'
      });
    }
  }
}));

