// src/components/DraggableBadge.tsx
import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';

interface Props {
  badgeId: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  canvasScale: number;
  onDragMove: (id: RatingType, dx: number, dy: number) => void;
  onDragEnd: (id: RatingType, dx: number, dy: number) => void;
  isSelected: boolean;
  onSelect: (id: RatingType, multi: boolean) => void;
  isObscuring?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
}

const DraggableBadge: React.FC<Props> = ({
  badgeId,
  config,
  x,
  y,
  canvasScale,
  onDragMove,
  onDragEnd,
  isSelected,
  onSelect,
  isObscuring,
  onHoverChange,
}) => {
  const itemConfig = config.items[badgeId];
  const scale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);

  // FIX: Keep mutable refs for all prop callbacks and the isSelected flag so that the
  // global drag useEffect (below) does not need them in its deps array. Without these
  // refs, the useEffect captured stale versions of the callbacks — particularly
  // problematic when onDragEnd / onSelect / isSelected change during an active drag
  // (e.g. another badge is selected while the user is dragging the current one).
  const onDragEndRef = useRef(onDragEnd);
  const onSelectRef = useRef(onSelect);
  const isSelectedRef = useRef(isSelected);
  const canvasScaleRef = useRef(canvasScale);

  // Sync refs unconditionally on every render — O(1) assignments.
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  });
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  useEffect(() => {
    isSelectedRef.current = isSelected;
  });
  useEffect(() => {
    canvasScaleRef.current = canvasScale;
  });

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { mouseX: clientX, mouseY: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const deltaX = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const deltaY = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;
    if (isFinite(deltaX) && isFinite(deltaY)) {
      onDragMove(badgeId, deltaX, deltaY);
    }
  };

  const handleEnd = (e: MouseEvent | TouchEvent) => {
    setIsDragging(false);
    if (!dragStartRef.current) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    const dx = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const dy = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;

    // Treat tiny movements (< 2 px in canvas space) as clicks, not drags.
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      const isCtrl = 'ctrlKey' in e ? e.ctrlKey : false;
      const isMeta = 'metaKey' in e ? e.metaKey : false;
      // Read from ref — always the current value regardless of when the drag started.
      if (isSelectedRef.current && !(isShift || isCtrl || isMeta)) {
        onSelectRef.current(badgeId, false);
      }
    }

    // Read from ref — always the current callback.
    onDragEndRef.current(badgeId, dx, dy);
    dragStartRef.current = null;
  };

  // FIX: deps reduced to [isDragging] only. All prop callbacks and canvasScale are
  // accessed through refs which are always current without requiring the effect to
  // re-run. Previously [isDragging, canvasScale] meant the effect re-registered
  // listeners mid-drag whenever the canvas was zoomed via pinch — briefly leaving a
  // window with no active listeners and a missed mouseup/touchend.
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e);

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => handleEnd(e);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]); // canvasScale, onDragEnd, onSelect, isSelected accessed via refs

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSelected) {
      onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    }
    handleStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isSelected) {
      onSelect(badgeId, false);
    }
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const blurVal = itemConfig?.blur ?? config.blur;
  const alphaVal = itemConfig?.alpha ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;

  const rawShadow = itemConfig?.shadow ?? config.shadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;

  const showIcon = itemConfig?.icon ?? config.icon ?? true;

  const bgRaw = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const backgroundStyle = bgRaw.startsWith('grad:')
    ? `linear-gradient(135deg, ${bgRaw.split(':')[1]}, ${bgRaw.split(':')[2]})`
    : bgRaw;

  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
    const dummyVals: Record<string, string> = {
      imdb: '8.7',
      rt: '73%',
      rt_popcorn: '88%',
      letterboxd: '4.2',
      meta: '74',
      tmdb: '85%',
      runtime: '2h 15m',
      mal: '8.5',
      anilist: '85%',
    };
    const dummyVal = dummyVals[badgeId] || '0.0';

    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute inset-0 m-2.5 border-2 rounded opacity-50"
            style={{ borderColor: txtColor }}
          ></div>
          <span
            style={{
              fontSize: `${28 * scale}px`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 'bold',
              color: txtColor,
            }}
          >
            PG-13
          </span>
        </div>
      );
    }

    if (!showIcon) {
      return (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: textTop,
            transform: 'translate(-50%, -50%)',
            fontSize: `${28 * scale}px`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 'bold',
            color: txtColor,
            lineHeight: 1,
          }}
        >
          {dummyVal}
        </span>
      );
    }

    let iconKey: string =
      badgeId === 'rt' ? 'rt_fresh' : badgeId === 'rt_popcorn' ? 'popcorn_fresh' : badgeId;
    const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];

    return (
      <>
        {iconData && (
          <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
            <svg
              viewBox={iconData.vb}
              width={iconSize}
              height={iconSize}
              style={{ display: 'block', color: txtColor }}
              dangerouslySetInnerHTML={{ __html: iconData.body }}
            />
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            right: textRight,
            top: textTop,
            transform: 'translateY(-50%)',
            fontSize: `${28 * scale}px`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 'bold',
            color: txtColor,
            lineHeight: 1,
          }}
        >
          {dummyVal}
        </span>
      </>
    );
  };

  const dropShadow =
    shadowVal > 0 ? `0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0, 0, 0, 0.5)` : '';

  const slantPattern = `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`;
  const finalBackground = isObscuring ? `${slantPattern}, ${backgroundStyle}` : backgroundStyle;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className="badge-item absolute select-none cursor-move z-50"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
        background: finalBackground,
        borderRadius: `${radiusVal}px`,
        outline: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        boxShadow: dropShadow || 'none',
        opacity: isObscuring ? 0.35 : 1,
        pointerEvents: isObscuring ? 'none' : 'auto',
        touchAction: 'none',
        transform: 'translateZ(0)',
      }}
    >
      {renderContent()}

      {isSelected && (
        <div
          className="absolute bg-indigo-500 border border-indigo-400 rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top: `${-7 * scale * 1.15}px`,
            right: `${-7 * scale * 1.15}px`,
            width: `${14 * scale * 1.15}px`,
            height: `${14 * scale * 1.15}px`,
            transition: 'none',
            willChange: 'transform, width, height, top, right',
          }}
        >
          <div
            className="bg-white"
            style={{
              width: `${6 * scale * 1.15}px`,
              height: `${6 * scale * 1.15}px`,
              borderRadius: `${1.5 * scale * 1.15}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DraggableBadge;
