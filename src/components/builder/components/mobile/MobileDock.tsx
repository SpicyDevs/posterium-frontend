import React, { memo, useEffect, useRef, useState } from 'react';
import { Film, Layers, Monitor, MousePointer2, Sliders } from 'lucide-react';
import type { MobileDrawerSide } from './utils';
import { vibrate } from './utils';

type DockAction = 'source' | 'layers' | 'canvas' | 'badges' | 'selection';

type Props = {
  openSide: MobileDrawerSide | null;
  leftTab: 'source' | 'layers';
  rightTab: 'badges' | 'selection';
  selectedCount: number;
  onSource: () => void;
  onLayers: () => void;
  onCanvas: () => void;
  onBadges: () => void;
  onSelection: () => void;
  onCanvasLongPress: () => void;
};

const items: Array<{ id: DockAction; label: string; icon: React.ElementType; size?: number }> = [
  { id: 'source', label: 'Source', icon: Film },
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'canvas', label: 'Canvas', icon: Monitor, size: 22 },
  { id: 'badges', label: 'Badges', icon: Sliders },
  { id: 'selection', label: 'Select', icon: MousePointer2 },
];

const MobileDock: React.FC<Props> = memo(
  ({
    openSide,
    leftTab,
    rightTab,
    selectedCount,
    onSource,
    onLayers,
    onCanvas,
    onBadges,
    onSelection,
    onCanvasLongPress,
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const longPressRef = useRef<number | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [width, setWidth] = useState(0);
    const [pressed, setPressed] = useState<DockAction | null>(null);
    useEffect(() => {
      if (!ref.current) return;
      const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
      ro.observe(ref.current);
      return () => ro.disconnect();
    }, []);
    const activeIndex =
      openSide === 'left'
        ? leftTab === 'source'
          ? 0
          : 1
        : openSide === 'right'
          ? rightTab === 'badges'
            ? 3
            : 4
          : 2;
    const indicatorLeft = width
      ? (activeIndex / items.length) * width + width / items.length / 2 - 16
      : 0;
    const actions: Record<DockAction, () => void> = {
      source: onSource,
      layers: onLayers,
      canvas: onCanvas,
      badges: onBadges,
      selection: onSelection,
    };
    return (
      <nav
        ref={ref}
        aria-label="Mobile builder dock"
        className="relative z-40 hidden h-16 [grid-area:dock] min-h-16 items-stretch border-t border-[rgba(196,124,46,0.12)] bg-[rgba(7,7,6,0.98)] pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_32px_rgba(0,0,0,0.5),0_-1px_0_rgba(196,124,46,0.06)] backdrop-blur-2xl max-lg:flex"
        style={{
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          backdropFilter: 'blur(24px) saturate(1.5)',
        }}
      >
        <div
          className="absolute -top-px h-0.5 w-8 rounded-b-sm bg-[var(--film-amber)] transition-[left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: indicatorLeft }}
        />
        {items.map(({ id, label, icon: Icon, size }, index) => {
          const active = index === activeIndex;
          const isCanvas = id === 'canvas';
          return (
            <button
              key={id}
              type="button"
              className="relative flex flex-1 select-none flex-col items-center justify-center gap-1 [touch-action:manipulation]"
              onClick={() => {
                vibrate(8);
                actions[id]();
              }}
              onTouchStart={(e) => {
                setPressed(id);
                if (id === 'canvas') {
                  const t = e.touches[0];
                  touchStartRef.current = { x: t.clientX, y: t.clientY };
                  longPressRef.current = window.setTimeout(() => {
                    vibrate(10);
                    onCanvasLongPress();
                  }, 400);
                }
              }}
              onTouchMove={(e) => {
                if (id !== 'canvas' || !touchStartRef.current || !longPressRef.current) return;
                const t = e.touches[0];
                if (
                  Math.hypot(
                    t.clientX - touchStartRef.current.x,
                    t.clientY - touchStartRef.current.y
                  ) > 8
                ) {
                  window.clearTimeout(longPressRef.current);
                  longPressRef.current = null;
                }
              }}
              onTouchEnd={() => {
                setPressed(null);
                if (longPressRef.current) window.clearTimeout(longPressRef.current);
                longPressRef.current = null;
              }}
              onTouchCancel={() => {
                setPressed(null);
                if (longPressRef.current) window.clearTimeout(longPressRef.current);
                longPressRef.current = null;
              }}
            >
              {isCanvas && (
                <span
                  className="absolute inset-x-1 bottom-2 top-2 rounded-[10px] transition-colors duration-200"
                  style={{ background: active ? 'rgba(196,124,46,0.06)' : 'transparent' }}
                />
              )}
              {id === 'selection' && selectedCount > 0 && (
                <span
                  className="absolute top-2 grid h-4 w-4 place-items-center rounded-full border-[1.5px] border-[rgba(7,7,6,0.8)] bg-[rgba(196,124,46,0.95)] font-mono text-[8px] font-extrabold text-[#070706] animate-[badge-pop_0.2s_cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ right: 'calc(50% - 14px)' }}
                >
                  {selectedCount}
                </span>
              )}
              <span
                className="relative flex flex-col items-center justify-center gap-1 transition-transform"
                style={{
                  transform: pressed === id ? 'scale(0.88)' : 'scale(1)',
                  transition:
                    pressed === id
                      ? 'transform 0.08s ease'
                      : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <Icon
                  size={size ?? 20}
                  strokeWidth={active ? (isCanvas ? 2.4 : 2.2) : 1.8}
                  color={active ? 'var(--film-amber)' : 'rgba(140,130,112,0.5)'}
                />
                <span
                  className="mt-0.5 text-[8px] font-bold uppercase leading-none tracking-[0.1em] syne-font"
                  style={{ color: active ? 'var(--film-amber)' : 'rgba(140,130,112,0.4)' }}
                >
                  {label}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    );
  }
);
MobileDock.displayName = 'MobileDock';
export default MobileDock;
