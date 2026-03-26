// src/builder/components/DraggableBadge.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
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
  const globalScale = getScale(config.size) * (config.scale !== undefined ? config.scale : 1.0);
  const badgeScale  = globalScale * (itemConfig?.scale ?? 1.0);
  const width  = BASE_BADGE_W * badgeScale;
  const height = BASE_BADGE_H * badgeScale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);

  // Keep refs current without re-registering listeners
  const onDragEndRef    = useRef(onDragEnd);
  const onSelectRef     = useRef(onSelect);
  const isSelectedRef   = useRef(isSelected);
  const canvasScaleRef  = useRef(canvasScale);

  onDragEndRef.current   = onDragEnd;
  onSelectRef.current    = onSelect;
  isSelectedRef.current  = isSelected;
  canvasScaleRef.current = canvasScale;

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

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      const isCtrl  = 'ctrlKey'  in e ? e.ctrlKey  : false;
      const isMeta  = 'metaKey'  in e ? e.metaKey  : false;
      if (isSelectedRef.current && !(isShift || isCtrl || isMeta)) {
        onSelectRef.current(badgeId, false);
      }
    }

    onDragEndRef.current(badgeId, dx, dy);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp   = (e: MouseEvent) => handleEnd(e);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => handleEnd(e);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onTouchEnd);
    };
  }, [isDragging]);

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

  // ── Style values ─────────────────────────────────────────────────────────
  const blurVal   = itemConfig?.blur   ?? config.blur;
  const alphaVal  = itemConfig?.alpha  ?? config.alpha;
  const radiusVal = (itemConfig?.radius ?? config.radius) * badgeScale;

  const rawShadow = itemConfig?.shadow ?? config.shadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;

  const showIcon = itemConfig?.icon ?? config.icon ?? true;

  const rawBg = itemConfig?.bg ?? config.bg;
  const bgRaw = (() => {
    if (!rawBg) return `rgba(0,0,0,${alphaVal})`;
    if (rawBg.startsWith('grad:')) return rawBg;
    const fullHex = /^#[0-9a-fA-F]{3}$/.test(rawBg)
      ? `#${rawBg[1]}${rawBg[1]}${rawBg[2]}${rawBg[2]}${rawBg[3]}${rawBg[3]}`
      : rawBg;
    if (/^#[0-9a-fA-F]{6}$/.test(fullHex)) {
      const r = parseInt(fullHex.slice(1, 3), 16);
      const g = parseInt(fullHex.slice(3, 5), 16);
      const b = parseInt(fullHex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alphaVal})`;
    }
    return rawBg;
  })();
  const backgroundStyle = rawBg?.startsWith('grad:')
    ? `linear-gradient(135deg, ${rawBg.split(':')[1]}, ${rawBg.split(':')[2]})`
    : bgRaw;

  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  const txtColor    = itemConfig?.txt || config.txt || '#ffffff';

  // ── Drop shadow: matches backend SVG filter formula ──────────────────────
  // Backend: dy = shadowVal * 0.5, stdDev = shadowVal * 0.5, opacity ≈ 0.5
  // CSS:     0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0,0,0,0.5)
  // (blur-radius in CSS box-shadow = 2 × stdDeviation in Gaussian, hence:
  //  CSS spread = shadowVal, Gaussian stdDev = shadowVal * 0.5 → same visual)
  const dropShadow = shadowVal > 0
    ? `0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0, 0, 0, 0.5)`
    : '';

  const iconSize = 36 * badgeScale;
  const iconLeft = 10 * badgeScale;
  const iconTop  = 12 * badgeScale;

  const renderContent = () => {
    const dummyVals: Record<string, string> = {
      imdb:       '8.7',
      rt:         '73%',
      rt_popcorn: '88%',
      letterboxd: '4.2',
      meta:       '74',
      tmdb:       '85%',
      runtime:    '2h 15m',
      mal:        '8.5',
      anilist:    '85%',
    };
    const dummyVal = dummyVals[badgeId] || '0.0';
    const fontSize = badgeScale * (badgeId === 'runtime' && dummyVal.length > 5 ? 24 : 28);

    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute border-2 rounded opacity-50"
            style={{
              inset: `${10 * badgeScale}px ${15 * badgeScale}px`,
              borderColor: txtColor,
            }}
          />
          <span
            style={{
              fontSize,
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
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize,
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

    const iconKey: string =
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
            right: `${10 * badgeScale}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize,
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
        // Position: matches SVG translate(x, y)
        left:   `${x}px`,
        top:    `${y}px`,
        // Size: unscaled base dimensions — the visual scale is handled by
        // the inner scale transform on the content, matching SVG scale(s) from origin.
        width:  `${BASE_BADGE_W}px`,
        height: `${BASE_BADGE_H}px`,
        // Scale from top-left origin to match SVG `translate(x,y) scale(s)` behavior.
        // SVG scale expands rightward/downward from (x,y), so transform-origin = 0 0.
        transform:       `scale(${badgeScale})`,
        transformOrigin: '0 0',
        background:      finalBackground,
        borderRadius:    `${itemConfig?.radius ?? config.radius}px`,
        // Border: use outline (outside the box) to match SVG stroke-based rendering.
        // CSS outline does not consume space inside the element, matching the visual
        // behavior where the badge background area stays the same size.
        outline:         borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        backdropFilter:  `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        // Shadow matches backend buildShadowFilter formula exactly
        boxShadow:       dropShadow || 'none',
        opacity:         isObscuring ? 0.35 : 1,
        pointerEvents:   isObscuring ? 'none' : 'auto',
        touchAction:     'none',
      }}
    >
      {renderContent()}

      {isSelected && (
        <div
          className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top:   '-8px',
            right: '-8px',
            width:  '16px',
            height: '16px',
            // Counter-scale so the selection indicator stays the same visual size
            transform:       `scale(${1 / badgeScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div className="bg-white w-2 h-2 rounded-[2px]" />
        </div>
      )}
    </div>
  );
};

export default DraggableBadge;