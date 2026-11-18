import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type {
  FocusSessionFilterInput,
  SetTimerModeInput,
  StartTimerInput,
  UpdateTimerPreferencesInput
} from '@shared/types/domain';
import type { FocusHistoryService } from '../services/FocusHistoryService';
import type { FoundationService } from '../services/FoundationService';
import type { TimerSupervisor } from '../services/TimerSupervisor';

export function registerIpcHandlers(
  foundationService: FoundationService,
  timerSupervisor: TimerSupervisor,
  focusHistoryService: FocusHistoryService
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
}

