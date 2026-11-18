import { useEffect } from 'react';
import type { DailyGoalItemDTO } from '@shared/types/domain';
import { useGoalStore } from '../stores/useGoalStore';
import { formatDurationHuman } from '../utils/formatTime';
import { PixelIcon } from '../components/ui/PixelIcon';

export function GoalsView() {
  const dailyGoals = useGoalStore((s) => s.dailyGoals);
  const weeklyGoals = useGoalStore((s) => s.weeklyGoals);
  const streakOverview = useGoalStore((s) => s.streakOverview);
  const isLoadingGoals = useGoalStore((s) => s.isLoadingGoals);
  const claimingGoalId = useGoalStore((s) => s.claimingGoalId);
  const goalError = useGoalStore((s) => s.goalError);
  const lastClaimBanner = useGoalStore((s) => s.lastClaimBanner);
  const loadGoalsAndStreak = useGoalStore((s) => s.loadGoalsAndStreak);
  const claimReward = useGoalStore((s) => s.claimReward);
  const clearClaimBanner = useGoalStore((s) => s.clearClaimBanner);

  useEffect(() => {
    void loadGoalsAndStreak();
  }, [loadGoalsAndStreak]);

  const todayFocusSec = streakOverview?.todayFocusSeconds ?? 0;
  const minStreakSec = streakOverview?.dailyMinimumSeconds ?? 1200;
  const streakPct = Math.min(100, Math.round((todayFocusSec / Math.max(1, minStreakSec)) * 100));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <span className="pixel-pill">
          <PixelIcon name="goals" size={14} />
          Daily Goals &amp; Study Streaks
        </span>
        <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
          Consistency &amp; Daily Milestones
        </h2>
      </header>

      {goalError && (
        <div className="border-2 border-[#3D2112] bg-[#F5B7A3] px-4 py-2.5 text-xs font-bold text-[#24140B]">
          {goalError}
        </div>
      )}

      {lastClaimBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-2 border-[#243E1E] bg-[#DCEDBD] px-5 py-3 text-xs font-bold text-cozy-wood shadow-pixel-sm"
        >
          <span className="inline-flex items-center gap-2">
            <PixelIcon name="sparkles" size={14} className="text-[#D48B17]" />
            {lastClaimBanner}
          </span>
          <button
            type="button"
            onClick={clearClaimBanner}
            className="border border-[#3D2112] bg-white p-1 text-cozy-wood"
            aria-label="Dismiss reward message"
          >
            <PixelIcon name="close" size={12} />
          </button>
        </div>
      )}

      {/* Streak Banner Card */}
      <section className="cozy-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border-2 border-[#3D2112] bg-[#F5C5B5] text-[#C94324] shadow-pixel-sm">
              <PixelIcon name="flame" size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
                Current Focus Streak
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-cozy-ink">
                  {streakOverview?.currentStreak ?? 0}{' '}
                  {streakOverview?.currentStreak === 1 ? 'day' : 'days'}
                </span>
                <span className="text-xs text-cozy-muted">
                  · Longest: {streakOverview?.longestStreak ?? 0} days
                </span>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#3D2112] bg-[#FFF8E8] px-4 py-2.5 text-xs shadow-pixel-sm">
            <div className="flex items-center gap-1.5 font-bold text-cozy-wood">
              <PixelIcon name="trophy" size={14} className="text-[#D48B17]" />
              <span>Next Milestone: {streakOverview?.nextMilestoneDays ?? 3} days</span>
            </div>
            <p className="mt-0.5 text-[11px] text-cozy-muted">
              {streakOverview?.daysToNextMilestone ?? 3} more qualifying{' '}
              {(streakOverview?.daysToNextMilestone ?? 3) === 1 ? 'day' : 'days'} to reach
              milestone
            </p>
          </div>
        </div>

        {/* Today's 20-Minute Streak Threshold Progress */}
        <div className="mt-5 rounded-xl border border-cozy-border/80 bg-cozy-cream/80 p-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-cozy-wood">
              Today&apos;s Streak Qualification ({formatDurationHuman(todayFocusSec)} /{' '}
              {Math.floor(minStreakSec / 60)}m minimum)
            </span>
            <span
              className={
                streakOverview?.todayQualified ? 'text-cozy-sage-dark' : 'text-cozy-muted'
              }
            >
              {streakOverview?.todayQualified ? 'Qualified Today!' : `${streakPct}%`}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cozy-panel">
            <div
              style={{ width: `${streakPct}%` }}
              className={`h-full rounded-full transition-all ${
                streakOverview?.todayQualified ? 'bg-cozy-sage-dark' : 'bg-cozy-sage'
              }`}
            />
          </div>
        </div>
      </section>

      {/* Today's Daily Goals */}
      <GoalSectionCard
        title="Today's Daily Goals"
        emptyMessage="Loading daily goals..."
        goals={dailyGoals}
        isLoading={isLoadingGoals}
        claimingGoalId={claimingGoalId}
        onClaim={(id) => void claimReward(id)}
      />

      {/* This Week's Goals */}
      <GoalSectionCard
        title="This Week's Goals"
        emptyMessage="Loading weekly goals..."
        goals={weeklyGoals}
        isLoading={isLoadingGoals}
        claimingGoalId={claimingGoalId}
        onClaim={(id) => void claimReward(id)}
      />
    </div>
  );
}

interface GoalSectionCardProps {
  title: string;
  emptyMessage: string;
  goals: DailyGoalItemDTO[];
  isLoading: boolean;
  claimingGoalId: string | null;
  onClaim: (goalInstanceId: string) => void;
}

function GoalSectionCard({
  title,
  emptyMessage,
  goals,
  isLoading,
  claimingGoalId,
  onClaim
}: GoalSectionCardProps) {
  return (
    <section className="cozy-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cozy-wood">{title}</h3>
        <span className="text-xs text-cozy-muted">
          {goals.filter((g) => g.isCompleted).length} / {goals.length} completed
        </span>
      </div>

      {isLoading && goals.length === 0 ? (
        <p className="py-6 text-center text-xs text-cozy-muted">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 100)
            );
            const canClaim = goal.isCompleted && !goal.rewardClaimed;

            return (
              <div
                key={goal.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cozy-border bg-cozy-cream/70 p-4"
              >
                <div className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-2">
                    <PixelIcon
                      name="check"
                      size={14}
                      className={goal.isCompleted ? 'text-cozy-sage-dark' : 'text-[#C2AD8E]'}
                    />
                    <p className="text-sm font-semibold text-cozy-wood">{goal.title}</p>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="pixel-progress-bar flex-1">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full transition-all ${
                          goal.isCompleted ? 'bg-[#73BD59]' : 'bg-[#E5A93B]'
                        }`}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-cozy-muted">
                      {goal.currentValue} / {goal.targetValue}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {goal.rewardClaimed ? (
                    <span className="pixel-pill">
                      <PixelIcon name="check" size={14} />
                      Claimed (+{goal.rewardXp} XP)
                    </span>
                  ) : canClaim ? (
                    <button
                      type="button"
                      disabled={claimingGoalId === goal.id}
                      onClick={() => onClaim(goal.id)}
                      className="cozy-btn-primary py-2 text-xs"
                    >
                      <PixelIcon name="gift" size={14} />
                      <span>
                        {claimingGoalId === goal.id
                          ? 'Claiming...'
                          : `Claim +${goal.rewardXp} XP`}
                      </span>
                    </button>
                  ) : (
                    <span className="border-2 border-[#3D2112] bg-[#FFF8E8] px-3 py-1.5 text-xs font-bold text-cozy-muted shadow-pixel-sm">
                      Reward: +{goal.rewardXp} XP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

