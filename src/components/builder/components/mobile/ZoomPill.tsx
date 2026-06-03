import React, { memo, useEffect, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { vibrate } from './utils';

interface CanvasViewState {
  zoom: number;
  pan: { x: number; y: number };
}

const ZoomPill: React.FC<{ onResetView: () => void }> = memo(({ onResetView }) => {
  const [view, setView] = useState<CanvasViewState>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => setView((event as CustomEvent<CanvasViewState>).detail);
    window.addEventListener('canvas-view-state', handler);
    return () => window.removeEventListener('canvas-view-state', handler);
  }, []);

  const visible = Math.abs(view.zoom - 1) > 0.01 || Math.abs(view.pan.x) > 0.5 || Math.abs(view.pan.y) > 0.5;

  return (
    <button
      type="button"
      className={`mobile-zoom-pill ${visible ? 'is-visible' : ''} ${pulse ? 'is-pulsing' : ''}`}
      onClick={(event) => {
        event.stopPropagation();
        vibrate(8);
        onResetView();
        setPulse(false);
        requestAnimationFrame(() => setPulse(true));
        window.setTimeout(() => setPulse(false), 220);
      }}
      aria-label="Reset zoom"
    >
      <ZoomIn size={10} />
      <span>{Math.round(view.zoom * 100)}%</span>
    </button>
  );
});

ZoomPill.displayName = 'ZoomPill';
export default ZoomPill;
