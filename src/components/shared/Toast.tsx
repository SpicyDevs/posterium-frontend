// src/components/shared/Toast.tsx
import React, { useRef } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToasts, dismiss, type Toast, type ToastVariant } from '@/lib/useToast';

// ── Colour palette per variant ─────────────────────────────────────────────
const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; color: string; bg: string; border: string; role: 'status' | 'alert' }
> = {
  success: {
    icon: <CheckCircle size={16} />,
    color: '#6ee7b7',
    bg: 'rgba(6,78,59,0.55)',
    border: 'rgba(110,231,183,0.25)',
    role: 'status',
  },
  error: {
    icon: <AlertCircle size={16} />,
    color: '#fca5a5',
    bg: 'rgba(127,29,29,0.55)',
    border: 'rgba(252,165,165,0.25)',
    role: 'alert',
  },
  info: {
    icon: <Info size={16} />,
    color: 'var(--film-amber)',
    bg: 'rgba(30,20,8,0.8)',
    border: 'rgba(196,124,46,0.3)',
    role: 'status',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    color: '#fbbf24',
    bg: 'rgba(78,52,0,0.6)',
    border: 'rgba(251,191,36,0.25)',
    role: 'alert',
  },
};

// ── Individual toast item ─────────────────────────────────────────────────
const ToastItem: React.FC<{ toast: Toast }> = ({ toast: t }) => {
  const cfg = VARIANT_CONFIG[t.variant];

  return (
    <div
      role={cfg.role}
      aria-live={cfg.role === 'alert' ? 'assertive' : 'polite'}
      aria-atomic="true"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-sm)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 280,
        maxWidth: 400,
        animation: 'toastSlideIn var(--transition-spring) forwards',
        color: 'var(--film-cream)',
        fontSize: 13,
        lineHeight: 1.45,
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {t.title && (
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, fontFamily: 'Syne, sans-serif', letterSpacing: '0.03em' }}>
            {t.title}
          </div>
        )}
        <div style={{ color: 'var(--film-text-label)' }}>{t.message}</div>
      </div>
      <button
        onClick={() => dismiss(t.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
          color: 'var(--film-text-ghost)', flexShrink: 0, display: 'flex',
          borderRadius: 4, transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--film-cream)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--film-text-ghost)')}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ── Container ─────────────────────────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes toastSlideIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
      <div
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: 'clamp(16px, 3vw, 28px)',
          right: 'clamp(12px, 2.5vw, 28px)',
          zIndex: 'var(--z-top)' as unknown as number,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </>
  );
};

export default ToastContainer;
