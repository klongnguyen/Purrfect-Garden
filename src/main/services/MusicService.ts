import type Database from 'better-sqlite3';
import type {
  AmbientLayerId,
  MusicPreferencesDTO,
  UpdateMusicPreferencesInput
} from '@shared/types/domain';

interface MusicPrefRow {
  active_playlist_id: string | null;
  master_volume: number;
  shuffle_enabled: number;
  fade_out_on_session_end: number;
  ambience_mix_json: string;
  favorite_track_ids_json: string;
  updated_at: string;
}

const DEFAULT_AMBIENCE_MIX: Record<AmbientLayerId, number> = {
  rain: 0,
  fireplace: 0,
  forest: 0,
  ocean: 0
};

const AMBIENT_KEYS: readonly AmbientLayerId[] = ['rain', 'fireplace', 'forest', 'ocean'];

export class MusicService {
  constructor(private readonly db: Database.Database) {}

  getMusicPreferences(): MusicPreferencesDTO {
    const row = this.db
      .prepare('SELECT * FROM music_preferences WHERE id = 1')
      .get() as MusicPrefRow | undefined;

    if (!row) {
      throw new Error('Music preferences row (id=1) is missing. Run migrations first.');
    }

    return mapMusicPreferencesRow(row);
  }

  updateMusicPreferences(input: UpdateMusicPreferencesInput): MusicPreferencesDTO {
    const current = this.getMusicPreferences();

    const nextMasterVolume =
      input.masterVolume !== undefined ? input.masterVolume : current.masterVolume;
    assertUnitRange(nextMasterVolume, 'masterVolume');

    const nextAmbienceMix: Record<AmbientLayerId, number> = { ...current.ambienceMix };
    if (input.ambienceMix) {
      for (const layer of AMBIENT_KEYS) {
        const val = input.ambienceMix[layer];
        if (val !== undefined) {
          assertUnitRange(val, `ambienceMix.${layer}`);
          nextAmbienceMix[layer] = val;
        }
      }
    }

    const nextActivePlaylistId =
      input.activePlaylistId !== undefined
        ? input.activePlaylistId
        : current.activePlaylistId;
    const nextShuffle =
      input.shuffleEnabled !== undefined ? input.shuffleEnabled : current.shuffleEnabled;
    const nextFadeOut =
      input.fadeOutOnSessionEnd !== undefined
        ? input.fadeOutOnSessionEnd
        : current.fadeOutOnSessionEnd;
    const nextFavorites =
      input.favoriteTrackIds !== undefined
        ? [...new Set(input.favoriteTrackIds)]
        : current.favoriteTrackIds;

    const nowIso = new Date().toISOString();

    this.db
      .prepare(
        `
        UPDATE music_preferences
        SET
          active_playlist_id = ?,
          master_volume = ?,
          shuffle_enabled = ?,
          fade_out_on_session_end = ?,
          ambience_mix_json = ?,
          favorite_track_ids_json = ?,
          updated_at = ?
        WHERE id = 1
      `
      )
      .run(
        nextActivePlaylistId,
        nextMasterVolume,
        nextShuffle ? 1 : 0,
        nextFadeOut ? 1 : 0,
        JSON.stringify(nextAmbienceMix),
        JSON.stringify(nextFavorites),
        nowIso
      );

    return this.getMusicPreferences();
  }
}

function mapMusicPreferencesRow(row: MusicPrefRow): MusicPreferencesDTO {
  let parsedMix: Partial<Record<AmbientLayerId, number>> = {};
  try {
    parsedMix = JSON.parse(row.ambience_mix_json) as Partial<Record<AmbientLayerId, number>>;
  } catch {
    parsedMix = {};
  }

  let parsedFavorites: string[] = [];
  try {
    const arr = JSON.parse(row.favorite_track_ids_json) as unknown;
    if (Array.isArray(arr)) {
      parsedFavorites = arr.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    parsedFavorites = [];
  }

  return {
    activePlaylistId: row.active_playlist_id ?? 'lofi_meadow',
    masterVolume: row.master_volume,
    shuffleEnabled: row.shuffle_enabled === 1,
    fadeOutOnSessionEnd: row.fade_out_on_session_end === 1,
    ambienceMix: {
      rain: parsedMix.rain ?? DEFAULT_AMBIENCE_MIX.rain,
      fireplace: parsedMix.fireplace ?? DEFAULT_AMBIENCE_MIX.fireplace,
      forest: parsedMix.forest ?? DEFAULT_AMBIENCE_MIX.forest,
      ocean: parsedMix.ocean ?? DEFAULT_AMBIENCE_MIX.ocean
    },
    favoriteTrackIds: parsedFavorites,
    updatedAt: row.updated_at
  };
}

function assertUnitRange(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between 0.0 and 1.0.`);
  }
}

