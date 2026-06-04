import { useState, useRef, useCallback } from 'react';

export interface BottomSheetRef {
  startY: number;
  startHeight: number;
  currentHeight: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  raf: number;
}

const INITIAL_REF: BottomSheetRef = {
  startY: 0, startHeight: 0, currentHeight: 0,
  lastY: 0, lastTime: 0, velocity: 0, raf: 0,
};

export function useMobileBottomSheet(rootRef: React.RefObject<HTMLDivElement | null>) {
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<BottomSheetRef>({ ...INITIAL_REF });

  const getMaxHeight = useCallback(() => {
    if (typeof window === 'undefined') return 520;
    return Math.max(200, window.innerHeight - 48 - 56 - 80);
  }, []);

  const getSnapPoints = useCallback(() => {
    const max = getMaxHeight();
    const mid = Math.min(max, Math.max(200, Math.round(window.innerHeight * 0.48)));
    return [200, mid, max] as const;
  }, [getMaxHeight]);

  const setHeight = useCallback((h: number) => {
    rootRef.current?.style.setProperty('--bph', `${Math.max(0, Math.round(h))}px`);
  }, [rootRef]);

  const open = useCallback((targetHeight?: number) => {
    const points = getSnapPoints();
    setHeight(targetHeight ?? points[1]);
    setBottomPanelOpen(true);
  }, [getSnapPoints, setHeight]);

  const close = useCallback(() => {
    setHeight(0);
    setBottomPanelOpen(false);
  }, [setHeight]);

  const beginDrag = useCallback((clientY: number, currentlyOpen: boolean) => {
    const current = parseFloat(
      rootRef.current?.style.getPropertyValue('--bph') || '0'
    );
    // Allow drag to start even when closed (to open from handle area)
    dragRef.current = {
      ...INITIAL_REF,
      startY: clientY,
      startHeight: currentlyOpen ? current : 0,
      currentHeight: currentlyOpen ? current : 0,
      lastY: clientY,
      lastTime: performance.now(),
    };
    setIsDragging(true);
    if (!currentlyOpen) setBottomPanelOpen(true);
  }, [rootRef]);

  const moveDrag = useCallback((clientY: number) => {
    const drag = dragRef.current;
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    drag.velocity = ((clientY - drag.lastY) / elapsed) * 1000;
    drag.lastY = clientY;
    drag.lastTime = now;
    const max = getMaxHeight();
    const next = Math.max(0, Math.min(max, drag.startHeight - (clientY - drag.startY)));
    drag.currentHeight = next;
    if (drag.raf) cancelAnimationFrame(drag.raf);
    drag.raf = requestAnimationFrame(() => setHeight(next));
  }, [getMaxHeight, setHeight]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    const drag = dragRef.current;
    if (drag.currentHeight < 80) { close(); return; }
    const points = getSnapPoints();
    const sorted = [...points].sort((a, b) => a - b);
    let targetIndex = sorted.reduce(
      (best, point, i) =>
        Math.abs(point - drag.currentHeight) < Math.abs(sorted[best] - drag.currentHeight) ? i : best,
      0
    );
    // Velocity flick: > 400px/s downward = snap down one level, upward = snap up one level
    if (drag.velocity > 400 && targetIndex > 0) targetIndex--;
    if (drag.velocity < -400 && targetIndex < sorted.length - 1) targetIndex++;
    const target = sorted[targetIndex];
    if (target <= 0) { close(); } else { setHeight(target); }
  }, [close, getSnapPoints, setHeight]);

  return {
    bottomPanelOpen, setBottomPanelOpen,
    isDragging, setIsDragging,
    open, close, beginDrag, moveDrag, endDrag, setHeight,
    getSnapPoints, getMaxHeight,
  };
}
