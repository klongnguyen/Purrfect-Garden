import { HeartHandshake, Sparkles, Ticket } from 'lucide-react';
import type { NavigationSectionId } from '@shared/types/domain';
import { PetIllustration } from '../components/garden/PixelSprite';

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
}> = [
  {
    species: 'cat',
    name: 'Miso the Tabby Cat',
    subtitle: 'Orange & Cream Shorthair',
    trait: 'Loves sunny afternoon Pomodoro sessions and naps by the cottage.',
    frameBg: 'bg-[#777B7E] border-[#595D60]'
  },
  {
    species: 'dog',
    name: 'Biscuit the Golden Pup',
    subtitle: 'Floppy-Eared Companion',
    trait: 'Cheers loudly when you hit your daily focus goal & streaks.',
    frameBg: 'bg-[#FFFFFF] border-[#E5DEC9]'
  },
  {
    species: 'capybara',
    name: 'Yuzu the Capybara',
    subtitle: 'Chill Yuzu-Topped Friend',
    trait: 'Brings pure zen calm to marathon deep-work & study blocks.',
    frameBg: 'bg-[#ECCEB3] border-[#D6B08E]'
  }
];

export function PlaceholderSectionView({
  section
}: {
  section: keyof typeof SECTION_CATALOG;
}) {
  const meta = SECTION_CATALOG[section];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Sparkles className="h-3.5 w-3.5" />
            {meta.milestone}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">{meta.title}</h2>
          <p className="mt-1 text-sm text-cozy-muted">{meta.description}</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-cozy-border bg-white px-4 py-2 text-xs font-semibold text-cozy-wood shadow-pixel-sm">
          <Ticket className="h-4 w-4 text-amber-600" />
          <span>Earned via XP &amp; Achievements</span>
        </div>
      </header>

      {/* Large 32x32 Pixel-Art Pet Companion Cards (Reference Image 2) */}
      <div className="grid gap-5 sm:grid-cols-3">
        {PET_SHOWCASE_CARDS.map((pet) => (
          <div
            key={pet.species}
            className="cozy-card flex flex-col overflow-hidden p-4 transition hover:-translate-y-0.5"
          >
            <div
              className={`flex h-52 w-full items-center justify-center rounded-2xl border-2 ${pet.frameBg} shadow-inner`}
            >
              <PetIllustration species={pet.species} size={148} />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-cozy-wood">{pet.name}</h3>
                <span className="rounded-full bg-cozy-meadow px-2 py-0.5 text-[10px] font-bold uppercase text-cozy-sage-dark">
                  Phase 3
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-cozy-sage-dark">{pet.subtitle}</p>
              <p className="mt-2 text-xs leading-relaxed text-cozy-muted">{pet.trait}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Phase 3 Planned Mechanics Summary */}
      <section className="cozy-card p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cozy-muted">
          <HeartHandshake className="h-4 w-4 text-cozy-sage-dark" />
          <span>Upcoming Pet Adoption &amp; Garden Placement Design</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {meta.highlights.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-cozy-border bg-cozy-cream px-4 py-3 text-xs font-medium text-cozy-wood"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
