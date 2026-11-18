import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BALANCE_CONFIG,
  calculateSessionXpReward
} from '@shared/config/balanceConfig';

describe('balanceConfig & XP rules', () => {
  it('provides approved configurable default values', () => {
    expect(DEFAULT_BALANCE_CONFIG.pomodoro.workMinutes).toBe(25);
    expect(DEFAULT_BALANCE_CONFIG.pomodoro.shortBreakMinutes).toBe(5);
    expect(DEFAULT_BALANCE_CONFIG.pomodoro.longBreakMinutes).toBe(15);
    expect(DEFAULT_BALANCE_CONFIG.pomodoro.cyclesBeforeLongBreak).toBe(4);
    expect(DEFAULT_BALANCE_CONFIG.focusRules.earlyStopMinXpSeconds).toBe(60);
    expect(DEFAULT_BALANCE_CONFIG.focusRules.recordSessionsBelowXpThreshold).toBe(true);
    expect(DEFAULT_BALANCE_CONFIG.xp.xpPerFocusMinute).toBe(1);
    expect(DEFAULT_BALANCE_CONFIG.xp.completionBonusXp).toBe(5);
  });

  it('defines expandable garden grid defaults and 64x32 isometric tile scale', () => {
    expect(DEFAULT_BALANCE_CONFIG.garden.initialGridWidth).toBe(12);
    expect(DEFAULT_BALANCE_CONFIG.garden.initialGridHeight).toBe(12);
    expect(DEFAULT_BALANCE_CONFIG.garden.maxExpandableGridWidth).toBeGreaterThan(12);
    expect(DEFAULT_BALANCE_CONFIG.garden.baseTileWidth).toBe(64);
    expect(DEFAULT_BALANCE_CONFIG.garden.baseTileHeight).toBe(32);
    expect(DEFAULT_BALANCE_CONFIG.garden.supportedZoomLevels).toContain(1);
    expect(DEFAULT_BALANCE_CONFIG.garden.supportedZoomLevels).toContain(2);
  });

  it('limits allowed initial pet species to cat, dog, and capybara (no bear)', () => {
    expect(DEFAULT_BALANCE_CONFIG.pets.allowedSpecies).toEqual([
      'cat',
      'dog',
      'capybara'
    ]);
    expect(DEFAULT_BALANCE_CONFIG.pets.allowedSpecies).not.toContain('bear');
  });

  it('awards 0 XP for focus sessions shorter than 60 seconds while still recordable', () => {
    expect(calculateSessionXpReward(0, true, false)).toBe(0);
    expect(calculateSessionXpReward(59, true, true)).toBe(0);
    expect(calculateSessionXpReward(-10, true, true)).toBe(0);
  });

  it('awards 1 XP per focus minute plus +5 XP completion bonus when >= 60 seconds', () => {
    expect(calculateSessionXpReward(60, true, false)).toBe(1);
    expect(calculateSessionXpReward(1500, true, false)).toBe(25);
    expect(calculateSessionXpReward(1500, true, true)).toBe(30);
  });

  it('never awards XP for break phases regardless of duration', () => {
    expect(calculateSessionXpReward(300, false, true)).toBe(0);
    expect(calculateSessionXpReward(900, false, true)).toBe(0);
  });

  it('respects custom configurable XP & threshold overrides', () => {
    const customConfig = {
      ...DEFAULT_BALANCE_CONFIG,
      focusRules: {
        ...DEFAULT_BALANCE_CONFIG.focusRules,
        earlyStopMinXpSeconds: 120
      },
      xp: {
        ...DEFAULT_BALANCE_CONFIG.xp,
        xpPerFocusMinute: 2,
        completionBonusXp: 10
      }
    };

    expect(calculateSessionXpReward(90, true, true, customConfig)).toBe(0);
    expect(calculateSessionXpReward(120, true, false, customConfig)).toBe(4);
    expect(calculateSessionXpReward(120, true, true, customConfig)).toBe(14);
  });
});

