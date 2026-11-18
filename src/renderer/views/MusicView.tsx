import { AMBIENT_LAYERS, COZY_TRACK_CATALOG } from '../services/audioEngine';
import { useMusicStore } from '../stores/useMusicStore';
import { PixelIcon } from '../components/ui/PixelIcon';

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
          <span className="pixel-pill">
            <PixelIcon name="music" size={14} />
            Study Soundscapes &amp; Ambient Mixer
          </span>
          <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
            Cozy Focus Music &amp; Nature Layers
          </h2>
        </div>

        <button type="button" onClick={togglePlay} className="cozy-btn-primary">
          <PixelIcon name={isPlaying ? 'pause' : 'play'} size={14} />
          <span>{isPlaying ? 'Pause Music' : 'Play Music'}</span>
        </button>
      </header>

      {musicError && (
        <div className="border-2 border-[#3D2112] bg-[#F5B7A3] px-4 py-2.5 text-xs font-bold text-[#24140B]">
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
              className={preferences.shuffleEnabled ? 'cozy-btn-primary py-1' : 'cozy-btn-secondary py-1'}
            >
              <PixelIcon name="shuffle" size={14} />
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
                      className={`flex h-7 w-7 items-center justify-center border border-[#3D2112] ${
                        isSelected && isPlaying
                          ? 'bg-cozy-sage text-white'
                          : 'bg-white text-cozy-sage-dark'
                      }`}
                    >
                      <PixelIcon name={isSelected && isPlaying ? 'pause' : 'play'} size={14} />
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
                    className={`p-1.5 transition ${
                      isFav ? 'text-[#D95B34]' : 'text-cozy-muted hover:text-[#D95B34]'
                    }`}
                  >
                    <PixelIcon name="heart" size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 border-t-2 border-cozy-border/50 pt-4 text-xs">
            <label className="flex items-center justify-between gap-3 font-semibold text-cozy-wood">
              <span className="inline-flex items-center gap-1.5">
                <PixelIcon name="volume" size={14} className="text-cozy-sage-dark" />
                Master Volume
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(preferences.masterVolume * 100)}
                  onChange={(e) => void setMasterVolume(Number(e.target.value) / 100)}
                  className="w-28"
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
            <PixelIcon name="settings" size={16} className="text-cozy-sage-dark" />
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

