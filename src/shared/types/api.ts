import type {
  GardenAreaDTO,
  ProgressionOverviewDTO,
  SystemStatusDTO,
  TimerPreferencesDTO,
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
}

declare global {
  interface Window {
    purrfectAPI?: PurrfectAPI;
  }
}

