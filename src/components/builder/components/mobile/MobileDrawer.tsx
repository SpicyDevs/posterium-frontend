import React, { memo, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronsDown, ChevronsUp, Film, Layers, MousePointer2, Sliders } from 'lucide-react';
import type { MobileDrawerTab } from './utils';
import { closestSnap, getMaxDrawerHeight, getSnapLevel, getSnapPoints, vibrate } from './utils';

interface TabDef {
  id: MobileDrawerTab;
  label: string;
  Icon: React.ElementType;
}

interface Props {
  side: 'left' | 'right';
  isOpen: boolean;
  drawerHeight: number;
  onHeightChange: (h: number) => void;
  onSnap: (h: number) => void;
  onClose: () => void;
  activeTab: MobileDrawerTab;
  onTabChange: (tab: MobileDrawerTab) => void;
  selectedCount: number;
  children: React.ReactNode;
}

const MobileDrawer: React.FC<Props> = memo(({ side, isOpen, drawerHeight, onHeightChange, onSnap, onClose, activeTab, onTabChange, selectedCount, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startHeight: number; lastY: number; lastT: number; velocity: number; pinchSpread?: number } | null>(null);
  const raf = useRef<number | null>(null);
  const pendingHeight = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [contentKey, setContentKey] = useState(activeTab);
  const [fading, setFading] = useState(false);

  const tabs: TabDef[] = side === 'left'
    ? [{ id: 'source', label: 'SOURCE', Icon: Film }, { id: 'layers', label: 'LAYERS', Icon: Layers }]
    : [{ id: 'badges', label: 'BADGES', Icon: Sliders }, { id: 'selection', label: 'SELECT', Icon: MousePointer2 }];

  useEffect(() => {
    if (activeTab === contentKey) return;
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setFading(true);
    const timer = window.setTimeout(() => {
      setContentKey(activeTab);
      setFading(false);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeTab, contentKey]);

  useEffect(() => () => { if (raf.current !== null) cancelAnimationFrame(raf.current); }, []);

  const writeHeight = (height: number) => {
    pendingHeight.current = Math.max(0, Math.min(getMaxDrawerHeight(), height));
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      if (pendingHeight.current !== null) onHeightChange(pendingHeight.current);
    });
  };

  const beginDrag = (event: React.TouchEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const touch = event.touches[0];
    const pinchSpread = event.touches.length >= 2 ? Math.abs(event.touches[0].clientY - event.touches[1].clientY) : undefined;
    drag.current = { startY: touch.clientY, startHeight: drawerHeight, lastY: touch.clientY, lastT: performance.now(), velocity: 0, pinchSpread };
    setDragging(true);
  };

  const moveDrag = (event: React.TouchEvent) => {
    if (!drag.current) return;
    event.stopPropagation();
    event.preventDefault();
    const now = performance.now();
    const d = drag.current;
    let next = d.startHeight - (event.touches[0].clientY - d.startY);
    if (event.touches.length >= 2 && d.pinchSpread !== undefined) {
      next = d.startHeight + (Math.abs(event.touches[0].clientY - event.touches[1].clientY) - d.pinchSpread);
    }
    d.velocity = ((event.touches[0].clientY - d.lastY) / Math.max(1, now - d.lastT)) * 1000;
    d.lastY = event.touches[0].clientY;
    d.lastT = now;
    writeHeight(next < 60 ? 0 : next);
  };

  const endDrag = () => {
    if (!drag.current) return;
    const velocity = drag.current.velocity;
    drag.current = null;
    setDragging(false);
    const target = drawerHeight < 60 ? 0 : closestSnap(drawerHeight, velocity);
    if (target === 0) onClose();
    else {
      vibrate(6);
      onSnap(target);
    }
  };

  const snapLevel = getSnapLevel(drawerHeight);
  const points = getSnapPoints();
  const ToggleIcon = snapLevel === 2 ? ChevronsDown : ChevronsUp;

  return (
    <section
      className={`mobile-drawer ${isOpen ? 'is-open' : ''} ${dragging ? 'is-dragging' : ''}`}
      onTouchStart={(event) => event.stopPropagation()}
      aria-label={`${side} mobile drawer`}
    >
      <button className="mobile-drawer-grip" type="button" aria-label="Resize drawer" onTouchStart={beginDrag} onTouchMove={moveDrag} onTouchEnd={endDrag} onTouchCancel={endDrag}>
        <span />
      </button>
      <div className="mobile-drawer-header" onTouchStart={beginDrag} onTouchMove={moveDrag} onTouchEnd={endDrag} onTouchCancel={endDrag}>
        <div className="mobile-drawer-tabs" role="tablist">
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={active} className={active ? 'is-active' : ''} onClick={(event) => { event.stopPropagation(); if (!active) onTabChange(id); }}>
                <Icon size={11} />
                <span>{label}</span>
                {id === 'selection' && selectedCount > 0 && <b>{selectedCount}</b>}
                <i />
              </button>
            );
          })}
        </div>
        <div className="mobile-drawer-snap-dots" aria-label="Drawer size">
          {points.map((point, index) => (
            <button key={index} type="button" aria-label={`Snap drawer to ${index + 1}`} onClick={(event) => { event.stopPropagation(); vibrate(6); onSnap(point); }} className={snapLevel === index ? 'is-active' : ''} />
          ))}
        </div>
        <button type="button" className="mobile-drawer-icon-button" aria-label="Toggle drawer size" onClick={(event) => { event.stopPropagation(); onSnap(snapLevel === 2 ? points[1] : points[Math.min(2, snapLevel + 1)]); }}><ToggleIcon size={13} /></button>
        <button type="button" className="mobile-drawer-icon-button" aria-label="Close drawer" onClick={(event) => { event.stopPropagation(); onClose(); }}><ChevronDown size={13} /></button>
      </div>
      <div
        ref={contentRef}
        className={`mobile-drawer-content ${fading ? 'is-fading' : ''}`}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => {
          const el = contentRef.current;
          if (el && el.scrollTop === 0 && event.touches[0] && drag.current && event.touches[0].clientY - drag.current.startY < -8) moveDrag(event);
        }}
      >
        <div key={contentKey} className="mobile-drawer-content-inner">{children}</div>
      </div>
    </section>
  );
});

MobileDrawer.displayName = 'MobileDrawer';
export default MobileDrawer;
