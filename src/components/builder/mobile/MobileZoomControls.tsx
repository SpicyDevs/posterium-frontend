import React, { memo, useCallback, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const BTN_STYLE: React.CSSProperties = {
  width: 34,
  height: 34,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: 'rgba(140,130,112,0.65)',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  transition: 'color 0.12s ease, background 0.12s ease',
};

const ZoomBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onAction: () => void;
}> = ({ icon, label, onAction }) => {
  const [pressed, setPressed] = useState(false);
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setPressed(true);
      onAction();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onAction]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      setPressed(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    []
  );

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setPressed(false)}
      aria-label={label}
      style={{
        ...BTN_STYLE,
        color: pressed ? 'var(--film-amber)' : BTN_STYLE.color,
        background: pressed ? 'rgba(196,124,46,0.12)' : BTN_STYLE.background,
      }}
    >
      {icon}
    </button>
  );
};

export const MobileZoomControls = memo<Props>(({ onZoomIn, onZoomOut, onReset }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 16,
      right: 14,
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: 4,
      borderRadius: 12,
      background: 'rgba(12,11,9,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(196,124,46,0.16)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
    }}
  >
    <ZoomBtn icon={<ZoomIn size={14} />} label="Zoom in" onAction={onZoomIn} />
    <ZoomBtn icon={<ZoomOut size={14} />} label="Zoom out" onAction={onZoomOut} />
    <ZoomBtn icon={<RotateCcw size={13} />} label="Reset view" onAction={onReset} />
  </div>
));

MobileZoomControls.displayName = 'MobileZoomControls';
