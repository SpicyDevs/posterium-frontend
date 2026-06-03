import React, { memo, useEffect, useRef, useState } from 'react';
import { Film, Layers, Monitor, MousePointer2, Sliders } from 'lucide-react';
import LongPressMenu from './LongPressMenu';

export type DockAction = 'source' | 'layers' | 'canvas' | 'badges' | 'selection';

interface Props {
  active: DockAction;
  selectedCount: number;
  onSource: () => void;
  onLayers: () => void;
  onCanvas: () => void;
  onBadges: () => void;
  onSelection: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onToggleSafeArea: () => void;
}

const items: Array<{ id: DockAction; label: string; Icon: React.ElementType; size?: number }> = [
  { id: 'source', label: 'SOURCE', Icon: Film },
  { id: 'layers', label: 'LAYERS', Icon: Layers },
  { id: 'canvas', label: 'CANVAS', Icon: Monitor, size: 22 },
  { id: 'badges', label: 'BADGES', Icon: Sliders },
  { id: 'selection', label: 'SELECT', Icon: MousePointer2 },
];

const MobileDock: React.FC<Props> = memo(
  ({
    active,
    selectedCount,
    onSource,
    onLayers,
    onCanvas,
    onBadges,
    onSelection,
    onResetView,
    onToggleGrid,
    onToggleSafeArea,
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [pressed, setPressed] = useState<DockAction | null>(null);
    const [quickOpen, setQuickOpen] = useState(false);
    const longPress = useRef<number | null>(null);
    const touch = useRef({ x: 0, y: 0 });
    useEffect(() => {
      if (!ref.current) return;
      const obs = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
      obs.observe(ref.current);
      return () => obs.disconnect();
    }, []);
    const activeIndex = Math.max(
      0,
      items.findIndex((item) => item.id === active)
    );
    const actions: Record<DockAction, () => void> = {
      source: onSource,
      layers: onLayers,
      canvas: onCanvas,
      badges: onBadges,
      selection: onSelection,
    };
    return (
      <>
        <nav
          ref={ref}
          className="lg:hidden"
          aria-label="Mobile builder dock"
          style={{
            gridArea: 'dock',
            position: 'relative',
            height: 64,
            minHeight: 64,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            background: 'rgba(7,7,6,0.98)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            borderTop: '1px solid rgba(196,124,46,0.12)',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.5), 0 -1px 0 rgba(196,124,46,0.06)',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 50,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -1,
              left: width
                ? (activeIndex / items.length) * width + width / items.length / 2 - 16
                : 0,
              width: 32,
              height: 2,
              background: 'var(--film-amber)',
              borderRadius: '0 0 2px 2px',
              transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 1,
            }}
          />
          {items.map(({ id, label, Icon, size }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => actions[id]()}
                onTouchStart={(e) => {
                  const p = e.touches[0];
                  touch.current = { x: p.clientX, y: p.clientY };
                  setPressed(id);
                  if (id === 'canvas')
                    longPress.current = window.setTimeout(() => setQuickOpen(true), 400);
                }}
                onTouchMove={(e) => {
                  const p = e.touches[0];
                  if (
                    Math.hypot(p.clientX - touch.current.x, p.clientY - touch.current.y) > 8 &&
                    longPress.current
                  ) {
                    clearTimeout(longPress.current);
                    longPress.current = null;
                  }
                }}
                onTouchEnd={() => {
                  setPressed(null);
                  if (longPress.current) {
                    clearTimeout(longPress.current);
                    longPress.current = null;
                  }
                }}
                onTouchCancel={() => {
                  setPressed(null);
                  if (longPress.current) clearTimeout(longPress.current);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  position: 'relative',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  background: 'transparent',
                  border: 0,
                  color: isActive ? 'var(--film-amber)' : 'rgba(140,130,112,0.5)',
                }}
              >
                {id === 'canvas' && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '8px 4px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(196,124,46,0.06)' : 'transparent',
                      transition: 'background 0.2s ease',
                    }}
                  />
                )}
                {id === 'selection' && selectedCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 'calc(50% - 14px)',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'rgba(196,124,46,0.95)',
                      border: '1.5px solid rgba(7,7,6,0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 8,
                      fontWeight: 800,
                      color: '#070706',
                      animation: 'dock-badge-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  >
                    {selectedCount}
                  </span>
                )}
                <span
                  style={{
                    transform: pressed === id ? 'scale(0.88)' : 'scale(1)',
                    transition:
                      pressed === id
                        ? 'transform 0.08s ease'
                        : 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    color: isActive ? 'var(--film-amber)' : 'rgba(140,130,112,0.5)',
                  }}
                >
                  <Icon
                    size={size ?? 20}
                    strokeWidth={id === 'canvas' && isActive ? 2.4 : isActive ? 2.2 : 1.8}
                    style={{ transition: 'stroke-width 0.15s ease, color 0.15s ease' }}
                  />
                  <span
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      marginTop: 2,
                      lineHeight: 1,
                      color: isActive ? 'var(--film-amber)' : 'rgba(140,130,112,0.4)',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {label}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
        <LongPressMenu
          open={quickOpen}
          onClose={() => setQuickOpen(false)}
          onResetView={onResetView}
          onToggleGrid={onToggleGrid}
          onToggleSafeArea={onToggleSafeArea}
        />
      </>
    );
  }
);
MobileDock.displayName = 'MobileDock';
export default MobileDock;
