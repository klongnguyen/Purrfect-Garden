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
export type TimerPhase = 'focus' | 'short_break' | 'long_break';
export type TimerStatus = 'idle' | 'running' | 'paused';
export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'stopped' | 'interrupted';

export interface TimerStateSnapshot {
  sessionId: string | null;
  mode: TimerMode;
  phase: TimerPhase;
  status: TimerStatus;
  targetDurationSeconds: number | null;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  pomodoroCycleCount: number;
  linkedTaskId: string | null;
  startedAtIso: string | null;
  pendingRecovery: boolean;
}

export interface StartTimerInput {
  mode?: TimerMode;
  customDurationMinutes?: number;
  taskId?: string | null;
}

export interface SetTimerModeInput {
  mode: TimerMode;
  customDurationMinutes?: number;
}

export interface FocusSessionDTO {
  id: string;
  mode: TimerMode;
  phase: TimerPhase;
  status: FocusSessionStatus;
  targetSeconds: number | null;
  recordedSeconds: number;
  taskId: string | null;
  localDate: string;
  startedAt: string;
  endedAt: string | null;
  xpAwarded: number;
}

export interface FocusCompletionResult {
  session: FocusSessionDTO | null;
  xpEarned: number;
  newXpBalance: number;
  todayFocusSeconds: number;
  currentStreak: number;
  nextTimerState: TimerStateSnapshot;
}

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

export type HeatmapIntensityLevel = 0 | 1 | 2 | 3 | 4;

export interface FocusSessionHistoryItemDTO extends FocusSessionDTO {
  taskTitle: string | null;
  taskCategory: string | null;
}

export interface FocusSessionFilterInput {
  limit?: number;
  includeBreaksAndInterrupted?: boolean;
  localDate?: string;
  taskId?: string;
}

export interface DailyHeatmapCellDTO {
  localDate: string;
  validFocusSeconds: number;
  completedSessionsCount: number;
  streakQualified: boolean;
  intensityLevel: HeatmapIntensityLevel;
}

export interface TaskFocusBreakdownDTO {
  taskId: string | null;
  taskTitle: string;
  category: string;
  totalFocusSeconds: number;
  sessionCount: number;
}

export interface DailyFocusTrendPointDTO {
  localDate: string;
  validFocusSeconds: number;
  completedSessionsCount: number;
}

export interface FocusStatsSummaryDTO {
  referenceLocalDate: string;
  todayFocusSeconds: number;
  todaySessionsCount: number;
  thisWeekFocusSeconds: number;
  thisWeekSessionsCount: number;
  thisMonthFocusSeconds: number;
  thisMonthSessionsCount: number;
  totalFocusSeconds: number;
  totalFocusSessionsCount: number;
  averageSessionSeconds: number;
  longestSessionSeconds: number;
  currentStreak: number;
  longestStreak: number;
  recentDailyTrend: DailyFocusTrendPointDTO[];
  taskBreakdown: TaskFocusBreakdownDTO[];
}

