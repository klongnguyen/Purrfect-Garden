import { AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { FocusFoundationView } from '../../views/FocusFoundationView';
import { GardenFoundationView } from '../../views/GardenFoundationView';
import { GoalsView } from '../../views/GoalsView';
import { MusicView } from '../../views/MusicView';
import { PlaceholderSectionView } from '../../views/PlaceholderSectionView';
import { SettingsFoundationView } from '../../views/SettingsFoundationView';
import { StatisticsView } from '../../views/StatisticsView';
import { TasksView } from '../../views/TasksView';
import { BottomMusicBar } from './BottomMusicBar';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const activeSection = useAppStore((s) => s.activeSection);
  const isLoading = useAppStore((s) => s.isLoading);
  const errorMessage = useAppStore((s) => s.errorMessage);
  const isBrowserFallback = useAppStore((s) => s.isBrowserFallback);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-cozy-muted">
          Warming up Purrfect Garden...
        </div>
      );
    }

    switch (activeSection) {
      case 'focus':
        return <FocusFoundationView />;
      case 'garden':
        return <GardenFoundationView />;
      case 'tasks':
        return <TasksView />;
      case 'goals':
        return <GoalsView />;
      case 'music':
        return <MusicView />;
      case 'statistics':
        return <StatisticsView />;
      case 'settings':
        return <SettingsFoundationView />;
      default:
        return <PlaceholderSectionView section={activeSection} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cozy-cream text-cozy-ink">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {isBrowserFallback && (
          <div className="border-b border-cozy-amber bg-cozy-amber/25 px-6 py-1.5 text-xs font-medium text-cozy-wood">
            Browser Preview Mode: Electron IPC bridge not attached; using in-memory fallback defaults.
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 border-b border-cozy-peach/40 bg-cozy-peach/15 px-6 py-2 text-xs font-medium text-cozy-peach">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">{renderContent()}</main>

        <BottomMusicBar />
      </div>
    </div>
  );
}

