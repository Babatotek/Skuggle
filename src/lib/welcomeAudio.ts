/**
 * Skuggle Web Audio Sound Engine
 * Synthesizes institutional, warm, premium harmonic chimes and transitions
 * without requiring external audio files.
 */

class WelcomeAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction or trigger
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /** Expose shared AudioContext for other short UI cues. */
  public acquireContext(): AudioContext | null {
    return this.getContext();
  }

  /**
   * Phase 1 (0.0s): Logo reveal harmonic chord (Warm F-Maj9 or Eb-Maj9 institutional swell)
   */
  public playLogoRevealChord(primaryColorHex?: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Base frequencies for a warm major chord: F3 (174.61Hz), C4 (261.63Hz), A4 (440Hz), G5 (783.99Hz)
      const freqs = [174.61, 261.63, 349.23, 440.0, 659.25];

      // Master gain node for the chord
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      masterGain.connect(ctx.destination);

      // Low-pass filter for smooth institutional warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.5);
      filter.frequency.exponentialRampToValueAtTime(600, now + 1.8);
      filter.connect(masterGain);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Use sine and warm triangle waveforms
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Slight detune for rich choral spread
        osc.detune.setValueAtTime((idx - 2) * 4, now);

        const volume = idx === 0 ? 0.4 : 0.25 / (idx + 1);
        oscGain.gain.setValueAtTime(volume, now);

        osc.connect(oscGain);
        oscGain.connect(filter);

        osc.start(now + idx * 0.03);
        osc.stop(now + 1.8);
      });
    } catch {
      // Graceful fallback if audio context blocked
    }
  }

  /**
   * Phase 2 (0.6s): School Name Reveal Shimmer (Crystal harmonic chime)
   */
  public playSchoolNameShimmer() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High delicate chime tones: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz), B6 (1975.5Hz)
      const shimmerNotes = [1046.5, 1318.5, 1567.98, 2093.0];

      shimmerNotes.forEach((freq, i) => {
        const noteTime = now + (i * 0.07);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.06, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.75);
      });
    } catch {
      // Silent fail safe
    }
  }

  /**
   * Phase 3 (1.8s): Transition into Login Stage (Soft resonant air sweep & bell)
   */
  public playLoginTransitionWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Soft bell tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.35); // E5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Silent fail safe
    }
  }

  /**
   * Phase 4: Sign-in Success Chime
   */
  public playAuthSuccessSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

      notes.forEach((freq, idx) => {
        const noteTime = now + (idx * 0.08);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.95);
      });
    } catch {
      // Silent fail safe
    }
  }
}

export const welcomeAudio = new WelcomeAudioEngine();
