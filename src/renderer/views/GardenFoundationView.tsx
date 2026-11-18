import { Clock, Flower2, Grid, ZoomIn } from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import { useAppStore } from '../stores/useAppStore';

export function GardenFoundationView() {
  const activeGarden = useAppStore((s) => s.activeGarden);
  const timerPreferences = useAppStore((s) => s.timerPreferences);

  const gridWidth = activeGarden?.gridWidth ?? DEFAULT_BALANCE_CONFIG.garden.initialGridWidth;
  const gridHeight = activeGarden?.gridHeight ?? DEFAULT_BALANCE_CONFIG.garden.initialGridHeight;
  const tileW = activeGarden?.baseTileWidth ?? DEFAULT_BALANCE_CONFIG.garden.baseTileWidth;
  const tileH = activeGarden?.baseTileHeight ?? DEFAULT_BALANCE_CONFIG.garden.baseTileHeight;
  const workMinutes = timerPreferences?.pomodoroWorkMinutes ?? 25;

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Flower2 className="h-3.5 w-3.5" />
            Isometric Garden Shell · PRD Section 4.7 Layout
          </span>
          <h2 className="mt-1.5 text-2xl font-bold text-cozy-wood">
            {activeGarden?.customName ?? 'My Cozy Meadow'}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-cozy-muted">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-cozy-border bg-white/80 px-3 py-1.5 font-medium text-cozy-wood">
            <Grid className="h-3.5 w-3.5 text-cozy-sage-dark" />
            {gridWidth}×{gridHeight} Expandable Grid
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-cozy-border bg-white/80 px-3 py-1.5 font-medium text-cozy-wood">
            <ZoomIn className="h-3.5 w-3.5 text-cozy-sage-dark" />
            {tileW}×{tileH}px Base Tile
          </span>
        </div>
      </header>

      {/* Main Isometric Area + Persistent Right-Docked Compact Timer Panel */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_290px]">
        {/* Isometric Diorama Viewport Shell */}
        <section className="cozy-card flex flex-col items-center justify-center bg-gradient-to-b from-cozy-meadow/65 to-cozy-cream p-6 text-center">
          <div className="pixel-art mb-4 flex h-24 w-44 items-center justify-center rounded-2xl border-2 border-dashed border-cozy-sage/60 bg-white/70 text-xs font-semibold text-cozy-sage-dark">
            2:1 Isometric Tile Canvas ({gridWidth}×{gridHeight})
          </div>
          <h3 className="text-base font-bold text-cozy-wood">
            {activeGarden?.name ?? 'Sunlit Meadow'}
          </h3>
          <p className="mt-1 max-w-md text-xs text-cozy-muted">
            {activeGarden?.description}
          </p>
          <p className="mt-4 rounded-xl border border-cozy-border bg-white/80 px-4 py-2 text-xs text-cozy-muted">
            Interactive 2D isometric diorama rendering and object placement will arrive in{' '}
            <strong>Milestone M1.7</strong>.
          </p>
        </section>

        {/* Right-Docked Compact Timer Panel (Required by PRD Section 4.7 & 19) */}
        <aside className="cozy-card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cozy-muted">
                Compact Timer
              </span>
              <Clock className="h-4 w-4 text-cozy-sage-dark" />
            </div>
            <div className="mt-5 rounded-2xl border border-cozy-border bg-cozy-cream py-6 text-center">
              <p className="text-xs font-semibold text-cozy-sage-dark">Pomodoro · Focus</p>
              <p className="mt-1 font-mono text-4xl font-bold text-cozy-ink">
                {String(workMinutes).padStart(2, '0')}:00
              </p>
            </div>
            <p className="mt-3 text-xs text-cozy-muted">
              Per PRD Section 4.7, the focus timer stays docked on the right so you can start,
              pause, or stop sessions without leaving your garden.
            </p>
          </div>

          <button type="button" disabled className="cozy-btn-primary mt-4 w-full">
            Timer Ready in M1.2
          </button>
        </aside>
      </div>
    </div>
  );
}
