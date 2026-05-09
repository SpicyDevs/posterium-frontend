import { useState, useRef, useEffect, useCallback } from 'react';

const ZOOM_SENSITIVITY = 0.004;

interface UseCanvasZoomProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export default function useCanvasZoom({ containerRef }: UseCanvasZoomProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
      setZoom((z) => Math.max(0.2, Math.min(z * factor, 4)));
    } else {
      let dx = e.deltaX,
        dy = e.deltaY;
      if (e.shiftKey) {
        dx = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        dy = 0;
      }
      setIsPanning(true);
      setPan((p) => ({
        x: p.x - dx * 0.85,
        y: p.y - dy * 0.85,
      }));
      if (panFadeTimer.current) clearTimeout(panFadeTimer.current);
      panFadeTimer.current = setTimeout(() => setIsPanning(false), 150);
    }
  }, []);

  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastDist.current;
      setZoom((z) => Math.max(0.2, Math.min(z * delta, 4)));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastPan.current && isPanning) {
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isPanning]);

  const handleTouchEnd = useCallback(() => {
    lastDist.current = null;
    lastPan.current = null;
    setIsPanning(false);
  }, []);

  return {
    zoom,
    pan,
    setPan,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
  };
}