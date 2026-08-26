/**
 * Action-outcome audio: short success / error / soft click cues.
 * Shares AudioContext with welcomeAudio (no external assets).
 */
import { welcomeAudio } from './welcomeAudio';

export type ActionTone = 'success' | 'error' | 'info' | 'warning' | 'click';

class ActionAudioEngine {
  setMuted(muted: boolean) {
    welcomeAudio.setMuted(muted);
  }

  getIsMuted() {
    return welcomeAudio.getIsMuted();
  }

  playClick() {
    this.playSequence(
      [{ f: 720, d: 0.05, g: 0.045, type: 'triangle' }],
      0,
    );
  }

  playSuccess() {
    this.playSequence(
      [
        { f: 523.25, d: 0.12, g: 0.07, type: 'sine' },
        { f: 659.25, d: 0.14, g: 0.08, type: 'sine' },
        { f: 783.99, d: 0.22, g: 0.07, type: 'triangle' },
      ],
      0.07,
    );
  }

  playError() {
    this.playSequence(
      [
        { f: 220, d: 0.14, g: 0.075, type: 'sawtooth' },
        { f: 185, d: 0.2, g: 0.065, type: 'triangle' },
      ],
      0.09,
    );
  }

  playInfo() {
    this.playSequence(
      [
        { f: 440, d: 0.1, g: 0.05, type: 'sine' },
        { f: 554.37, d: 0.14, g: 0.05, type: 'sine' },
      ],
      0.06,
    );
  }

  playWarning() {
    this.playSequence(
      [
        { f: 392, d: 0.1, g: 0.055, type: 'triangle' },
        { f: 311.13, d: 0.16, g: 0.055, type: 'triangle' },
      ],
      0.08,
    );
  }

  playTone(tone: ActionTone) {
    switch (tone) {
      case 'success':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'warning':
        this.playWarning();
        break;
      case 'click':
        this.playClick();
        break;
      default:
        this.playInfo();
    }
  }

  private playSequence(
    notes: Array<{
      f: number;
      d: number;
      g: number;
      type: OscillatorType;
    }>,
    stagger: number,
  ) {
    const ctx = welcomeAudio.acquireContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      notes.forEach((note, idx) => {
        const t = now + idx * stagger;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type;
        osc.frequency.setValueAtTime(note.f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(note.g, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + note.d + 0.02);
      });
    } catch {
      /* silent fail */
    }
  }
}

export const actionAudio = new ActionAudioEngine();
