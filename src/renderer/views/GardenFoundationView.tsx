import { useEffect, useMemo, useState } from 'react';
import { Clock, Eraser, Flower2, Move, PlusSquare, Trash2, ZoomIn } from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import { tileToScreen } from '@shared/utils/isometricMath';
import { PixelSprite } from '../components/garden/PixelSprite';
import { TimerControls } from '../components/timer/TimerControls';
import { useGardenStore, type GardenInteractionMode } from '../stores/useGardenStore';
import { useTimerStore } from '../stores/useTimerStore';
import { formatTimerClock, getDisplaySeconds, getPhaseDisplayLabel } from '../utils/formatTime';

const ZOOM_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;

const MODE_BUTTONS: ReadonlyArray<{
  id: GardenInteractionMode;
  label: string;
  icon: typeof PlusSquare;
}> = [
  { id: 'place', label: 'Place Item', icon: PlusSquare },
  { id: 'move', label: 'Move Item', icon: Move },
  { id: 'remove', label: 'Remove Item', icon: Eraser }
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
  const baseTileW = area?.baseTileWidth ?? DEFAULT_BALANCE_CONFIG.garden.baseTileWidth;
  const baseTileH = area?.baseTileHeight ?? DEFAULT_BALANCE_CONFIG.garden.baseTileHeight;

  const tileW = baseTileW * zoomLevel;
  const tileH = baseTileH * zoomLevel;
  const halfW = tileW / 2;
  const halfH = tileH / 2;

  const paddingX = 48;
  const paddingTop = 56;
  const paddingBottom = 36;

  const svgWidth = Math.ceil((gridWidth + gridHeight) * halfW + paddingX * 2);
  const svgHeight = Math.ceil((gridWidth + gridHeight) * halfH + paddingTop + paddingBottom);
  const originX = Math.round(gridHeight * halfW + paddingX);
  const originY = paddingTop;

  const tiles = useMemo(() => {
    const list: Array<{ x: number; y: number; screenX: number; screenY: number }> = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const pt = tileToScreen(x, y, originX, originY, baseTileW, baseTileH, zoomLevel);
        list.push({ x, y, screenX: pt.screenX, screenY: pt.screenY });
      }
    }
    return list;
  }, [gridWidth, gridHeight, originX, originY, baseTileW, baseTileH, zoomLevel]);

  const placementMap = useMemo(() => {
    const map = new Map<string, (typeof placements)[number]>();
    for (const p of placements) {
      map.set(`${p.tileX},${p.tileY}`, p);
    }
    return map;
  }, [placements]);

  const displaySeconds = getDisplaySeconds(
    timerState.mode,
    timerState.elapsedSeconds,
    timerState.remainingSeconds
  );
  const phaseLabel = getPhaseDisplayLabel(timerState.mode, timerState.phase);

  const spriteSize = Math.max(24, Math.round(38 * zoomLevel));

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header & Controls */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Flower2 className="h-3.5 w-3.5" />
            {area?.name ?? 'Sunlit Meadow'} · {gridWidth}×{gridHeight} Isometric Diorama
          </span>
          <h2 className="mt-1.5 text-2xl font-bold text-cozy-wood">
            {area?.customName ?? 'My Cozy Meadow'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MODE_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            const active = interactionMode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setInteractionMode(btn.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-cozy-sage bg-cozy-sage text-white shadow-pixel-sm'
                    : 'border-cozy-border bg-white/80 text-cozy-wood hover:bg-cozy-panel'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{btn.label}</span>
              </button>
            );
          })}

          <div className="flex items-center gap-1 rounded-xl border border-cozy-border bg-white/80 px-2.5 py-1 text-xs">
            <ZoomIn className="h-3.5 w-3.5 text-cozy-sage-dark" />
            <select
              aria-label="Garden zoom level"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="bg-transparent font-semibold text-cozy-wood outline-none"
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
                className="rounded-xl bg-cozy-peach px-3 py-1.5 text-xs font-semibold text-white"
              >
                Confirm Clear?
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-cozy-border bg-white px-2.5 py-1.5 text-xs text-cozy-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={placements.length === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-cozy-border bg-white/80 px-3 py-1.5 text-xs font-semibold text-cozy-peach transition hover:bg-cozy-peach/10 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear ({placements.length})</span>
            </button>
          )}
        </div>
      </header>

      {gardenError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2 text-xs font-medium text-cozy-peach">
          {gardenError}
        </div>
      )}

      {/* Main Isometric Viewport + Right-Docked Compact Timer Panel */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_290px]">
        <div className="flex min-h-0 flex-col gap-3">
          {/* Interactive Isometric Diorama Canvas */}
          <section className="cozy-card relative min-h-0 flex-1 overflow-auto bg-gradient-to-b from-[#EAF7DC] via-[#F7F6E8] to-[#FAF6EE] p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-cozy-muted">
              <span>
                {interactionMode === 'place'
                  ? 'Click any empty grass tile to place the selected item.'
                  : interactionMode === 'move'
                    ? selectedPlacementId
                      ? 'Click an empty destination tile to move the selected item.'
                      : 'Click an existing item in the garden to pick it up.'
                    : 'Click an existing item to return it to your inventory.'}
              </span>
              {hoveredTile && (
                <span className="font-mono text-cozy-wood">
                  Tile ({hoveredTile.x}, {hoveredTile.y})
                </span>
              )}
            </div>

            <div className="flex min-h-[360px] items-center justify-center">
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="pixel-art select-none overflow-visible"
              >
                {/* Ground Isometric Diamond Tiles */}
                {tiles.map((tile) => {
                  const isEven = (tile.x + tile.y) % 2 === 0;
                  const isHovered =
                    hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
                  const existing = placementMap.get(`${tile.x},${tile.y}`);
                  const isSelectedForMove =
                    existing !== undefined && existing.id === selectedPlacementId;

                  const points = [
                    `${tile.screenX},${tile.screenY}`,
                    `${tile.screenX + halfW},${tile.screenY + halfH}`,
                    `${tile.screenX},${tile.screenY + tileH}`,
                    `${tile.screenX - halfW},${tile.screenY + halfH}`
                  ].join(' ');

                  let fillColor = isEven ? '#CBE9A6' : '#C0E297';
                  if (isSelectedForMove) {
                    fillColor = '#FDE68A';
                  } else if (isHovered) {
                    fillColor =
                      interactionMode === 'remove' && existing ? '#FECACA' : '#E2F5C8';
                  }

                  return (
                    <polygon
                      key={`${tile.x}-${tile.y}`}
                      points={points}
                      fill={fillColor}
                      stroke={isHovered ? '#5A8F5E' : '#A6D07C'}
                      strokeWidth={isHovered ? 1.75 : 1}
                      className="cursor-pointer transition-colors"
                      onMouseEnter={() => setHoveredTile({ x: tile.x, y: tile.y })}
                      onMouseLeave={() => setHoveredTile(null)}
                      onClick={() => void interactWithTile(tile.x, tile.y)}
                    />
                  );
                })}

                {/* Depth-Sorted Placed Objects */}
                {placements.map((placement) => {
                  const pt = tileToScreen(
                    placement.tileX,
                    placement.tileY,
                    originX,
                    originY,
                    baseTileW,
                    baseTileH,
                    zoomLevel
                  );
                  const spriteX = pt.screenX - spriteSize / 2;
                  const spriteY = pt.screenY + halfH - spriteSize * 0.8;

                  return (
                    <g
                      key={placement.id}
                      transform={`translate(${Math.round(spriteX)}, ${Math.round(spriteY)})`}
                      className="pointer-events-none"
                    >
                      <foreignObject width={spriteSize} height={spriteSize}>
                        <div className="flex h-full w-full items-center justify-center">
                          <PixelSprite spriteKey={placement.spriteKey} size={spriteSize} />
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Bottom Inventory Tray */}
          <section className="cozy-card shrink-0 p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-cozy-wood">Garden Inventory</span>
              <span className="text-[11px] text-cozy-muted">
                Select an item below to place it in your meadow
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {inventory.map((item) => {
                const isSelected =
                  selectedItemId === item.itemId && interactionMode === 'place';
                const depleted = item.availableQuantity <= 0;

                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => setSelectedItemId(item.itemId)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? 'border-cozy-sage bg-cozy-meadow shadow-pixel-sm'
                        : 'border-cozy-border bg-cozy-cream/80 hover:bg-cozy-panel'
                    } ${depleted ? 'opacity-60' : ''}`}
                  >
                    <PixelSprite spriteKey={item.spriteKey} size={28} />
                    <div>
                      <p className="text-xs font-bold text-cozy-wood">{item.name}</p>
                      <p className="text-[11px] text-cozy-muted">
                        Avail: {item.availableQuantity} / {item.ownedQuantity}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right-Docked Compact Timer Panel (Required by PRD Section 4.7 & 19) */}
        <aside className="cozy-card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cozy-muted">
                Compact Timer
              </span>
              <Clock className="h-4 w-4 text-cozy-sage-dark" />
            </div>

            <div className="mt-5 rounded-2xl border border-cozy-border bg-cozy-cream px-3 py-6 text-center">
              <p className="text-xs font-semibold text-cozy-sage-dark">{phaseLabel}</p>
              <p className="mt-1 font-mono text-4xl font-bold text-cozy-ink">
                {formatTimerClock(displaySeconds)}
              </p>
              {timerState.pendingRecovery && timerState.status === 'paused' && (
                <span className="mt-2 inline-block rounded-full bg-cozy-amber/40 px-2.5 py-0.5 text-[10px] font-bold text-cozy-wood">
                  Restored Paused
                </span>
              )}
              {timerState.status !== 'idle' && !timerState.pendingRecovery && (
                <p className="mt-1 text-[11px] capitalize text-cozy-muted">
                  {timerState.status} · {formatTimerClock(timerState.elapsedSeconds)} elapsed
                </p>
              )}
            </div>

            <p className="mt-3 text-xs text-cozy-muted">
              Per PRD Section 4.7, you can start, pause, resume, or finish sessions directly
              from Garden view.
            </p>
          </div>

          <div className="mt-4">
            <TimerControls compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
