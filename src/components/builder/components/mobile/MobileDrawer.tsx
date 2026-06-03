import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Film,
  Layers,
  MousePointer2,
  Sliders,
} from 'lucide-react';

export type DrawerSide = 'left' | 'right';
export type DrawerTab = 'source' | 'layers' | 'badges' | 'selection';

export interface DrawerSnapPoints {
  compact: number;
  half: number;
  full: number;
}

interface TabConfig {
  id: DrawerTab;
  label: string;
  Icon: React.ElementType;
}

interface Props {
  side: DrawerSide;
  isOpen: boolean;
  drawerHeight: number;
  snapPoints: DrawerSnapPoints;
  onHeightChange: (h: number, animate?: boolean) => void;
  onClose: () => void;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  selectedCount?: number;
  children: React.ReactNode;
}

const vibrate = (ms: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
};

const MobileDrawer: React.FC<Props> = memo(
  ({
    side,
    isOpen,
    drawerHeight,
    snapPoints,
    onHeightChange,
    onClose,
    activeTab,
    onTabChange,
    selectedCount = 0,
    children,
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const dragRef = useRef({
      active: false,
      startY: 0,
      startHeight: 0,
      lastY: 0,
      lastT: 0,
      velocity: 0,
      pinch: false,
      spread: 0,
    });
    const [dragging, setDragging] = useState(false);
    const [renderKey, setRenderKey] = useState(activeTab);
    const [fading, setFading] = useState(false);

    useEffect(() => {
      setFading(true);
      contentRef.current && (contentRef.current.scrollTop = 0);
      const t = window.setTimeout(() => {
        setRenderKey(activeTab);
        setFading(false);
      }, 80);
      return () => window.clearTimeout(t);
    }, [activeTab]);

    useEffect(
      () => () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      },
      []
    );

    const tabs = useMemo<TabConfig[]>(
      () =>
        side === 'left'
          ? [
              { id: 'source', label: 'Source', Icon: Film },
              { id: 'layers', label: 'Layers', Icon: Layers },
            ]
          : [
              { id: 'badges', label: 'Badges', Icon: Sliders },
              { id: 'selection', label: 'Select', Icon: MousePointer2 },
            ],
      [side]
    );

    const currentLevel = useMemo(() => {
      const entries = Object.entries(snapPoints) as Array<[keyof DrawerSnapPoints, number]>;
      return entries.reduce(
        (best, entry) =>
          Math.abs(entry[1] - drawerHeight) < Math.abs(best[1] - drawerHeight) ? entry : best,
        entries[0]
      )[0];
    }, [drawerHeight, snapPoints]);

    const setHeightRaf = useCallback(
      (height: number) => {
        const clamped = Math.max(0, Math.min(height, snapPoints.full));
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => onHeightChange(clamped, false));
      },
      [onHeightChange, snapPoints.full]
    );

    const beginDrag = useCallback(
      (e: React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const touches = Array.from(e.touches);
        dragRef.current.active = true;
        dragRef.current.pinch = touches.length >= 2;
        dragRef.current.startY = touches[0].clientY;
        dragRef.current.startHeight = drawerHeight;
        dragRef.current.lastY = touches[0].clientY;
        dragRef.current.lastT = performance.now();
        dragRef.current.velocity = 0;
        dragRef.current.spread =
          touches.length >= 2 ? Math.abs(touches[0].clientY - touches[1].clientY) : 0;
        setDragging(true);
      },
      [drawerHeight]
    );

    const nearestSnap = useCallback(
      (height: number, velocity: number) => {
        const points = [snapPoints.compact, snapPoints.half, snapPoints.full];
        const currentIndex = points.reduce(
          (best, p, i) => (Math.abs(p - height) < Math.abs(points[best] - height) ? i : best),
          0
        );
        if (velocity > 400) return points[Math.max(0, currentIndex - 1)];
        if (velocity < -400) return points[Math.min(points.length - 1, currentIndex + 1)];
        return points[currentIndex];
      },
      [snapPoints]
    );

    const handleMove = useCallback(
      (e: React.TouchEvent) => {
        if (!dragRef.current.active) return;
        e.stopPropagation();
        e.preventDefault();
        const now = performance.now();
        const touches = Array.from(e.touches);
        let nextHeight = dragRef.current.startHeight;
        if (dragRef.current.pinch && touches.length >= 2) {
          const spread = Math.abs(touches[0].clientY - touches[1].clientY);
          nextHeight = dragRef.current.startHeight + (spread - dragRef.current.spread);
        } else {
          const y = touches[0].clientY;
          nextHeight = dragRef.current.startHeight - (y - dragRef.current.startY);
          const dt = Math.max(1, now - dragRef.current.lastT);
          dragRef.current.velocity = ((y - dragRef.current.lastY) / dt) * 1000;
          dragRef.current.lastY = y;
          dragRef.current.lastT = now;
        }
        if (nextHeight < 60) {
          onHeightChange(0, true);
          onClose();
          return;
        }
        setHeightRaf(nextHeight);
      },
      [onClose, onHeightChange, setHeightRaf]
    );

    const endDrag = useCallback(
      (e: React.TouchEvent) => {
        if (!dragRef.current.active) return;
        e.stopPropagation();
        const target = nearestSnap(drawerHeight, dragRef.current.velocity);
        dragRef.current.active = false;
        setDragging(false);
        onHeightChange(target, true);
        vibrate(6);
      },
      [drawerHeight, nearestSnap, onHeightChange]
    );

    const snapTo = (height: number) => {
      onHeightChange(height, true);
      vibrate(8);
    };

    if (!isOpen && drawerHeight <= 0) return <div className="lg:hidden" aria-hidden="true" />;

    return (
      <section
        className="lg:hidden"
        aria-label={`${side} mobile drawer`}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'rgba(9,8,7,0.97)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          borderTop: '1px solid rgba(196,124,46,0.22)',
          borderRadius: '18px 18px 0 0',
          boxShadow: '0 -12px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(196,124,46,0.08)',
          willChange: 'height',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          onTouchStart={beginDrag}
          onTouchMove={handleMove}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 80,
            height: 24,
            background: 'transparent',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 10,
          }}
        >
          <div
            style={{
              width: dragging ? 48 : 40,
              height: 4,
              borderRadius: 2,
              background: dragging ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
              transition: 'width 0.15s ease, background 0.15s ease',
            }}
          />
        </div>
        <header
          onTouchStart={beginDrag}
          onTouchMove={handleMove}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
          style={{
            height: 68,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '20px 16px 0',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
            touchAction: 'none',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
            {tabs.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!active) onTabChange(id);
                  }}
                  style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    color: active ? 'var(--film-cream)' : 'rgba(140,130,112,0.45)',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    transition: 'color 0.15s ease',
                    background: 'transparent',
                    border: 0,
                  }}
                >
                  <Icon size={11} /> <span>{label}</span>
                  {id === 'selection' && selectedCount > 0 && (
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: 'rgba(196,124,46,0.9)',
                        color: '#070706',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 8,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selectedCount}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '20%',
                      width: '60%',
                      height: 2,
                      background:
                        'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
                      borderRadius: '1px 1px 0 0',
                      opacity: active ? 1 : 0,
                      transition: 'opacity 0.15s ease',
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div
            style={{
              width: 16,
              padding: 2,
              marginRight: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {(['compact', 'half', 'full'] as const).map((level) => (
              <button
                key={level}
                aria-label={`Snap ${level}`}
                onClick={(e) => {
                  e.stopPropagation();
                  snapTo(snapPoints[level]);
                }}
                style={{
                  width: 14,
                  height: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: `rgba(196,124,46,${currentLevel === level ? 0.9 : 0.3})`,
                  }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Toggle drawer size"
            onClick={(e) => {
              e.stopPropagation();
              snapTo(
                currentLevel === 'full'
                  ? snapPoints.half
                  : currentLevel === 'compact'
                    ? snapPoints.half
                    : snapPoints.full
              );
            }}
            style={smallButtonStyle}
          >
            {currentLevel === 'full' ? <ChevronsDown size={13} /> : <ChevronsUp size={13} />}
          </button>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{ ...smallButtonStyle, marginLeft: 6 }}
          >
            <ChevronDown size={13} />
          </button>
        </header>
        <div
          ref={contentRef}
          onTouchMove={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop === 0 && e.touches.length === 1 && dragRef.current.active)
              handleMove(e);
          }}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(196,124,46,0.15) transparent',
            paddingBottom: 24,
            touchAction: 'pan-y',
            opacity: fading ? 0 : 1,
            transition: fading ? 'opacity 0.08s ease' : 'opacity 0.12s ease',
          }}
        >
          <div key={renderKey}>{children}</div>
        </div>
      </section>
    );
  }
);

const smallButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.03)',
  color: 'rgba(140,130,112,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

MobileDrawer.displayName = 'MobileDrawer';
export default MobileDrawer;
