import type {
  AchievementItemDTO,
  CatalogItemDTO,
  ClaimAchievementRewardResultDTO,
  ClaimGoalRewardResultDTO,
  CreateTaskInput,
  DailyGoalItemDTO,
  DailyHeatmapCellDTO,
  ExchangeItemInput,
  ExchangeItemResultDTO,
  FocusCompletionResult,
  FocusSessionFilterInput,
  FocusSessionHistoryItemDTO,
  FocusStatsSummaryDTO,
  GachaStateDTO,
  GardenAreaDTO,
  GardenStateDTO,
  LinkSessionTaskInput,
  MoveGardenItemInput,
  MusicPreferencesDTO,
  PetCatalogItemDTO,
  PlaceGardenItemInput,
  ProgressionOverviewDTO,
  RollGachaInput,
  RollGachaResultDTO,
  SetTimerModeInput,
  StartTimerInput,
  StreakOverviewDTO,
  SystemStatusDTO,
  TaskDTO,
  TaskListFilterInput,
  TaskProgressSummaryDTO,
  TimerPreferencesDTO,
  TimerStateSnapshot,
  ToggleTaskCompleteInput,
  UnlockGardenResultDTO,
  UpdateMusicPreferencesInput,
  UpdatePetNicknameInput,
  UpdatePetPlacementInput,
  UpdateTaskInput,
  UpdateTimerPreferencesInput,
  XPTransactionDTO
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
    getCatalog(): Promise<CatalogItemDTO[]>;
    exchangeItem(input: ExchangeItemInput): Promise<ExchangeItemResultDTO>;
    listTransactions(limit?: number): Promise<XPTransactionDTO[]>;
  };
  garden: {
    getActiveArea(): Promise<GardenAreaDTO>;
    listAreas(): Promise<GardenAreaDTO[]>;
    unlockArea(userGardenId: string): Promise<UnlockGardenResultDTO>;
    switchArea(userGardenId: string): Promise<GardenStateDTO>;
    getState(gardenId?: string): Promise<GardenStateDTO>;
    placeItem(input: PlaceGardenItemInput): Promise<GardenStateDTO>;
    moveItem(input: MoveGardenItemInput): Promise<GardenStateDTO>;
    removeItem(placementId: string): Promise<GardenStateDTO>;
    clearLayout(gardenId: string): Promise<GardenStateDTO>;
  };
  goals: {
    getDailyGoals(localDate: string): Promise<DailyGoalItemDTO[]>;
    getWeeklyGoals(localDate: string): Promise<DailyGoalItemDTO[]>;
    claimGoalReward(goalInstanceId: string): Promise<ClaimGoalRewardResultDTO>;
    getStreakOverview(localDate: string): Promise<StreakOverviewDTO>;
  };
  achievements: {
    list(): Promise<AchievementItemDTO[]>;
    claimReward(achievementId: string): Promise<ClaimAchievementRewardResultDTO>;
  };
  pets: {
    getGachaState(): Promise<GachaStateDTO>;
    rollGacha(input: RollGachaInput): Promise<RollGachaResultDTO>;
    updatePlacement(input: UpdatePetPlacementInput): Promise<PetCatalogItemDTO>;
    updateNickname(input: UpdatePetNicknameInput): Promise<PetCatalogItemDTO>;
  };
  music: {
    getPreferences(): Promise<MusicPreferencesDTO>;
    updatePreferences(input: UpdateMusicPreferencesInput): Promise<MusicPreferencesDTO>;
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
  focusHistory: {
    getStatsSummary(referenceLocalDate: string): Promise<FocusStatsSummaryDTO>;
    listSessions(filter?: FocusSessionFilterInput): Promise<FocusSessionHistoryItemDTO[]>;
    getHeatmap(endLocalDate: string, daysCount?: number): Promise<DailyHeatmapCellDTO[]>;
    linkTask(input: LinkSessionTaskInput): Promise<FocusSessionHistoryItemDTO>;
  };
  tasks: {
    list(filter?: TaskListFilterInput): Promise<TaskDTO[]>;
    getSummary(referenceLocalDate: string): Promise<TaskProgressSummaryDTO>;
    create(input: CreateTaskInput): Promise<TaskDTO>;
    update(taskId: string, input: UpdateTaskInput): Promise<TaskDTO>;
    toggleComplete(input: ToggleTaskCompleteInput): Promise<TaskDTO>;
    delete(taskId: string): Promise<void>;
  };
}

declare global {
  interface Window {
    purrfectAPI?: PurrfectAPI;
  }
}

