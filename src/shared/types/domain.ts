import type { BalanceConfig } from '../config/balanceConfig';

export type NavigationSectionId =
  | 'focus'
  | 'garden'
  | 'tasks'
  | 'goals'
  | 'achievements'
  | 'collection'
  | 'pets'
  | 'music'
  | 'statistics'
  | 'settings';

export type TimerMode = 'pomodoro' | 'stopwatch' | 'custom';

export interface TimerPreferencesDTO {
  defaultMode: TimerMode;
  pomodoroWorkMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroCyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  customDefaultMinutes: number;
  earlyStopMinXpSeconds: number;
  soundOnComplete: boolean;
  updatedAt: string;
}

export interface UpdateTimerPreferencesInput {
  defaultMode?: TimerMode;
  pomodoroWorkMinutes?: number;
  pomodoroShortBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  pomodoroCyclesBeforeLongBreak?: number;
  autoStartBreaks?: boolean;
  autoStartWork?: boolean;
  customDefaultMinutes?: number;
  earlyStopMinXpSeconds?: number;
  soundOnComplete?: boolean;
}

export interface StreakStateDTO {
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
  streakFreezesOwned: number;
}

export interface ProgressionOverviewDTO {
  xpBalance: number;
  todayFocusSeconds: number;
  todaySessionsCount: number;
  streak: StreakStateDTO;
}

export interface GardenAreaDTO {
  userGardenId: string;
  areaDefinitionId: string;
  name: string;
  customName: string;
  theme: string;
  description: string;
  gridWidth: number;
  gridHeight: number;
  baseTileWidth: number;
  baseTileHeight: number;
  isUnlocked: boolean;
  isActiveView: boolean;
}

export interface SystemStatusDTO {
  schemaVersion: number;
  tableCount: number;
  walModeEnabled: boolean;
  databasePath: string;
  config: BalanceConfig;
}

