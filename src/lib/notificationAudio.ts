export type NotificationTone = 'success' | 'info' | 'warning' | 'error' | 'failed';

const STORAGE_KEY = 'skuggle_notification_sound';
let context: AudioContext | null = null;

export function notificationSoundEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'muted';
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'enabled' : 'muted');
}

export function playNotificationTone(tone: NotificationTone): void {
  if (!notificationSoundEnabled()) return;
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const sequences: Record<NotificationTone, number[]> = {
      success: [523.25, 659.25, 783.99],
      info: [440, 554.37],
      warning: [392, 311.13],
      error: [220, 185],
      failed: [196, 164.81, 146.83],
    };
    const now = context.currentTime;
    sequences[tone].forEach((frequency, index) => {
      const start = now + index * 0.075;
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      oscillator.type = tone === 'error' || tone === 'failed' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.16);
    });
  } catch {
    // Audio is enhancement-only; browser autoplay/privacy restrictions must never break an action.
  }
}
