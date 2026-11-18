import { FastForward, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { useTimerStore } from '../../stores/useTimerStore';

interface TimerControlsProps {
  compact?: boolean;
}

export function TimerControls({ compact = false }: TimerControlsProps) {
  const timerState = useTimerStore((s) => s.timerState);
  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const resetTimer = useTimerStore((s) => s.resetTimer);
  const skipPhase = useTimerStore((s) => s.skipPhase);

  const isBreakPhase = timerState.mode === 'pomodoro' && timerState.phase !== 'focus';
  const startLabel = isBreakPhase ? 'Start Break' : 'Start Focus';

  if (timerState.status === 'idle') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 ${compact ? 'w-full' : ''}`}>
        <button
          type="button"
          onClick={() => void startTimer()}
          className={`cozy-btn-primary ${compact ? 'w-full' : 'px-6'}`}
        >
          <Play className="h-4 w-4" />
          <span>{startLabel}</span>
        </button>

        {timerState.mode === 'pomodoro' && (
          <button
            type="button"
            onClick={() => void skipPhase()}
            className={`cozy-btn-secondary ${compact ? 'w-full' : ''}`}
            title="Skip to next Pomodoro phase"
          >
            <FastForward className="h-4 w-4" />
            <span>Skip Phase</span>
          </button>
        )}
      </div>
    );
  }

  if (timerState.status === 'running') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 ${compact ? 'w-full' : ''}`}>
        <button
          type="button"
          onClick={() => void pauseTimer()}
          className={`cozy-btn-secondary ${compact ? 'flex-1' : ''}`}
        >
          <Pause className="h-4 w-4" />
          <span>Pause</span>
        </button>

        <button
          type="button"
          onClick={() => void stopTimer()}
          className={`cozy-btn-primary ${compact ? 'flex-1' : ''}`}
        >
          <Square className="h-4 w-4" />
          <span>Finish</span>
        </button>

        <button
          type="button"
          onClick={() => void resetTimer()}
          className="cozy-btn-secondary"
          title="Discard current elapsed progress and reset"
        >
          <RotateCcw className="h-4 w-4" />
          {!compact && <span>Reset</span>}
        </button>

        {!compact && timerState.mode === 'pomodoro' && (
          <button
            type="button"
            onClick={() => void skipPhase()}
            className="cozy-btn-secondary"
            title="Skip to next Pomodoro phase"
          >
            <FastForward className="h-4 w-4" />
            <span>Skip</span>
          </button>
        )}
      </div>
    );
  }

  // status === 'paused'
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${compact ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => void resumeTimer()}
        className={`cozy-btn-primary ${compact ? 'flex-1' : 'px-5'}`}
      >
        <Play className="h-4 w-4" />
        <span>Resume</span>
      </button>

      <button
        type="button"
        onClick={() => void stopTimer()}
        className={`cozy-btn-secondary ${compact ? 'flex-1' : ''}`}
      >
        <Square className="h-4 w-4" />
        <span>Finish</span>
      </button>

      <button
        type="button"
        onClick={() => void resetTimer()}
        className="cozy-btn-secondary"
        title="Discard paused session and reset"
      >
        <RotateCcw className="h-4 w-4" />
        {!compact && <span>Reset</span>}
      </button>
    </div>
  );
}

