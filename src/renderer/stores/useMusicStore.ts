import { create } from 'zustand';
import type {
  AmbientLayerId,
  MusicPreferencesDTO,
  UpdateMusicPreferencesInput
} from '@shared/types/domain';
import { COZY_TRACK_CATALOG, cozyAudioEngine } from '../services/audioEngine';

const DEFAULT_PREFERENCES: MusicPreferencesDTO = {
  activePlaylistId: 'lofi_meadow',
  masterVolume: 0.7,
  shuffleEnabled: false,
  fadeOutOnSessionEnd: true,
  ambienceMix: {
    rain: 0,
    fireplace: 0,
    forest: 0,
    ocean: 0
  },
  favoriteTrackIds: [],
  updatedAt: new Date().toISOString()
};

interface MusicStoreState {
  isPlaying: boolean;
  preferences: MusicPreferencesDTO;
  isLoadingMusic: boolean;
  musicError: string | null;
  loadMusicPreferences: () => Promise<void>;
  togglePlay: () => void;
  selectTrack: (trackId: string) => Promise<void>;
  nextTrack: () => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  setMasterVolume: (volume: number) => Promise<void>;
  setAmbientVolume: (layerId: AmbientLayerId, volume: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  toggleFadeOutOnSessionEnd: () => Promise<void>;
  handleSessionCompleted: () => void;
}

export const useMusicStore = create<MusicStoreState>((set, get) => ({
  isPlaying: false,
  preferences: DEFAULT_PREFERENCES,
  isLoadingMusic: false,
  musicError: null,

  loadMusicPreferences: async () => {
    const api = window.purrfectAPI;
    if (!api) return;

    set({ isLoadingMusic: true, musicError: null });
    try {
      const preferences = await api.music.getPreferences();
      set({ isLoadingMusic: false, preferences });
      syncAudio(get().isPlaying, preferences);
    } catch (error) {
      set({
        isLoadingMusic: false,
        musicError:
          error instanceof Error ? error.message : 'Failed to load music preferences.'
      });
    }
  },

  togglePlay: () => {
    const nextPlaying = !get().isPlaying;
    set({ isPlaying: nextPlaying });
    syncAudio(nextPlaying, get().preferences);
  },

  selectTrack: async (trackId) => {
    set({ isPlaying: true });
    await persistMusicUpdate(set, get, { activePlaylistId: trackId });
  },

  nextTrack: async () => {
    const { preferences } = get();
    const currentIndex = COZY_TRACK_CATALOG.findIndex(
      (t) => t.id === preferences.activePlaylistId
    );

    let nextIndex = (currentIndex + 1) % COZY_TRACK_CATALOG.length;
    if (preferences.shuffleEnabled && COZY_TRACK_CATALOG.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * COZY_TRACK_CATALOG.length);
      } while (nextIndex === currentIndex);
    }

    const nextTrack = COZY_TRACK_CATALOG[nextIndex];
    set({ isPlaying: true });
    await persistMusicUpdate(set, get, { activePlaylistId: nextTrack.id });
  },

  toggleFavorite: async (trackId) => {
    const current = get().preferences.favoriteTrackIds;
    const next = current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId];
    await persistMusicUpdate(set, get, { favoriteTrackIds: next });
  },

  setMasterVolume: async (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    await persistMusicUpdate(set, get, { masterVolume: clamped });
  },

  setAmbientVolume: async (layerId, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    await persistMusicUpdate(set, get, {
      ambienceMix: { [layerId]: clamped }
    });
  },

  toggleShuffle: async () => {
    await persistMusicUpdate(set, get, {
      shuffleEnabled: !get().preferences.shuffleEnabled
    });
  },

  toggleFadeOutOnSessionEnd: async () => {
    await persistMusicUpdate(set, get, {
      fadeOutOnSessionEnd: !get().preferences.fadeOutOnSessionEnd
    });
  },

  handleSessionCompleted: () => {
    const { isPlaying, preferences } = get();
    if (!isPlaying || !preferences.fadeOutOnSessionEnd) return;

    cozyAudioEngine.fadeOutAll(1500, () => {
      set({ isPlaying: false });
    });
  }
}));

async function persistMusicUpdate(
  set: (
    partial:
      | Partial<MusicStoreState>
      | ((state: MusicStoreState) => Partial<MusicStoreState>)
  ) => void,
  get: () => MusicStoreState,
  input: UpdateMusicPreferencesInput
): Promise<void> {
  const prev = get().preferences;
  const optimistic: MusicPreferencesDTO = {
    ...prev,
    ...input,
    ambienceMix: {
      ...prev.ambienceMix,
      ...(input.ambienceMix ?? {})
    },
    updatedAt: new Date().toISOString()
  };

  set({ preferences: optimistic, musicError: null });
  syncAudio(get().isPlaying, optimistic);

  const api = window.purrfectAPI;
  if (!api) return;

  try {
    const saved = await api.music.updatePreferences(input);
    set({ preferences: saved });
  } catch (error) {
    set({
      musicError:
        error instanceof Error ? error.message : 'Failed to save music preferences.'
    });
  }
}

function syncAudio(isPlaying: boolean, preferences: MusicPreferencesDTO): void {
  cozyAudioEngine.syncState({
    isPlaying,
    activeTrackId: preferences.activePlaylistId,
    masterVolume: preferences.masterVolume,
    ambienceMix: preferences.ambienceMix
  });
}

