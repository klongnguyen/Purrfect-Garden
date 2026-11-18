import { Music, Volume2 } from 'lucide-react';

export function BottomMusicBar() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between border-t border-cozy-border bg-cozy-panel/95 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cozy-border bg-cozy-cream text-cozy-sage-dark">
          <Music className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-cozy-wood">
            Cozy Ambience &amp; Lo-fi Player
          </p>
          <p className="text-[11px] text-cozy-muted">
            Audio Mixer Shell — Playback &amp; soundscapes scheduled for Milestone M1.6
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-cozy-muted">
        <span className="rounded-full border border-cozy-border bg-cozy-cream px-3 py-1 font-medium text-cozy-wood">
          Local-First Offline Audio Ready
        </span>
        <Volume2 className="h-4 w-4 text-cozy-sage-dark" />
      </div>
    </footer>
  );
}

