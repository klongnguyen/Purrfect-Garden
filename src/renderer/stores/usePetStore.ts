import { create } from 'zustand';
import { DEFAULT_BALANCE_CONFIG } from '@shared/config/balanceConfig';
import type {
  GachaCurrencyType,
  GachaStateDTO,
  GardenWeatherMode,
  PetCatalogItemDTO,
  PetRarity,
  RollGachaResultDTO
} from '@shared/types/domain';
import { useAppStore } from './useAppStore';

interface PetStoreState {
  gachaState: GachaStateDTO | null;
  weatherMode: GardenWeatherMode;
  isAmbientFocusMode: boolean;
  isLoadingPets: boolean;
  isRolling: boolean;
  lastRollResult: RollGachaResultDTO | null;
  petError: string | null;
  petBanner: string | null;
  loadGachaState: () => Promise<void>;
  rollGacha: (currencyType: GachaCurrencyType) => Promise<void>;
  togglePetPlacement: (userPetId: string, placed: boolean) => Promise<void>;
  updatePetNickname: (userPetId: string, nickname: string) => Promise<void>;
  setWeatherMode: (mode: GardenWeatherMode) => void;
  setAmbientFocusMode: (enabled: boolean) => void;
  clearRollBanner: () => void;
}

const FALLBACK_PET_CATALOG: PetCatalogItemDTO[] = [
  {
    petDefinitionId: 'pet_cat_miso',
    species: 'cat',
    name: 'Miso the Tabby Cat',
    rarity: 'common',
    description: 'Warm orange-and-white tabby who curls up near your porch during focus blocks.',
    spriteKey: 'cat_tabby',
    gachaWeight: 30,
    isOwned: true,
    userPetId: 'user_pet_starter_miso',
    nickname: 'Miso',
    duplicateCount: 1,
    placedGardenId: 'user_garden_starter',
    tileX: 2,
    tileY: 2,
    acquiredAt: '2026-11-18T00:00:00.000Z'
  },
  {
    petDefinitionId: 'pet_dog_biscuit',
    species: 'dog',
    name: 'Biscuit the Golden Pup',
    rarity: 'common',
    description: 'Cheerful floppy-eared golden pup who celebrates every completed Pomodoro.',
    spriteKey: 'dog_golden',
    gachaWeight: 25,
    isOwned: true,
    userPetId: 'preview-pet-biscuit',
    nickname: 'Biscuit',
    duplicateCount: 1,
    placedGardenId: 'user_garden_starter',
    tileX: 8,
    tileY: 3,
    acquiredAt: '2026-11-18T00:00:00.000Z'
  },
  {
    petDefinitionId: 'pet_capy_yuzu',
    species: 'capybara',
    name: 'Yuzu the Chill Capybara',
    rarity: 'common',
    description: 'Serene capybara balancing a bright orange yuzu on top of its head.',
    spriteKey: 'capy_yuzu',
    gachaWeight: 25,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_cat_mochi',
    species: 'cat',
    name: 'Mochi the Calico Cat',
    rarity: 'rare',
    description: 'Soft pastel calico companion who adores afternoon rain ambience.',
    spriteKey: 'cat_calico',
    gachaWeight: 12,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_dog_latte',
    species: 'dog',
    name: 'Latte the Corgi Pup',
    rarity: 'rare',
    description: 'Short-legged cinnamon-tan pup trotting enthusiastically down garden paths.',
    spriteKey: 'dog_corgi',
    gachaWeight: 10,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_capy_matcha',
    species: 'capybara',
    name: 'Matcha the Onsen Capybara',
    rarity: 'rare',
    description: 'Placid green-tea spa companion who radiates pure deep-work calm.',
    spriteKey: 'capy_onsen',
    gachaWeight: 10,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_dog_cloud',
    species: 'dog',
    name: 'Cloud the Samoyed Pup',
    rarity: 'epic',
    description: 'Fluffy snow-white smiling puppy who sparkles like freshly fallen frost.',
    spriteKey: 'dog_samoyed',
    gachaWeight: 6,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_capy_sakura',
    species: 'capybara',
    name: 'Sakura the Blossom Capybara',
    rarity: 'epic',
    description: 'Rare spring capybara adorned with blooming sakura petals.',
    spriteKey: 'capy_sakura',
    gachaWeight: 6,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  },
  {
    petDefinitionId: 'pet_cat_luna',
    species: 'cat',
    name: 'Luna the Starlight Cat',
    rarity: 'legendary',
    description: 'Mythic lavender-blue stargazing cat said to bless midnight scholars.',
    spriteKey: 'cat_starlight',
    gachaWeight: 3,
    isOwned: false,
    userPetId: null,
    nickname: null,
    duplicateCount: 0,
    placedGardenId: null,
    tileX: null,
    tileY: null,
    acquiredAt: null
  }
];

const FALLBACK_GACHA_STATE: GachaStateDTO = {
  ticketCount: 3,
  xpBalance: 220,
  ticketCost: DEFAULT_BALANCE_CONFIG.pets.gachaTicketCost,
  xpCost: DEFAULT_BALANCE_CONFIG.pets.gachaXpCost,
  pityCounter: 0,
  pityThreshold: DEFAULT_BALANCE_CONFIG.pets.pityRarePlusThreshold,
  rates: { common: 65, rare: 25, epic: 8, legendary: 2 },
  catalog: FALLBACK_PET_CATALOG,
  recentHistory: []
};

export const usePetStore = create<PetStoreState>((set, get) => ({
  gachaState: null,
  weatherMode: 'sunny',
  isAmbientFocusMode: false,
  isLoadingPets: false,
  isRolling: false,
  lastRollResult: null,
  petError: null,
  petBanner: null,

  loadGachaState: async () => {
    const api = window.purrfectAPI;
    if (!api) {
      set((s) => ({
        gachaState: s.gachaState ?? FALLBACK_GACHA_STATE,
        isLoadingPets: false,
        petError: null
      }));
      return;
    }

    set({ isLoadingPets: true, petError: null });
    try {
      const state = await api.pets.getGachaState();
      set({ gachaState: state, isLoadingPets: false });
    } catch (error) {
      set({
        isLoadingPets: false,
        petError: error instanceof Error ? error.message : 'Failed to load pet gacha state.'
      });
    }
  },

  rollGacha: async (currencyType) => {
    const api = window.purrfectAPI;
    set({ isRolling: true, petError: null });

    if (!api) {
      const current = get().gachaState ?? FALLBACK_GACHA_STATE;
      if (currencyType === 'ticket' && current.ticketCount < current.ticketCost) {
        set({ isRolling: false, petError: 'Not enough Pet Companion Tickets.' });
        return;
      }
      if (currencyType === 'xp' && current.xpBalance < current.xpCost) {
        set({ isRolling: false, petError: `Need ${current.xpCost} XP to roll.` });
        return;
      }

      const nextTickets =
        currencyType === 'ticket' ? current.ticketCount - current.ticketCost : current.ticketCount;
      let nextXp =
        currencyType === 'xp' ? current.xpBalance - current.xpCost : current.xpBalance;
      const forceRarePlus = current.pityCounter + 1 >= current.pityThreshold;
      const tiers: PetRarity[] = forceRarePlus
        ? ['rare', 'epic', 'legendary']
        : ['common', 'rare', 'epic', 'legendary'];
      const tierSum = tiers.reduce((sum, r) => sum + current.rates[r], 0);
      let roll = Math.random() * tierSum;
      let chosenTier: PetRarity = tiers[tiers.length - 1];
      for (const t of tiers) {
        roll -= current.rates[t];
        if (roll < 0) {
          chosenTier = t;
          break;
        }
      }
      const pool = current.catalog.filter((p) => p.rarity === chosenTier);
      const picked = pool[Math.floor(Math.random() * pool.length)] ?? current.catalog[0];
      const wasDuplicate = picked.isOwned;
      const dupBonus = wasDuplicate ? 25 : 0;
      nextXp += dupBonus;
      const nextPity = picked.rarity === 'common' ? current.pityCounter + 1 : 0;
      const nowIso = new Date().toISOString();

      const updatedCatalog = current.catalog.map((p) =>
        p.petDefinitionId === picked.petDefinitionId
          ? {
              ...p,
              isOwned: true,
              userPetId: p.userPetId ?? `preview-pet-${Date.now()}`,
              duplicateCount: p.duplicateCount + 1,
              acquiredAt: p.acquiredAt ?? nowIso
            }
          : p
      );
      const updatedPet = updatedCatalog.find((p) => p.petDefinitionId === picked.petDefinitionId)!;

      const rollRes: RollGachaResultDTO = {
        pet: updatedPet,
        wasDuplicate,
        duplicateBonusXp: dupBonus,
        pityCounterAfter: nextPity,
        ticketCount: nextTickets,
        newXpBalance: nextXp
      };

      set({
        isRolling: false,
        lastRollResult: rollRes,
        petBanner: wasDuplicate
          ? `Met ${updatedPet.name} again! Duplicate count increased (+${dupBonus} XP bonus).`
          : `Welcome home, ${updatedPet.name}! You can place them in your Garden now.`,
        gachaState: {
          ...current,
          ticketCount: nextTickets,
          xpBalance: nextXp,
          pityCounter: nextPity,
          catalog: updatedCatalog,
          recentHistory: [
            {
              id: `preview-roll-${Date.now()}`,
              currencyType,
              currencySpent: currencyType === 'ticket' ? current.ticketCost : current.xpCost,
              petDefinitionId: updatedPet.petDefinitionId,
              petName: updatedPet.name,
              species: updatedPet.species,
              rarity: updatedPet.rarity,
              spriteKey: updatedPet.spriteKey,
              wasDuplicate,
              pityCounterAfter: nextPity,
              createdAt: nowIso
            },
            ...current.recentHistory.slice(0, 19)
          ]
        }
      });
      return;
    }

    try {
      const res = await api.pets.rollGacha({ currencyType });
      const refreshedState = await api.pets.getGachaState();
      set({
        isRolling: false,
        gachaState: refreshedState,
        lastRollResult: res,
        petBanner: res.wasDuplicate
          ? `Met ${res.pet.name} again! (+${res.duplicateBonusXp} XP bonus)`
          : `Welcome home, ${res.pet.name}! Place your new companion in the Garden anytime.`
      });
      await useAppStore.getState().refreshProgression();
    } catch (error) {
      set({
        isRolling: false,
        petError: error instanceof Error ? error.message : 'Unable to complete Gacha roll.'
      });
    }
  },

  togglePetPlacement: async (userPetId, placed) => {
    const api = window.purrfectAPI;
    set({ petError: null });

    if (!api) {
      const current = get().gachaState;
      if (!current) return;
      const placedCount = current.catalog.filter((p) => p.placedGardenId !== null).length;
      set({
        gachaState: {
          ...current,
          catalog: current.catalog.map((p) =>
            p.userPetId === userPetId
              ? {
                  ...p,
                  placedGardenId: placed ? 'user_garden_starter' : null,
                  tileX: placed ? (placedCount * 2 + 1) % 10 + 1 : null,
                  tileY: placed ? 1 + (placedCount % 4) : null
                }
              : p
          )
        }
      });
      return;
    }

    try {
      await api.pets.updatePlacement({ userPetId, placed });
      const refreshedState = await api.pets.getGachaState();
      set({ gachaState: refreshedState });
    } catch (error) {
      set({
        petError: error instanceof Error ? error.message : 'Unable to update pet placement.'
      });
    }
  },

  updatePetNickname: async (userPetId, nickname) => {
    const api = window.purrfectAPI;
    set({ petError: null });

    if (!api) {
      const current = get().gachaState;
      if (!current) return;
      const trimmed = nickname.trim().slice(0, 24);
      set({
        gachaState: {
          ...current,
          catalog: current.catalog.map((p) =>
            p.userPetId === userPetId ? { ...p, nickname: trimmed || null } : p
          )
        }
      });
      return;
    }

    try {
      await api.pets.updateNickname({ userPetId, nickname });
      const refreshedState = await api.pets.getGachaState();
      set({ gachaState: refreshedState });
    } catch (error) {
      set({
        petError: error instanceof Error ? error.message : 'Unable to update pet nickname.'
      });
    }
  },

  setWeatherMode: (mode) => set({ weatherMode: mode }),
  setAmbientFocusMode: (enabled) => set({ isAmbientFocusMode: enabled }),
  clearRollBanner: () => set({ petBanner: null, lastRollResult: null })
}));

