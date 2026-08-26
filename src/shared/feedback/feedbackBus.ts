import type { ToastInput, ToastTone } from '../ui/FeedbackProvider';

type Listener = (input: ToastInput) => void;

let listener: Listener | null = null;

/**
 * Imperative feedback bus so mock views can call success/error
 * without threading hooks through every callback.
 * Bound by FeedbackProvider on mount.
 */
export const feedbackBus = {
  bind(fn: Listener | null) {
    listener = fn;
  },
  notify(input: ToastInput | string) {
    const payload: ToastInput =
      typeof input === 'string' ? { message: input, tone: 'info' } : input;
    listener?.(payload);
  },
  success(message: string) {
    feedbackBus.notify({ message, tone: 'success' });
  },
  error(message: string) {
    feedbackBus.notify({ message, tone: 'error' });
  },
  info(message: string) {
    feedbackBus.notify({ message, tone: 'info' });
  },
  warning(message: string) {
    feedbackBus.notify({ message, tone: 'warning' });
  },
  action(message: string, tone: ToastTone = 'success') {
    feedbackBus.notify({ message, tone });
  },
};
