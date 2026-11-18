import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type { GardenAreaDTO, GardenStateDTO } from '@shared/types/domain';
import { sortPlacementsByDepth } from '@shared/utils/isometricMath';
import { useAppStore } from './useAppStore';

export type GardenInteractionMode = 'place' | 'move' | 'remove';

interface GardenStoreState {
  gardenState: GardenStateDTO | null;
  areas: GardenAreaDTO[];
  selectedItemId: string | null;
  selectedPlacementId: string | null;
  interactionMode: GardenInteractionMode;
  zoomLevel: number;
  isLoadingGarden: boolean;
  gardenError: string | null;
  loadGarden: () => Promise<void>;
  setSelectedItemId: (itemId: string | null) => void;
  setInteractionMode: (mode: GardenInteractionMode) => void;
  setZoomLevel: (zoom: number) => void;
  interactWithTile: (tileX: number, tileY: number) => Promise<void>;
  clearGarden: () => Promise<void>;
  switchArea: (userGardenId: string) => Promise<void>;
  unlockArea: (userGardenId: string) => Promise<void>;
}

const FALLBACK_AREAS: GardenAreaDTO[] = [
  {
    userGardenId: 'user_garden_starter',
    areaDefinitionId: 'meadow_starter',
    name: 'Sunlit Meadow',
    customName: 'My Cozy Meadow',
    theme: 'spring_meadow',
    description: 'A bright, peaceful starter meadow ready to grow alongside your focus habit.',
    gridWidth: DEFAULT_BALANCE_CONFIG.garden.initialGridWidth,
    gridHeight: DEFAULT_BALANCE_CONFIG.garden.initialGridHeight,
    baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
    baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
    unlockXpCost: 0,
    isUnlocked: true,
    isActiveView: true
  },
  {
    userGardenId: 'user_garden_autumn',
    areaDefinitionId: 'autumn_grove',
    name: 'Autumn Grove',
    customName: 'Amber Harvest Yard',
    theme: 'autumn_grove',
    description: 'Warm amber fields framed by maple foliage and harvest pumpkin beds.',
    gridWidth: 14,
    gridHeight: 14,
    baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
    baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
    unlockXpCost: 120,
    isUnlocked: false,
    isActiveView: false
  },
  {
    userGardenId: 'user_garden_winter',
    areaDefinitionId: 'winter_sanctuary',
    name: 'Winter Sanctuary',
    customName: 'Frosty Log Cabin',
    theme: 'winter_sanctuary',
    description: 'Snow-dusted pines beside a warm glowing winter study cabin.',
    gridWidth: 14,
    gridHeight: 14,
    baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
    baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
    unlockXpCost: 180,
    isUnlocked: false,
    isActiveView: false
  },
  {
    userGardenId: 'user_garden_starlight',
    areaDefinitionId: 'starlight_conservatory',
    name: 'Starlight Conservatory',
    customName: 'Bioluminescent Grove',
    theme: 'magical_garden',
    description: 'Glowing starlight mushrooms illuminating late-night study sessions.',
    gridWidth: 16,
    gridHeight: 16,
    baseTileWidth: DEFAULT_BALANCE_CONFIG.garden.baseTileWidth,
    baseTileHeight: DEFAULT_BALANCE_CONFIG.garden.baseTileHeight,
    unlockXpCost: 260,
    isUnlocked: false,
    isActiveView: false
  }
];

const FALLBACK_INVENTORY: GardenStateDTO['inventory'] = [
  {
    itemId: 'item_pruning_shears',
    name: 'Pruning Shears',
    category: 'tool',
    description: 'Handy garden shears for tending tidy beds.',
    rarity: 'common',
    spriteKey: 'pruning_shears',
    ownedQuantity: 1,
    placedCount: 0,
    availableQuantity: 1
  },
  {
    itemId: 'item_watering_can',
    name: 'Flower Watering Can',
    category: 'tool',
    description: 'Periwinkle watering can painted with a daisy blossom.',
    rarity: 'common',
    spriteKey: 'watering_can',
    ownedQuantity: 1,
    placedCount: 0,
    availableQuantity: 1
  },
  {
    itemId: 'item_sunflower_seed',
    name: 'Sunflower Seed Bag',
    category: 'seed',
    description: 'Plump burlap pouch filled with golden sunflower seeds.',
    rarity: 'common',
    spriteKey: 'sunflower_seed',
    ownedQuantity: 7,
    placedCount: 0,
    availableQuantity: 7
  },
  {
    itemId: 'item_sprout_pot',
    name: 'Terracotta Sprout',
    category: 'plant',
    description: 'A cheerful little sprout in a warm clay pot.',
    rarity: 'common',
    spriteKey: 'sprout_pot',
    ownedQuantity: 4,
    placedCount: 1,
    availableQuantity: 3
  },
  {
    itemId: 'item_sunlit_daisy',
    name: 'Sunlit Daisy',
    category: 'plant',
    description: 'Bright white petals that love morning focus sessions.',
    rarity: 'common',
    spriteKey: 'sunlit_daisy',
    ownedQuantity: 3,
    placedCount: 1,
    availableQuantity: 2
  },
  {
    itemId: 'item_lavender_bush',
    name: 'Lavender Bush',
    category: 'plant',
    description: 'Fragrant violet lavender spikes for calm afternoons.',
    rarity: 'uncommon',
    spriteKey: 'lavender_bush',
    ownedQuantity: 2,
    placedCount: 0,
    availableQuantity: 2
  },
  {
    itemId: 'item_wooden_lantern',
    name: 'Wooden Lantern',
    category: 'decor',
    description: 'Warm amber study lantern guiding dusk focus blocks.',
    rarity: 'common',
    spriteKey: 'wooden_lantern',
    ownedQuantity: 2,
    placedCount: 1,
    availableQuantity: 1
  },
  {
    itemId: 'item_cherry_bonsai',
    name: 'Cherry Blossom Bonsai',
    category: 'plant',
    description: 'Miniature blooming sakura tree in a ceramic glaze dish.',
    rarity: 'rare',
    spriteKey: 'cherry_bonsai',
    ownedQuantity: 1,
    placedCount: 0,
    availableQuantity: 1
  }
];

const FALLBACK_GARDEN_STATE: GardenStateDTO = {
  area: FALLBACK_AREAS[0],
  placements: [
    {
      id: 'preview-place-1',
      gardenId: 'user_garden_starter',
      itemId: 'item_sunlit_daisy',
      itemName: 'Sunlit Daisy',
      category: 'plant',
      spriteKey: 'sunlit_daisy',
      tileX: 3,
      tileY: 4,
      rotation: 0,
      placedAt: '2026-11-18T00:00:00.000Z'
    },
    {
      id: 'preview-place-2',
      gardenId: 'user_garden_starter',
      itemId: 'item_sprout_pot',
      itemName: 'Terracotta Sprout',
      category: 'plant',
      spriteKey: 'sprout_pot',
      tileX: 5,
      tileY: 4,
      rotation: 0,
      placedAt: '2026-11-18T00:00:00.000Z'
    },
    {
      id: 'preview-place-3',
      gardenId: 'user_garden_starter',
      itemId: 'item_wooden_lantern',
      itemName: 'Wooden Lantern',
      category: 'decor',
      spriteKey: 'wooden_lantern',
      tileX: 6,
      tileY: 2,
      rotation: 0,
      placedAt: '2026-11-18T00:00:00.000Z'
    }
  ],
  inventory: FALLBACK_INVENTORY
};

export const useGardenStore = create<GardenStoreState>((set, get) => ({
  gardenState: null,
  areas: [],
  selectedItemId: null,
  selectedPlacementId: null,
  interactionMode: 'place',
  zoomLevel: DEFAULT_BALANCE_CONFIG.garden.defaultZoomLevel,
  isLoadingGarden: false,
  gardenError: null,

  loadGarden: async () => {
    const api = window.purrfectAPI;
    if (!api) {
      const current = get().gardenState ?? FALLBACK_GARDEN_STATE;
      const existingAreas = get().areas;
      const defaultItem =
        current.inventory.find((i) => i.availableQuantity > 0)?.itemId ??
        current.inventory[0]?.itemId ??
        null;
      set((s) => ({
        gardenState: current,
        areas: existingAreas.length > 0 ? existingAreas : FALLBACK_AREAS,
        selectedItemId: s.selectedItemId ?? defaultItem,
        isLoadingGarden: false
      }));
      return;
    }

    set({ isLoadingGarden: true, gardenError: null });
    try {
      const [gardenState, areas] = await Promise.all([
        api.garden.getState(),
        api.garden.listAreas()
      ]);
      const firstAvailable =
        gardenState.inventory.find((i) => i.availableQuantity > 0)?.itemId ??
        gardenState.inventory[0]?.itemId ??
        null;
      const currentSelected = get().selectedItemId;
      const stillExists =
        currentSelected !== null &&
        gardenState.inventory.some((i) => i.itemId === currentSelected);

      set({
        isLoadingGarden: false,
        gardenState,
        areas,
        selectedItemId: stillExists ? currentSelected : firstAvailable
      });
    } catch (error) {
      set({
        isLoadingGarden: false,
        gardenError: error instanceof Error ? error.message : 'Failed to load garden.'
      });
    }
  },

  setSelectedItemId: (itemId) => {
    set({ selectedItemId: itemId, interactionMode: 'place', selectedPlacementId: null });
  },

  setInteractionMode: (mode) => {
    set({ interactionMode: mode, selectedPlacementId: null, gardenError: null });
  },

  setZoomLevel: (zoom) => {
    set({ zoomLevel: zoom });
  },

  interactWithTile: async (tileX, tileY) => {
    const { gardenState, interactionMode, selectedItemId, selectedPlacementId } = get();
    if (!gardenState) return;

    const existingAtTile = gardenState.placements.find(
      (p) => p.tileX === tileX && p.tileY === tileY
    );
    const api = window.purrfectAPI;

    set({ gardenError: null });

    if (interactionMode === 'remove') {
      if (!existingAtTile) return;
      if (!api) {
        const nextPlacements = gardenState.placements.filter(
          (p) => p.id !== existingAtTile.id
        );
        set({ gardenState: rebuildFallbackCounts(gardenState, nextPlacements) });
        return;
      }
      try {
        const next = await api.garden.removeItem(existingAtTile.id);
        set({ gardenState: next });
      } catch (error) {
        set({
          gardenError: error instanceof Error ? error.message : 'Unable to remove item.'
        });
      }
      return;
    }

    if (interactionMode === 'move') {
      if (!selectedPlacementId) {
        if (existingAtTile) {
          set({ selectedPlacementId: existingAtTile.id });
        }
        return;
      }

      if (existingAtTile && existingAtTile.id === selectedPlacementId) {
        set({ selectedPlacementId: null });
        return;
      }

      if (existingAtTile) {
        set({ selectedPlacementId: existingAtTile.id });
        return;
      }

      if (!api) {
        const nextPlacements = sortPlacementsByDepth(
          gardenState.placements.map((p) =>
            p.id === selectedPlacementId ? { ...p, tileX, tileY } : p
          )
        );
        set({
          selectedPlacementId: null,
          gardenState: rebuildFallbackCounts(gardenState, nextPlacements)
        });
        return;
      }

      try {
        const next = await api.garden.moveItem({
          placementId: selectedPlacementId,
          tileX,
          tileY
        });
        set({ gardenState: next, selectedPlacementId: null });
      } catch (error) {
        set({
          gardenError: error instanceof Error ? error.message : 'Unable to move item.'
        });
      }
      return;
    }

    // interactionMode === 'place'
    if (existingAtTile || !selectedItemId) return;

    if (!api) {
      const inv = gardenState.inventory.find((i) => i.itemId === selectedItemId);
      if (!inv || inv.availableQuantity <= 0) return;
      const nextPlacements = sortPlacementsByDepth([
        ...gardenState.placements,
        {
          id: `preview-place-${Date.now()}`,
          gardenId: gardenState.area.userGardenId,
          itemId: inv.itemId,
          itemName: inv.name,
          category: inv.category,
          spriteKey: inv.spriteKey,
          tileX,
          tileY,
          rotation: 0,
          placedAt: new Date().toISOString()
        }
      ]);
      set({ gardenState: rebuildFallbackCounts(gardenState, nextPlacements) });
      return;
    }

    try {
      const next = await api.garden.placeItem({
        gardenId: gardenState.area.userGardenId,
        itemId: selectedItemId,
        tileX,
        tileY
      });
      set({ gardenState: next });
    } catch (error) {
      set({
        gardenError: error instanceof Error ? error.message : 'Unable to place item.'
      });
    }
  },

  clearGarden: async () => {
    const gardenState = get().gardenState;
    if (!gardenState) return;
    const api = window.purrfectAPI;

    if (!api) {
      set({ gardenState: rebuildFallbackCounts(gardenState, []) });
      return;
    }

    try {
      const next = await api.garden.clearLayout(gardenState.area.userGardenId);
      set({ gardenState: next, selectedPlacementId: null });
    } catch (error) {
      set({
        gardenError: error instanceof Error ? error.message : 'Unable to clear layout.'
      });
    }
  },

  switchArea: async (userGardenId) => {
    const api = window.purrfectAPI;
    if (!api) {
      const current = get().gardenState ?? FALLBACK_GARDEN_STATE;
      const targetArea = get().areas.find((a) => a.userGardenId === userGardenId);
      if (!targetArea || !targetArea.isUnlocked) return;
      const nextAreas = get().areas.map((a) => ({
        ...a,
        isActiveView: a.userGardenId === userGardenId
      }));
      set({
        areas: nextAreas,
        selectedPlacementId: null,
        gardenState: {
          ...current,
          area: { ...targetArea, isActiveView: true }
        }
      });
      return;
    }

    set({ gardenError: null, selectedPlacementId: null });
    try {
      const [gardenState, areas] = await Promise.all([
        api.garden.switchArea(userGardenId),
        api.garden.listAreas()
      ]);
      set({ gardenState, areas });
    } catch (error) {
      set({
        gardenError: error instanceof Error ? error.message : 'Unable to switch garden area.'
      });
    }
  },

  unlockArea: async (userGardenId) => {
    const api = window.purrfectAPI;
    if (!api) {
      const targetArea = get().areas.find((a) => a.userGardenId === userGardenId);
      if (!targetArea) return;
      const unlockedTarget: GardenAreaDTO = {
        ...targetArea,
        isUnlocked: true,
        isActiveView: true
      };
      const nextAreas = get().areas.map((a) =>
        a.userGardenId === userGardenId
          ? unlockedTarget
          : { ...a, isActiveView: false }
      );
      const current = get().gardenState ?? FALLBACK_GARDEN_STATE;
      set({
        areas: nextAreas,
        selectedPlacementId: null,
        gardenState: {
          ...current,
          area: unlockedTarget
        }
      });
      return;
    }

    set({ gardenError: null });
    try {
      await api.garden.unlockArea(userGardenId);
      const [gardenState, areas] = await Promise.all([
        api.garden.switchArea(userGardenId),
        api.garden.listAreas()
      ]);
      set({ gardenState, areas, selectedPlacementId: null });
      await useAppStore.getState().refreshProgression();
    } catch (error) {
      set({
        gardenError: error instanceof Error ? error.message : 'Unable to unlock garden area.'
      });
    }
  }
}));

function rebuildFallbackCounts(
  state: GardenStateDTO,
  placements: GardenStateDTO['placements']
): GardenStateDTO {
  const counts = new Map<string, number>();
  for (const p of placements) {
    counts.set(p.itemId, (counts.get(p.itemId) ?? 0) + 1);
  }
  return {
    ...state,
    placements,
    inventory: state.inventory.map((item) => {
      const placed = counts.get(item.itemId) ?? 0;
      return {
        ...item,
        placedCount: placed,
        availableQuantity: Math.max(0, item.ownedQuantity - placed)
      };
    })
  };
}

