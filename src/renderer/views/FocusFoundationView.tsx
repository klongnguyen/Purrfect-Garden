import { Clock, Flower2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export function FocusFoundationView() {
  const timerPreferences = useAppStore((s) => s.timerPreferences);
  const progression = useAppStore((s) => s.progression);
  const activeGarden = useAppStore((s) => s.activeGarden);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const workMinutes = timerPreferences?.pomodoroWorkMinutes ?? 25;
  const shortBreak = timerPreferences?.pomodoroShortBreakMinutes ?? 5;
  const longBreak = timerPreferences?.pomodoroLongBreakMinutes ?? 15;
  const earlyStopThreshold = timerPreferences?.earlyStopMinXpSeconds ?? 60;
  const todayMinutes = Math.floor((progression?.todayFocusSeconds ?? 0) / 60);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Clock className="h-3.5 w-3.5" />
            Focus Workspace · M1.1 Foundation
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary Timer Shell Card */}
        <section className="cozy-card flex flex-col items-center justify-center p-8 text-center lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-cozy-border bg-cozy-cream px-4 py-1.5 text-xs font-semibold text-cozy-wood">
            <span>Pomodoro Mode</span>
            <span className="text-cozy-muted">·</span>
            <span className="text-cozy-sage-dark">
              {workMinutes}m / {shortBreak}m / {longBreak}m
            </span>
          </div>

          <div className="my-4 font-mono text-6xl font-bold tracking-tight text-cozy-ink">
            {String(workMinutes).padStart(2, '0')}:00
          </div>

          <p className="max-w-md text-sm text-cozy-muted">
            Authoritative monotonic timer controls (Pomodoro, Stopwatch, Custom Countdown,
            and pause-on-exit recovery) will activate in <strong>Milestone M1.2</strong>.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" disabled className="cozy-btn-primary">
              Start Focus (M1.2)
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('garden')}
              className="cozy-btn-secondary"
            >
              Visit {activeGarden?.customName ?? 'Garden'}
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
