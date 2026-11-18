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

export function formatDurationHuman(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  if (safe === 0) return '0m';
  if (safe < 60) return `${safe}s`;

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

