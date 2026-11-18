import type { NavigationSectionId } from '@shared/types/domain';

interface SectionMeta {
  title: string;
  milestone: string;
  description: string;
  highlights: readonly string[];
}

const SECTION_CATALOG: Record<
  Exclude<
    NavigationSectionId,
    'focus' | 'garden' | 'tasks' | 'goals' | 'music' | 'settings' | 'statistics'
  >,
  SectionMeta
> = {
  achievements: {
    title: 'Achievements',
    milestone: 'Milestone M2.4',
    description:
      'Bronze, Silver, and Gold milestones celebrating Focus Master, Consistency, Green Thumb, Explorer, Collector, Pet Lover, Early Bird, and Night Owl progress.',
    highlights: [
      '8 PRD achievement categories backed by SQLite',
      'One-time unlock & reward audit trail',
      'Unviewed unlock notifications'
    ]
  },
  collection: {
    title: 'Collection & Journal',
    milestone: 'Milestone M2.2 & M2.4',
    description:
      'A peaceful album of discovered plants, seeds, tools, technologies, and unlocked garden areas—built around collecting rather than trading.',
    highlights: [
      'Collection-first philosophy (no crop selling)',
      'Tracks acquisition date and unlock source',
      'Catalog driven by item_definitions table'
    ]
  },
  pets: {
    title: 'Pets & Cozy Gacha',
    milestone: 'Milestone M3.1 – M3.3',
    description:
      'Collect adorable Cats, Dogs, and Capybaras using earned in-app tickets or XP—zero real-money purchases.',
    highlights: [
      'Initial roster: Cats, Dogs, and Capybaras only (no Bears)',
      'Transparent probability rates & pity counter',
      'Place owned pets directly in unlocked gardens'
    ]
  }
};

interface PlaceholderSectionViewProps {
  section: Exclude<
    NavigationSectionId,
    'focus' | 'garden' | 'tasks' | 'goals' | 'music' | 'settings' | 'statistics'
  >;
}

export function PlaceholderSectionView({ section }: PlaceholderSectionViewProps) {
  const meta = SECTION_CATALOG[section];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <span className="inline-flex items-center rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
          {meta.milestone} · Schema Ready
        </span>
        <h2 className="mt-2 text-2xl font-bold text-cozy-wood">{meta.title}</h2>
        <p className="mt-1 text-sm text-cozy-muted">{meta.description}</p>
      </div>

      <section className="cozy-card p-6">
        <h3 className="text-sm font-bold text-cozy-wood">Architecture Guardrails in Place</h3>
        <ul className="mt-3 space-y-2 text-sm text-cozy-muted">
          {meta.highlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cozy-sage" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

