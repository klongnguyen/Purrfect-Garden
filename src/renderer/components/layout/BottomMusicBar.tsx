import { COZY_TRACK_CATALOG } from '../../services/audioEngine';
import { useAppStore } from '../../stores/useAppStore';
import { useMusicStore } from '../../stores/useMusicStore';
import { PixelIcon } from '../ui/PixelIcon';

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
    <footer
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-t-[4px] border-[#2B160B] bg-[#7A4728] px-5 text-[#FFF4DC]"
      style={{
        boxShadow: 'inset 0px 2px 0px #A3643D'
      }}
    >
      {/* Play Controls & Track Title */}
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          className="cozy-btn-primary h-9 w-9 p-0"
        >
          <PixelIcon name={isPlaying ? 'pause' : 'play'} size={16} />
        </button>

        <button
          type="button"
          onClick={() => void nextTrack()}
          aria-label="Next track"
          className="cozy-btn-secondary h-9 w-9 p-0"
        >
          <PixelIcon name="skip" size={14} />
        </button>

        <div className="min-w-0 pl-1">
          <div className="flex items-center gap-2">
            <PixelIcon name="music" size={14} className="text-[#F5CE86]" />
            <p className="truncate text-xs font-bold uppercase tracking-wide text-[#FFF7E2]">
              {currentTrack.title}
            </p>
            <span className="border border-[#2B160B] bg-[#5E9A4E] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              {currentTrack.category}
            </span>
          </div>
          <p className="text-[11px] text-[#EAD2B0]">
            {isPlaying ? 'Playing softly' : 'Paused'}
            {activeAmbientCount > 0 ? ` · ${activeAmbientCount} ambient layers active` : ''}
          </p>
        </div>
      </div>

      {/* Volume Slider & Open Full Mixer */}
      <div className="flex shrink-0 items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-[#FFF4DC]">
          <PixelIcon name="volume" size={16} className="text-[#F5CE86]" />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(preferences.masterVolume * 100)}
            onChange={(e) => void setMasterVolume(Number(e.target.value) / 100)}
            aria-label="Master volume"
            className="w-24"
          />
          <span className="w-9 text-right text-[11px] font-bold text-[#FFF7E2]">
            {Math.round(preferences.masterVolume * 100)}%
          </span>
        </label>

        <button
          type="button"
          onClick={() => setActiveSection('music')}
          className="cozy-btn-secondary py-1.5 text-xs"
        >
          <PixelIcon name="settings" size={14} />
          <span>Mixer</span>
        </button>
      </div>
    </footer>
  );
}
