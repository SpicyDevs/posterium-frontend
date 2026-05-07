import { memo, useEffect, useState } from 'react';
import { dismissToast, subscribeToasts, type ToastItem } from '@/lib/client/toastBus';
import { subscribeLoading } from '@/lib/client/loadingBus';

const toastColors: Record<ToastItem['tone'], { border: string; accent: string }> = {
  info: { border: 'rgba(255,255,255,0.16)', accent: '#d0c4a8' },
  success: { border: 'rgba(52,211,153,0.42)', accent: '#34d399' },
  warning: { border: 'rgba(245,158,11,0.4)', accent: '#fbbf24' },
  error: { border: 'rgba(248,113,113,0.45)', accent: '#f87171' },
};

const GlobalClientShell = memo(() => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState({ isActive: false, progress: 0 });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => subscribeToasts(setToasts), []);
  useEffect(() => subscribeLoading(setLoading), []);

  useEffect(() => {
    const sync = () => setIsOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden={!loading.isActive}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 2,
          width: `${loading.progress}%`,
          opacity: loading.isActive ? 1 : 0,
          background: 'linear-gradient(90deg, #c47c2e, #d4a245)',
          boxShadow: '0 0 20px rgba(196,124,46,0.8)',
          transition: loading.isActive ? 'width 0.25s ease, opacity 0.2s ease' : 'opacity 0.2s ease',
          zIndex: 3000,
        }}
      />

      {isOffline ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2999,
            background: 'rgba(168,32,24,0.95)',
            color: '#fdf5e6',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
          }}
        >
          You are offline — changes may not load
        </div>
      ) : null}

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          zIndex: 3001,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 'min(320px, calc(100vw - 24px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              border: `1px solid ${toastColors[toast.tone].border}`,
              borderLeft: `3px solid ${toastColors[toast.tone].accent}`,
              borderRadius: 10,
              background: 'rgba(18,17,14,0.96)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
              padding: '9px 10px',
              color: 'var(--film-cream)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.02em',
                    fontWeight: 700,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {toast.title}
                </div>
                {toast.message ? (
                  <div style={{ marginTop: 2, color: 'var(--film-text-label)', fontSize: 12 }}>
                    {toast.message}
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--film-text-dim)',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

GlobalClientShell.displayName = 'GlobalClientShell';

export default GlobalClientShell;
