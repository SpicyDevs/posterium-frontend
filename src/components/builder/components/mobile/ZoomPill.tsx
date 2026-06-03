import React, { memo, useEffect, useState } from 'react';
import { ZoomIn } from 'lucide-react';

interface Props {
  onResetView: () => void;
}

const ZoomPill: React.FC<Props> = memo(({ onResetView }) => {
  const [view, setView] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setView((e as CustomEvent<typeof view>).detail);
    window.addEventListener('canvas-view-change', handler);
    return () => window.removeEventListener('canvas-view-change', handler);
  }, []);
  const visible =
    Math.abs(view.zoom - 1) > 0.001 || Math.abs(view.panX) > 0.5 || Math.abs(view.panY) > 0.5;
  return (
    <button
      type="button"
      aria-label="Reset canvas view"
      onClick={() => {
        onResetView();
        setPulse(true);
        window.setTimeout(() => setPulse(false), 220);
      }}
      className={pulse ? 'zoom-pill-tap' : undefined}
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        height: 26,
        padding: '0 10px',
        borderRadius: 13,
        background: 'rgba(10,9,8,0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(196,124,46,0.18)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        color: 'rgba(196,124,46,0.6)',
      }}
    >
      <ZoomIn size={10} style={{ color: 'rgba(196,124,46,0.5)' }} />
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.06em',
        }}
      >
        {Math.round(view.zoom * 100)}%
      </span>
    </button>
  );
});
ZoomPill.displayName = 'ZoomPill';
export default ZoomPill;
