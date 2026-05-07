export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
}

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 2800;

let toasts: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();
const timers = new Map<string, number>();

const emit = () => {
  listeners.forEach((listener) => listener(toasts));
};

const clearTimer = (id: string) => {
  const timer = timers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
};

export const dismissToast = (id: string) => {
  clearTimer(id);
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
};

export const pushToast = ({ title, message, tone = 'info', durationMs = DEFAULT_DURATION }: ToastInput) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const next: ToastItem = { id, title, message, tone, durationMs };

  toasts = [next, ...toasts];
  while (toasts.length > MAX_TOASTS) {
    const removed = toasts.pop();
    if (removed) clearTimer(removed.id);
  }
  emit();

  const timer = window.setTimeout(() => {
    dismissToast(id);
  }, Math.max(800, durationMs));
  timers.set(id, timer);

  return id;
};

export const subscribeToasts = (listener: (items: ToastItem[]) => void) => {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
};
