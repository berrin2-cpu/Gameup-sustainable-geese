/**
 * Zero-dependency Web Audio procedural sound synthesizer for ClimateKaz.
 * Provides authentic procedural equivalents for:
 * - water_splash.wav
 * - plastic_crunch.wav
 * - wind turbine whoosh, task completion chimes, level up fanfares, and cozy acoustic progression.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private bgmPlaying: boolean = false;

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Procedural water_splash.wav
   * Liquid bubble + bandpass noise sweep with resonant dip
   */
  public playWaterSplash() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, t);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    masterGain.connect(ctx.destination);

    // Bubble pop oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(680 + Math.random() * 100, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.4);

    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.4);

    // Water droplet noise splash
    const bufferSize = ctx.sampleRate * 0.45;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.45);
    filter.Q.setValueAtTime(4.0, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.45);
  }

  /**
   * Procedural plastic_crunch.wav
   * High-frequency textured crinkles with rapid random impulses
   */
  public playPlasticCrunch() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.22, t);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    masterGain.connect(ctx.destination);

    // Multiple rapid noise bursts resembling crinkling cellophane / bottle crunch
    const burstCount = 4;
    for (let b = 0; b < burstCount; b++) {
      const offset = b * 0.05 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const bGain = ctx.createGain();
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(1800 + Math.random() * 1200, t + offset);
      osc.frequency.linearRampToValueAtTime(600 + Math.random() * 300, t + offset + 0.08);

      bGain.gain.setValueAtTime(0.3, t + offset);
      bGain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.07);

      osc.connect(bGain);
      bGain.connect(masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.08);
    }
  }

  /**
   * Clean energy wind turbine whoosh
   */
  public playWindWhoosh() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.linearRampToValueAtTime(0.14, t + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    noiseGain.connect(ctx.destination);

    const bufferSize = ctx.sampleRate * 0.8;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.exponentialRampToValueAtTime(650, t + 0.35);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.8);

    noise.connect(filter);
    filter.connect(noiseGain);
    noise.start(t);
    noise.stop(t + 0.8);
  }

  /**
   * Sparkling task complete arpeggio
   */
  public playTaskComplete() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.12, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.36);
    });
  }

  /**
   * Triumphant level up fanfare
   */
  public playLevelUp() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);

      gain.gain.setValueAtTime(0.15, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.48);
    });
  }

  /**
   * Wooden UI click
   */
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Duck footstep waddle sound
   */
  public playWaddle() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 + Math.random() * 40, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.04);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Gentle ambient acoustic background chord progression
   */
  public startAmbientBgm() {
    if (this.bgmPlaying) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.028, ctx.currentTime);
    this.bgmGain.connect(ctx.destination);

    // Warm peaceful pedal point chord (F major 9 / C)
    const freqs = [130.81, 174.61, 220.0, 261.63, 329.63];
    this.bgmOscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      const nodeGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);

      // Gentle tremolo lfo
      nodeGain.gain.setValueAtTime(0.25 / freqs.length, ctx.currentTime);

      osc.connect(nodeGain);
      nodeGain.connect(this.bgmGain!);
      osc.start();
      return osc;
    });

    this.bgmPlaying = true;
  }

  public stopAmbientBgm() {
    this.bgmOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    });
    this.bgmOscs = [];
    this.bgmPlaying = false;
  }
}

export const sounds = new SoundManager();
