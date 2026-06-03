import React, { memo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onCloseLeft: () => void;
  onCloseRight: () => void;
}

const CanvasHandles: React.FC<Props> = memo(
  ({ leftOpen, rightOpen, onToggleLeft, onToggleRight, onCloseLeft, onCloseRight }) => (
    <>
      <Handle side="left" open={leftOpen} onTap={onToggleLeft} onSwipeClose={onCloseLeft} />
      <Handle side="right" open={rightOpen} onTap={onToggleRight} onSwipeClose={onCloseRight} />
    </>
  )
);

const Handle: React.FC<{
  side: 'left' | 'right';
  open: boolean;
  onTap: () => void;
  onSwipeClose: () => void;
}> = ({ side, open, onTap, onSwipeClose }) => {
  const [pressed, setPressed] = useState(false);
  const touch = useRef({ x: 0, y: 0, t: 0 });
  const Icon =
    side === 'left' ? (open ? ChevronLeft : ChevronRight) : open ? ChevronRight : ChevronLeft;
  const isLeft = side === 'left';
  return (
    <button
      type="button"
      aria-label={`${side} drawer`}
      onTouchStart={(e) => {
        e.stopPropagation();
        const p = e.touches[0];
        touch.current = { x: p.clientX, y: p.clientY, t: performance.now() };
        setPressed(true);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        const p = e.changedTouches[0];
        const dx = p.clientX - touch.current.x;
        const dy = p.clientY - touch.current.y;
        const dt = performance.now() - touch.current.t;
        setPressed(false);
        if ((isLeft && dx > 40) || (!isLeft && dx < -40)) {
          onSwipeClose();
          return;
        }
        if (dt < 200 && Math.hypot(dx, dy) < 10) onTap();
      }}
      onTouchCancel={() => setPressed(false)}
      style={{
        position: 'absolute',
        [isLeft ? 'left' : 'right']: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        width: 24,
        height: 72,
        borderRadius: isLeft ? '0 10px 10px 0' : '10px 0 0 10px',
        background: pressed ? 'rgba(196,124,46,0.12)' : 'rgba(10,9,8,0.92)',
        backdropFilter: 'blur(16px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
        border: '1px solid rgba(196,124,46,0.2)',
        borderLeft: isLeft ? 'none' : '1px solid rgba(196,124,46,0.2)',
        borderRight: isLeft ? '1px solid rgba(196,124,46,0.2)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isLeft ? '4px 0 16px rgba(0,0,0,0.4)' : '-4px 0 16px rgba(0,0,0,0.4)',
        color: pressed || open ? 'rgba(196,124,46,0.9)' : 'rgba(196,124,46,0.55)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span
          style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(196,124,46,0.3)' }}
        />
        <span
          style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(196,124,46,0.3)' }}
        />
        <Icon
          size={13}
          style={{
            transform: `translateX(${(isLeft ? !open : open) ? 1 : -1}px)`,
            transition: 'color 0.2s ease',
          }}
        />
      </span>
    </button>
  );
};

CanvasHandles.displayName = 'CanvasHandles';
export default CanvasHandles;
