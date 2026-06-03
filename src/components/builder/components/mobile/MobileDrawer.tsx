import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Film,
  Layers,
  MousePointer2,
  Sliders,
} from 'lucide-react';
import type { MobileDrawerSide, MobileTab } from './utils';
import {
  clampDrawerHeight,
  getDefaultDrawerHeight,
  getSnapPoints,
  nearestSnapPoint,
  vibrate,
} from './utils';

type TabDef = { id: MobileTab; label: string; icon: React.ElementType };

type Props = {
  side: MobileDrawerSide;
  isOpen: boolean;
  drawerHeight: number;
  onHeightChange: (height: number) => void;
  onClose: () => void;
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  selectedCount: number;
  bodyGridRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

type DragState = {
  startY: number;
  startHeight: number;
  lastY: number;
  lastT: number;
  velocity: number;
  initialSpread?: number;
};

const tabsBySide: Record<MobileDrawerSide, TabDef[]> = {
  left: [
    { id: 'source', label: 'Source', icon: Film },
    { id: 'layers', label: 'Layers', icon: Layers },
  ],
  right: [
    { id: 'badges', label: 'Badges', icon: Sliders },
    { id: 'selection', label: 'Select', icon: MousePointer2 },
  ],
};

const MobileDrawer: React.FC<Props> = memo(
  ({
    side,
    isOpen,
    drawerHeight,
    onHeightChange,
    onClose,
    activeTab,
    onTabChange,
    selectedCount,
    bodyGridRef,
    children,
  }) => {
    const dragRef = useRef<DragState | null>(null);
    const rafRef = useRef<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [contentKey, setContentKey] = useState(activeTab);
    const [contentVisible, setContentVisible] = useState(true);

    useEffect(
      () => () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
      []
    );

    useEffect(() => {
      setContentVisible(false);
      if (contentRef.current) contentRef.current.scrollTop = 0;
      const id = window.setTimeout(() => {
        setContentKey(activeTab);
        setContentVisible(true);
      }, 80);
      return () => window.clearTimeout(id);
    }, [activeTab]);

    const snapLevel = useMemo(() => {
      const points = getSnapPoints();
      return points.reduce(
        (best, point, index) =>
          Math.abs(point - drawerHeight) < Math.abs(points[best] - drawerHeight) ? index : best,
        0
      );
    }, [drawerHeight]);

    const setHeightRaf = (height: number) => {
      const next = clampDrawerHeight(height);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        bodyGridRef.current?.style.setProperty('--drawer-height', `${next}px`);
        onHeightChange(next);
      });
    };

    const animateTo = (height: number, duration = 380) => {
      const grid = bodyGridRef.current;
      const target = clampDrawerHeight(height);
      if (grid)
        grid.style.transition = `grid-template-rows ${duration}ms cubic-bezier(0.16,1,0.3,1)`;
      grid?.style.setProperty('--drawer-height', `${target}px`);
      onHeightChange(target);
      vibrate(6);
      window.setTimeout(() => {
        if (grid) grid.style.transition = 'none';
        vibrate(4);
      }, duration);
    };

    const startDrag = (e: React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const now = performance.now();
      const first = e.touches[0];
      dragRef.current = {
        startY: first.clientY,
        startHeight: drawerHeight || getDefaultDrawerHeight(),
        lastY: first.clientY,
        lastT: now,
        velocity: 0,
        initialSpread:
          e.touches.length >= 2 ? Math.abs(e.touches[0].clientY - e.touches[1].clientY) : undefined,
      };
      bodyGridRef.current && (bodyGridRef.current.style.transition = 'none');
      setDragging(true);
    };

    const moveDrag = (e: React.TouchEvent) => {
      if (!dragRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const now = performance.now();
      const state = dragRef.current;
      let nextHeight = state.startHeight;
      if (e.touches.length >= 2 && state.initialSpread !== undefined) {
        const spread = Math.abs(e.touches[0].clientY - e.touches[1].clientY);
        nextHeight = state.startHeight + (spread - state.initialSpread);
      } else {
        const y = e.touches[0].clientY;
        nextHeight = state.startHeight - (y - state.startY);
        const dt = Math.max(1, now - state.lastT);
        state.velocity = ((y - state.lastY) / dt) * 1000;
        state.lastY = y;
        state.lastT = now;
      }
      setHeightRaf(nextHeight);
    };

    const endDrag = () => {
      if (!dragRef.current) return;
      const velocity = dragRef.current.velocity;
      dragRef.current = null;
      setDragging(false);
      if (drawerHeight < 60) {
        onClose();
        return;
      }
      animateTo(nearestSnapPoint(drawerHeight, velocity));
    };

    const toggleSize = () => {
      const points = getSnapPoints();
      animateTo(snapLevel >= 2 ? points[1] : points[Math.min(2, snapLevel + 1)]);
    };

    const tabs = tabsBySide[side];
    const ToggleIcon = snapLevel >= 2 ? ChevronsDown : ChevronsUp;

    return (
      <section
        aria-hidden={!isOpen}
        className="relative hidden h-full w-full overflow-hidden rounded-t-[18px] border-t border-[rgba(196,124,46,0.22)] bg-[rgba(9,8,7,0.97)] shadow-[0_-12px_60px_rgba(0,0,0,0.7),0_-1px_0_rgba(196,124,46,0.08)] backdrop-blur-3xl max-lg:flex max-lg:flex-col"
        style={{
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          willChange: 'height',
        }}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          className="absolute left-1/2 top-0 z-10 h-6 w-20 -translate-x-1/2 bg-transparent pt-2.5 touch-none"
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
        >
          <div
            className={`mx-auto h-1 rounded-sm bg-white/[0.18] transition-all duration-150 ${dragging ? 'w-12 bg-white/[0.35]' : 'w-10'}`}
          />
        </div>
        <div
          className="flex h-12 shrink-0 items-center border-b border-[rgba(196,124,46,0.08)] px-4 pt-5 touch-none"
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
        >
          <div className="flex h-full flex-1 items-center gap-0">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!active) {
                      vibrate(8);
                      onTabChange(id);
                    }
                  }}
                  className="relative flex h-full flex-1 items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors syne-font"
                  style={{ color: active ? 'var(--film-cream)' : 'rgba(140,130,112,0.45)' }}
                >
                  <Icon size={11} />
                  <span>{label}</span>
                  {id === 'selection' && selectedCount > 0 && (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[rgba(196,124,46,0.9)] font-mono text-[8px] font-bold text-[#070706]">
                      {selectedCount}
                    </span>
                  )}
                  <span
                    className="absolute bottom-0 left-[20%] h-0.5 w-[60%] rounded-t bg-[linear-gradient(90deg,transparent,var(--film-amber),transparent)] transition-opacity duration-150"
                    style={{ opacity: active ? 1 : 0 }}
                  />
                </button>
              );
            })}
          </div>
          <div
            className="mr-1.5 flex w-4 flex-col items-center justify-center p-0.5"
            onTouchStart={(e) => e.stopPropagation()}
          >
            {getSnapPoints().map((point, index) => (
              <button
                key={point}
                type="button"
                aria-label={`Snap drawer level ${index + 1}`}
                onClick={() => animateTo(point)}
                className="my-0.5 h-1.5 w-1.5 rounded-full"
                style={{ background: `rgba(196,124,46,${snapLevel === index ? 0.9 : 0.3})` }}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Toggle drawer size"
            onClick={toggleSize}
            className="mr-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[rgba(140,130,112,0.4)] active:bg-[rgba(196,124,46,0.08)] active:text-[rgba(196,124,46,0.8)]"
          >
            <ToggleIcon size={13} />
          </button>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => {
              vibrate(8);
              onClose();
            }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[rgba(140,130,112,0.5)] active:bg-[rgba(196,124,46,0.08)] active:text-[rgba(196,124,46,0.8)]"
          >
            <ChevronDown size={13} />
          </button>
        </div>
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-6 transition-opacity duration-120 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] [scrollbar-color:rgba(196,124,46,0.15)_transparent] [scrollbar-width:thin] [touch-action:pan-y]"
          style={{ opacity: contentVisible ? 1 : 0 }}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div key={contentKey}>{children}</div>
        </div>
      </section>
    );
  }
);

MobileDrawer.displayName = 'MobileDrawer';
export default MobileDrawer;
