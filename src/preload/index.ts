import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type { PurrfectAPI } from '@shared/types/api';
import type {
  CreateTaskInput,
  ExchangeItemInput,
  FocusCompletionResult,
  FocusSessionFilterInput,
  LinkSessionTaskInput,
  MoveGardenItemInput,
  PlaceGardenItemInput,
  RollGachaInput,
  SetTimerModeInput,
  StartTimerInput,
  TaskListFilterInput,
  TimerStateSnapshot,
  ToggleTaskCompleteInput,
  UpdateMusicPreferencesInput,
  UpdatePetNicknameInput,
  UpdatePetPlacementInput,
  UpdateTaskInput,
  UpdateTimerPreferencesInput
} from '@shared/types/domain';

const purrfectAPI: PurrfectAPI = {
  system: {
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_STATUS)
  },
  settings: {
    getTimerPreferences: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
    updateTimerPreferences: (input: UpdateTimerPreferencesInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE_TIMER, input)
  },
  progression: {
    getOverview: (localDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_GET_OVERVIEW, localDate),
    getCatalog: () => ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_GET_CATALOG),
    exchangeItem: (input: ExchangeItemInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_EXCHANGE_ITEM, input),
    listTransactions: (limit?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_LIST_TRANSACTIONS, limit)
  },
  garden: {
    getActiveArea: () => ipcRenderer.invoke(IPC_CHANNELS.GARDEN_GET_ACTIVE_AREA),
    listAreas: () => ipcRenderer.invoke(IPC_CHANNELS.GARDEN_LIST_AREAS),
    unlockArea: (userGardenId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_UNLOCK_AREA, userGardenId),
    switchArea: (userGardenId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_SWITCH_AREA, userGardenId),
    getState: (gardenId?: string) => ipcRenderer.invoke(IPC_CHANNELS.GARDEN_GET_STATE, gardenId),
    placeItem: (input: PlaceGardenItemInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_PLACE_ITEM, input),
    moveItem: (input: MoveGardenItemInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_MOVE_ITEM, input),
    removeItem: (placementId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_REMOVE_ITEM, placementId),
    clearLayout: (gardenId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GARDEN_CLEAR_LAYOUT, gardenId)
  },
  goals: {
    getDailyGoals: (localDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GOALS_GET_DAILY, localDate),
    getWeeklyGoals: (localDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GOALS_GET_WEEKLY, localDate),
    claimGoalReward: (goalInstanceId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GOALS_CLAIM_REWARD, goalInstanceId),
    getStreakOverview: (localDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.STREAK_GET_OVERVIEW, localDate)
  },
  achievements: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.ACHIEVEMENTS_LIST),
    claimReward: (achievementId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACHIEVEMENTS_CLAIM_REWARD, achievementId)
  },
  pets: {
    getGachaState: () => ipcRenderer.invoke(IPC_CHANNELS.PETS_GET_GACHA_STATE),
    rollGacha: (input: RollGachaInput) => ipcRenderer.invoke(IPC_CHANNELS.PETS_ROLL_GACHA, input),
    updatePlacement: (input: UpdatePetPlacementInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.PETS_UPDATE_PLACEMENT, input),
    updateNickname: (input: UpdatePetNicknameInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.PETS_UPDATE_NICKNAME, input)
  },
  music: {
    getPreferences: () => ipcRenderer.invoke(IPC_CHANNELS.MUSIC_GET_PREFERENCES),
    updatePreferences: (input: UpdateMusicPreferencesInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.MUSIC_UPDATE_PREFERENCES, input)
  },
  timer: {
    getState: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_GET_STATE),
    start: (input?: StartTimerInput) => ipcRenderer.invoke(IPC_CHANNELS.TIMER_START, input),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STOP),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET),
    skipPhase: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_SKIP_PHASE),
    setMode: (input: SetTimerModeInput) => ipcRenderer.invoke(IPC_CHANNELS.TIMER_SET_MODE, input),
    onTick: (callback: (snapshot: TimerStateSnapshot) => void) => {
      const listener = (_event: IpcRendererEvent, snapshot: TimerStateSnapshot) =>
        callback(snapshot);
      ipcRenderer.on(IPC_CHANNELS.TIMER_TICK_EVENT, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TIMER_TICK_EVENT, listener);
      };
    },
    onSessionCompleted: (callback: (result: FocusCompletionResult) => void) => {
      const listener = (_event: IpcRendererEvent, result: FocusCompletionResult) =>
        callback(result);
      ipcRenderer.on(IPC_CHANNELS.TIMER_COMPLETED_EVENT, listener);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TIMER_COMPLETED_EVENT, listener);
      };
    }
  },
  focusHistory: {
    getStatsSummary: (referenceLocalDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FOCUS_HISTORY_GET_STATS, referenceLocalDate),
    listSessions: (filter?: FocusSessionFilterInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.FOCUS_HISTORY_LIST_SESSIONS, filter),
    getHeatmap: (endLocalDate: string, daysCount?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.FOCUS_HISTORY_GET_HEATMAP, endLocalDate, daysCount),
    linkTask: (input: LinkSessionTaskInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.FOCUS_HISTORY_LINK_TASK, input)
  },
  tasks: {
    list: (filter?: TaskListFilterInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_LIST, filter),
    getSummary: (referenceLocalDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASKS_GET_SUMMARY, referenceLocalDate),
    create: (input: CreateTaskInput) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_CREATE, input),
    update: (taskId: string, input: UpdateTaskInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASKS_UPDATE, taskId, input),
    toggleComplete: (input: ToggleTaskCompleteInput) =>
      ipcRenderer.invoke(IPC_CHANNELS.TASKS_TOGGLE_COMPLETE, input),
    delete: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.TASKS_DELETE, taskId)
  }
};

contextBridge.exposeInMainWorld('purrfectAPI', purrfectAPI);

