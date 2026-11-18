import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Database, Save, Settings } from 'lucide-react';
import type { TimerMode } from '@shared/types/domain';
import { useAppStore } from '../stores/useAppStore';

export function SettingsFoundationView() {
  const timerPreferences = useAppStore((s) => s.timerPreferences);
  const systemStatus = useAppStore((s) => s.systemStatus);
  const isSavingSettings = useAppStore((s) => s.isSavingSettings);
  const updateTimerPreferences = useAppStore((s) => s.updateTimerPreferences);

  const [defaultMode, setDefaultMode] = useState<TimerMode>('pomodoro');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [customDefaultMinutes, setCustomDefaultMinutes] = useState(30);
  const [earlyStopMinXpSeconds, setEarlyStopMinXpSeconds] = useState(60);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [autoStartWork, setAutoStartWork] = useState(false);
  const [soundOnComplete, setSoundOnComplete] = useState(true);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!timerPreferences) return;
    setDefaultMode(timerPreferences.defaultMode);
    setWorkMinutes(timerPreferences.pomodoroWorkMinutes);
    setShortBreakMinutes(timerPreferences.pomodoroShortBreakMinutes);
    setLongBreakMinutes(timerPreferences.pomodoroLongBreakMinutes);
    setCyclesBeforeLongBreak(timerPreferences.pomodoroCyclesBeforeLongBreak);
    setCustomDefaultMinutes(timerPreferences.customDefaultMinutes);
    setEarlyStopMinXpSeconds(timerPreferences.earlyStopMinXpSeconds);
    setAutoStartBreaks(timerPreferences.autoStartBreaks);
    setAutoStartWork(timerPreferences.autoStartWork);
    setSoundOnComplete(timerPreferences.soundOnComplete);
  }, [timerPreferences]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveBanner(null);
    const ok = await updateTimerPreferences({
      defaultMode,
      pomodoroWorkMinutes: workMinutes,
      pomodoroShortBreakMinutes: shortBreakMinutes,
      pomodoroLongBreakMinutes: longBreakMinutes,
      pomodoroCyclesBeforeLongBreak: cyclesBeforeLongBreak,
      customDefaultMinutes,
      earlyStopMinXpSeconds,
      autoStartBreaks,
      autoStartWork,
      soundOnComplete
    });
    if (ok) {
      setSaveBanner('Timer preferences saved to local SQLite.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
          <Settings className="h-3.5 w-3.5" />
          Application &amp; Timer Settings
        </span>
        <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
          Configurable Preferences &amp; System Health
        </h2>
      </header>

      <form onSubmit={handleSubmit} className="cozy-card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Default Timer Mode</span>
            <select
              value={defaultMode}
              onChange={(e) => setDefaultMode(e.target.value as TimerMode)}
              className="cozy-input"
            >
              <option value="pomodoro">Pomodoro</option>
              <option value="stopwatch">Stopwatch</option>
              <option value="custom">Custom Countdown</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Pomodoro Work (minutes)</span>
            <input
              type="number"
              min={1}
              max={180}
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Number(e.target.value))}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Short Break (minutes)</span>
            <input
              type="number"
              min={1}
              max={60}
              value={shortBreakMinutes}
              onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Long Break (minutes)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={longBreakMinutes}
              onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Cycles Before Long Break</span>
            <input
              type="number"
              min={1}
              max={12}
              value={cyclesBeforeLongBreak}
              onChange={(e) => setCyclesBeforeLongBreak(Number(e.target.value))}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood">
            <span>Custom Timer Default (minutes)</span>
            <input
              type="number"
              min={1}
              max={300}
              value={customDefaultMinutes}
              onChange={(e) => setCustomDefaultMinutes(Number(e.target.value))}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1.5 text-xs font-semibold text-cozy-wood sm:col-span-2 lg:col-span-3">
            <span>Early-Stop Minimum XP Threshold (seconds)</span>
            <input
              type="number"
              min={0}
              max={3600}
              value={earlyStopMinXpSeconds}
              onChange={(e) => setEarlyStopMinXpSeconds(Number(e.target.value))}
              className="cozy-input"
            />
            <span className="block text-[11px] font-normal text-cozy-muted">
              Focus sessions shorter than this threshold are still saved to history, but earn 0 XP.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-cozy-border/70 pt-4 text-xs font-medium text-cozy-wood">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="h-4 w-4 accent-cozy-sage"
            />
            Auto-start breaks
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoStartWork}
              onChange={(e) => setAutoStartWork(e.target.checked)}
              className="h-4 w-4 accent-cozy-sage"
            />
            Auto-start next work phase
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soundOnComplete}
              onChange={(e) => setSoundOnComplete(e.target.checked)}
              className="h-4 w-4 accent-cozy-sage"
            />
            Play completion sound
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-cozy-sage-dark">
            {saveBanner && (
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                {saveBanner}
              </span>
            )}
          </div>
          <button type="submit" disabled={isSavingSettings} className="cozy-btn-primary">
            <Save className="h-4 w-4" />
            {isSavingSettings ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* Local Database Status Card */}
      <section className="cozy-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-cozy-wood">
          <Database className="h-4 w-4 text-cozy-sage-dark" />
          <span>Local-First Persistence Diagnostics</span>
        </div>
        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-xl border border-cozy-border bg-cozy-cream p-3">
            <p className="text-cozy-muted">Schema Version</p>
            <p className="mt-0.5 font-bold text-cozy-ink">
              v{systemStatus?.schemaVersion ?? 1}
            </p>
          </div>
          <div className="rounded-xl border border-cozy-border bg-cozy-cream p-3">
            <p className="text-cozy-muted">SQLite Tables</p>
            <p className="mt-0.5 font-bold text-cozy-ink">{systemStatus?.tableCount ?? 21}</p>
          </div>
          <div className="rounded-xl border border-cozy-border bg-cozy-cream p-3">
            <p className="text-cozy-muted">WAL Mode</p>
            <p className="mt-0.5 font-bold text-cozy-sage-dark">
              {systemStatus?.walModeEnabled ? 'Enabled' : 'Memory/Standard'}
            </p>
          </div>
          <div className="rounded-xl border border-cozy-border bg-cozy-cream p-3">
            <p className="text-cozy-muted">XP Rate (Config)</p>
            <p className="mt-0.5 font-bold text-cozy-ink">
              {systemStatus?.config.xp.xpPerFocusMinute ?? 1} XP/min (+
              {systemStatus?.config.xp.completionBonusXp ?? 5})
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
