export type PetSpecies = 'cat' | 'dog' | 'capybara';

export interface BalanceConfig {
  pomodoro: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    cyclesBeforeLongBreak: number;
    autoStartBreaks: boolean;
    autoStartWork: boolean;
  };
  customTimer: {
    defaultMinutes: number;
  };
  focusRules: {
    earlyStopMinXpSeconds: number;
    recordSessionsBelowXpThreshold: boolean;
    countBreakTimeInFocusStats: boolean;
    countBreakTimeInXp: boolean;
    pauseOnAppExit: boolean;
  };
  xp: {
    xpPerFocusMinute: number;
    completionBonusXp: number;
    minStreakDailyFocusSeconds: number;
  };
  garden: {
    initialGridWidth: number;
    initialGridHeight: number;
    maxExpandableGridWidth: number;
    maxExpandableGridHeight: number;
    baseTileWidth: number;
    baseTileHeight: number;
    supportedZoomLevels: readonly number[];
    defaultZoomLevel: number;
  };
  pets: {
    allowedSpecies: readonly PetSpecies[];
    gachaTicketCost: number;
    gachaXpCost: number;
    pityRarePlusThreshold: number;
  };
}

export const DEFAULT_BALANCE_CONFIG: Readonly<BalanceConfig> = {
  pomodoro: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false
  },
  customTimer: {
    defaultMinutes: 30
  },
  focusRules: {
    earlyStopMinXpSeconds: 60,
    recordSessionsBelowXpThreshold: true,
    countBreakTimeInFocusStats: false,
    countBreakTimeInXp: false,
    pauseOnAppExit: true
  },
  xp: {
    xpPerFocusMinute: 1,
    completionBonusXp: 5,
    minStreakDailyFocusSeconds: 1200
  },
  garden: {
    initialGridWidth: 12,
    initialGridHeight: 12,
    maxExpandableGridWidth: 32,
    maxExpandableGridHeight: 32,
    baseTileWidth: 64,
    baseTileHeight: 32,
    supportedZoomLevels: [0.75, 1, 1.25, 1.5, 2, 3],
    defaultZoomLevel: 1
  },
  pets: {
    allowedSpecies: ['cat', 'dog', 'capybara'],
    gachaTicketCost: 1,
    gachaXpCost: 100,
    pityRarePlusThreshold: 10
  }
};

/**
 * Calculates XP earned for a completed or stopped session.
 * Break sessions and focus sessions shorter than `earlyStopMinXpSeconds` award 0 XP
 * while still allowing short focus sessions to be recorded in focus history.
 */
export function calculateSessionXpReward(
  elapsedSeconds: number,
  isFocusPhase: boolean,
  completedTarget: boolean,
  config: BalanceConfig = DEFAULT_BALANCE_CONFIG
): number {
  if (!isFocusPhase || elapsedSeconds < 0) {
    return 0;
  }

  if (elapsedSeconds < config.focusRules.earlyStopMinXpSeconds) {
    return 0;
  }

  const wholeMinutes = Math.floor(elapsedSeconds / 60);
  const baseXp = wholeMinutes * config.xp.xpPerFocusMinute;
  const bonusXp = completedTarget ? config.xp.completionBonusXp : 0;

  return baseXp + bonusXp;
}

