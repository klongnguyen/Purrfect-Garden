import { useEffect, useMemo, useState } from 'react';
import { Clock, Eraser, Flower2, Lock, Move, PlusSquare, Sparkles, Trash2, ZoomIn } from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import { tileToScreen } from '@shared/utils/isometricMath';
import {
  GardenThemePreviewBanner,
  PetIllustration,
  PixelSprite
} from '../components/garden/PixelSprite';
import { TimerControls } from '../components/timer/TimerControls';
import { useAppStore } from '../stores/useAppStore';
import { useGardenStore, type GardenInteractionMode } from '../stores/useGardenStore';
import { useTimerStore } from '../stores/useTimerStore';
import { formatTimerClock, getDisplaySeconds, getPhaseDisplayLabel } from '../utils/formatTime';

interface ThemePalette {
  backdropGradient: string;
  evenTile: string;
  oddTile: string;
  hoverTile: string;
  stroke: string;
  hoverStroke: string;
  slabLeft: string;
  slabRight: string;
  slabTrim: string;
  viSubtitle: string;
  fenceWood: string;
  fenceDark: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  spring_meadow: {
    backdropGradient: 'from-[#CBE9F7] via-[#E9F6DC] to-[#D6EDBA]',
    evenTile: '#9BD265',
    oddTile: '#8EC657',
    hoverTile: '#BCE683',
    stroke: '#75AD45',
    hoverStroke: '#3D6B2A',
    slabLeft: '#8B5939',
    slabRight: '#694026',
    slabTrim: '#5B9A3E',
    viSubtitle: 'Khu vườn mùa xuân',
    fenceWood: '#AE7244',
    fenceDark: '#6E4223'
  },
  autumn_grove: {
    backdropGradient: 'from-[#F7E09A] via-[#EDD083] to-[#DEC06D]',
    evenTile: '#DDA84E',
    oddTile: '#D29B41',
    hoverTile: '#F3C76F',
    stroke: '#B37E2F',
    hoverStroke: '#6B3E17',
    slabLeft: '#855130',
    slabRight: '#60381F',
    slabTrim: '#B57B2E',
    viSubtitle: 'Khu vườn mùa thu',
    fenceWood: '#965A34',
    fenceDark: '#59321A'
  },
  winter_sanctuary: {
    backdropGradient: 'from-[#B5D2F4] via-[#DCEBFB] to-[#EDF6FF]',
    evenTile: '#DDF0FD',
    oddTile: '#CFE6F9',
    hoverTile: '#F4FAFF',
    stroke: '#9BC0E3',
    hoverStroke: '#3566B8',
    slabLeft: '#5D7CA6',
    slabRight: '#425C82',
    slabTrim: '#9BC6EC',
    viSubtitle: 'Khu vườn mùa đông',
    fenceWood: '#7F685A',
    fenceDark: '#4D3D35'
  },
  magical_garden: {
    backdropGradient: 'from-[#091826] via-[#0E283A] to-[#133548]',
    evenTile: '#1A4B5C',
    oddTile: '#153F50',
    hoverTile: '#27677D',
    stroke: '#2E7082',
    hoverStroke: '#67E8F9',
    slabLeft: '#1A2642',
    slabRight: '#11192E',
    slabTrim: '#3B82A6',
    viSubtitle: 'Khu vườn ánh sao',
    fenceWood: '#5E4B8A',
    fenceDark: '#352759'
  }
};

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

function IsometricSceneryLandmark({
  theme,
  topX,
  topY,
  rightX,
  rightY,
  leftX,
  leftY,
  bottomX,
  bottomY,
  zoomLevel
}: {
  theme: string;
  topX: number;
  topY: number;
  rightX: number;
  rightY: number;
  leftX: number;
  leftY: number;
  bottomX: number;
  bottomY: number;
  zoomLevel: number;
}) {
  const s = Math.max(0.75, zoomLevel);
  const barnX = Math.round((topX + leftX) * 0.5 - 32 * s);
  const barnY = Math.round((topY + leftY) * 0.5 - 66 * s);
  const rightLandmarkX = Math.round((topX + rightX) * 0.5 - 12 * s);
  const rightLandmarkY = Math.round((topY + rightY) * 0.5 - 52 * s);
  const wellX = Math.round(rightX - 18 * s);
  const wellY = Math.round(rightY + 4 * s);
  const catX = Math.round((topX + rightX) * 0.5 - 48 * s);
  const catY = Math.round((topY + rightY) * 0.5 - 24 * s);

  return (
    <g className="pointer-events-none" shapeRendering="crispEdges">
      {/* Upper-Left Hero Landmark (Barn / Cottage / Log Cabin / Crystal Shrine) */}
      <g transform={`translate(${barnX}, ${barnY}) scale(${s})`}>
        {theme === 'magical_garden' ? (
          <g>
            {/* Glowing Bioluminescent Crystal Mushroom Cluster */}
            <rect x="28" y="34" width="12" height="32" fill="#7CF3FF" />
            <polygon points="4,40 34,8 64,40 52,48 16,48" fill="#22D3EE" />
            <polygon points="16,34 34,14 52,34 42,40 26,40" fill="#A5F3FC" />
            <rect x="64" y="44" width="8" height="22" fill="#F9A8D4" />
            <ellipse cx="68" cy="40" rx="18" ry="11" fill="#E879F9" />
            <circle cx="24" cy="28" r="3" fill="#ECFEFF" />
            <circle cx="42" cy="24" r="2" fill="#ECFEFF" />
          </g>
        ) : theme === 'winter_sanctuary' ? (
          <g>
            {/* Snowy Cozy Lit Log Cabin + Pine */}
            <polygon points="6,30 38,2 70,30" fill="#6F4135" />
            <polygon points="10,30 38,8 66,30" fill="#E6F3FF" />
            <rect x="52" y="4" width="9" height="18" fill="#6E4438" />
            <rect x="12" y="30" width="52" height="34" fill="#6D442B" />
            <rect x="30" y="42" width="16" height="22" fill="#462817" />
            <rect x="16" y="40" width="10" height="10" fill="#FFD15C" />
            <rect x="50" y="40" width="10" height="10" fill="#FFD15C" />
            <polygon points="84,8 70,38 98,38" fill="#477254" />
            <polygon points="84,8 75,24 93,24" fill="#E8F5FF" />
          </g>
        ) : theme === 'spring_meadow' ? (
          <g>
            {/* Cozy Spring Cottage & Pink Sakura Tree */}
            <polygon points="8,28 38,4 68,28" fill="#C95E44" />
            <rect x="14" y="28" width="48" height="32" fill="#FAF0DA" />
            <rect x="30" y="38" width="14" height="22" fill="#7D4C2D" />
            <rect x="18" y="36" width="9" height="9" fill="#8CCCF2" />
            <rect x="78" y="36" width="8" height="24" fill="#78482B" />
            <circle cx="82" cy="22" r="20" fill="#F496B6" />
            <circle cx="94" cy="26" r="14" fill="#F9BED4" />
            <circle cx="70" cy="26" r="13" fill="#E36E98" />
          </g>
        ) : (
          <g>
            {/* Autumn Red Wooden Barn + Golden Hay Bale (Reference Image 1) */}
            <polygon points="6,26 36,2 66,26" fill="#4B4644" />
            <polygon points="10,26 36,6 62,26" fill="#5D5654" />
            <rect x="10" y="26" width="52" height="34" fill="#C43B2E" />
            <rect x="30" y="16" width="12" height="10" fill="#F7C76E" />
            <rect x="24" y="38" width="24" height="22" fill="#5E261B" />
            <rect x="26" y="40" width="20" height="20" fill="#9E3124" />
            <circle cx="82" cy="48" r="12" fill="#E89E3C" />
            <circle cx="80" cy="45" r="8" fill="#F7C75E" />
          </g>
        )}
      </g>

      {/* Upper-Right Secondary Scenery (Trees / Pumpkins / Glow Foliage) */}
      <g transform={`translate(${rightLandmarkX}, ${rightLandmarkY}) scale(${s})`}>
        {theme === 'magical_garden' ? (
          <g>
            <rect x="22" y="26" width="8" height="24" fill="#67E8F9" />
            <ellipse cx="26" cy="22" rx="18" ry="12" fill="#38BDF8" />
            <ellipse cx="26" cy="19" rx="11" ry="7" fill="#CFFAFE" />
            <rect x="46" y="12" width="4" height="4" fill="#FDE047" />
          </g>
        ) : theme === 'winter_sanctuary' ? (
          <g>
            <polygon points="22,4 4,34 40,34" fill="#3E6B4F" />
            <polygon points="22,4 11,20 33,20" fill="#E5F3FF" />
            <polygon points="48,14 34,40 62,40" fill="#4B795C" />
            <polygon points="48,14 40,26 56,26" fill="#E5F3FF" />
          </g>
        ) : theme === 'spring_meadow' ? (
          <g>
            <rect x="18" y="28" width="6" height="18" fill="#7D4C2D" />
            <circle cx="21" cy="18" r="15" fill="#F6A2BF" />
            <circle cx="50" cy="28" r="9" fill="#F6C53B" />
            <circle cx="50" cy="28" r="4" fill="#7D4C2D" />
          </g>
        ) : (
          <g>
            {/* Golden Autumn Oak & Pumpkins */}
            <rect x="24" y="28" width="8" height="20" fill="#6D4124" />
            <circle cx="28" cy="16" r="18" fill="#D98324" />
            <circle cx="38" cy="20" r="14" fill="#F2B83A" />
            <circle cx="56" cy="44" r="6" fill="#EA7B26" />
            <rect x="55" y="36" width="2" height="3" fill="#4C8237" />
          </g>
        )}
      </g>

      {/* Cozy Resting Companion Pet with Heart Bubble along Rim */}
      <g transform={`translate(${catX}, ${catY}) scale(${s})`}>
        {/* Speech Bubble Heart (Reference Image 1) */}
        <rect x="10" y="-12" width="16" height="14" rx="4" fill="#FFFDF7" stroke="#2B1B17" strokeWidth="1.5" />
        <polygon points="15,2 19,2 17,6" fill="#FFFDF7" />
        <rect x="15" y="-8" width="2" height="3" fill="#E24B5B" />
        <rect x="19" y="-8" width="2" height="3" fill="#E24B5B" />
        <rect x="14" y="-6" width="8" height="3" fill="#E24B5B" />
        <rect x="16" y="-3" width="4" height="2" fill="#E24B5B" />
        {/* Tiny Lounging Orange-White Cat */}
        <ellipse cx="18" cy="20" rx="11" ry="6" fill="rgba(0,0,0,0.18)" />
        <rect x="9" y="10" width="18" height="11" rx="3" fill="#F1A76A" stroke="#2B1B17" strokeWidth="1.5" />
        <rect x="10" y="7" width="4" height="4" fill="#F1A76A" stroke="#2B1B17" strokeWidth="1.2" />
        <rect x="22" y="7" width="4" height="4" fill="#F1A76A" stroke="#2B1B17" strokeWidth="1.2" />
        <rect x="13" y="15" width="10" height="5" fill="#FFFDF7" />
        <rect x="13" y="13" width="2" height="2" fill="#2B1B17" />
        <rect x="21" y="13" width="2" height="2" fill="#2B1B17" />
        <rect x="17" y="15" width="2" height="1.5" fill="#E87D8A" />
      </g>

      {/* Lower-Right Glowing Moss Well (Reference Image 1) */}
      <g transform={`translate(${wellX}, ${wellY}) scale(${s})`}>
        <ellipse cx="16" cy="22" rx="14" ry="7" fill="#757370" stroke="#2B1B17" strokeWidth="1.5" />
        <ellipse cx="16" cy="16" rx="13" ry="6" fill="#A9A59F" stroke="#2B1B17" strokeWidth="1.5" />
        <ellipse cx="16" cy="16" rx="9" ry="4" fill={theme === 'magical_garden' ? '#22D3EE' : '#58D1BA'} />
        <rect x="4" y="6" width="3" height="12" fill="#7D4C2D" />
        <rect x="25" y="6" width="3" height="12" fill="#7D4C2D" />
        <polygon points="0,8 16,-2 32,8" fill={theme === 'winter_sanctuary' ? '#D6EAFA' : '#9E5D36'} stroke="#2B1B17" strokeWidth="1.2" />
      </g>

      {/* Tiny Garden Chick / Bunny Accent near Front-Left Meadow */}
      <g transform={`translate(${Math.round((leftX + bottomX) * 0.45 - 24 * s)}, ${Math.round((leftY + bottomY) * 0.45 + 6 * s)}) scale(${s})`}>
        <rect x="4" y="4" width="10" height="8" rx="3" fill="#FFF8EC" stroke="#2B1B17" strokeWidth="1.2" />
        <rect x="6" y="7" width="1.5" height="1.5" fill="#2B1B17" />
        <rect x="11" y="7" width="1.5" height="1.5" fill="#2B1B17" />
        <rect x="8" y="8.5" width="2" height="1.5" fill="#F59E0B" />
      </g>
    </g>
  );
}

export function GardenFoundationView() {
  const gardenState = useGardenStore((s) => s.gardenState);
  const areas = useGardenStore((s) => s.areas);
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
  const switchArea = useGardenStore((s) => s.switchArea);
  const unlockArea = useGardenStore((s) => s.unlockArea);

  const xpBalance = useAppStore((s) => s.progression?.xpBalance ?? 0);
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

  const paddingX = Math.round(92 * Math.max(0.85, zoomLevel));
  const paddingTop = Math.round(98 * Math.max(0.85, zoomLevel));
  const paddingBottom = Math.round(62 * Math.max(0.85, zoomLevel));

  const svgWidth = Math.ceil((gridWidth + gridHeight) * halfW + paddingX * 2);
  const svgHeight = Math.ceil((gridWidth + gridHeight) * halfH + paddingTop + paddingBottom);
  const originX = Math.round(gridHeight * halfW + paddingX);
  const originY = paddingTop;

  const islandDepth = Math.round(22 * zoomLevel);
  const diamondTopX = originX;
  const diamondTopY = originY;
  const diamondRightX = originX + gridWidth * halfW;
  const diamondRightY = originY + gridWidth * halfH;
  const diamondBottomX = originX + (gridWidth - gridHeight) * halfW;
  const diamondBottomY = originY + (gridWidth + gridHeight) * halfH;
  const diamondLeftX = originX - gridHeight * halfW;
  const diamondLeftY = originY + gridHeight * halfH;

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

  const sortedPlacements = useMemo(
    () =>
      [...placements].sort((a, b) => {
        const depthDiff = a.tileX + a.tileY - (b.tileX + b.tileY);
        if (depthDiff !== 0) return depthDiff;
        if (a.tileY !== b.tileY) return a.tileY - b.tileY;
        return a.tileX - b.tileX;
      }),
    [placements]
  );

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

  const spriteSize = Math.max(26, Math.round(40 * zoomLevel));
  const themeKey = area?.theme ?? 'spring_meadow';
  const palette = THEME_PALETTES[themeKey] ?? THEME_PALETTES.spring_meadow;
  const isDarkTheme = themeKey === 'magical_garden';
  const hotbarSlotsCount = Math.max(8, inventory.length);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header & Interaction Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Flower2 className="h-3.5 w-3.5" />
            {area?.name ?? 'Sunlit Meadow'} · {gridWidth}×{gridHeight} Isometric Diorama
          </span>
          <h2 className="mt-1 text-2xl font-bold text-cozy-wood">
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
                className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[#3C5C3D] bg-cozy-sage text-white shadow-pixel-sm'
                    : 'border-cozy-border bg-white/90 text-cozy-wood hover:bg-cozy-panel'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{btn.label}</span>
              </button>
            );
          })}

          <div className="flex items-center gap-1 rounded-xl border-2 border-cozy-border bg-white/90 px-2.5 py-1 text-xs">
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
              className="inline-flex items-center gap-1 rounded-xl border-2 border-cozy-border bg-white/90 px-3 py-1.5 text-xs font-semibold text-cozy-peach transition hover:bg-cozy-peach/10 disabled:opacity-40"
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

      {/* Visual Garden Biome Showcase Switcher Cards (Reference Image 4) */}
      {areas.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          {areas.map((item) => {
            const isCurrent = area?.userGardenId === item.userGardenId;
            const itemPalette = THEME_PALETTES[item.theme] ?? THEME_PALETTES.spring_meadow;
            const cost = item.unlockXpCost ?? 0;
            const canAfford = xpBalance >= cost;

            if (item.isUnlocked) {
              return (
                <button
                  key={item.userGardenId}
                  type="button"
                  onClick={() => void switchArea(item.userGardenId)}
                  className={`group overflow-hidden rounded-2xl border-2 text-left transition ${
                    isCurrent
                      ? 'border-cozy-sage bg-white shadow-pixel-sm ring-2 ring-cozy-sage/30'
                      : 'border-cozy-border bg-white/85 hover:border-cozy-sage/60'
                  }`}
                >
                  <div className="relative h-16 w-full overflow-hidden border-b border-cozy-border/60">
                    <GardenThemePreviewBanner theme={item.theme} />
                    <span className="absolute right-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.gridWidth}×{item.gridHeight}
                    </span>
                    {isCurrent && (
                      <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-cozy-sage px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <Sparkles className="h-2.5 w-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-1.5">
                    <p className="truncate text-xs font-bold text-cozy-wood">{item.name}</p>
                    <p className="truncate text-[10px] text-cozy-muted">
                      {itemPalette.viSubtitle}
                    </p>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.userGardenId}
                type="button"
                disabled={!canAfford}
                onClick={() => void unlockArea(item.userGardenId)}
                title={
                  canAfford
                    ? `Unlock ${item.name} (${item.gridWidth}×${item.gridHeight}) for ${cost} XP`
                    : `Need ${cost} XP to unlock ${item.name}`
                }
                className="group overflow-hidden rounded-2xl border-2 border-dashed border-cozy-border bg-cozy-panel/85 text-left transition hover:border-cozy-sage disabled:cursor-not-allowed disabled:opacity-75"
              >
                <div className="relative h-16 w-full overflow-hidden border-b border-cozy-border/60">
                  <GardenThemePreviewBanner
                    theme={item.theme}
                    className="brightness-75 saturate-75"
                  />
                  <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.gridWidth}×{item.gridHeight}
                  </span>
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-amber-900/85 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">
                    <Lock className="h-2.5 w-2.5" />
                    Unlock {cost} XP
                  </span>
                </div>
                <div className="px-2.5 py-1.5">
                  <p className="truncate text-xs font-bold text-cozy-wood">{item.name}</p>
                  <p className="truncate text-[10px] text-cozy-muted">{itemPalette.viSubtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Isometric Viewport + Right-Docked Compact Timer Panel */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_290px]">
        <div className="flex min-h-0 flex-col gap-3">
          {/* Interactive Rich Pixel Isometric Diorama Canvas */}
          <section
            className={`cozy-card relative min-h-0 flex-1 overflow-auto bg-gradient-to-b ${palette.backdropGradient} p-3`}
          >
            <div
              className={`mb-1.5 flex items-center justify-between text-[11px] font-semibold ${
                isDarkTheme ? 'text-cyan-100' : 'text-cozy-wood'
              }`}
            >
              <span className="rounded-lg bg-white/55 px-2.5 py-0.5 text-cozy-wood backdrop-blur-sm">
                {interactionMode === 'place'
                  ? 'Click any empty grass tile to place the selected item.'
                  : interactionMode === 'move'
                    ? selectedPlacementId
                      ? 'Click an empty destination tile to move the selected item.'
                      : 'Click an existing item in the garden to pick it up.'
                    : 'Click an existing item to return it to your inventory.'}
              </span>
              {hoveredTile && (
                <span className="rounded-lg bg-white/75 px-2 py-0.5 font-mono text-cozy-wood">
                  Tile ({hoveredTile.x}, {hoveredTile.y})
                </span>
              )}
            </div>

            <div className="flex min-h-[340px] items-center justify-center">
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="pixel-art select-none overflow-visible"
              >
                {/* Drop Shadow under Floating 3D Island */}
                <polygon
                  points={`${diamondTopX},${diamondTopY + islandDepth + 10} ${diamondRightX + 6},${diamondRightY + islandDepth + 12} ${diamondBottomX},${diamondBottomY + islandDepth + 14} ${diamondLeftX - 6},${diamondLeftY + islandDepth + 12}`}
                  fill="rgba(26, 20, 14, 0.22)"
                />

                {/* 3D Diorama Earth / Stone Island Depth Slab */}
                <polygon
                  points={`${diamondLeftX},${diamondLeftY} ${diamondBottomX},${diamondBottomY} ${diamondBottomX},${diamondBottomY + islandDepth} ${diamondLeftX},${diamondLeftY + islandDepth}`}
                  fill={palette.slabLeft}
                  stroke="#2B1B17"
                  strokeWidth="1.5"
                />
                <polygon
                  points={`${diamondBottomX},${diamondBottomY} ${diamondRightX},${diamondRightY} ${diamondRightX},${diamondRightY + islandDepth} ${diamondBottomX},${diamondBottomY + islandDepth}`}
                  fill={palette.slabRight}
                  stroke="#2B1B17"
                  strokeWidth="1.5"
                />
                {/* Turf Lip Along Front Bevel */}
                <polyline
                  points={`${diamondLeftX},${diamondLeftY + 2} ${diamondBottomX},${diamondBottomY + 2} ${diamondRightX},${diamondRightY + 2}`}
                  fill="none"
                  stroke={palette.slabTrim}
                  strokeWidth={Math.max(3, Math.round(4 * zoomLevel))}
                />

                {/* Upper Perimeter Wooden Fence Posts */}
                <g className="pointer-events-none">
                  {Array.from({ length: gridWidth }).map((_, idx) => {
                    const pt = tileToScreen(
                      idx,
                      0,
                      originX,
                      originY,
                      baseTileW,
                      baseTileH,
                      zoomLevel
                    );
                    return (
                      <rect
                        key={`fence-r-${idx}`}
                        x={pt.screenX + halfW * 0.35 - 2}
                        y={pt.screenY + halfH * 0.2 - 12 * zoomLevel}
                        width={Math.max(4, Math.round(5 * zoomLevel))}
                        height={Math.round(13 * zoomLevel)}
                        fill={palette.fenceWood}
                        stroke={palette.fenceDark}
                        strokeWidth="1"
                      />
                    );
                  })}
                  {Array.from({ length: gridHeight }).map((_, idx) => {
                    const pt = tileToScreen(
                      0,
                      idx,
                      originX,
                      originY,
                      baseTileW,
                      baseTileH,
                      zoomLevel
                    );
                    return (
                      <rect
                        key={`fence-l-${idx}`}
                        x={pt.screenX - halfW * 0.45 - 2}
                        y={pt.screenY + halfH * 0.2 - 12 * zoomLevel}
                        width={Math.max(4, Math.round(5 * zoomLevel))}
                        height={Math.round(13 * zoomLevel)}
                        fill={palette.fenceWood}
                        stroke={palette.fenceDark}
                        strokeWidth="1"
                      />
                    );
                  })}
                </g>

                {/* Scenic Theme Landmarks + Companion Cat */}
                <IsometricSceneryLandmark
                  theme={themeKey}
                  topX={diamondTopX}
                  topY={diamondTopY}
                  rightX={diamondRightX}
                  rightY={diamondRightY}
                  leftX={diamondLeftX}
                  leftY={diamondLeftY}
                  bottomX={diamondBottomX}
                  bottomY={diamondBottomY}
                  zoomLevel={zoomLevel}
                />

                {/* Ground Isometric Diamond Tiles + Tilled Crop Soil Plots */}
                {tiles.map((tile) => {
                  const isEven = (tile.x + tile.y) % 2 === 0;
                  const isHovered =
                    hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
                  const existing = placementMap.get(`${tile.x},${tile.y}`);
                  const isSelectedForMove =
                    existing !== undefined && existing.id === selectedPlacementId;
                  const isPlantedTile =
                    existing?.category === 'plant' || existing?.category === 'seed';

                  const points = [
                    `${tile.screenX},${tile.screenY}`,
                    `${tile.screenX + halfW},${tile.screenY + halfH}`,
                    `${tile.screenX},${tile.screenY + tileH}`,
                    `${tile.screenX - halfW},${tile.screenY + halfH}`
                  ].join(' ');

                  let fillColor = isEven ? palette.evenTile : palette.oddTile;
                  if (isSelectedForMove) {
                    fillColor = '#FDE68A';
                  } else if (isHovered) {
                    fillColor =
                      interactionMode === 'remove' && existing ? '#FECACA' : palette.hoverTile;
                  }

                  const soilPadX = halfW * 0.68;
                  const soilPadY = halfH * 0.68;
                  const centerY = tile.screenY + halfH;
                  const soilPoints = [
                    `${tile.screenX},${centerY - soilPadY}`,
                    `${tile.screenX + soilPadX},${centerY}`,
                    `${tile.screenX},${centerY + soilPadY}`,
                    `${tile.screenX - soilPadX},${centerY}`
                  ].join(' ');

                  return (
                    <g
                      key={`${tile.x}-${tile.y}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTile({ x: tile.x, y: tile.y })}
                      onMouseLeave={() => setHoveredTile(null)}
                      onClick={() => void interactWithTile(tile.x, tile.y)}
                    >
                      <polygon
                        points={points}
                        fill={fillColor}
                        stroke={isHovered ? palette.hoverStroke : palette.stroke}
                        strokeWidth={isHovered ? 2 : 1}
                      />
                      {/* Auto Tilled Soil Plot Under Placed Plants & Seeds */}
                      {isPlantedTile && (
                        <g className="pointer-events-none">
                          <polygon
                            points={soilPoints}
                            fill="#B07246"
                            stroke="#6D3E20"
                            strokeWidth="1.2"
                          />
                          <line
                            x1={tile.screenX - soilPadX * 0.45}
                            y1={centerY - soilPadY * 0.15}
                            x2={tile.screenX + soilPadX * 0.2}
                            y2={centerY + soilPadY * 0.42}
                            stroke="#8A522E"
                            strokeWidth="1.5"
                          />
                          <line
                            x1={tile.screenX - soilPadX * 0.12}
                            y1={centerY - soilPadY * 0.42}
                            x2={tile.screenX + soilPadX * 0.52}
                            y2={centerY + soilPadY * 0.12}
                            stroke="#8A522E"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Depth-Sorted Placed Objects */}
                {sortedPlacements.map((placement) => {
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

          {/* Stardew Valley-Style Wooden Bottom Inventory Hotbar (Reference Image 1) */}
          <section className="shrink-0 rounded-2xl border-2 border-[#4C2816] bg-[#8C5230] p-3 shadow-[0_4px_0_#3A1D0F]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#5C3119] px-2.5 py-0.5 font-bold text-[#FFF2D6]">
                  Garden Hotbar
                </span>
                {selectedInventoryItem ? (
                  <span className="font-semibold text-[#FFE9C6]">
                    Selected: <strong>{selectedInventoryItem.name}</strong> (Avail:{' '}
                    {selectedInventoryItem.availableQuantity} /{' '}
                    {selectedInventoryItem.ownedQuantity})
                  </span>
                ) : (
                  <span className="text-[#F5D6AD]">
                    Select a slot below to place items into your garden
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#F5D6AD]">
                {inventory.length} item types owned
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: hotbarSlotsCount }).map((_, idx) => {
                const item = inventory[idx];
                if (!item) {
                  return (
                    <div
                      key={`empty-slot-${idx}`}
                      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-[#4C2816] bg-[#C67A4B]/70 shadow-inner"
                    >
                      <div className="pointer-events-none h-[calc(100%-6px)] w-[calc(100%-6px)] rounded border border-dashed border-[#F7D7B5]/45" />
                      <span className="absolute bottom-1 right-1.5 font-mono text-[10px] font-bold text-[#5A2D16]/70">
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
                    className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-[#FFF3B0] bg-[#EEA06E] ring-2 ring-[#FFE58F] -translate-y-0.5'
                        : 'border-[#4C2816] bg-[#DE8F5F] hover:bg-[#E79B6C]'
                    } ${depleted ? 'opacity-65' : ''}`}
                  >
                    <div className="pointer-events-none flex h-[calc(100%-6px)] w-[calc(100%-6px)] items-center justify-center rounded border border-dashed border-[#F7D7B5]">
                      <PixelSprite spriteKey={item.spriteKey} size={36} />
                    </div>
                    <span className="absolute bottom-0.5 right-1 rounded bg-[#4C2816]/85 px-1 font-mono text-[10px] font-bold leading-tight text-[#FFF7E2]">
                      {item.availableQuantity}
                    </span>
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

            <div className="mt-4 rounded-2xl border-2 border-cozy-border bg-cozy-cream px-3 py-5 text-center">
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

            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-cozy-border bg-cozy-panel/70 p-2.5">
              <PetIllustration species="cat" size={44} />
              <p className="text-[11px] leading-snug text-cozy-muted">
                {timerState.status === 'running'
                  ? 'Your garden companion is focusing peacefully alongside you!'
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
