import type {
  FocusCompletionResult,
  GardenAreaDTO,
  ProgressionOverviewDTO,
  SetTimerModeInput,
  StartTimerInput,
  SystemStatusDTO,
  TimerPreferencesDTO,
  TimerStateSnapshot,
  UpdateTimerPreferencesInput
} from './domain';

export interface PurrfectAPI {
  system: {
    getStatus(): Promise<SystemStatusDTO>;
  };
  settings: {
    getTimerPreferences(): Promise<TimerPreferencesDTO>;
    updateTimerPreferences(input: UpdateTimerPreferencesInput): Promise<TimerPreferencesDTO>;
  };
  progression: {
    getOverview(localDate: string): Promise<ProgressionOverviewDTO>;
  };
  garden: {
    getActiveArea(): Promise<GardenAreaDTO>;
  };
  timer: {
    getState(): Promise<TimerStateSnapshot>;
    start(input?: StartTimerInput): Promise<TimerStateSnapshot>;
    pause(): Promise<TimerStateSnapshot>;
    resume(): Promise<TimerStateSnapshot>;
    stop(): Promise<FocusCompletionResult>;
    reset(): Promise<TimerStateSnapshot>;
    skipPhase(): Promise<TimerStateSnapshot>;
    setMode(input: SetTimerModeInput): Promise<TimerStateSnapshot>;
    onTick(callback: (snapshot: TimerStateSnapshot) => void): () => void;
    onSessionCompleted(callback: (result: FocusCompletionResult) => void): () => void;
  };
}

declare global {
  interface Window {
    purrfectAPI?: PurrfectAPI;
  }
}

