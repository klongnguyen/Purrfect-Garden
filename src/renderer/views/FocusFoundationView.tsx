import { AlertCircle, CheckCircle2, Clock, Flower2, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { TimerMode } from '@shared/types/domain';
import { TimerControls } from '../components/timer/TimerControls';
import { useAppStore } from '../stores/useAppStore';
import { useTimerStore } from '../stores/useTimerStore';
import { formatTimerClock, getDisplaySeconds, getPhaseDisplayLabel } from '../utils/formatTime';

const MODE_OPTIONS: ReadonlyArray<{ id: TimerMode; label: string }> = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'stopwatch', label: 'Stopwatch' },
  { id: 'custom', label: 'Custom Timer' }
];

export function FocusFoundationView() {
  const timerPreferences = useAppStore((s) => s.timerPreferences);
  const progression = useAppStore((s) => s.progression);
  const activeGarden = useAppStore((s) => s.activeGarden);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const timerState = useTimerStore((s) => s.timerState);
  const customMinutesInput = useTimerStore((s) => s.customMinutesInput);
  const lastCompletion = useTimerStore((s) => s.lastCompletion);
  const timerError = useTimerStore((s) => s.timerError);
  const selectMode = useTimerStore((s) => s.selectMode);
  const setCustomMinutesInput = useTimerStore((s) => s.setCustomMinutesInput);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const clearLastCompletion = useTimerStore((s) => s.clearLastCompletion);

  const workMinutes = timerPreferences?.pomodoroWorkMinutes ?? 25;
  const shortBreak = timerPreferences?.pomodoroShortBreakMinutes ?? 5;
  const longBreak = timerPreferences?.pomodoroLongBreakMinutes ?? 15;
  const earlyStopThreshold = timerPreferences?.earlyStopMinXpSeconds ?? 60;
  const todayMinutes = Math.floor((progression?.todayFocusSeconds ?? 0) / 60);

  const displaySeconds = getDisplaySeconds(
    timerState.mode,
    timerState.elapsedSeconds,
    timerState.remainingSeconds
  );
  const phaseLabel = getPhaseDisplayLabel(timerState.mode, timerState.phase);
  const isIdle = timerState.status === 'idle';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Clock className="h-3.5 w-3.5" />
            Focus Workspace · Authoritative Monotonic Timer
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
            Ready for a calm focus session?
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className="cozy-btn-secondary"
        >
          Configure Timer Defaults
        </button>
      </header>

      {/* Restored Interrupted Session Banner */}
      {timerState.pendingRecovery && timerState.status === 'paused' && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cozy-amber bg-cozy-amber/20 px-5 py-3.5"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-cozy-wood" />
            <div>
              <p className="text-sm font-bold text-cozy-wood">
                Paused Session Restored ({formatTimerClock(timerState.elapsedSeconds)} elapsed)
              </p>
              <p className="text-xs text-cozy-muted">
                Your active session was automatically paused when the app closed or slept. Zero
                offline time was added.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void resumeTimer()}
              className="cozy-btn-primary py-1.5 text-xs"
            >
              Resume Session
            </button>
            <button
              type="button"
              onClick={() => void stopTimer()}
              className="cozy-btn-secondary py-1.5 text-xs"
            >
              Finish &amp; Save
            </button>
          </div>
        </div>
      )}

      {/* Session Completion Summary Banner */}
      {lastCompletion?.session && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-2xl border border-cozy-sage/50 bg-cozy-meadow/80 px-5 py-3.5"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-cozy-sage-dark" />
            <div>
              <p className="text-sm font-bold text-cozy-wood">
                {lastCompletion.session.phase === 'focus'
                  ? 'Focus session recorded!'
                  : 'Break phase completed!'}{' '}
                ({formatTimerClock(lastCompletion.session.recordedSeconds)})
              </p>
              <p className="text-xs text-cozy-muted">
                {lastCompletion.session.phase !== 'focus'
                  ? 'Break sessions are logged without adding focus XP or focus totals.'
                  : lastCompletion.xpEarned > 0
                    ? `Earned +${lastCompletion.xpEarned} XP · Balance: ${lastCompletion.newXpBalance} XP`
                    : `Recorded in history with 0 XP (under ${earlyStopThreshold}s minimum XP threshold).`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearLastCompletion}
            className="rounded-lg p-1 text-cozy-muted hover:bg-white/60 hover:text-cozy-wood"
            aria-label="Dismiss completion banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {timerError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {timerError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary Interactive Timer Card */}
        <section className="cozy-card flex flex-col items-center justify-center p-8 text-center lg:col-span-2">
          {/* Mode Selector Tabs */}
          <div className="mb-5 inline-flex rounded-xl border border-cozy-border bg-cozy-cream p-1">
            {MODE_OPTIONS.map((opt) => {
              const selected = timerState.mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!isIdle}
                  onClick={() => void selectMode(opt.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? 'bg-cozy-sage text-white shadow-pixel-sm'
                      : 'text-cozy-wood/80 hover:text-cozy-wood disabled:opacity-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mb-2 flex items-center gap-2 rounded-full border border-cozy-border bg-cozy-cream px-4 py-1 text-xs font-semibold text-cozy-wood">
            <span>{phaseLabel}</span>
            {timerState.mode === 'pomodoro' && (
              <>
                <span className="text-cozy-muted">·</span>
                <span className="text-cozy-sage-dark">
                  {workMinutes}m / {shortBreak}m / {longBreak}m · Cycle {timerState.pomodoroCycleCount}
                </span>
              </>
            )}
          </div>

          {/* Custom Timer Duration Selector */}
          {timerState.mode === 'custom' && isIdle && (
            <div className="mt-2 flex items-center gap-2 text-xs text-cozy-muted">
              <label htmlFor="custom-minutes-input" className="font-semibold text-cozy-wood">
                Target minutes:
              </label>
              <input
                id="custom-minutes-input"
                type="number"
                min={1}
                max={300}
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(Number(e.target.value))}
                className="cozy-input w-20 py-1 text-center font-mono"
              />
            </div>
          )}

          {/* Main Clock Readout */}
          <div
            data-testid="focus-clock-display"
            className="my-5 font-mono text-6xl font-bold tracking-tight text-cozy-ink sm:text-7xl"
          >
            {formatTimerClock(displaySeconds)}
          </div>

          {timerState.status !== 'idle' && (
            <p className="mb-5 text-xs font-medium text-cozy-muted">
              Elapsed: {formatTimerClock(timerState.elapsedSeconds)} · Status:{' '}
              <span className="font-semibold capitalize text-cozy-wood">{timerState.status}</span>
            </p>
          )}

          <div className="mt-2 flex flex-col items-center gap-3">
            <TimerControls />
            <button
              type="button"
              onClick={() => setActiveSection('garden')}
              className="text-xs font-medium text-cozy-sage-dark underline-offset-4 hover:underline"
            >
              View {activeGarden?.customName ?? 'Garden'} while focusing
            </button>
          </div>
        </section>

        {/* Secondary Garden Preview & Rules Summary */}
        <aside className="space-y-4">
          <div className="cozy-card p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-cozy-wood">
              <Flower2 className="h-4 w-4 text-cozy-sage-dark" />
              <span>Active Garden Preview</span>
            </div>
            <div className="mt-3 rounded-xl border border-cozy-border bg-gradient-to-br from-cozy-meadow to-cozy-cream p-4">
              <p className="text-sm font-semibold text-cozy-wood">
                {activeGarden?.name ?? 'Sunlit Meadow'}
              </p>
              <p className="mt-1 text-xs text-cozy-muted">
                {activeGarden?.gridWidth ?? 12}×{activeGarden?.gridHeight ?? 12} Isometric Grid ·{' '}
                {activeGarden?.baseTileWidth ?? 64}×{activeGarden?.baseTileHeight ?? 32}px Tile Scale
              </p>
            </div>
          </div>

          <div className="cozy-card p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-cozy-wood">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Today&apos;s Focus &amp; Rules</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-cozy-muted">
              <li className="flex items-center justify-between">
                <span>Today&apos;s recorded focus</span>
                <span className="font-semibold text-cozy-ink">{todayMinutes} min</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Today&apos;s sessions</span>
                <span className="font-semibold text-cozy-ink">
                  {progression?.todaySessionsCount ?? 0}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Early-stop XP threshold</span>
                <span className="font-semibold text-cozy-ink">{earlyStopThreshold}s</span>
              </li>
              <li className="flex items-start gap-1.5 pt-1 text-[11px]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cozy-sage-dark" />
                <span>
                  Sessions under {earlyStopThreshold}s still save to history with 0 XP. Break
                  phases never earn focus XP.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
