import type { TimerMode, TimerPhase } from '@shared/types/domain';

export function formatTimerClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getDisplaySeconds(
  mode: TimerMode,
  elapsedSeconds: number,
  remainingSeconds: number | null
): number {
  if (mode === 'stopwatch' || remainingSeconds === null) {
    return elapsedSeconds;
  }
  return remainingSeconds;
}

export function getPhaseDisplayLabel(mode: TimerMode, phase: TimerPhase): string {
  if (mode === 'stopwatch') {
    return 'Stopwatch · Open Focus';
  }
  if (mode === 'custom') {
    return 'Custom Countdown · Focus';
  }
  switch (phase) {
    case 'focus':
      return 'Pomodoro · Focus Phase';
    case 'short_break':
      return 'Pomodoro · Short Break';
    case 'long_break':
      return 'Pomodoro · Long Break';
  }
}

