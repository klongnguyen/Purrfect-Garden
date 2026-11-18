import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GardenAreaDTO,
  NavigationSectionId,
  ProgressionOverviewDTO,
  SystemStatusDTO,
  TimerPreferencesDTO,
  UpdateTimerPreferencesInput
} from '@shared/types/domain';

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AppState {
  activeSection: NavigationSectionId;
  isLoading: boolean;
  isSavingSettings: boolean;
  errorMessage: string | null;
  isBrowserFallback: boolean;
  systemStatus: SystemStatusDTO | null;
  timerPreferences: TimerPreferencesDTO | null;
  progression: ProgressionOverviewDTO | null;
  activeGarden: GardenAreaDTO | null;
  setActiveSection: (section: NavigationSectionId) => void;
  initializeApp: () => Promise<void>;
  refreshProgression: () => Promise<void>;
  updateTimerPreferences: (input: UpdateTimerPreferencesInput) => Promise<boolean>;
}

const FALLBACK_TIMER_PREFS: TimerPreferencesDTO = {
  defaultMode: 'pomodoro',
  pomodoroWorkMinutes: DEFAULT_BALANCE_CONFIG.pomodoro.workMinutes,
  pomodoroShortBreakMinutes: DEFAULT_BALANCE_CONFIG.pomodoro.shortBreakMinutes,
  pomodoroLongBreakMinutes: DEFAULT_BALANCE_CONFIG.pomodoro.longBreakMinutes,
  pomodoroCyclesBeforeLongBreak: DEFAULT_BALANCE_CONFIG.pomodoro.cyclesBeforeLongBreak,
  autoStartBreaks: DEFAULT_BALANCE_CONFIG.pomodoro.autoStartBreaks,
  autoStartWork: DEFAULT_BALANCE_CONFIG.pomodoro.autoStartWork,
  customDefaultMinutes: DEFAULT_BALANCE_CONFIG.customTimer.defaultMinutes,
  earlyStopMinXpSeconds: DEFAULT_BALANCE_CONFIG.focusRules.earlyStopMinXpSeconds,
  soundOnComplete: true,
  updatedAt: new Date().toISOString()
};

const FALLBACK_PROGRESSION: ProgressionOverviewDTO = {
  xpBalance: 0,
  todayFocusSeconds: 0,
  todaySessionsCount: 0,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastQualifiedDate: null,
    streakFreezesOwned: 0
  }
};

const FALLBACK_GARDEN: GardenAreaDTO = {
  userGardenId: 'user_garden_starter',
  areaDefinitionId: 'meadow_starter',
  name: 'Sunlit Meadow',
  customName: 'My Cozy Meadow',
  theme: 'spring_meadow',
  description: 'A bright, peaceful starter meadow ready to grow alongside your focus habit.',
  gridWidth: DEFAULT_BALANCE_CONFIG.garden.initialGridWidth,
  gridHeight: DEFAULT_BALANCE_CONFIG.garden.initialGridHeight,
  baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
  baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
  unlockXpCost: 0,
  isUnlocked: true,
  isActiveView: true
};

export const useAppStore = create<AppState>((set, get) => ({
  activeSection: 'focus',
  isLoading: true,
  isSavingSettings: false,
  errorMessage: null,
  isBrowserFallback: false,
  systemStatus: null,
  timerPreferences: null,
  progression: null,
  activeGarden: null,

  setActiveSection: (section) => {
    set({ activeSection: section });
  },

  initializeApp: async () => {
    set({ isLoading: true, errorMessage: null });
    const api = window.purrfectAPI;

    if (!api) {
      set({
        isLoading: false,
        isBrowserFallback: true,
        systemStatus: {
          schemaVersion: 1,
          tableCount: 21,
          walModeEnabled: true,
          databasePath: 'browser-preview-mock',
          config: DEFAULT_BALANCE_CONFIG
        },
        timerPreferences: FALLBACK_TIMER_PREFS,
        progression: FALLBACK_PROGRESSION,
        activeGarden: FALLBACK_GARDEN
      });
      return;
    }

    try {
      const localDate = getLocalDateKey();
      const [systemStatus, timerPreferences, progression, activeGarden] = await Promise.all([
        api.system.getStatus(),
        api.settings.getTimerPreferences(),
        api.progression.getOverview(localDate),
        api.garden.getActiveArea()
      ]);

      set({
        isLoading: false,
        isBrowserFallback: false,
        systemStatus,
        timerPreferences,
        progression,
        activeGarden
      });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to initialize Purrfect Garden.'
      });
    }
  },

  refreshProgression: async () => {
    const api = window.purrfectAPI;
    if (!api) return;
    try {
      const progression = await api.progression.getOverview(getLocalDateKey());
      set({ progression });
    } catch {
      // Non-fatal background refresh error
    }
  },

  updateTimerPreferences: async (input) => {
    set({ isSavingSettings: true, errorMessage: null });
    const api = window.purrfectAPI;

    if (!api) {
      const current = get().timerPreferences ?? FALLBACK_TIMER_PREFS;
      set({
        isSavingSettings: false,
        timerPreferences: {
          ...current,
          ...input,
          updatedAt: new Date().toISOString()
        }
      });
      return true;
    }

    try {
      const updated = await api.settings.updateTimerPreferences(input);
      set({ isSavingSettings: false, timerPreferences: updated });
      return true;
    } catch (error) {
      set({
        isSavingSettings: false,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to update timer settings.'
      });
      return false;
    }
  }
}));

