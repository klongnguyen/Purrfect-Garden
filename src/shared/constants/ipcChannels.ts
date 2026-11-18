export const IPC_CHANNELS = Object.freeze({
  SYSTEM_GET_STATUS: 'system:get-status',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_UPDATE_TIMER: 'settings:update-timer',
  PROGRESSION_GET_OVERVIEW: 'progression:get-overview',
  GARDEN_GET_ACTIVE_AREA: 'garden:get-active-area'
} as const);

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

