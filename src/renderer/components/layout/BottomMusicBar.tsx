import { Music, Pause, Play, SkipForward, Sliders, Volume2 } from 'lucide-react';
import { COZY_TRACK_CATALOG } from '../../services/audioEngine';
import { useAppStore } from '../../stores/useAppStore';
import { useMusicStore } from '../../stores/useMusicStore';

export function BottomMusicBar() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const preferences = useMusicStore((s) => s.preferences);
  const togglePlay = useMusicStore((s) => s.togglePlay);
  const nextTrack = useMusicStore((s) => s.nextTrack);
  const setMasterVolume = useMusicStore((s) => s.setMasterVolume);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const currentTrack =
    COZY_TRACK_CATALOG.find((t) => t.id === preferences.activePlaylistId) ??
    COZY_TRACK_CATALOG[0];

  const activeAmbientCount = Object.values(preferences.ambienceMix).filter(
    (vol) => vol > 0.01
  ).length;

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-4 border-t border-cozy-border bg-cozy-panel/95 px-6">
      {/* Play Controls & Track Title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cozy-sage text-white shadow-pixel-sm transition hover:bg-cozy-sage-dark"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => void nextTrack()}
          aria-label="Next track"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cozy-border bg-cozy-cream text-cozy-wood transition hover:bg-white"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Music className="h-3.5 w-3.5 shrink-0 text-cozy-sage-dark" />
            <p className="truncate text-xs font-semibold text-cozy-wood">
              {currentTrack.title}
            </p>
            <span className="rounded-full bg-cozy-meadow px-2 py-0.5 text-[10px] font-bold text-cozy-sage-dark">
              {currentTrack.category}
            </span>
          </div>
          <p className="text-[11px] text-cozy-muted">
            {isPlaying ? 'Playing softly' : 'Paused'}
            {activeAmbientCount > 0 ? ` · ${activeAmbientCount} ambient layers active` : ''}
          </p>
        </div>
      </div>

      {/* Volume Slider & Open Full Mixer */}
      <div className="flex shrink-0 items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-cozy-muted">
          <Volume2 className="h-4 w-4 text-cozy-sage-dark" />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(preferences.masterVolume * 100)}
            onChange={(e) => void setMasterVolume(Number(e.target.value) / 100)}
            aria-label="Master volume"
            className="h-1.5 w-24 cursor-pointer accent-cozy-sage"
          />
          <span className="w-8 font-mono text-[11px] font-semibold text-cozy-wood">
            {Math.round(preferences.masterVolume * 100)}%
          </span>
        </label>

        <button
          type="button"
          onClick={() => setActiveSection('music')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cozy-border bg-cozy-cream px-3 py-1.5 text-xs font-semibold text-cozy-wood transition hover:bg-white"
        >
          <Sliders className="h-3.5 w-3.5 text-cozy-sage-dark" />
          <span>Mixer</span>
        </button>
      </div>
    </footer>
  );
}
