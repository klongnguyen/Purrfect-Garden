import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabaseConnection } from '../../src/main/database/connection';
import { runMigrations } from '../../src/main/database/migrator';
import { MusicService } from '../../src/main/services/MusicService';

describe('MusicService', () => {
  let db: Database.Database;
  let musicService: MusicService;

  beforeEach(() => {
    db = createDatabaseConnection(':memory:');
    runMigrations(db);
    musicService = new MusicService(db);
  });

  afterEach(() => {
    db.close();
  });

  it('returns default music and ambient mixer preferences', () => {
    const prefs = musicService.getMusicPreferences();
    expect(prefs.activePlaylistId).toBe('lofi_meadow');
    expect(prefs.masterVolume).toBe(0.7);
    expect(prefs.shuffleEnabled).toBe(false);
    expect(prefs.fadeOutOnSessionEnd).toBe(true);
    expect(prefs.ambienceMix).toEqual({
      rain: 0,
      fireplace: 0,
      forest: 0,
      ocean: 0
    });
    expect(prefs.favoriteTrackIds).toEqual([]);
  });

  it('persists playlist, volume, shuffle, fadeOut, favorites, and ambient mix updates', () => {
    const updated = musicService.updateMusicPreferences({
      activePlaylistId: 'piano_morning_dew',
      masterVolume: 0.45,
      shuffleEnabled: true,
      fadeOutOnSessionEnd: false,
      ambienceMix: { rain: 0.6, fireplace: 0.3 },
      favoriteTrackIds: ['piano_morning_dew', 'lofi_meadow']
    });

    expect(updated.activePlaylistId).toBe('piano_morning_dew');
    expect(updated.masterVolume).toBe(0.45);
    expect(updated.shuffleEnabled).toBe(true);
    expect(updated.fadeOutOnSessionEnd).toBe(false);
    expect(updated.ambienceMix).toEqual({
      rain: 0.6,
      fireplace: 0.3,
      forest: 0,
      ocean: 0
    });
    expect(updated.favoriteTrackIds).toEqual(['piano_morning_dew', 'lofi_meadow']);

    const reloaded = musicService.getMusicPreferences();
    expect(reloaded.activePlaylistId).toBe('piano_morning_dew');
    expect(reloaded.ambienceMix.rain).toBe(0.6);
  });

  it('rejects out-of-range volume inputs', () => {
    expect(() => musicService.updateMusicPreferences({ masterVolume: 1.5 })).toThrow();
    expect(() =>
      musicService.updateMusicPreferences({ ambienceMix: { ocean: -0.1 } })
    ).toThrow();
  });
});

