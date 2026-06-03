import React, { memo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { vibrate } from './utils';

type Props = {
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
};

type Side = 'left' | 'right';

const Handle: React.FC<{ side: Side; open: boolean; onTap: () => void }> = ({
  side,
  open,
  onTap,
}) => {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [pressed, setPressed] = useState(false);
  const closedIcon = side === 'left' ? ChevronRight : ChevronLeft;
  const openIcon = side === 'left' ? ChevronLeft : ChevronRight;
  const Icon = open ? openIcon : closedIcon;
  const isLeft = side === 'left';
  return (
    <button
      type="button"
      aria-label={`${side} drawer handle`}
      className={`absolute top-1/2 z-20 hidden h-[72px] w-6 -translate-y-1/2 items-center justify-center border border-[rgba(196,124,46,0.2)] bg-[rgba(10,9,8,0.92)] max-lg:flex ${isLeft ? 'left-0 rounded-r-[10px] border-l-0 shadow-[4px_0_16px_rgba(0,0,0,0.4)]' : 'right-0 rounded-l-[10px] border-r-0 shadow-[-4px_0_16px_rgba(0,0,0,0.4)]'}`}
      style={{
        WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
        backdropFilter: 'blur(16px) saturate(1.3)',
        background: pressed ? 'rgba(196,124,46,0.12)' : 'rgba(10,9,8,0.92)',
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        const t = e.touches[0];
        startRef.current = { x: t.clientX, y: t.clientY, t: performance.now() };
        setPressed(true);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        setPressed(false);
        const start = startRef.current;
        startRef.current = null;
        if (!start) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const dt = performance.now() - start.t;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if ((isLeft && dx > 0) || (!isLeft && dx < 0)) {
            vibrate(8);
            onTap();
          }
          return;
        }
        if (dt < 200 && Math.hypot(dx, dy) < 10) {
          vibrate(8);
          onTap();
        }
      }}
      onTouchCancel={() => setPressed(false)}
      onClick={(e) => {
        e.stopPropagation();
        vibrate(8);
        onTap();
      }}
    >
      <span className="flex flex-col items-center justify-center gap-1">
        <span className="flex flex-col gap-1">
          <span className="h-[3px] w-[3px] rounded-full bg-[rgba(196,124,46,0.3)]" />
          <span className="h-[3px] w-[3px] rounded-full bg-[rgba(196,124,46,0.3)]" />
        </span>
        <Icon
          size={13}
          color={open || pressed ? 'rgba(196,124,46,0.9)' : 'rgba(196,124,46,0.55)'}
          style={{
            transform: `translateX(${(isLeft ? !open : open) ? 1 : -1}px)`,
            transition: 'color 0.2s ease',
          }}
        />
      </span>
    </button>
  );
};

const CanvasHandles: React.FC<Props> = memo((props) => (
  <>
    <Handle side="left" open={props.leftOpen} onTap={props.onToggleLeft} />
    <Handle side="right" open={props.rightOpen} onTap={props.onToggleRight} />
  </>
));

CanvasHandles.displayName = 'CanvasHandles';
export default CanvasHandles;
