import { useEffect, useState } from 'react';
import type { AchievementCategory, AchievementTier } from '@shared/types/domain';
import { AchievementIllustration } from '../components/garden/PixelSprite';
import { PixelIcon } from '../components/ui/PixelIcon';
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
  bronze: 'bg-[#F6DFB0] text-[#5C3A16] border-[#784A1A]',
  silver: 'bg-[#E2E8F0] text-[#334155] border-[#475569]',
  gold: 'bg-[#FEF08A] text-[#713F12] border-[#A16207]'
};

const SHOWCASE_FRAME_BG: Record<AchievementCategory, string> = {
  focus_master: 'bg-[#DCDCDC] border-[#26262B]',
  green_thumb: 'bg-[#FFFFFF] border-[#26262B]',
  consistency: 'bg-[#FFFFFF] border-[#26262B]',
  explorer: 'bg-[#F2E5C9] border-[#26262B]',
  collector: 'bg-[#E6F1E2] border-[#26262B]',
  pet_lover: 'bg-[#FBE6EB] border-[#26262B]',
  early_bird: 'bg-[#FDF1CC] border-[#26262B]',
  night_owl: 'bg-[#E5E2F8] border-[#26262B]'
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
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pixel-pill">
            <PixelIcon name="trophy" size={14} />
            Achievements &amp; Milestones
          </span>
          <h2 className="mt-1.5 text-2xl font-bold uppercase tracking-tight text-cozy-wood">
            Achievement Book
          </h2>
        </div>

        <div className="cozy-card px-4 py-2 text-xs font-bold uppercase text-cozy-wood">
          Unlocked: <strong className="text-cozy-sage-dark">{unlockedCount}</strong> /{' '}
          {achievements.length}
        </div>
      </header>

      {progressionError && (
        <div className="border-2 border-[#3D2112] bg-[#F5B7A3] px-4 py-2.5 text-xs font-bold text-[#24140B]">
          {progressionError}
        </div>
      )}

      {actionBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-2 border-[#243E1E] bg-[#DCEDBD] px-5 py-3 text-xs font-bold text-[#24140B] shadow-pixel-sm"
        >
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={clearActionBanner}
            className="border border-[#3D2112] bg-white px-1.5 py-1 text-cozy-wood"
            aria-label="Dismiss banner"
          >
            <PixelIcon name="close" size={12} />
          </button>
        </div>
      )}

      {/* Pixel Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_OPTIONS.map((opt) => {
          const active = categoryFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategoryFilter(opt.id)}
              className={active ? 'cozy-btn-primary py-1.5' : 'cozy-btn-secondary py-1.5'}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Reference Image 3 Dark "Achievement Book" Showcase Board */}
      <section className="pixel-showcase-dark p-5">
        <div className="mb-4 flex items-center justify-between border-b-2 border-[#2A2C34] pb-3">
          <div className="flex items-center gap-2.5">
            <PixelIcon name="trophy" size={18} className="text-[#F5CE5E]" />
            <h3 className="text-lg font-bold tracking-tight text-white">Achievement Book</h3>
          </div>
          <span className="text-xs font-bold text-[#A1A1AA]">
            {filtered.length} Achievements Shown
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ach) => {
            const pct = Math.min(
              100,
              Math.round((ach.progressValue / Math.max(1, ach.targetValue)) * 100)
            );
            const canClaim = ach.isUnlocked && !ach.rewardClaimed;
            const showcaseBg = SHOWCASE_FRAME_BG[ach.category] ?? 'bg-[#FFFFFF] border-[#26262B]';

            return (
              <div
                key={ach.id}
                className="flex flex-col justify-between border-2 border-[#2B2D35] bg-[#191A1F] p-3.5"
              >
                <div>
                  {/* High-Contrast Pixel Illustration Square Container (Ref Image 3) */}
                  <div
                    className={`relative flex h-44 w-full items-center justify-center border-2 ${showcaseBg}`}
                  >
                    <div className={ach.isUnlocked ? '' : 'opacity-85 grayscale-[25%]'}>
                      <AchievementIllustration
                        achievementId={ach.id}
                        category={ach.category}
                        size={128}
                      />
                    </div>

                    <span
                      className={`absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center border-2 ${
                        ach.isUnlocked
                          ? 'border-[#243E1E] bg-[#649E4F] text-white'
                          : 'border-[#3D2112] bg-[#FAF0DC] text-[#6D513C]'
                      }`}
                      title={ach.isUnlocked ? 'Unlocked' : 'Locked'}
                    >
                      <PixelIcon name={ach.isUnlocked ? 'trophy' : 'lock'} size={14} />
                    </span>

                    <span
                      className={`absolute right-2 top-2 border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${TIER_STYLES[ach.tier]}`}
                    >
                      {ach.tier}
                    </span>
                  </div>

                  {/* Bold White Title + Muted Grey Subtitle (Reference Image 3 Style) */}
                  <div className="mt-3">
                    <h4 className="text-base font-bold text-white">{ach.name}</h4>
                    <p className="mt-0.5 text-xs text-[#9CA3AF]">{ach.description}</p>
                  </div>

                  {/* Pixel Progress Bar */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="h-3 flex-1 border-2 border-[#2E3039] bg-[#0D0E11]">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full transition-all ${
                          ach.isUnlocked ? 'bg-[#73BD59]' : 'bg-[#E5A93B]'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#D1D5DB]">
                      {ach.progressValue} / {ach.targetValue}
                    </span>
                  </div>
                </div>

                {/* Reward & Claim Control */}
                <div className="mt-4 flex items-center justify-between border-t-2 border-[#272930] pt-3 text-xs">
                  <span className="font-bold text-[#F5CE5E]">
                    +{ach.rewardXp} XP
                    {ach.rewardTickets > 0 ? ` · +${ach.rewardTickets} Ticket` : ''}
                  </span>

                  {ach.rewardClaimed ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#8CC973]">
                      <PixelIcon name="check" size={14} />
                      Claimed
                    </span>
                  ) : canClaim ? (
                    <button
                      type="button"
                      disabled={claimingAchievementId === ach.id}
                      onClick={() => void claimAchievementReward(ach.id)}
                      className="cozy-btn-primary py-1.5 text-xs"
                    >
                      <PixelIcon name="gift" size={14} />
                      <span>
                        {claimingAchievementId === ach.id
                          ? 'Claiming...'
                          : `Claim +${ach.rewardXp} XP`}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-[#71717A]">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
