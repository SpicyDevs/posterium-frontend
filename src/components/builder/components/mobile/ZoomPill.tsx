import React, { memo, useEffect, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { vibrate } from './utils';

type CanvasViewState = { zoom: number; pan: { x: number; y: number } };

const ZoomPill: React.FC<{ onReset: () => void }> = memo(({ onReset }) => {
  const [view, setView] = useState<CanvasViewState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const handler = (event: Event) => setView((event as CustomEvent<CanvasViewState>).detail);
    window.addEventListener('canvas-view-state', handler);
    return () => window.removeEventListener('canvas-view-state', handler);
  }, []);
  const visible = Math.abs(view.zoom - 1) > 0.001 || view.pan.x !== 0 || view.pan.y !== 0;
  return (
    <button
      type="button"
      aria-label="Reset canvas view"
      onClick={(e) => {
        e.stopPropagation();
        vibrate(8);
        setPulse(true);
        onReset();
        window.setTimeout(() => setPulse(false), 220);
      }}
      className={`absolute bottom-3 left-1/2 z-30 hidden h-[26px] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-[13px] border border-[rgba(196,124,46,0.18)] bg-[rgba(10,9,8,0.9)] px-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-opacity duration-300 max-lg:flex ${pulse ? 'animate-[zoom-pill-tap_0.2s_ease]' : ''}`}
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <ZoomIn size={10} color="rgba(196,124,46,0.5)" />
      <span className="font-mono text-[9px] font-medium tracking-[0.06em] text-[rgba(196,124,46,0.6)]">
        {Math.round(view.zoom * 100)}%
      </span>
    </button>
  );
});
ZoomPill.displayName = 'ZoomPill';
export default ZoomPill;
