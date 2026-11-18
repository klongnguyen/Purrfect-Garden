export const IPC_CHANNELS = Object.freeze({
  SYSTEM_GET_STATUS: 'system:get-status',
  SETTINGS_GET_ALL: 'settings:get-all',
  SETTINGS_UPDATE_TIMER: 'settings:update-timer',
  PROGRESSION_GET_OVERVIEW: 'progression:get-overview',
  GARDEN_GET_ACTIVE_AREA: 'garden:get-active-area',
  TIMER_GET_STATE: 'timer:get-state',
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_STOP: 'timer:stop',
  TIMER_RESET: 'timer:reset',
  TIMER_SKIP_PHASE: 'timer:skip-phase',
  TIMER_SET_MODE: 'timer:set-mode',
  TIMER_TICK_EVENT: 'timer:tick-event',
  TIMER_COMPLETED_EVENT: 'timer:completed-event',
  FOCUS_HISTORY_GET_STATS: 'focus-history:get-stats',
  FOCUS_HISTORY_LIST_SESSIONS: 'focus-history:list-sessions',
  FOCUS_HISTORY_GET_HEATMAP: 'focus-history:get-heatmap'
} as const);

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

