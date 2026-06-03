import React, { memo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { vibrate } from './utils';

interface Props {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onCloseLeft: () => void;
  onCloseRight: () => void;
}

const Handle: React.FC<{
  side: 'left' | 'right';
  open: boolean;
  onToggle: () => void;
  onSwipeClose: () => void;
}> = ({ side, open, onToggle, onSwipeClose }) => {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const [pressed, setPressed] = useState(false);
  const isLeft = side === 'left';
  const Icon = isLeft ? (open ? ChevronLeft : ChevronRight) : open ? ChevronRight : ChevronLeft;

  return (
    <button
      type="button"
      aria-label={`${isLeft ? 'Left' : 'Right'} drawer`}
      className={`mobile-canvas-handle mobile-canvas-handle-${side} ${pressed ? 'is-pressed' : ''}`}
      onTouchStart={(event) => {
        event.stopPropagation();
        const touch = event.touches[0];
        start.current = { x: touch.clientX, y: touch.clientY, t: performance.now() };
        setPressed(true);
      }}
      onTouchEnd={(event) => {
        event.stopPropagation();
        const touch = event.changedTouches[0];
        const s = start.current;
        setPressed(false);
        if (!s) return;
        const dx = touch.clientX - s.x;
        const dy = touch.clientY - s.y;
        const dt = performance.now() - s.t;
        if ((isLeft && dx > 40) || (!isLeft && dx < -40)) {
          vibrate(8);
          onSwipeClose();
        } else if (dt < 200 && Math.hypot(dx, dy) < 10) {
          vibrate(8);
          onToggle();
        }
        start.current = null;
      }}
      onTouchCancel={() => {
        setPressed(false);
        start.current = null;
      }}
      onClick={(event) => {
        event.stopPropagation();
        vibrate(8);
        onToggle();
      }}
    >
      <span className="mobile-handle-dots" aria-hidden="true"><i /><i /></span>
      <Icon className="mobile-handle-icon" size={13} />
    </button>
  );
};

const CanvasHandles: React.FC<Props> = memo(({ leftOpen, rightOpen, onToggleLeft, onToggleRight, onCloseLeft, onCloseRight }) => (
  <>
    <Handle side="left" open={leftOpen} onToggle={onToggleLeft} onSwipeClose={onCloseLeft} />
    <Handle side="right" open={rightOpen} onToggle={onToggleRight} onSwipeClose={onCloseRight} />
  </>
));

CanvasHandles.displayName = 'CanvasHandles';
export default CanvasHandles;
