import type { NavigationSectionId } from '@shared/types/domain';
import { PetIllustration } from '../components/garden/PixelSprite';
import { PixelIcon } from '../components/ui/PixelIcon';

interface SectionMeta {
  title: string;
  milestone: string;
  description: string;
  highlights: readonly string[];
}

const SECTION_CATALOG: Record<
  Exclude<
    NavigationSectionId,
    | 'focus'
    | 'garden'
    | 'tasks'
    | 'goals'
    | 'achievements'
    | 'collection'
    | 'music'
    | 'settings'
    | 'statistics'
  >,
  SectionMeta
> = {
  pets: {
    title: 'Pet System – Những người bạn nhỏ',
    milestone: 'Phase 3 (M3.1 – M3.3)',
    description:
      'Collect adorable Cats, Dogs, and Capybaras using earned in-app tickets or XP—zero real-money purchases.',
    highlights: [
      'Initial roster: Cats, Dogs, and Capybaras only (no Bears)',
      'Transparent probability rates & pity counter',
      'Place owned pets directly in unlocked gardens'
    ]
  }
};

const PET_SHOWCASE_CARDS: ReadonlyArray<{
  species: 'cat' | 'dog' | 'capybara';
  name: string;
  subtitle: string;
  trait: string;
  frameBg: string;
  badgeCount?: number;
}> = [
  {
    species: 'cat',
    name: 'Miso the Tabby Cat',
    subtitle: 'Orange & White Shorthair',
    trait: 'Loves sunny afternoon Pomodoro sessions and naps by the cottage.',
    frameBg: 'bg-[#7A7E81] border-[#303238]'
  },
  {
    species: 'dog',
    name: 'Biscuit the Golden Pup',
    subtitle: 'Floppy-Eared Companion',
    trait: 'Cheers loudly when you hit your daily focus goal & streaks.',
    frameBg: 'bg-[#FFFFFF] border-[#303238]'
  },
  {
    species: 'capybara',
    name: 'Yuzu the Capybara',
    subtitle: 'Chill Yuzu-Topped Friend',
    trait: 'Brings pure zen calm to marathon deep-work & study blocks.',
    frameBg: 'bg-[#ECCCB0] border-[#303238]',
    badgeCount: 8
  }
];

export function PlaceholderSectionView({
  section
}: {
  section: keyof typeof SECTION_CATALOG;
}) {
  const meta = SECTION_CATALOG[section];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="pixel-pill">
            <PixelIcon name="pets" size={14} />
            {meta.milestone}
          </span>
          <h2 className="mt-1.5 text-2xl font-bold uppercase tracking-tight text-cozy-wood">
            {meta.title}
          </h2>
          <p className="mt-1 text-xs font-medium text-cozy-muted">{meta.description}</p>
        </div>

        <div className="cozy-card flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-cozy-wood">
          <PixelIcon name="gift" size={14} className="text-[#D48B17]" />
          <span>Earned via XP &amp; Achievements</span>
        </div>
      </header>

      {/* Dark Showcase Board Matching Reference Image 2 */}
      <section className="pixel-showcase-dark p-5">
        <div className="mb-4 flex items-center justify-between border-b-2 border-[#2A2C34] pb-3">
          <h3 className="text-base font-bold text-white">2.7. Pet System – Những người bạn nhỏ</h3>
          <span className="border border-[#3D404A] bg-[#22242B] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#D1D5DB]">
            32×32 Pixel Companions
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PET_SHOWCASE_CARDS.map((pet) => (
            <div
              key={pet.species}
              className="flex flex-col border-2 border-[#2B2D35] bg-[#191A1F] p-3"
            >
              <div
                className={`relative flex h-56 w-full items-center justify-center border-2 ${pet.frameBg}`}
              >
                <PetIllustration species={pet.species} size={160} />
                {pet.badgeCount !== undefined && (
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 border border-[#1E1F24] bg-black/55 px-2 py-0.5 text-xs font-bold text-white">
                    <PixelIcon name="pets" size={12} />
                    {pet.badgeCount}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{pet.name}</h4>
                  <span className="border border-[#243E1E] bg-[#5E9A4E] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Phase 3
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-bold text-[#F5CE5E]">{pet.subtitle}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">{pet.trait}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phase 3 Planned Mechanics Summary */}
      <section className="cozy-card p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cozy-muted">
          <PixelIcon name="heart" size={14} className="text-[#D95B34]" />
          <span>Upcoming Pet Adoption &amp; Garden Placement Design</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {meta.highlights.map((item) => (
            <div
              key={item}
              className="border-2 border-[#3D2112] bg-[#FFF8E8] px-3.5 py-2.5 text-xs font-bold text-cozy-wood shadow-pixel-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
