import type {
  ClaimGoalRewardResultDTO,
  CreateTaskInput,
  DailyGoalItemDTO,
  DailyHeatmapCellDTO,
  FocusCompletionResult,
  FocusSessionFilterInput,
  FocusSessionHistoryItemDTO,
  FocusStatsSummaryDTO,
  GardenAreaDTO,
  GardenStateDTO,
  LinkSessionTaskInput,
  MoveGardenItemInput,
  MusicPreferencesDTO,
  PlaceGardenItemInput,
  ProgressionOverviewDTO,
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
  UpdateMusicPreferencesInput,
  UpdateTaskInput,
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
    getState(gardenId?: string): Promise<GardenStateDTO>;
    placeItem(input: PlaceGardenItemInput): Promise<GardenStateDTO>;
    moveItem(input: MoveGardenItemInput): Promise<GardenStateDTO>;
    removeItem(placementId: string): Promise<GardenStateDTO>;
    clearLayout(gardenId: string): Promise<GardenStateDTO>;
  };
  goals: {
    getDailyGoals(localDate: string): Promise<DailyGoalItemDTO[]>;
    claimGoalReward(goalInstanceId: string): Promise<ClaimGoalRewardResultDTO>;
    getStreakOverview(localDate: string): Promise<StreakOverviewDTO>;
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

