import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from 'lucide-react';
import { actionAudio, type ActionTone } from '../../lib/actionAudio';
import { feedbackBus } from '../feedback/feedbackBus';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  /** Play matching action audio (default true) */
  sound?: boolean;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: string; tone: ToastTone };

type FeedbackContextValue = {
  notify: (input: ToastInput | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  /** Toast + audio for completed user actions */
  notifyAction: (
    message: string,
    tone?: ToastTone,
    options?: { sound?: boolean },
  ) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  dismiss: (id: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toneIcon: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  error: <XCircle className="h-4 w-4 text-rose-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  info: <Info className="h-4 w-4 text-indigo-600" />,
};

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-950',
};

function toTone(tone?: ToastTone): ActionTone {
  return tone ?? 'info';
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const timers = useRef<Map<string, number>>(new Map());

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    actionAudio.setMuted(!enabled);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (input: ToastInput | string) => {
      const payload: ToastInput =
        typeof input === 'string' ? { message: input, tone: 'info' } : input;
      const tone = payload.tone ?? 'info';
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = payload.durationMs ?? (tone === 'error' ? 4500 : 3200);

      if (payload.sound !== false && soundEnabled) {
        actionAudio.playTone(toTone(tone));
      }

      setToasts((prev) => [...prev.slice(-4), { ...payload, id, tone }]);
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss, soundEnabled],
  );

  useEffect(() => {
    feedbackBus.bind(notify);
    return () => feedbackBus.bind(null);
  }, [notify]);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      notify,
      success: (message) => notify({ message, tone: 'success' }),
      error: (message) => notify({ message, tone: 'error' }),
      info: (message) => notify({ message, tone: 'info' }),
      warning: (message) => notify({ message, tone: 'warning' }),
      notifyAction: (message, tone = 'success', options) =>
        notify({ message, tone, sound: options?.sound }),
      soundEnabled,
      setSoundEnabled,
      dismiss,
    }),
    [notify, soundEnabled, setSoundEnabled, dismiss],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[80] flex w-[min(420px,92vw)] -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 shadow-lg shadow-slate-900/10 animate-in slide-in-from-bottom-2 fade-in duration-200 ${toneStyles[toast.tone]}`}
            role="status"
          >
            <div className="mt-0.5 shrink-0">{toneIcon[toast.tone]}</div>
            <p className="flex-1 text-xs font-semibold leading-snug sm:text-[13px]">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/70 hover:text-slate-800"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return ctx;
}

/** Safe variant for optional provider boundaries */
export function useFeedbackOptional() {
  return useContext(FeedbackContext);
}
