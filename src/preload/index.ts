import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type { PurrfectAPI } from '@shared/types/api';
import type { UpdateTimerPreferencesInput } from '@shared/types/domain';

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
      ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_GET_OVERVIEW, localDate)
  },
  garden: {
    getActiveArea: () => ipcRenderer.invoke(IPC_CHANNELS.GARDEN_GET_ACTIVE_AREA)
  }
};

contextBridge.exposeInMainWorld('purrfectAPI', purrfectAPI);

