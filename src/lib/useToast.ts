// src/lib/useToast.ts
/**
 * Module-level pub/sub toast singleton.
 * Uses useSyncExternalStore for React 18+ compatibility.
 * Max 3 concurrent toasts. Auto-dismiss after `duration` ms.
 */
import { useSyncExternalStore } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000
}

// ── Internal store ────────────────────────────────────────────────────────────
const MAX_TOASTS = 3;
let toasts: Toast[] = [];
let uid = 0;
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function toast(
  message: string,
  options: Partial<Omit<Toast, 'id' | 'message'>> = {}
): string {
  const id = `toast-${++uid}`;
  const duration = options.duration ?? 4000;
  const newToast: Toast = { id, message, variant: 'info', ...options };

  // Cap at MAX_TOASTS — dismiss oldest if over limit
  if (toasts.length >= MAX_TOASTS) {
    const oldest = toasts[0];
    dismiss(oldest.id);
  }

  toasts = [...toasts, newToast];
  notify();

  if (duration > 0) {
    const t = setTimeout(() => dismiss(id), duration);
    timers.set(id, t);
  }

  return id;
}

export function dismiss(id: string): void {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function dismissAll(): void {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  toasts = [];
  notify();
}

// Convenience wrappers
export const toastSuccess = (message: string, opts?: Partial<Toast>) =>
  toast(message, { variant: 'success', ...opts });
export const toastError = (message: string, opts?: Partial<Toast>) =>
  toast(message, { variant: 'error', duration: 6000, ...opts });
export const toastInfo = (message: string, opts?: Partial<Toast>) =>
  toast(message, { variant: 'info', ...opts });
export const toastWarning = (message: string, opts?: Partial<Toast>) =>
  toast(message, { variant: 'warning', ...opts });

// ── React hook ────────────────────────────────────────────────────────────────
export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}
