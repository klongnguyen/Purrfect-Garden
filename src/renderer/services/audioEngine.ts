import type { AmbientLayerId } from '@shared/types/domain';

export interface CozyTrackDefinition {
  id: string;
  title: string;
  category: 'Lo-fi' | 'Piano' | 'Nature';
  tempoMs: number;
  notesHz: readonly number[];
}

export interface AmbientLayerDefinition {
  id: AmbientLayerId;
  label: string;
  description: string;
}

export const COZY_TRACK_CATALOG: readonly CozyTrackDefinition[] = [
  {
    id: 'lofi_meadow',
    title: 'Sunlit Meadow Lo-fi',
    category: 'Lo-fi',
    tempoMs: 900,
    notesHz: [261.63, 329.63, 392.0, 493.88, 392.0, 329.63]
  },
  {
    id: 'lofi_rainy_window',
    title: 'Rainy Window Study',
    category: 'Lo-fi',
    tempoMs: 1100,
    notesHz: [220.0, 261.63, 329.63, 392.0, 329.63, 293.66]
  },
  {
    id: 'piano_morning_dew',
    title: 'Morning Dew Piano',
    category: 'Piano',
    tempoMs: 850,
    notesHz: [293.66, 349.23, 440.0, 523.25, 440.0, 349.23]
  },
  {
    id: 'piano_starlight',
    title: 'Starlight Nocturne',
    category: 'Piano',
    tempoMs: 1200,
    notesHz: [246.94, 293.66, 369.99, 440.0, 369.99, 293.66]
  },
  {
    id: 'nature_breeze',
    title: 'Peaceful Garden Breeze',
    category: 'Nature',
    tempoMs: 1350,
    notesHz: [261.63, 293.66, 329.63, 392.0, 440.0, 392.0]
  }
];

export const AMBIENT_LAYERS: readonly AmbientLayerDefinition[] = [
  { id: 'rain', label: 'Soft Rain', description: 'Gentle rainfall on greenhouse glass' },
  { id: 'fireplace', label: 'Warm Fireplace', description: 'Low crackle of cozy hearth embers' },
  { id: 'forest', label: 'Forest Ambience', description: 'Breeze rustling through sunlit leaves' },
  { id: 'ocean', label: 'Ocean Waves', description: 'Slow rolling coastal tides' }
];

interface NoiseChannelNodes {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private noteIndex = 0;
  private ambientNodes = new Map<AmbientLayerId, NoiseChannelNodes>();

  private currentPlaying = false;
  private currentTrackId = 'lofi_meadow';
  private currentMasterVolume = 0.7;
  private currentAmbienceMix: Record<AmbientLayerId, number> = {
    rain: 0,
    fireplace: 0,
    forest: 0,
    ocean: 0
  };

  syncState(params: {
    isPlaying: boolean;
    activeTrackId: string;
    masterVolume: number;
    ambienceMix: Record<AmbientLayerId, number>;
  }): void {
    this.currentPlaying = params.isPlaying;
    this.currentTrackId = params.activeTrackId;
    this.currentMasterVolume = params.masterVolume;
    this.currentAmbienceMix = { ...params.ambienceMix };

    const anyAudioActive =
      params.isPlaying || Object.values(params.ambienceMix).some((vol) => vol > 0.01);

    if (!anyAudioActive && !this.ctx) {
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || !this.masterGain) {
      return;
    }

    if (ctx.state === 'suspended' && anyAudioActive) {
      void ctx.resume().catch(() => {});
    }

    this.masterGain.gain.setTargetAtTime(params.masterVolume, ctx.currentTime, 0.08);
    this.syncMusicLoop();
    this.syncAmbientLayers(ctx);
  }

  fadeOutAll(durationMs = 1500, onFadeComplete?: () => void): void {
    if (!this.ctx || !this.masterGain) {
      this.stopMusicLoop();
      onFadeComplete?.();
      return;
    }

    const now = this.ctx.currentTime;
    const durationSec = Math.max(0.1, durationMs / 1000);
    this.masterGain.gain.setTargetAtTime(0, now, durationSec / 3);

    setTimeout(() => {
      this.stopMusicLoop();
      for (const node of this.ambientNodes.values()) {
        node.gain.gain.setValueAtTime(0, this.ctx?.currentTime ?? 0);
      }
      onFadeComplete?.();
    }, durationMs);
  }

  private ensureAudioContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentMasterVolume;
      this.masterGain.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      this.ctx = null;
      this.masterGain = null;
      return null;
    }
  }

  private syncMusicLoop(): void {
    this.stopMusicLoop();
    if (!this.currentPlaying || !this.ctx || !this.masterGain) {
      return;
    }

    const track =
      COZY_TRACK_CATALOG.find((t) => t.id === this.currentTrackId) ?? COZY_TRACK_CATALOG[0];

    this.playSoftNote(track.notesHz[this.noteIndex % track.notesHz.length], track.category);
    this.noteIndex += 1;

    this.musicTimer = setInterval(() => {
      if (!this.currentPlaying || !this.ctx) return;
      const freq = track.notesHz[this.noteIndex % track.notesHz.length];
      this.playSoftNote(freq, track.category);
      this.noteIndex += 1;
    }, track.tempoMs);
  }

  private stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playSoftNote(freqHz: number, category: CozyTrackDefinition['category']): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const env = this.ctx.createGain();

    osc.type = category === 'Piano' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freqHz, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(category === 'Lo-fi' ? 750 : 1200, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.08, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.95);
  }

  private syncAmbientLayers(ctx: AudioContext): void {
    if (!this.masterGain) return;

    for (const layer of AMBIENT_LAYERS) {
      const targetVol = this.currentAmbienceMix[layer.id] ?? 0;
      let existing = this.ambientNodes.get(layer.id);

      if (targetVol > 0.01 && !existing) {
        existing = this.createAmbientChannel(ctx, layer.id);
        this.ambientNodes.set(layer.id, existing);
      }

      if (existing) {
        existing.gain.gain.setTargetAtTime(targetVol * 0.25, ctx.currentTime, 0.12);
      }
    }
  }

  private createAmbientChannel(
    ctx: AudioContext,
    layerId: AmbientLayerId
  ): NoiseChannelNodes {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = layerId === 'rain' ? white * 0.35 : lastOut * 2.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = layerId === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value =
      layerId === 'rain'
        ? 1100
        : layerId === 'fireplace'
          ? 420
          : layerId === 'forest'
            ? 650
            : 320;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();

    return { source, gain };
  }
}

export const cozyAudioEngine = new CozyAudioEngine();

