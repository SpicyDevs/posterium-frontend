// src/builder/components/ui/Toast.tsx
//
// Ambient toast system for the builder. Warm amber/ink styling per DESIGN.md
// tokens: panel surface (velvet-umber), 12px panel radius, mono microlabel
// tones. Toasts auto-dismiss and stack bottom-center on mobile / bottom-right
// on desktop. `useToast()` degrades to a no-op outside the provider so shared
// modules (e.g. ExportMenu on example pages) never crash without one.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// DESIGN.md tokens: amber = var(--film-amber), gold = var(--film-gold),
// danger = rgba(248,113,113,0.85). Icons replace the old dot — a glyph carries
// the tone for glanceable reading (diagnosis 2.14).
const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  info: <Info size={14} />,
  success: <CheckCircle2 size={14} />,
  error: <AlertTriangle size={14} />,
};

const TONE_COLOR: Record<ToastTone, string> = {
  info: 'var(--film-amber)',
  success: 'var(--film-gold)',
  error: 'rgba(248,113,113,0.85)',
};

const TONE_GLOW: Record<ToastTone, string> = {
  info: '0 0 6px rgba(196,124,46,0.55)',
  success: '0 0 6px rgba(212,162,69,0.55)',
  error: '0 0 6px rgba(248,113,113,0.5)',
};

// Everything dismisses at ~2.4s; errors get longer to read (diagnosis 2.14).
const TONE_DURATION: Record<ToastTone, number> = {
  info: 2400,
  success: 2400,
  error: 4000,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextIdRef.current++;
      // Cap the stack at 3 — drop the oldest when overflowing.
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), TONE_DURATION[tone]);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Fixed stack — container is click-transparent; only toasts capture.
          Mobile: bottom-center, floating above the 64px tab bar + safe inset
          (offset handled in global.css so env() resolves). */}
      <div
        role="status"
        aria-live="polite"
        className="builder-toast-stack fixed inset-x-0 flex flex-col items-center gap-2 px-4 pointer-events-none lg:items-end lg:pr-6"
      >
        <style>{`
          @keyframes toast-in {
            from { opacity: 0; transform: translateY(8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="builder-toast pointer-events-auto"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              maxWidth: 'min(360px, 100vw - 32px)',
              padding: '9px 14px',
              background: 'rgba(14,13,11,0.96)', // panel — velvet-umber
              border: '1px solid rgba(196,124,46,0.16)', // brass border
              borderRadius: 12, // panel radius
              boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(196,124,46,0.05)',
              animation: 'toast-in 0.18s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                color: TONE_COLOR[t.tone],
                filter: `drop-shadow(${TONE_GLOW[t.tone]})`,
                flexShrink: 0,
                display: 'flex',
              }}
            >
              {TONE_ICON[t.tone]}
            </span>
            <span
              className="syne-font"
              style={{
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.3,
                color: 'rgba(240,230,204,0.92)', // text-body
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  // No-op fallback keeps shared modules (ExportMenu on example pages) working
  // without a provider — toasts simply don't render there.
  const noop = useMemo<ToastContextValue>(() => ({ toast: () => undefined }), []);
  return ctx ?? noop;
};
