import {
  Award,
  BarChart3,
  BookOpen,
  Cat,
  CheckSquare,
  Flame,
  Flower2,
  Music,
  Settings,
  Sparkles,
  Target,
  Timer
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NavigationSectionId } from '@shared/types/domain';
import { useAppStore } from '../../stores/useAppStore';

interface NavItem {
  id: NavigationSectionId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'garden', label: 'Garden', icon: Flower2 },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'collection', label: 'Collection', icon: BookOpen },
  { id: 'pets', label: 'Pets', icon: Cat },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const activeSection = useAppStore((s) => s.activeSection);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const progression = useAppStore((s) => s.progression);

  const currentStreak = progression?.streak.currentStreak ?? 0;
  const xpBalance = progression?.xpBalance ?? 0;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-cozy-border bg-cozy-panel/90 px-4 py-5">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="pixel-art flex h-10 w-10 items-center justify-center rounded-xl border-2 border-cozy-sage-dark/40 bg-cozy-meadow text-cozy-sage-dark shadow-pixel-sm">
          <Cat className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-cozy-wood">
            Purrfect Garden
          </h1>
          <p className="text-[11px] leading-tight text-cozy-muted">
            The garden grows when you grow.
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary Navigation" className="flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-cozy-sage text-white shadow-pixel-sm'
                  : 'text-cozy-wood/85 hover:bg-cozy-cream/80 hover:text-cozy-wood'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-cozy-sage-dark'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Live Status Card */}
      <div className="mt-4 rounded-2xl border border-cozy-border bg-cozy-cream p-3.5 shadow-pixel-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-cozy-muted">
          <span>Daily Progress</span>
          <span className="rounded-full bg-cozy-meadow px-2 py-0.5 text-[10px] font-bold text-cozy-sage-dark">
            M1.1
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-cozy-border/70 bg-white/75 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-xs text-cozy-muted">
              <Flame className="h-3.5 w-3.5 text-cozy-peach" />
              <span>Streak</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-cozy-ink">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="rounded-xl border border-cozy-border/70 bg-white/75 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-xs text-cozy-muted">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>XP</span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-cozy-ink">{xpBalance} XP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

