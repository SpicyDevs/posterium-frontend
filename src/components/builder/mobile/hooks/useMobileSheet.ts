import { useState, useRef, useCallback, useEffect } from 'react';

export interface SheetState {
  height: number;
  isOpen: boolean;
  isDragging: boolean;
}

interface UseMobileSheetOptions {
  snapPoints: number[];
  peekHeight?: number;
  onOpenChange?: (open: boolean) => void;
}

export function useMobileSheet({
  snapPoints,
  peekHeight = 0,
  onOpenChange,
}: UseMobileSheetOptions) {
  const [height, setHeight] = useState(peekHeight);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const drag = useRef({
    startY: 0,
    startH: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    rafId: 0,
    pendingH: peekHeight,
  });

  const sheetRef = useRef<HTMLDivElement>(null);

  const writeHeight = useCallback((h: number) => {
    const clamped = Math.max(0, Math.round(h));
    drag.current.pendingH = clamped;
    sheetRef.current?.style.setProperty('--sh', `${clamped}px`);
  }, []);

  const snapTo = useCallback(
    (currentH: number, velocityPxPerSec: number): number => {
      const sorted = [...snapPoints].sort((a, b) => a - b);
      let best = sorted.reduce((prev, cur) =>
        Math.abs(cur - currentH) < Math.abs(prev - currentH) ? cur : prev
      );
      const idx = sorted.indexOf(best);
      if (velocityPxPerSec > 600 && idx > 0) best = sorted[idx - 1];
      if (velocityPxPerSec < -600 && idx < sorted.length - 1) best = sorted[idx + 1];
      return best;
    },
    [snapPoints]
  );

  const open = useCallback(
    (targetH?: number) => {
      const h = targetH ?? snapPoints[Math.floor(snapPoints.length / 2)];
      setHeight(h);
      writeHeight(h);
      setIsOpen(true);
      onOpenChange?.(true);
    },
    [snapPoints, writeHeight, onOpenChange]
  );

  const close = useCallback(() => {
    const h = peekHeight;
    setHeight(h);
    writeHeight(h);
    setIsOpen(false);
    onOpenChange?.(false);
  }, [peekHeight, writeHeight, onOpenChange]);

  const beginDrag = useCallback(
    (clientY: number) => {
      cancelAnimationFrame(drag.current.rafId);
      const currentH = drag.current.pendingH || height;
      drag.current = {
        startY: clientY,
        startH: currentH,
        lastY: clientY,
        lastTime: performance.now(),
        velocity: 0,
        rafId: 0,
        pendingH: currentH,
      };
      setIsDragging(true);
      if (!isOpen) {
        setIsOpen(true);
        onOpenChange?.(true);
      }
    },
    [height, isOpen, onOpenChange]
  );

  const moveDrag = useCallback(
    (clientY: number) => {
      const now = performance.now();
      const dt = Math.max(1, now - drag.current.lastTime);
      const dy = clientY - drag.current.lastY;
      drag.current.velocity = (dy / dt) * 1000;
      drag.current.lastY = clientY;
      drag.current.lastTime = now;

      const max = snapPoints[snapPoints.length - 1];
      let next = drag.current.startH - (clientY - drag.current.startY);

      if (next > max) {
        const over = next - max;
        next = max + over * 0.25;
      }
      if (next < 0) {
        next = next * 0.2;
      }

      cancelAnimationFrame(drag.current.rafId);
      drag.current.rafId = requestAnimationFrame(() => {
        writeHeight(next);
      });
    },
    [snapPoints, writeHeight]
  );

  const endDrag = useCallback(() => {
    cancelAnimationFrame(drag.current.rafId);
    setIsDragging(false);
    const currentH = drag.current.pendingH;
    const vel = drag.current.velocity;

    if (currentH < snapPoints[0] + 60 && vel > 0) {
      close();
      return;
    }

    const target = snapTo(currentH, vel);
    if (target <= 0) {
      close();
    } else {
      setHeight(target);
      writeHeight(target);
      setIsOpen(target > peekHeight);
      onOpenChange?.(target > peekHeight);
    }
  }, [snapPoints, snapTo, close, writeHeight, peekHeight, onOpenChange]);

  useEffect(() => {
    if (!isDragging) writeHeight(height);
  }, [height, isDragging, writeHeight]);

  return {
    sheetRef,
    height,
    isOpen,
    isDragging,
    open,
    close,
    beginDrag,
    moveDrag,
    endDrag,
  };
}
