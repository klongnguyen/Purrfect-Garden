import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import { useGardenStore, type GardenInteractionMode } from '../stores/useGardenStore';
import { useTimerStore } from '../stores/useTimerStore';
import { formatTimerClock, getDisplaySeconds, getPhaseDisplayLabel } from '../utils/formatTime';
import { PixelGardenCanvas } from '../components/garden/PixelGardenCanvas';
import { PetIllustration, PixelSprite } from '../components/garden/PixelSprite';
import { TimerControls } from '../components/timer/TimerControls';
import { PixelIcon, type PixelIconName } from '../components/ui/PixelIcon';

const ZOOM_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

const MODE_BUTTONS: ReadonlyArray<{
  id: GardenInteractionMode;
  label: string;
  icon: PixelIconName;
}> = [
  { id: 'place', label: 'Place Item', icon: 'plus' },
  { id: 'move', label: 'Move Item', icon: 'move' },
  { id: 'remove', label: 'Remove Item', icon: 'eraser' }
];

export function GardenFoundationView() {
  const gardenState = useGardenStore((s) => s.gardenState);
  const selectedItemId = useGardenStore((s) => s.selectedItemId);
  const selectedPlacementId = useGardenStore((s) => s.selectedPlacementId);
  const interactionMode = useGardenStore((s) => s.interactionMode);
  const zoomLevel = useGardenStore((s) => s.zoomLevel);
  const gardenError = useGardenStore((s) => s.gardenError);
  const loadGarden = useGardenStore((s) => s.loadGarden);
  const setSelectedItemId = useGardenStore((s) => s.setSelectedItemId);
  const setInteractionMode = useGardenStore((s) => s.setInteractionMode);
  const setZoomLevel = useGardenStore((s) => s.setZoomLevel);
  const interactWithTile = useGardenStore((s) => s.interactWithTile);
  const clearGarden = useGardenStore((s) => s.clearGarden);

  const timerState = useTimerStore((s) => s.timerState);

  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    void loadGarden();
  }, [loadGarden]);

  const area = gardenState?.area;
  const placements = gardenState?.placements ?? [];
  const inventory = gardenState?.inventory ?? [];

  const gridWidth = area?.gridWidth ?? DEFAULT_BALANCE_CONFIG.garden.initialGridWidth;
  const gridHeight = area?.gridHeight ?? DEFAULT_BALANCE_CONFIG.garden.initialGridHeight;

  const selectedInventoryItem = useMemo(
    () => inventory.find((i) => i.itemId === selectedItemId) ?? null,
    [inventory, selectedItemId]
  );

  const displaySeconds = getDisplaySeconds(
    timerState.mode,
    timerState.elapsedSeconds,
    timerState.remainingSeconds
  );
  const phaseLabel = getPhaseDisplayLabel(timerState.mode, timerState.phase);
  const themeKey = area?.theme ?? 'spring_meadow';
  const hotbarSlotsCount = Math.max(8, inventory.length);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Compact Single-Row Pixel Toolbar (Maximizes Garden Canvas Space) */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="pixel-pill">
            <PixelIcon name="garden" size={14} />
            {area?.name ?? 'Sunlit Meadow'} · {gridWidth}×{gridHeight}
          </span>
          <h2 className="text-lg font-bold uppercase tracking-tight text-cozy-wood">
            {area?.customName ?? 'My Cozy Meadow'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MODE_BUTTONS.map((btn) => {
            const active = interactionMode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setInteractionMode(btn.id)}
                className={active ? 'cozy-btn-primary py-1.5' : 'cozy-btn-secondary py-1.5'}
              >
                <PixelIcon name={btn.icon} size={14} />
                <span>{btn.label}</span>
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 border-2 border-[#3D2112] bg-[#FAF0DC] px-2.5 py-1.5 text-xs font-bold text-cozy-wood shadow-pixel-sm">
            <PixelIcon name="zoom" size={14} className="text-cozy-sage-dark" />
            <select
              aria-label="Garden zoom level"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="bg-transparent font-bold text-cozy-wood outline-none"
            >
              {ZOOM_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}x
                </option>
              ))}
            </select>
          </div>

          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(false);
                  void clearGarden();
                }}
                className="border-2 border-[#3D2112] bg-[#D95B34] px-3 py-1.5 text-xs font-bold uppercase text-white shadow-pixel-sm"
              >
                Confirm Clear?
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="cozy-btn-secondary px-2.5 py-1.5"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={placements.length === 0}
              className="cozy-btn-secondary py-1.5 text-[#A83820] disabled:opacity-40"
            >
              <PixelIcon name="trash" size={14} />
              <span>Clear ({placements.length})</span>
            </button>
          )}
        </div>
      </header>

      {gardenError && (
        <div className="shrink-0 border-2 border-[#3D2112] bg-[#F5B7A3] px-4 py-2 text-xs font-bold text-[#24140B]">
          {gardenError}
        </div>
      )}

      {/* Full-Height Main Garden Canvas + Wooden Hotbar + Right Compact Timer */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_270px]">
        <div className="flex min-h-0 flex-col border-[4px] border-[#2B160B] bg-[#4B752F] shadow-pixel-md">
          {/* HUD Status Strip */}
          <div className="flex shrink-0 items-center justify-between border-b-2 border-[#2B160B] bg-[#693D22] px-3 py-1 text-[11px] font-bold text-[#FFF2D6]">
            <span>
              {interactionMode === 'place'
                ? 'Click any tile in your village garden courtyard to place the selected item.'
                : interactionMode === 'move'
                  ? selectedPlacementId
                    ? 'Click an empty destination plot to move the picked item.'
                    : 'Click a placed item in the garden to pick it up.'
                  : 'Click a placed item to return it to your hotbar.'}
            </span>
            <span className="border border-[#2B160B] bg-[#4C2A16] px-2 py-0.5 font-mono text-[#F5CE86]">
              {hoveredTile
                ? `Tile (${hoveredTile.x}, ${hoveredTile.y})`
                : `${placements.length} placed`}
            </span>
          </div>

          {/* 3/4 Top-Down Orthographic Pixel Garden Viewport */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <PixelGardenCanvas
              theme={themeKey}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              placements={placements}
              interactionMode={interactionMode}
              selectedPlacementId={selectedPlacementId}
              hoveredTile={hoveredTile}
              zoomLevel={zoomLevel}
              onHoverTile={setHoveredTile}
              onTileClick={(tx, ty) => void interactWithTile(tx, ty)}
            />
          </div>

          {/* Flush Stardew-Style Pixel Wooden Bottom Inventory Hotbar */}
          <div
            className="shrink-0 border-t-[3px] border-[#2B160B] bg-[#8C5230] px-3 py-2"
            style={{
              boxShadow: 'inset 0px 2px 0px #B57247'
            }}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-bold text-[#FFF2D6]">
                {selectedInventoryItem
                  ? `Selected: ${selectedInventoryItem.name} (Avail: ${selectedInventoryItem.availableQuantity} / ${selectedInventoryItem.ownedQuantity})`
                  : 'Select an item slot below to decorate your garden'}
              </span>
              <span className="font-bold text-[#F5D6AD]">{inventory.length} owned types</span>
            </div>

            <div className="flex justify-center gap-1.5 overflow-x-auto pb-0.5">
              {Array.from({ length: hotbarSlotsCount }).map((_, idx) => {
                const item = inventory[idx];
                if (!item) {
                  return (
                    <div
                      key={`empty-slot-${idx}`}
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#3D1F10] bg-[#C97C4B]"
                    >
                      <div className="pointer-events-none h-[calc(100%-6px)] w-[calc(100%-6px)] border border-dashed border-[#F7D7B5]/50" />
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-[#3D1F10]">
                        0
                      </span>
                    </div>
                  );
                }

                const isSelected =
                  selectedItemId === item.itemId && interactionMode === 'place';
                const depleted = item.availableQuantity <= 0;

                return (
                  <button
                    key={item.itemId}
                    type="button"
                    title={`${item.name} — Avail: ${item.availableQuantity} / ${item.ownedQuantity}`}
                    onClick={() => setSelectedItemId(item.itemId)}
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center border-2 transition ${
                      isSelected
                        ? 'border-[#FFF3B0] bg-[#F2A672] ring-2 ring-[#FFE58F]'
                        : 'border-[#3D1F10] bg-[#DE8E58] hover:bg-[#EA9A64]'
                    } ${depleted ? 'opacity-65' : ''}`}
                  >
                    <div className="pointer-events-none flex h-[calc(100%-6px)] w-[calc(100%-6px)] items-center justify-center border border-dashed border-[#F7D7B5]">
                      <PixelSprite spriteKey={item.spriteKey} size={28} />
                    </div>
                    <span className="absolute bottom-0.5 right-1 bg-[#3D1F10]/90 px-1 text-[10px] font-bold leading-tight text-[#FFF7E2]">
                      {item.availableQuantity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right-Docked Compact Timer Panel (PRD Section 4.7) */}
        <aside className="cozy-card flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between border-b-2 border-[#C7AE81] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cozy-muted">
                Compact Timer
              </span>
              <PixelIcon name="timer" size={16} className="text-cozy-sage-dark" />
            </div>

            <div className="mt-4 border-2 border-[#3D2112] bg-[#FFF8E8] px-3 py-5 text-center shadow-pixel-sm">
              <p className="text-xs font-bold uppercase text-cozy-sage-dark">{phaseLabel}</p>
              <p className="mt-1 text-4xl font-bold text-cozy-ink">
                {formatTimerClock(displaySeconds)}
              </p>
              {timerState.pendingRecovery && timerState.status === 'paused' && (
                <span className="mt-2 inline-block border border-[#3D2112] bg-[#F0BE63] px-2 py-0.5 text-[10px] font-bold uppercase text-[#24140B]">
                  Restored Paused
                </span>
              )}
              {timerState.status !== 'idle' && !timerState.pendingRecovery && (
                <p className="mt-1 text-[11px] font-bold capitalize text-cozy-muted">
                  {timerState.status} · {formatTimerClock(timerState.elapsedSeconds)} elapsed
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2.5 border-2 border-[#3D2112] bg-[#E8D5B1] p-2.5">
              <PetIllustration species="cat" size={44} />
              <p className="text-[11px] font-medium leading-snug text-cozy-wood">
                {timerState.status === 'running'
                  ? 'Miso is napping happily while your focus session grows the farm!'
                  : 'Start, pause, or complete focus sessions directly from Garden view.'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <TimerControls compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
