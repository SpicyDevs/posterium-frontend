import React, { useState, useRef, useEffect } from 'react';
import type { PosterConfig } from '../types';
import { getScale } from '../utils/positioning';
import { useEditor } from '../EditorContext';

interface Props {
  config: PosterConfig;
  canvasScale: number;
  isSelected: boolean;
  onSelect: (multi: boolean) => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: (dx: number, dy: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragOffsetX?: number;
  dragOffsetY?: number;
}

const DraggableTitle: React.FC<Props> = ({
  config,
  canvasScale,
  isSelected,
  onSelect,
  onDragMove,
  onDragEnd,
  onContextMenu,
  dragOffsetX = 0,
  dragOffsetY = 0,
}) => {
  const { liveTitle } = useEditor();
  const itemConfig = config.items.title;
  const sizeScale = getScale(config.size);
  const itemScale = itemConfig?.scale ?? config.scale ?? 1.0;
  const displayScale = itemScale * sizeScale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const onDragEndRef = useRef(onDragEnd);
  const onSelectRef = useRef(onSelect);
  const isSelectedRef = useRef(isSelected);
  const canvasScaleRef = useRef(canvasScale);

  onDragEndRef.current = onDragEnd;
  onSelectRef.current = onSelect;
  isSelectedRef.current = isSelected;
  canvasScaleRef.current = canvasScale;

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { mouseX: clientX, mouseY: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const deltaX = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const deltaY = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      hasDraggedRef.current = true;
    }
    if (isFinite(deltaX) && isFinite(deltaY)) {
      onDragMove(deltaX, deltaY);
    }
  };

  const handleEnd = (e: MouseEvent | TouchEvent) => {
    setIsDragging(false);
    if (!dragStartRef.current) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const dx = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const dy = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      const isCtrl = 'ctrlKey' in e ? e.ctrlKey : false;
      const isMeta = 'metaKey' in e ? e.metaKey : false;
      if (isSelectedRef.current && !(isShift || isCtrl || isMeta)) {
        onSelectRef.current(false);
      }
    }
    const moveThreshold = 2;
    if (Math.abs(dx) < moveThreshold && Math.abs(dy) < moveThreshold) {
      onDragEndRef.current(0, 0);
    } else {
      onDragEndRef.current(dx, dy);
    }
    dragStartRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMM = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMU = (e: MouseEvent) => handleEnd(e);
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTE = (e: TouchEvent) => handleEnd(e);
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

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDraggedRef.current) return;
    if (!isSelected) {
      onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
    }
  };

  // ── Title style from config ──────────────────────────────────────────────
  const textSize = Math.max(8, itemConfig?.textSize ?? 48) * displayScale;
  const textWeight = Math.max(100, Math.min(900, itemConfig?.textWeight ?? 800));
  const textLetterSpacing = (itemConfig?.textLetterSpacing ?? 0) * displayScale;
  const textLineHeight = itemConfig?.textLineHeight ?? 1.1;
  const textAlign = itemConfig?.textAlign ?? 'left';
  const txtColor = itemConfig?.txt || config.txt || '#ffffff';
  const textMaxChars = Math.max(0, itemConfig?.textMaxChars ?? 0);
  const wrapEnabled = itemConfig?.textWrapEnabled ?? true;
  const approxCharPx = Math.max(1, textSize * 0.54 + Math.max(0, textLetterSpacing));
  const legacyWidthPx = itemConfig?.textBoxWidth;
  const legacyFromPx =
    legacyWidthPx && legacyWidthPx > 120
      ? Math.max(4, Math.round((legacyWidthPx - 16 * displayScale) / approxCharPx))
      : undefined;
  const titleCharWidth = Math.max(
    4,
    Math.min(80, Math.round(itemConfig?.textCharWidth ?? legacyFromPx ?? 24))
  );
  const legacyHeightPx = itemConfig?.textBoxHeight;
  const legacyMaxLinesRaw = Math.round(itemConfig?.textMaxLines ?? 0);
  const legacyHeightLines =
    legacyHeightPx && legacyHeightPx > 16 ? Math.max(1, Math.round(legacyHeightPx / 36)) : undefined;
  const titleCharHeight = Math.max(
    1,
    Math.min(12, Math.round(itemConfig?.textCharHeight ?? legacyHeightLines ?? (legacyMaxLinesRaw > 0 ? legacyMaxLinesRaw : 1)))
  );

  const rawTitle = (liveTitle || 'Title').trim();
  const truncatedTitle =
    textMaxChars > 0 && rawTitle.length > textMaxChars
      ? `${rawTitle.slice(0, textMaxChars).trimEnd()}…`
      : rawTitle;

  const dynamicWidth = Math.max(120, Math.round(titleCharWidth * approxCharPx + 16 * displayScale));
  const titleCharsPerLine = Math.max(
    1,
    Math.floor((Math.max(dynamicWidth, 1) - 16 * displayScale) / approxCharPx)
  );
  const titleEstimatedLines = Math.max(1, Math.ceil(Math.max(truncatedTitle.length, 1) / titleCharsPerLine));
  const titleRenderedLines = wrapEnabled ? Math.min(titleEstimatedLines, titleCharHeight) : 1;
  const contentHeight = Math.max(
    32,
    Math.ceil(titleRenderedLines * textSize * textLineHeight + 16 * displayScale)
  );

  const textShadowEnabled = itemConfig?.textShadowEnabled ?? false;
  const textShadow =
    textShadowEnabled
      ? `${itemConfig?.textShadowX ?? 0}px ${itemConfig?.textShadowY ?? 2}px ${
          itemConfig?.textShadowBlur ?? 8
        }px ${itemConfig?.textShadowColor ?? '#000000'}`
      : 'none';

  const verticalAnchor = itemConfig?.verticalAnchor ?? 'top';

  const selectionDotSize = 14 * displayScale;
  const selectionDotInnerSize = 6 * displayScale;

  const x = (itemConfig?.x ?? 25) + dragOffsetX;
  const y = (itemConfig?.y ?? 100) + dragOffsetY;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      className="badge-item absolute select-none cursor-move"
      style={{
        width: `${dynamicWidth}px`,
        height: `${contentHeight}px`,
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 130,
        overflow: 'visible',
        pointerEvents: 'auto',
        touchAction: 'none',
        transform: 'translateZ(0)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: verticalAnchor === 'bottom' ? 8 * displayScale : 8 * displayScale,
          right: 8 * displayScale,
          top: verticalAnchor === 'bottom' ? 'auto' : 8 * displayScale,
          bottom: verticalAnchor === 'bottom' ? 8 * displayScale : 'auto',
          fontSize: textSize,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: textWeight,
          color: txtColor,
          lineHeight: textLineHeight,
          letterSpacing: `${textLetterSpacing}px`,
          textAlign,
          textShadow,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          overflow: 'hidden',
          textOverflow: 'clip',
          paddingBottom: `${4 * displayScale}px`,
          display: wrapEnabled ? '-webkit-box' : 'inline-block',
          WebkitBoxOrient: wrapEnabled ? 'vertical' : undefined,
          WebkitLineClamp: wrapEnabled ? titleCharHeight : undefined,
          pointerEvents: 'none',
        }}
      >
        {truncatedTitle}
      </span>

      {isSelected && (
        <div
          className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top: `${8 * displayScale - selectionDotSize / 2}px`,
            right: `${8 * displayScale - selectionDotSize / 2}px`,
            width: `${selectionDotSize}px`,
            height: `${selectionDotSize}px`,
          }}
        >
          <div
            className="bg-white"
            style={{
              width: `${selectionDotInnerSize}px`,
              height: `${selectionDotInnerSize}px`,
              borderRadius: `${1.5 * displayScale}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DraggableTitle;
