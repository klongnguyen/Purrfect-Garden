import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipcChannels';
import type { PurrfectAPI } from '@shared/types/api';
import type {
  FocusCompletionResult,
  SetTimerModeInput,
  StartTimerInput,
  TimerStateSnapshot,
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
      ipcRenderer.invoke(IPC_CHANNELS.PROGRESSION_GET_OVERVIEW, localDate)
  },
  garden: {
    getActiveArea: () => ipcRenderer.invoke(IPC_CHANNELS.GARDEN_GET_ACTIVE_AREA)
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
  }
};

contextBridge.exposeInMainWorld('purrfectAPI', purrfectAPI);

