import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  FocusCompletionResult,
  TimerMode,
  TimerStateSnapshot
} from '@shared/types/domain';
import { useAppStore } from './useAppStore';
import { useStatsStore } from './useStatsStore';

const INITIAL_TIMER_SNAPSHOT: TimerStateSnapshot = {
  sessionId: null,
  mode: 'pomodoro',
  phase: 'focus',
  status: 'idle',
  targetDurationSeconds: DEFAULT_BALANCE_CONFIG.pomodoro.workMinutes * 60,
  elapsedSeconds: 0,
  remainingSeconds: DEFAULT_BALANCE_CONFIG.pomodoro.workMinutes * 60,
  pomodoroCycleCount: 0,
  linkedTaskId: null,
  startedAtIso: null,
  pendingRecovery: false
};

interface TimerStoreState {
  timerState: TimerStateSnapshot;
  customMinutesInput: number;
  lastCompletion: FocusCompletionResult | null;
  timerError: string | null;
  initializeTimer: () => Promise<() => void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  skipPhase: () => Promise<void>;
  selectMode: (mode: TimerMode, customMinutes?: number) => Promise<void>;
  setCustomMinutesInput: (minutes: number) => void;
  clearLastCompletion: () => void;
}

let fallbackInterval: ReturnType<typeof setInterval> | null = null;
let fallbackAccumulatedMs = 0;
let fallbackResumedAtMs: number | null = null;

function stopFallbackInterval(): void {
  if (fallbackInterval !== null) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
  }
}

export const useTimerStore = create<TimerStoreState>((set, get) => ({
  timerState: INITIAL_TIMER_SNAPSHOT,
  customMinutesInput: DEFAULT_BALANCE_CONFIG.customTimer.defaultMinutes,
  lastCompletion: null,
  timerError: null,

  initializeTimer: async () => {
    const api = window.purrfectAPI;
    if (!api) {
      return () => {};
    }

    try {
      const snapshot = await api.timer.getState();
      set({ timerState: snapshot, timerError: null });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Failed to load timer state.'
      });
    }

    const unsubTick = api.timer.onTick((snapshot) => {
      set({ timerState: snapshot });
    });

    const unsubCompleted = api.timer.onSessionCompleted((result) => {
      set({
        timerState: result.nextTimerState,
        lastCompletion: result,
        timerError: null
      });
      void useAppStore.getState().refreshProgression();
      if (useStatsStore.getState().summary !== null) {
        void useStatsStore.getState().loadStatistics();
      }
    });

    return () => {
      unsubTick();
      unsubCompleted();
    };
  },

  startTimer: async () => {
    set({ timerError: null, lastCompletion: null });
    const api = window.purrfectAPI;
    const { timerState, customMinutesInput } = get();

    if (!api) {
      fallbackAccumulatedMs = 0;
      fallbackResumedAtMs = performance.now();
      const target =
        timerState.mode === 'custom'
          ? customMinutesInput * 60
          : timerState.targetDurationSeconds;

      set({
        timerState: {
          ...timerState,
          sessionId: 'browser-preview',
          status: 'running',
          targetDurationSeconds: target,
          elapsedSeconds: 0,
          remainingSeconds: target,
          pendingRecovery: false
        }
      });

      stopFallbackInterval();
      fallbackInterval = setInterval(() => {
        const current = get().timerState;
        if (current.status !== 'running' || fallbackResumedAtMs === null) return;
        const elapsed = Math.floor(
          (fallbackAccumulatedMs + (performance.now() - fallbackResumedAtMs)) / 1000
        );
        const clampedElapsed =
          current.targetDurationSeconds !== null
            ? Math.min(elapsed, current.targetDurationSeconds)
            : elapsed;
        const remaining =
          current.targetDurationSeconds !== null
            ? Math.max(0, current.targetDurationSeconds - clampedElapsed)
            : null;
        set({
          timerState: {
            ...current,
            elapsedSeconds: clampedElapsed,
            remainingSeconds: remaining
          }
        });
      }, 250);
      return;
    }

    try {
      const snapshot = await api.timer.start(
        timerState.mode === 'custom'
          ? { mode: 'custom', customDurationMinutes: customMinutesInput }
          : undefined
      );
      set({ timerState: snapshot });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to start timer.'
      });
    }
  },

  pauseTimer: async () => {
    set({ timerError: null });
    const api = window.purrfectAPI;
    if (!api) {
      if (fallbackResumedAtMs !== null) {
        fallbackAccumulatedMs += performance.now() - fallbackResumedAtMs;
        fallbackResumedAtMs = null;
      }
      stopFallbackInterval();
      set((s) => ({ timerState: { ...s.timerState, status: 'paused' } }));
      return;
    }

    try {
      const snapshot = await api.timer.pause();
      set({ timerState: snapshot });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to pause timer.'
      });
    }
  },

  resumeTimer: async () => {
    set({ timerError: null });
    const api = window.purrfectAPI;
    if (!api) {
      fallbackResumedAtMs = performance.now();
      set((s) => ({
        timerState: { ...s.timerState, status: 'running', pendingRecovery: false }
      }));
      return;
    }

    try {
      const snapshot = await api.timer.resume();
      set({ timerState: snapshot });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to resume timer.'
      });
    }
  },

  stopTimer: async () => {
    set({ timerError: null });
    const api = window.purrfectAPI;
    if (!api) {
      stopFallbackInterval();
      fallbackAccumulatedMs = 0;
      fallbackResumedAtMs = null;
      set((s) => ({
        timerState: {
          ...s.timerState,
          sessionId: null,
          status: 'idle',
          elapsedSeconds: 0,
          remainingSeconds: s.timerState.targetDurationSeconds
        }
      }));
      return;
    }

    try {
      const result = await api.timer.stop();
      set({
        timerState: result.nextTimerState,
        lastCompletion: result
      });
      await useAppStore.getState().refreshProgression();
      if (useStatsStore.getState().summary !== null) {
        void useStatsStore.getState().loadStatistics();
      }
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to stop session.'
      });
    }
  },

  resetTimer: async () => {
    set({ timerError: null });
    const api = window.purrfectAPI;
    if (!api) {
      stopFallbackInterval();
      fallbackAccumulatedMs = 0;
      fallbackResumedAtMs = null;
      set((s) => ({
        timerState: {
          ...s.timerState,
          sessionId: null,
          status: 'idle',
          elapsedSeconds: 0,
          remainingSeconds: s.timerState.targetDurationSeconds,
          pendingRecovery: false
        }
      }));
      return;
    }

    try {
      const snapshot = await api.timer.reset();
      set({ timerState: snapshot });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to reset timer.'
      });
    }
  },

  skipPhase: async () => {
    set({ timerError: null });
    const api = window.purrfectAPI;
    if (!api) return;

    try {
      const snapshot = await api.timer.skipPhase();
      set({ timerState: snapshot });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to skip phase.'
      });
    }
  },

  selectMode: async (mode, customMinutes) => {
    set({ timerError: null });
    const nextCustom = customMinutes ?? get().customMinutesInput;
    const api = window.purrfectAPI;

    if (!api) {
      const target =
        mode === 'stopwatch'
          ? null
          : mode === 'custom'
            ? nextCustom * 60
            : DEFAULT_BALANCE_CONFIG.pomodoro.workMinutes * 60;
      set((s) => ({
        customMinutesInput: nextCustom,
        timerState: {
          ...s.timerState,
          mode,
          phase: 'focus',
          targetDurationSeconds: target,
          elapsedSeconds: 0,
          remainingSeconds: target
        }
      }));
      return;
    }

    try {
      const snapshot = await api.timer.setMode({
        mode,
        customDurationMinutes: mode === 'custom' ? nextCustom : undefined
      });
      set({ timerState: snapshot, customMinutesInput: nextCustom });
    } catch (error) {
      set({
        timerError: error instanceof Error ? error.message : 'Unable to switch timer mode.'
      });
    }
  },

  setCustomMinutesInput: (minutes) => {
    const safeMinutes = Math.max(1, Math.min(300, Math.floor(minutes) || 1));
    set({ customMinutesInput: safeMinutes });
    if (get().timerState.mode === 'custom' && get().timerState.status === 'idle') {
      void get().selectMode('custom', safeMinutes);
    }
  },

  clearLastCompletion: () => {
    set({ lastCompletion: null });
  }
}));

