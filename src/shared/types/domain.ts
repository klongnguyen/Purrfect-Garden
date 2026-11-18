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
  unlockXpCost: number | null;
  placedItemsCount?: number;
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

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskViewFilter = 'today' | 'incomplete' | 'completed' | 'overdue' | 'all';

export interface TaskDTO {
  id: string;
  title: string;
  notes: string;
  category: string;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  deadlineAt: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  trackedFocusSeconds: number;
  trackedSessionsCount: number;
}

export interface CreateTaskInput {
  title: string;
  notes?: string;
  category?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number | null;
  deadlineAt?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  category?: string;
  priority?: TaskPriority;
  estimatedMinutes?: number | null;
  deadlineAt?: string | null;
}

export interface TaskListFilterInput {
  view?: TaskViewFilter;
  referenceLocalDate?: string;
  category?: string;
}

export interface ToggleTaskCompleteInput {
  taskId: string;
  isCompleted: boolean;
  localDate: string;
}

export interface TaskProgressSummaryDTO {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  overdueTasks: number;
  todayCompletedTasks: number;
  totalTrackedFocusSeconds: number;
}

export interface LinkSessionTaskInput {
  sessionId: string;
  taskId: string | null;
}

export type GoalMetricType =
  | 'focus_minutes'
  | 'focus_sessions'
  | 'tasks_completed'
  | 'single_session_minutes';

export interface DailyGoalItemDTO {
  id: string;
  templateId: string;
  periodKey: string;
  title: string;
  metricType: GoalMetricType;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
  rewardXp: number;
  completedAt: string | null;
}

export interface ClaimGoalRewardResultDTO {
  goal: DailyGoalItemDTO;
  xpAwarded: number;
  newXpBalance: number;
}

export interface StreakOverviewDTO {
  currentStreak: number;
  longestStreak: number;
  lastQualifiedDate: string | null;
  streakFreezesOwned: number;
  todayFocusSeconds: number;
  dailyMinimumSeconds: number;
  todayQualified: boolean;
  nextMilestoneDays: number;
  daysToNextMilestone: number;
}

export type AmbientLayerId = 'rain' | 'fireplace' | 'forest' | 'ocean';

export interface MusicPreferencesDTO {
  activePlaylistId: string;
  masterVolume: number;
  shuffleEnabled: boolean;
  fadeOutOnSessionEnd: boolean;
  ambienceMix: Record<AmbientLayerId, number>;
  favoriteTrackIds: string[];
  updatedAt: string;
}

export interface UpdateMusicPreferencesInput {
  activePlaylistId?: string;
  masterVolume?: number;
  shuffleEnabled?: boolean;
  fadeOutOnSessionEnd?: boolean;
  ambienceMix?: Partial<Record<AmbientLayerId, number>>;
  favoriteTrackIds?: string[];
}

export interface GardenInventoryItemDTO {
  itemId: string;
  name: string;
  category: string;
  description: string;
  rarity: string;
  spriteKey: string;
  ownedQuantity: number;
  placedCount: number;
  availableQuantity: number;
}

export interface GardenPlacementDTO {
  id: string;
  gardenId: string;
  itemId: string;
  itemName: string;
  category: string;
  spriteKey: string;
  tileX: number;
  tileY: number;
  rotation: number;
  placedAt: string;
}

export interface GardenStateDTO {
  area: GardenAreaDTO;
  placements: GardenPlacementDTO[];
  inventory: GardenInventoryItemDTO[];
}

export interface PlaceGardenItemInput {
  gardenId: string;
  itemId: string;
  tileX: number;
  tileY: number;
  rotation?: number;
}

export interface MoveGardenItemInput {
  placementId: string;
  tileX: number;
  tileY: number;
}

export type ItemCategory = 'plant' | 'seed' | 'tool' | 'technology' | 'decor' | 'ticket';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface CatalogItemDTO {
  itemId: string;
  name: string;
  category: ItemCategory;
  description: string;
  rarity: ItemRarity;
  xpCost: number | null;
  spriteKey: string;
  isPlaceable: boolean;
  ownedQuantity: number;
  placedCount: number;
  availableQuantity: number;
  firstAcquiredAt: string | null;
}

export interface ExchangeItemInput {
  itemId: string;
  quantity?: number;
}

export interface ExchangeItemResultDTO {
  item: CatalogItemDTO;
  quantityPurchased: number;
  xpSpent: number;
  newXpBalance: number;
}

export interface XPTransactionDTO {
  id: string;
  deltaXp: number;
  balanceAfter: number;
  sourceType: string;
  referenceId: string | null;
  description: string;
  createdAt: string;
}

export interface UnlockGardenResultDTO {
  area: GardenAreaDTO;
  xpSpent: number;
  newXpBalance: number;
}

export type AchievementCategory =
  | 'focus_master'
  | 'consistency'
  | 'green_thumb'
  | 'explorer'
  | 'collector'
  | 'pet_lover'
  | 'early_bird'
  | 'night_owl';

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementItemDTO {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  description: string;
  targetValue: number;
  progressValue: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  isViewed: boolean;
  rewardClaimed: boolean;
  rewardXp: number;
  rewardTickets: number;
  iconKey: string;
}

export interface ClaimAchievementRewardResultDTO {
  achievement: AchievementItemDTO;
  xpAwarded: number;
  newXpBalance: number;
}

export type PetRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GachaCurrencyType = 'ticket' | 'xp';
export type GardenWeatherMode = 'sunny' | 'rain' | 'petals' | 'starlight';

export interface PetCatalogItemDTO {
  petDefinitionId: string;
  species: 'cat' | 'dog' | 'capybara';
  name: string;
  rarity: PetRarity;
  description: string;
  spriteKey: string;
  gachaWeight: number;
  isOwned: boolean;
  userPetId: string | null;
  nickname: string | null;
  duplicateCount: number;
  placedGardenId: string | null;
  tileX: number | null;
  tileY: number | null;
  acquiredAt: string | null;
}

export interface GachaHistoryItemDTO {
  id: string;
  currencyType: GachaCurrencyType;
  currencySpent: number;
  petDefinitionId: string;
  petName: string;
  species: 'cat' | 'dog' | 'capybara';
  rarity: PetRarity;
  spriteKey: string;
  wasDuplicate: boolean;
  pityCounterAfter: number;
  createdAt: string;
}

export interface GachaStateDTO {
  ticketCount: number;
  xpBalance: number;
  ticketCost: number;
  xpCost: number;
  pityCounter: number;
  pityThreshold: number;
  rates: Record<PetRarity, number>;
  catalog: PetCatalogItemDTO[];
  recentHistory: GachaHistoryItemDTO[];
}

export interface RollGachaInput {
  currencyType: GachaCurrencyType;
}

export interface RollGachaResultDTO {
  pet: PetCatalogItemDTO;
  wasDuplicate: boolean;
  duplicateBonusXp: number;
  pityCounterAfter: number;
  ticketCount: number;
  newXpBalance: number;
}

export interface UpdatePetPlacementInput {
  userPetId: string;
  placed: boolean;
  tileX?: number;
  tileY?: number;
}

export interface UpdatePetNicknameInput {
  userPetId: string;
  nickname: string;
}

