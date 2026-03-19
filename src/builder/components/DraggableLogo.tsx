// src/builder/components/DraggableLogo.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive logo overlay rendered on top of the poster canvas.
//
// • Draggable - updates logoX / logoY via onDragEnd callback.
// • Mirrors the backend's bounding-box behaviour: the image fills the box with
//   object-fit: contain + center alignment (same as SVG preserveAspectRatio
//   "xMidYMid meet").
// • Shows a dashed outline so the bounding box is always visible even when the
//   logo has transparency (which is the common case for title logos).
// • On load error (Metahub 404, network failure, etc.) falls back to a labelled
//   placeholder so the user knows the logo region is still active.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import type { PosterConfig } from '../types';
import { CANVAS_WIDTH } from '../types';
import { ImageOff } from 'lucide-react';

interface Props {
  config: PosterConfig;
  /** Resolved logo image URL to preview (Metahub or similar). */
  logoUrl: string | null;
  canvasScale: number;
  /** Called once drag completes; parent applies clamped delta to logoX/logoY. */
  onDragEnd: (dx: number, dy: number) => void;
}

const DraggableLogo: React.FC<Props> = ({ config, logoUrl, canvasScale, onDragEnd }) => {
  const lw = config.logoW;
  const lh = config.logoH;

  // Auto-centre when logoX is null (matches backend logic)
  const baseX =
    config.logoX !== null && config.logoX !== undefined
      ? config.logoX
      : Math.round((CANVAS_WIDTH - lw) / 2);
  const baseY = config.logoY;

  const [isDragging, setIsDragging] = useState(false);
  const [liveOffset, setLiveOffset] = useState({ dx: 0, dy: 0 });
  const [imgError, setImgError] = useState(false);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const canvasScaleRef = useRef(canvasScale);
  const onDragEndRef = useRef(onDragEnd);

  // Keep refs current without re-registering listeners
  useEffect(() => {
    canvasScaleRef.current = canvasScale;
  });
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  });

  // Reset error state when URL changes (new media selected)
  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const calcDelta = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return { dx: 0, dy: 0 };
    return {
      dx: (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current,
      dy: (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current,
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    setLiveOffset(calcDelta(clientX, clientY));
  };

  const handleEnd = (clientX: number, clientY: number) => {
    setIsDragging(false);
    const { dx, dy } = calcDelta(clientX, clientY);
    onDragEndRef.current(dx, dy);
    setLiveOffset({ dx: 0, dy: 0 });
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMM = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMU = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTE = (e: TouchEvent) =>
      handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend', onTE);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend', onTE);
    };
  }, [isDragging]); // canvasScale / onDragEnd accessed via refs

  const renderX = baseX + liveOffset.dx;
  const renderY = baseY + liveOffset.dy;

  const dropShadow =
    config.logoShadow > 0
      ? `drop-shadow(0 ${config.logoShadow * 0.5}px ${config.logoShadow}px rgba(0,0,0,0.65))`
      : undefined;

  const startDrag = (mouseX: number, mouseY: number) => {
    setIsDragging(true);
    dragStartRef.current = { mouseX, mouseY };
  };

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }}
      className="absolute select-none cursor-move z-40"
      style={{
        left: renderX,
        top: renderY,
        width: lw,
        height: lh,
        opacity: config.logoOpacity,
        filter: dropShadow,
        touchAction: 'none',
        // Always show bounding-box outline so empty / transparent logos are editable
        outline: isDragging
          ? '1.5px dashed rgba(196,124,46,0.85)'
          : '1.5px dashed rgba(255,255,255,0.2)',
        outlineOffset: 3,
        borderRadius: 2,
        transition: isDragging ? 'none' : 'outline-color 0.15s',
      }}
    >
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt="Logo overlay preview"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain pointer-events-none"
          style={{ userSelect: 'none' }}
        />
      ) : (
        /* Placeholder shown when URL is null or img fails to load */
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 rounded">
          <ImageOff size={18} className="text-[#D4A245]/40" />
          <span className="text-[9px] font-mono text-[#D4A245]/40 uppercase tracking-widest leading-none">
            logo
          </span>
          {imgError && logoUrl && (
            <span className="text-[8px] text-red-400/50 font-mono">preview unavailable</span>
          )}
        </div>
      )}

      {/* Corner indicator when selected / dragging */}
      {isDragging && (
        <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#E8D8A8] bg-[#C47C2E]/20 border border-[#C47C2E]/30 whitespace-nowrap pointer-events-none">
          {Math.round(renderX)}, {Math.round(renderY)}
        </div>
      )}
    </div>
  );
};

export default DraggableLogo;
