import { Heart, Music, Pause, Play, Shuffle, Sliders, Volume2 } from 'lucide-react';
import { AMBIENT_LAYERS, COZY_TRACK_CATALOG } from '../services/audioEngine';
import { useMusicStore } from '../stores/useMusicStore';

export function MusicView() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const preferences = useMusicStore((s) => s.preferences);
  const musicError = useMusicStore((s) => s.musicError);
  const togglePlay = useMusicStore((s) => s.togglePlay);
  const selectTrack = useMusicStore((s) => s.selectTrack);
  const toggleFavorite = useMusicStore((s) => s.toggleFavorite);
  const setMasterVolume = useMusicStore((s) => s.setMasterVolume);
  const setAmbientVolume = useMusicStore((s) => s.setAmbientVolume);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const toggleFadeOutOnSessionEnd = useMusicStore((s) => s.toggleFadeOutOnSessionEnd);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cozy-meadow px-3 py-1 text-xs font-semibold text-cozy-sage-dark">
            <Music className="h-3.5 w-3.5" />
            Study Soundscapes &amp; Ambient Mixer
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
            Cozy Focus Music &amp; Nature Layers
          </h2>
        </div>

        <button type="button" onClick={togglePlay} className="cozy-btn-primary">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? 'Pause Music' : 'Play Music'}</span>
        </button>
      </header>

      {musicError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {musicError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Track Selector Card */}
        <section className="cozy-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cozy-wood">Cozy Playlists &amp; Tracks</h3>
            <button
              type="button"
              onClick={() => void toggleShuffle()}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                preferences.shuffleEnabled
                  ? 'border-cozy-sage bg-cozy-meadow text-cozy-sage-dark'
                  : 'border-cozy-border bg-cozy-cream text-cozy-muted'
              }`}
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Shuffle {preferences.shuffleEnabled ? 'On' : 'Off'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {COZY_TRACK_CATALOG.map((track) => {
              const isSelected = preferences.activePlaylistId === track.id;
              const isFav = preferences.favoriteTrackIds.includes(track.id);
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                    isSelected
                      ? 'border-cozy-sage bg-cozy-meadow/60'
                      : 'border-cozy-border bg-cozy-cream/70 hover:bg-cozy-panel/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void selectTrack(track.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        isSelected && isPlaying
                          ? 'bg-cozy-sage text-white'
                          : 'bg-white text-cozy-sage-dark'
                      }`}
                    >
                      {isSelected && isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-cozy-wood">{track.title}</p>
                      <p className="text-[11px] text-cozy-muted">{track.category}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void toggleFavorite(track.id)}
                    aria-label={`Favorite ${track.title}`}
                    className={`rounded-lg p-1.5 transition ${
                      isFav ? 'text-cozy-peach' : 'text-cozy-muted hover:text-cozy-peach'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-cozy-border/70 pt-4 text-xs">
            <label className="flex items-center justify-between gap-3 font-semibold text-cozy-wood">
              <span className="inline-flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-cozy-sage-dark" />
                Master Volume
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(preferences.masterVolume * 100)}
                  onChange={(e) => void setMasterVolume(Number(e.target.value) / 100)}
                  className="h-1.5 w-28 cursor-pointer accent-cozy-sage"
                />
                <span className="w-9 text-right font-mono">
                  {Math.round(preferences.masterVolume * 100)}%
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-2 font-medium text-cozy-wood">
              <input
                type="checkbox"
                checked={preferences.fadeOutOnSessionEnd}
                onChange={() => void toggleFadeOutOnSessionEnd()}
                className="h-4 w-4 accent-cozy-sage"
              />
              Automatically fade out audio when a focus session completes
            </label>
          </div>
        </section>

        {/* 4-Channel Ambient Soundscape Mixer */}
        <section className="cozy-card space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cozy-sage-dark" />
            <h3 className="text-sm font-bold text-cozy-wood">
              Ambient Soundscape Mixer
            </h3>
          </div>
          <p className="text-xs text-cozy-muted">
            Combine nature layers freely on top of your focus music. Settings save automatically
            to local SQLite.
          </p>

          <div className="space-y-4 pt-1">
            {AMBIENT_LAYERS.map((layer) => {
              const level = preferences.ambienceMix[layer.id] ?? 0;
              const pct = Math.round(level * 100);
              return (
                <div
                  key={layer.id}
                  className="rounded-xl border border-cozy-border bg-cozy-cream/70 p-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-cozy-wood">{layer.label}</p>
                      <p className="text-[11px] text-cozy-muted">{layer.description}</p>
                    </div>
                    <span className="font-mono font-bold text-cozy-sage-dark">{pct}%</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pct}
                    aria-label={`${layer.label} volume`}
                    onChange={(e) =>
                      void setAmbientVolume(layer.id, Number(e.target.value) / 100)
                    }
                    className="mt-3 h-1.5 w-full cursor-pointer accent-cozy-sage"
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

