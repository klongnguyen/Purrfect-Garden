import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type { UpdateTimerPreferencesInput } from '@shared/types/domain';
import type { FoundationService } from '../services/FoundationService';

export function registerIpcHandlers(foundationService: FoundationService): void {
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_STATUS, () => {
    return foundationService.getSystemStatus();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return foundationService.getTimerPreferences();
  });

  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_UPDATE_TIMER,
    (_event, input: UpdateTimerPreferencesInput) => {
      return foundationService.updateTimerPreferences(input);
    }
  );

  ipcMain.handle(IPC_CHANNELS.PROGRESSION_GET_OVERVIEW, (_event, localDate: string) => {
    return foundationService.getProgressionOverview(localDate);
  });

  ipcMain.handle(IPC_CHANNELS.GARDEN_GET_ACTIVE_AREA, () => {
    return foundationService.getActiveGardenArea();
  });
}

