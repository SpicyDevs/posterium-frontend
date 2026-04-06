// src/components/builder/components/DraggableLogo.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { PosterConfig } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { ImageOff, Move } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { snapToGridSize } from '../utils';

interface Props {
  config: PosterConfig;
  logoUrl: string | null;
  canvasScale: number;
  onDragEnd: (dx: number, dy: number) => void;
  onLogoLoad?: (naturalW: number, naturalH: number) => void;
}

const DraggableLogo: React.FC<Props> = ({
  config,
  logoUrl,
  canvasScale,
  onDragEnd,
  onLogoLoad,
}) => {
  const { viewOptions } = useEditor();
  const lw = config.logoW,
    lh = config.logoH;
  const baseX =
    config.logoX !== null && config.logoX !== undefined
      ? config.logoX
      : Math.round((CANVAS_WIDTH - lw) / 2);
  const baseY = config.logoY;
  const [isDragging, setIsDragging] = useState(false);
  const [liveOffset, setLiveOffset] = useState({ dx: 0, dy: 0 });
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const canvasScaleRef = useRef(canvasScale);
  const onDragEndRef = useRef(onDragEnd);
  canvasScaleRef.current = canvasScale;
  onDragEndRef.current = onDragEnd;
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
  const handleMove = (clientX: number, clientY: number) =>
    setLiveOffset(calcDelta(clientX, clientY));
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
  }, [isDragging]);
  const snapVal = (val: number) => (viewOptions?.snapToGrid ? snapToGridSize(val) : val);
  const renderX = snapVal(baseX + liveOffset.dx),
    renderY = snapVal(baseY + liveOffset.dy);
  const centreX = CANVAS_WIDTH / 2,
    centreY = CANVAS_HEIGHT / 2,
    snapTolerance = 8;
  const nearCentreX = isDragging && Math.abs(renderX + lw / 2 - centreX) < snapTolerance;
  const nearCentreY = isDragging && Math.abs(renderY + lh / 2 - centreY) < snapTolerance;
  const dropShadow =
    config.logoShadow > 0
      ? `drop-shadow(0 ${config.logoShadow * 0.5}px ${config.logoShadow}px rgba(0,0,0,0.65))`
      : undefined;
  const startDrag = (mouseX: number, mouseY: number) => {
    setIsDragging(true);
    dragStartRef.current = { mouseX, mouseY };
  };
  const isVisible = isHovered || isDragging;
  return (
    <>
      {nearCentreX && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            left: centreX,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(196,124,46,0.8)',
            transform: 'translateX(-50%)',
          }}
        />
      )}
      {nearCentreY && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            top: centreY,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(196,124,46,0.8)',
            transform: 'translateY(-50%)',
          }}
        />
      )}
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="absolute select-none cursor-move z-40"
        style={{
          left: renderX,
          top: renderY,
          width: lw,
          height: lh,
          opacity: config.logoOpacity,
          filter: dropShadow,
          touchAction: 'none',
          outline: isDragging
            ? '1.5px dashed rgba(196,124,46,0.9)'
            : isHovered
              ? '1.5px dashed rgba(255,255,255,0.35)'
              : '1.5px dashed rgba(255,255,255,0.12)',
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
            onLoad={(e) => {
              const img = e.currentTarget;
              onLogoLoad?.(img.naturalWidth, img.naturalHeight);
            }}
            className="w-full h-full object-contain pointer-events-none"
            style={{ userSelect: 'none' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 rounded">
            <ImageOff size={18} className="text-[#D4A245]/40" />
            <span className="text-[9px] font-mono text-[#D4A245]/40 uppercase tracking-widest leading-none">
              logo
            </span>
            {imgError && logoUrl && (
              <span className="text-[8px] text-red-400/50 font-mono leading-none">unavailable</span>
            )}
          </div>
        )}
        {isVisible && !imgError && (
          <div
            className="absolute bottom-0 right-0 rounded-tl pointer-events-none flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              background: 'rgba(196,124,46,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Move size={10} className="text-white" />
          </div>
        )}
      </div>
      {isDragging && (
        <div
          className="absolute pointer-events-none z-50"
          style={{ left: renderX, top: renderY - 28 }}
        >
          <div className="px-2 py-1 rounded text-[10px] font-mono text-[#E8D8A8] bg-[#0d0d0f]/90 border border-[#C47C2E]/30 whitespace-nowrap shadow-lg">
            {Math.round(renderX)}, {Math.round(renderY)} · {lw}×{lh}
          </div>
        </div>
      )}
    </>
  );
};

export default DraggableLogo;
