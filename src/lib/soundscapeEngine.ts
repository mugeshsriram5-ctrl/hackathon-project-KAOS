// Web Audio API spatial & multi-track ambient soundscape synthesizer

class SoundscapeEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentType: string = '';
  private timer: any = null;

  // Layered volume gains
  private masterGain: GainNode | null = null;
  private activeGains: Record<string, GainNode> = {};
  private activeSources: Record<string, AudioNode> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playTempleBells(volume: number = 0.5) {
    this.stop();
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentType = 'temple';

    const playStrike = () => {
      if (!this.isPlaying || !this.audioCtx || !this.masterGain) return;
      const ctx = this.audioCtx;
      const fundamental = 432;
      const harmonics = [fundamental, fundamental * 1.5, fundamental * 2.04, fundamental * 2.76];

      harmonics.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const duration = 3.5 - idx * 0.5;
        const noteGain = (volume / (idx + 1)) * 0.35;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(noteGain, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      });
    };

    playStrike();
    this.timer = setInterval(playStrike, 4000);
  }

  public playMarinaWaves(volume: number = 0.4) {
    this.stop();
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentType = 'waves';

    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    whiteNoise.start();
    this.activeSources['waves'] = whiteNoise;
  }

  public playFilterCoffee(volume: number = 0.4) {
    this.stop();
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentType = 'coffee';

    const ctx = this.audioCtx;
    const playDrip = () => {
      if (!this.isPlaying || !this.audioCtx || !this.masterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 600 + Math.random() * 400;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    };

    this.timer = setInterval(playDrip, 450);
  }

  public playBelfry(volume: number = 0.4) {
    this.stop();
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentType = 'belfry';

    const playToll = () => {
      if (!this.isPlaying || !this.audioCtx || !this.masterGain) return;
      const ctx = this.audioCtx;
      const fundamental = 261.63;

      [fundamental, fundamental * 1.25, fundamental * 1.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const duration = 4.0;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime((volume / (idx + 1)) * 0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      });
    };

    playToll();
    this.timer = setInterval(playToll, 5000);
  }

  public playSuccessTone() {
    this.initContext();
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  public stop() {
    this.isPlaying = false;
    this.currentType = '';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    Object.keys(this.activeSources).forEach((key) => {
      try {
        (this.activeSources[key] as any).stop?.();
        this.activeSources[key].disconnect();
      } catch {}
    });
    this.activeSources = {};
  }

  public getActiveType(): string {
    return this.isPlaying ? this.currentType : '';
  }
}

export const soundscapes = new SoundscapeEngine();
