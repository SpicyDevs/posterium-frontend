import React, { memo, useEffect, useRef, useState } from 'react';
import { Film, Layers, Monitor, MousePointer2, Sliders } from 'lucide-react';
import type { LeftDrawerTab, RightDrawerTab } from './utils';
import { vibrate } from './utils';

interface Props {
  leftOpen: boolean;
  rightOpen: boolean;
  leftTab: LeftDrawerTab;
  rightTab: RightDrawerTab;
  selectedCount: number;
  onSource: () => void;
  onLayers: () => void;
  onCanvas: () => void;
  onBadges: () => void;
  onSelect: () => void;
  onCanvasLongPress: () => void;
}

const MobileDock: React.FC<Props> = memo(({ leftOpen, rightOpen, leftTab, rightTab, selectedCount, onSource, onLayers, onCanvas, onBadges, onSelect, onCanvasLongPress }) => {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const activeIndex = leftOpen ? (leftTab === 'source' ? 0 : 1) : rightOpen ? (rightTab === 'badges' ? 3 : 4) : 2;
  const indicatorLeft = width ? (activeIndex / 5) * width + width / 10 - 16 : 0;

  const items = [
    { key: 'source', label: 'SOURCE', Icon: Film, active: leftOpen, action: onSource },
    { key: 'layers', label: 'LAYERS', Icon: Layers, active: leftOpen, action: onLayers },
    { key: 'canvas', label: 'CANVAS', Icon: Monitor, active: !leftOpen && !rightOpen, action: onCanvas, center: true },
    { key: 'badges', label: 'BADGES', Icon: Sliders, active: rightOpen, action: onBadges },
    { key: 'select', label: 'SELECT', Icon: MousePointer2, active: rightOpen, action: onSelect, count: selectedCount },
  ];

  return (
    <nav ref={ref} className="mobile-dock lg:hidden" style={{ gridArea: 'dock' }} aria-label="Mobile builder dock">
      <div className="mobile-dock-active-line" style={{ left: indicatorLeft }} />
      {items.map(({ key, label, Icon, active, action, center, count }) => (
        <button
          key={key}
          type="button"
          className={`mobile-dock-item ${active ? 'is-active' : ''} ${center ? 'is-center' : ''}`}
          onClick={() => { vibrate(8); action(); }}
          onTouchStart={(event) => {
            if (key !== 'canvas') return;
            const touch = event.touches[0];
            pressStart.current = { x: touch.clientX, y: touch.clientY };
            pressTimer.current = window.setTimeout(() => { vibrate(10); onCanvasLongPress(); }, 400);
          }}
          onTouchMove={(event) => {
            if (!pressTimer.current || !pressStart.current) return;
            const touch = event.touches[0];
            if (Math.hypot(touch.clientX - pressStart.current.x, touch.clientY - pressStart.current.y) > 8) {
              window.clearTimeout(pressTimer.current);
              pressTimer.current = null;
            }
          }}
          onTouchEnd={() => {
            if (pressTimer.current) window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
            pressStart.current = null;
          }}
          onTouchCancel={() => {
            if (pressTimer.current) window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
            pressStart.current = null;
          }}
        >
          {center && <span className="mobile-dock-center-bg" />}
          {typeof count === 'number' && count > 0 && <span className="mobile-dock-count">{count}</span>}
          <span className="mobile-dock-item-inner">
            <Icon size={center ? 22 : 20} strokeWidth={active ? (center ? 2.4 : 2.2) : 1.8} />
            <span>{label}</span>
          </span>
        </button>
      ))}
    </nav>
  );
});

MobileDock.displayName = 'MobileDock';
export default MobileDock;
