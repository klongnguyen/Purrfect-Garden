import type { NavigationSectionId } from '@shared/types/domain';
import { useAppStore } from '../../stores/useAppStore';
import { PetIllustration } from '../garden/PixelSprite';
import { PixelIcon, type PixelIconName } from '../ui/PixelIcon';

interface NavItem {
  id: NavigationSectionId;
  label: string;
  icon: PixelIconName;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'focus', label: 'Focus', icon: 'timer' },
  { id: 'garden', label: 'Garden', icon: 'garden' },
  { id: 'tasks', label: 'Tasks', icon: 'tasks' },
  { id: 'goals', label: 'Goals', icon: 'goals' },
  { id: 'achievements', label: 'Achievements', icon: 'achievements' },
  { id: 'collection', label: 'Collection', icon: 'collection' },
  { id: 'pets', label: 'Pets', icon: 'pets' },
  { id: 'music', label: 'Music', icon: 'music' },
  { id: 'statistics', label: 'Statistics', icon: 'statistics' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export function Sidebar() {
  const activeSection = useAppStore((s) => s.activeSection);
  const setActiveSection = useAppStore((s) => s.setActiveSection);
  const progression = useAppStore((s) => s.progression);

  const currentStreak = progression?.streak.currentStreak ?? 0;
  const xpBalance = progression?.xpBalance ?? 0;

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r-[4px] border-[#2B160B] bg-[#5B341D] px-3.5 py-4 text-[#FFF4DC]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 2px, transparent 2px, transparent 14px)',
        boxShadow: 'inset -3px 0px 0px #412312'
      }}
    >
      {/* Carved Wooden Pixel Brand Header */}
      <div
        className="mb-4 flex items-center gap-3 border-2 border-[#2B160B] bg-[#7A4728] px-3 py-2.5"
        style={{
          boxShadow: 'inset 2px 2px 0px #A3643D, inset -2px -2px 0px #522D17, 2px 2px 0px #24130B'
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#2B160B] bg-[#F4E8CF]">
          <PetIllustration species="cat" size={34} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold uppercase tracking-tight text-[#FFF8E4]">
            Purrfect Garden
          </h1>
          <p className="text-[10px] leading-tight text-[#EAD2B0]">
            The garden grows when you grow.
          </p>
        </div>
      </div>

      {/* Pixel Navigation Tabs */}
      <nav aria-label="Primary Navigation" className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center gap-3 border-2 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition ${
                isActive
                  ? 'border-[#243E1E] bg-[#649E4F] text-white'
                  : 'border-[#3A1E0E] bg-[#814D2D] text-[#F9E7C9] hover:bg-[#945A36]'
              }`}
              style={{
                boxShadow: isActive
                  ? 'inset 2px 2px 0px #8EC976, inset -2px -2px 0px #3E6B2F, 2px 2px 0px #24130B'
                  : 'inset 2px 2px 0px #A66841, inset -2px -2px 0px #59321A'
              }}
            >
              <PixelIcon
                name={item.icon}
                size={16}
                className={isActive ? 'text-[#FFF9D6]' : 'text-[#F5CE86]'}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Live Status Wooden Plaque */}
      <div
        className="mt-4 border-2 border-[#2B160B] bg-[#7A4728] p-3"
        style={{
          boxShadow: 'inset 2px 2px 0px #A3643D, inset -2px -2px 0px #522D17, 3px 3px 0px #24130B'
        }}
      >
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#F7DFB9]">
          <span>Daily Progress</span>
          <span className="border border-[#2B160B] bg-[#5E9A4E] px-1.5 py-0.5 text-[10px] font-bold text-white">
            COZY
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border-2 border-[#2B160B] bg-[#F4E8CF] px-2 py-1.5 text-[#24140B]">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#6D513C]">
              <PixelIcon name="flame" size={12} className="text-[#D95B34]" />
              <span>Streak</span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-[#24140B]">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="border-2 border-[#2B160B] bg-[#F4E8CF] px-2 py-1.5 text-[#24140B]">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#6D513C]">
              <PixelIcon name="sparkles" size={12} className="text-[#D48B17]" />
              <span>XP</span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-[#24140B]">{xpBalance} XP</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
