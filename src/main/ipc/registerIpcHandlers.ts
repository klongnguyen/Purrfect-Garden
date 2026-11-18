import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type {
  CreateTaskInput,
  ExchangeItemInput,
  FocusSessionFilterInput,
  LinkSessionTaskInput,
  MoveGardenItemInput,
  PlaceGardenItemInput,
  RollGachaInput,
  SetTimerModeInput,
  StartTimerInput,
  TaskListFilterInput,
  ToggleTaskCompleteInput,
  UpdateMusicPreferencesInput,
  UpdatePetNicknameInput,
  UpdatePetPlacementInput,
  UpdateTaskInput,
  UpdateTimerPreferencesInput
} from '@shared/types/domain';
import type { AchievementService } from '../services/AchievementService';
import type { FocusHistoryService } from '../services/FocusHistoryService';
import type { FoundationService } from '../services/FoundationService';
import type { GardenService } from '../services/GardenService';
import type { GoalStreakService } from '../services/GoalStreakService';
import type { MusicService } from '../services/MusicService';
import type { PetService } from '../services/PetService';
import type { ProgressionService } from '../services/ProgressionService';
import type { TaskService } from '../services/TaskService';
import type { TimerSupervisor } from '../services/TimerSupervisor';

export function registerIpcHandlers(
  foundationService: FoundationService,
  timerSupervisor: TimerSupervisor,
  focusHistoryService: FocusHistoryService,
  taskService: TaskService,
  goalStreakService: GoalStreakService,
  musicService: MusicService,
  gardenService: GardenService,
  progressionService: ProgressionService,
  achievementService: AchievementService,
  petService: PetService
): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_STATUS, () => {
    return foundationService.getSystemStatus();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return foundationService.getTimerPreferences();
  });

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_UPDATE_TIMER,
    (_event, input: UpdateTimerPreferencesInput) => {
      const updated = foundationService.updateTimerPreferences(input);
      timerSupervisor.syncIdleDurationsFromPreferences();
      return updated;
    }
  );

  ipcMain.handle(IPC_CHANNELS.PROGRESSION_GET_OVERVIEW, (_event, localDate: string) => {
    return foundationService.getProgressionOverview(localDate);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_GET_ACTIVE_AREA, () => {
    return foundationService.getActiveGardenArea();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_GET_STATE, () => {
    return timerSupervisor.getSnapshot();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_START, (_event, input?: StartTimerInput) => {
    return timerSupervisor.start(input);
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
    return timerSupervisor.pause('user');
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
    return timerSupervisor.resume();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_STOP, () => {
    return timerSupervisor.stop();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
    return timerSupervisor.reset();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_SKIP_PHASE, () => {
    return timerSupervisor.skipPhase();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_SET_MODE, (_event, input: SetTimerModeInput) => {
    return timerSupervisor.setMode(input);
  });

  ipcMain.handle(
    IPC_CHANNELS.FOCUS_HISTORY_GET_STATS,
    (_event, referenceLocalDate: string) => {
      return focusHistoryService.getStatsSummary(referenceLocalDate);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FOCUS_HISTORY_LIST_SESSIONS,
    (_event, filter?: FocusSessionFilterInput) => {
      return focusHistoryService.listSessions(filter);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FOCUS_HISTORY_GET_HEATMAP,
    (_event, endLocalDate: string, daysCount?: number) => {
      return focusHistoryService.getHeatmap(endLocalDate, daysCount);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.FOCUS_HISTORY_LINK_TASK,
    (_event, input: LinkSessionTaskInput) => {
      return focusHistoryService.linkSessionToTask(input.sessionId, input.taskId);
    }
  );

  ipcMain.handle(IPC_CHANNELS.TASKS_LIST, (_event, filter?: TaskListFilterInput) => {
    return taskService.listTasks(filter);
  });

  ipcMain.handle(IPC_CHANNELS.TASKS_GET_SUMMARY, (_event, referenceLocalDate: string) => {
    return taskService.getTaskSummary(referenceLocalDate);
  });

  ipcMain.handle(IPC_CHANNELS.TASKS_CREATE, (_event, input: CreateTaskInput) => {
    return taskService.createTask(input);
  });

  ipcMain.handle(
    IPC_CHANNELS.TASKS_UPDATE,
    (_event, taskId: string, input: UpdateTaskInput) => {
      return taskService.updateTask(taskId, input);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TASKS_TOGGLE_COMPLETE,
    (_event, input: ToggleTaskCompleteInput) => {
      return taskService.toggleTaskCompletion(input);
    }
  );

  ipcMain.handle(IPC_CHANNELS.TASKS_DELETE, (_event, taskId: string) => {
    taskService.deleteTask(taskId);
  });

  ipcMain.handle(IPC_CHANNELS.GOALS_GET_DAILY, (_event, localDate: string) => {
    return goalStreakService.syncAndGetDailyGoals(localDate);
  });

  ipcMain.handle(IPC_CHANNELS.GOALS_CLAIM_REWARD, (_event, goalInstanceId: string) => {
    return goalStreakService.claimGoalReward(goalInstanceId);
  });

  ipcMain.handle(IPC_CHANNELS.STREAK_GET_OVERVIEW, (_event, localDate: string) => {
    return goalStreakService.getStreakOverview(localDate);
  });

  ipcMain.handle(IPC_CHANNELS.MUSIC_GET_PREFERENCES, () => {
    return musicService.getMusicPreferences();
  });

  ipcMain.handle(
    IPC_CHANNELS.MUSIC_UPDATE_PREFERENCES,
    (_event, input: UpdateMusicPreferencesInput) => {
      return musicService.updateMusicPreferences(input);
    }
  );

  ipcMain.handle(IPC_CHANNELS.GARDEN_GET_STATE, (_event, gardenId?: string) => {
    return gardenService.getGardenState(gardenId);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_PLACE_ITEM, (_event, input: PlaceGardenItemInput) => {
    return gardenService.placeItem(input);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_MOVE_ITEM, (_event, input: MoveGardenItemInput) => {
    return gardenService.moveItem(input);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_REMOVE_ITEM, (_event, placementId: string) => {
    return gardenService.removeItem(placementId);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_CLEAR_LAYOUT, (_event, gardenId: string) => {
    return gardenService.clearGardenLayout(gardenId);
  });

  ipcMain.handle(IPC_CHANNELS.GOALS_GET_WEEKLY, (_event, localDate: string) => {
    return goalStreakService.syncAndGetWeeklyGoals(localDate);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_LIST_AREAS, () => {
    return gardenService.listGardenAreas();
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_UNLOCK_AREA, (_event, userGardenId: string) => {
    return gardenService.unlockGardenArea(userGardenId);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_SWITCH_AREA, (_event, userGardenId: string) => {
    return gardenService.switchActiveGarden(userGardenId);
  });

  ipcMain.handle(IPC_CHANNELS.PROGRESSION_GET_CATALOG, () => {
    return progressionService.getCatalog();
  });

  ipcMain.handle(
    IPC_CHANNELS.PROGRESSION_EXCHANGE_ITEM,
    (_event, input: ExchangeItemInput) => {
      return progressionService.exchangeItem(input);
    }
  );

  ipcMain.handle(IPC_CHANNELS.PROGRESSION_LIST_TRANSACTIONS, (_event, limit?: number) => {
    return progressionService.listTransactions(limit);
  });

  ipcMain.handle(IPC_CHANNELS.ACHIEVEMENTS_LIST, () => {
    return achievementService.listAchievements();
  });

  ipcMain.handle(IPC_CHANNELS.ACHIEVEMENTS_CLAIM_REWARD, (_event, achievementId: string) => {
    return achievementService.claimReward(achievementId);
  });

  ipcMain.handle(IPC_CHANNELS.PETS_GET_GACHA_STATE, () => {
    return petService.getGachaState();
  });

  ipcMain.handle(IPC_CHANNELS.PETS_ROLL_GACHA, (_event, input: RollGachaInput) => {
    return petService.rollGacha(input);
  });

  ipcMain.handle(
    IPC_CHANNELS.PETS_UPDATE_PLACEMENT,
    (_event, input: UpdatePetPlacementInput) => {
      return petService.updatePetPlacement(input);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PETS_UPDATE_NICKNAME,
    (_event, input: UpdatePetNicknameInput) => {
      return petService.updatePetNickname(input);
    }
  );
}

