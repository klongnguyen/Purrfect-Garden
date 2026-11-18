import { useEffect } from 'react';
import type { HeatmapIntensityLevel } from '@shared/types/domain';
import { useStatsStore } from '../stores/useStatsStore';
import { useTaskStore } from '../stores/useTaskStore';
import { formatDurationHuman, formatTimerClock } from '../utils/formatTime';
import { PixelIcon } from '../components/ui/PixelIcon';

const HEATMAP_COLOR_CLASSES: Record<HeatmapIntensityLevel, string> = {
  0: 'bg-cozy-panel border-cozy-border/70',
  1: 'bg-cozy-meadow border-cozy-sage/40',
  2: 'bg-cozy-sage/45 border-cozy-sage/60',
  3: 'bg-cozy-sage/75 border-cozy-sage-dark/60',
  4: 'bg-cozy-sage-dark border-cozy-sage-dark'
};

export function StatisticsView() {
  const summary = useStatsStore((s) => s.summary);
  const sessions = useStatsStore((s) => s.sessions);
  const heatmap = useStatsStore((s) => s.heatmap);
  const includeBreaksAndInterrupted = useStatsStore((s) => s.includeBreaksAndInterrupted);
  const isLoadingStats = useStatsStore((s) => s.isLoadingStats);
  const statsError = useStatsStore((s) => s.statsError);
  const loadStatistics = useStatsStore((s) => s.loadStatistics);
  const setIncludeBreaksAndInterrupted = useStatsStore((s) => s.setIncludeBreaksAndInterrupted);
  const allTasks = useTaskStore((s) => s.allTasks);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const linkSessionTask = useTaskStore((s) => s.linkSessionTask);

  useEffect(() => {
    void loadStatistics();
    void loadTasks();
  }, [loadStatistics, loadTasks]);

  const maxTrendSeconds = Math.max(
    1,
    ...(summary?.recentDailyTrend.map((point) => point.validFocusSeconds) ?? [0])
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pixel-pill">
            <PixelIcon name="statistics" size={14} />
            Focus History &amp; Analytics
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
            Your Study &amp; Focus Progress
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void loadStatistics()}
          disabled={isLoadingStats}
          className="cozy-btn-secondary"
        >
          <PixelIcon name="refresh" size={14} className={isLoadingStats ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {statsError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {statsError}
        </div>
      )}

      {/* Summary KPI Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cozy-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            Today&apos;s Focus
          </p>
          <p className="mt-2 text-2xl font-bold text-cozy-ink">
            {formatDurationHuman(summary?.todayFocusSeconds ?? 0)}
          </p>
          <p className="mt-1 text-xs text-cozy-muted">
            {summary?.todaySessionsCount ?? 0} focus sessions
          </p>
        </div>

        <div className="cozy-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            This Week (7 Days)
          </p>
          <p className="mt-2 text-2xl font-bold text-cozy-ink">
            {formatDurationHuman(summary?.thisWeekFocusSeconds ?? 0)}
          </p>
          <p className="mt-1 text-xs text-cozy-muted">
            {summary?.thisWeekSessionsCount ?? 0} focus sessions
          </p>
        </div>

        <div className="cozy-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            This Month
          </p>
          <p className="mt-2 text-2xl font-bold text-cozy-ink">
            {formatDurationHuman(summary?.thisMonthFocusSeconds ?? 0)}
          </p>
          <p className="mt-1 text-xs text-cozy-muted">
            {summary?.thisMonthSessionsCount ?? 0} focus sessions
          </p>
        </div>

        <div className="cozy-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            All-Time Total
          </p>
          <p className="mt-2 text-2xl font-bold text-cozy-sage-dark">
            {formatDurationHuman(summary?.totalFocusSeconds ?? 0)}
          </p>
          <p className="mt-1 text-xs text-cozy-muted">
            {summary?.totalFocusSessionsCount ?? 0} completed/stopped
          </p>
        </div>
      </section>

      {/* Secondary KPI Row */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="cozy-card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
              Session Averages
            </p>
            <p className="mt-1.5 text-lg font-bold text-cozy-wood">
              Avg: {formatDurationHuman(summary?.averageSessionSeconds ?? 0)} · Best:{' '}
              {formatDurationHuman(summary?.longestSessionSeconds ?? 0)}
            </p>
          </div>
          <PixelIcon name="timer" size={24} className="text-cozy-sage-dark" />
        </div>

        <div className="cozy-card flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
              Focus Streak
            </p>
            <p className="mt-1.5 text-lg font-bold text-cozy-wood">
              Current: {summary?.currentStreak ?? 0} days · Best: {summary?.longestStreak ?? 0}{' '}
              days
            </p>
          </div>
          <PixelIcon name="flame" size={24} className="text-[#D95B34]" />
        </div>
      </section>

      {/* 7-Day Trend & Task Breakdown */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="cozy-card p-5">
          <h3 className="text-sm font-bold text-cozy-wood">7-Day Focus Trend</h3>
          <div className="mt-4 flex h-40 items-end justify-between gap-2 rounded-xl border border-cozy-border/70 bg-cozy-cream/70 px-4 py-3">
            {(summary?.recentDailyTrend ?? []).length === 0 ? (
              <p className="m-auto text-xs text-cozy-muted">No daily trend data yet.</p>
            ) : (
              summary!.recentDailyTrend.map((point) => {
                const heightPct =
                  point.validFocusSeconds > 0
                    ? Math.max(8, Math.round((point.validFocusSeconds / maxTrendSeconds) * 100))
                    : 4;
                return (
                  <div
                    key={point.localDate}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${point.localDate}: ${formatDurationHuman(point.validFocusSeconds)}`}
                  >
                    <span className="text-[10px] font-medium text-cozy-muted">
                      {point.validFocusSeconds > 0
                        ? formatDurationHuman(point.validFocusSeconds)
                        : ''}
                    </span>
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                          point.validFocusSeconds > 0 ? 'bg-cozy-sage' : 'bg-cozy-border/60'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-cozy-wood">
                      {point.localDate.slice(5)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="cozy-card p-5">
          <h3 className="text-sm font-bold text-cozy-wood">Focus Time by Task</h3>
          <div className="mt-4 space-y-2.5">
            {(summary?.taskBreakdown ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-cozy-border bg-cozy-cream/60 p-6 text-center text-xs text-cozy-muted">
                Complete a focus session to see breakdown by task.
              </div>
            ) : (
              summary!.taskBreakdown.map((item) => (
                <div
                  key={item.taskId ?? 'unassigned'}
                  className="flex items-center justify-between rounded-xl border border-cozy-border/80 bg-cozy-cream/70 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-cozy-wood">{item.taskTitle}</p>
                    <p className="text-[11px] text-cozy-muted">
                      {item.category} · {item.sessionCount}{' '}
                      {item.sessionCount === 1 ? 'session' : 'sessions'}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-cozy-sage-dark">
                    {formatDurationHuman(item.totalFocusSeconds)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 12-Week Activity Heatmap */}
      <section className="cozy-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="calendar" size={16} className="text-cozy-sage-dark" />
            <h3 className="text-sm font-bold text-cozy-wood">
              12-Week Activity Calendar (84 Days)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-cozy-muted">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                className={`h-3 w-3 border ${HEATMAP_COLOR_CLASSES[level]}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="inline-grid grid-flow-col grid-rows-7 gap-1.5">
            {heatmap.map((cell) => (
              <div
                key={cell.localDate}
                title={`${cell.localDate}: ${formatDurationHuman(cell.validFocusSeconds)} (${cell.completedSessionsCount} sessions)`}
                className={`h-4 w-4 border transition ${HEATMAP_COLOR_CLASSES[cell.intensityLevel]}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Session History List */}
      <section className="cozy-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PixelIcon name="statistics" size={16} className="text-cozy-sage-dark" />
            <h3 className="text-sm font-bold text-cozy-wood">Recent Focus History</h3>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-cozy-wood">
            <input
              type="checkbox"
              checked={includeBreaksAndInterrupted}
              onChange={(e) => void setIncludeBreaksAndInterrupted(e.target.checked)}
              className="h-4 w-4 accent-cozy-sage"
            />
            Show break &amp; interrupted sessions
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cozy-border bg-cozy-cream/60 p-6 text-center text-xs text-cozy-muted">
              No recorded sessions match this filter yet. Start a focus session to grow your history!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cozy-border/80 bg-cozy-cream/70 px-4 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-lg bg-white px-2 py-0.5 font-semibold capitalize text-cozy-wood">
                    {session.mode}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      session.phase === 'focus'
                        ? 'bg-cozy-meadow text-cozy-sage-dark'
                        : 'bg-cozy-amber/30 text-cozy-wood'
                    }`}
                  >
                    {session.phase === 'focus'
                      ? 'Focus'
                      : session.phase === 'short_break'
                        ? 'Short Break'
                        : 'Long Break'}
                  </span>
                  <span className="capitalize text-cozy-muted">{session.status}</span>
                  {session.phase === 'focus' ? (
                    <select
                      aria-label={`Associate task for session ${session.id}`}
                      value={session.taskId ?? ''}
                      onChange={(e) => void linkSessionTask(session.id, e.target.value || null)}
                      className="rounded-lg border border-cozy-border bg-white px-2 py-1 text-[11px] text-cozy-wood outline-none focus:border-cozy-sage"
                    >
                      <option value="">No task linked</option>
                      {allTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    session.taskTitle && (
                      <span className="font-medium text-cozy-wood">· {session.taskTitle}</span>
                    )
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-cozy-muted">{session.localDate}</span>
                  <span className="font-mono font-bold text-cozy-ink">
                    {formatTimerClock(session.recordedSeconds)}
                  </span>
                  <span
                    className={`min-w-[54px] text-right font-semibold ${
                      session.xpAwarded > 0 ? 'text-amber-700' : 'text-cozy-muted'
                    }`}
                  >
                    {session.xpAwarded > 0 ? `+${session.xpAwarded} XP` : '0 XP'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

