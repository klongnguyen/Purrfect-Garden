import { useEffect, useState } from 'react';
import { Award, CheckCircle2, Gift, Lock, X } from 'lucide-react';
import type { AchievementCategory, AchievementTier } from '@shared/types/domain';
import { AchievementIllustration } from '../components/garden/PixelSprite';
import { useProgressionStore } from '../stores/useProgressionStore';

type CategoryFilter = 'all' | AchievementCategory;

const CATEGORY_OPTIONS: ReadonlyArray<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'focus_master', label: 'Focus Master' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'green_thumb', label: 'Green Thumb' },
  { id: 'explorer', label: 'Explorer' },
  { id: 'collector', label: 'Collector' },
  { id: 'pet_lover', label: 'Pet Lover' },
  { id: 'early_bird', label: 'Early Bird' },
  { id: 'night_owl', label: 'Night Owl' }
];

const TIER_STYLES: Record<AchievementTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
  silver: 'bg-slate-100 text-slate-700 border-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-400'
};

const SHOWCASE_FRAME_BG: Record<AchievementCategory, string> = {
  focus_master: 'bg-[#E5E5E5] border-[#D0C8BC]',
  green_thumb: 'bg-[#FFFDF9] border-[#DFD5C5]',
  consistency: 'bg-[#FFFDF9] border-[#DFD5C5]',
  explorer: 'bg-[#F5EBD6] border-[#D9C7A3]',
  collector: 'bg-[#E9F3E7] border-[#C4DBC0]',
  pet_lover: 'bg-[#FCECEF] border-[#ECC8CF]',
  early_bird: 'bg-[#FEF6DC] border-[#EBDCAB]',
  night_owl: 'bg-[#ECE9FA] border-[#CBC4E8]'
};

export function AchievementsView() {
  const achievements = useProgressionStore((s) => s.achievements);
  const claimingAchievementId = useProgressionStore((s) => s.claimingAchievementId);
  const progressionError = useProgressionStore((s) => s.progressionError);
  const actionBanner = useProgressionStore((s) => s.actionBanner);
  const loadAchievements = useProgressionStore((s) => s.loadAchievements);
  const claimAchievementReward = useProgressionStore((s) => s.claimAchievementReward);
  const clearActionBanner = useProgressionStore((s) => s.clearActionBanner);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const filtered = achievements.filter((a) =>
    categoryFilter === 'all' ? true : a.category === categoryFilter
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Award className="h-3.5 w-3.5" />
            Achievements &amp; Milestones
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">Achievement Book</h2>
        </div>

        <div className="rounded-2xl border-2 border-cozy-border bg-white px-4 py-2 text-xs font-semibold text-cozy-wood shadow-pixel-sm">
          Unlocked: <strong className="text-cozy-sage-dark">{unlockedCount}</strong> /{' '}
          {achievements.length}
        </div>
      </header>

      {progressionError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {progressionError}
        </div>
      )}

      {actionBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-cozy-sage/50 bg-cozy-meadow/80 px-5 py-3 text-xs font-semibold text-cozy-wood"
        >
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={clearActionBanner}
            className="rounded-lg p-1 text-cozy-muted hover:bg-white/60"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_OPTIONS.map((opt) => {
          const active = categoryFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategoryFilter(opt.id)}
              className={`rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[#3C5C3D] bg-cozy-sage text-white shadow-pixel-sm'
                  : 'border-cozy-border bg-white/85 text-cozy-wood hover:bg-cozy-panel'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Illustrated Achievement Book Cards (Reference Image 3) */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ach) => {
          const pct = Math.min(
            100,
            Math.round((ach.progressValue / Math.max(1, ach.targetValue)) * 100)
          );
          const canClaim = ach.isUnlocked && !ach.rewardClaimed;
          const showcaseBg = SHOWCASE_FRAME_BG[ach.category] ?? 'bg-cozy-cream border-cozy-border';

          return (
            <div
              key={ach.id}
              className={`cozy-card flex flex-col justify-between p-4 transition ${
                ach.isUnlocked ? 'border-cozy-sage/60' : ''
              }`}
            >
              <div>
                {/* Large Illustrated Showcase Frame */}
                <div
                  className={`relative flex h-40 w-full items-center justify-center rounded-2xl border-2 ${showcaseBg} shadow-inner`}
                >
                  <div className={ach.isUnlocked ? '' : 'opacity-80 grayscale-[25%]'}>
                    <AchievementIllustration
                      achievementId={ach.id}
                      category={ach.category}
                      size={116}
                    />
                  </div>

                  <span
                    className={`absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                      ach.isUnlocked
                        ? 'border-cozy-sage/50 bg-cozy-meadow text-cozy-sage-dark'
                        : 'border-cozy-border bg-white/85 text-cozy-muted'
                    }`}
                    title={ach.isUnlocked ? 'Unlocked' : 'Locked'}
                  >
                    {ach.isUnlocked ? (
                      <Award className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <span
                    className={`absolute right-2.5 top-2.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${TIER_STYLES[ach.tier]}`}
                  >
                    {ach.tier}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div className="mt-3.5">
                  <h3 className="text-base font-bold text-cozy-wood">{ach.name}</h3>
                  <p className="mt-0.5 text-xs text-cozy-muted">{ach.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cozy-panel">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all ${
                        ach.isUnlocked ? 'bg-cozy-sage-dark' : 'bg-cozy-sage'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-cozy-muted">
                    {ach.progressValue} / {ach.targetValue}
                  </span>
                </div>
              </div>

              {/* Footer Reward & Claim */}
              <div className="mt-4 flex items-center justify-between border-t border-cozy-border/70 pt-3 text-xs">
                <span className="font-semibold text-amber-700">
                  +{ach.rewardXp} XP
                  {ach.rewardTickets > 0 ? ` · +${ach.rewardTickets} Ticket` : ''}
                </span>

                {ach.rewardClaimed ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-cozy-sage-dark">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Claimed
                  </span>
                ) : canClaim ? (
                  <button
                    type="button"
                    disabled={claimingAchievementId === ach.id}
                    onClick={() => void claimAchievementReward(ach.id)}
                    className="cozy-btn-primary py-1.5 text-xs"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    <span>
                      {claimingAchievementId === ach.id
                        ? 'Claiming...'
                        : `Claim +${ach.rewardXp} XP`}
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-cozy-muted">In Progress</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
