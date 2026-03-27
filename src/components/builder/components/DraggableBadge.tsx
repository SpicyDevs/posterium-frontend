// src/builder/components/DraggableBadge.tsx
//
// RENDERING FIXES vs. PREVIOUS VERSION
// ──────────────────────────────────────
// 1. SHADOW — updated CSS formula to match the new backend SVG filter formula
//    in filters.js:
//      stdDev  = val * 0.25   → CSS blur = stdDev * 2 = val * 0.50
//      dy      = val * 0.25 + 1.0
//      opacity = min(0.65, val * 0.025 + 0.20)
//    CSS: `filter: drop-shadow(0 ${dy}px ${val*0.5}px rgba(0,0,0,${opacity}))`
//    Note: CSS `drop-shadow` is used instead of `box-shadow` because it follows
//    the element's shape (including rounded corners and transparency), matching
//    SVG filter behaviour. `box-shadow: 0 _ _ -1px` was the old formula that
//    produced the "3D card" look — removed.
//
// 2. BLUR — CSS `backdrop-filter: blur(Xpx)` ≈ SVG stdDeviation X/2.
//    The backend now uses stdDeviation = blur/2 to match. Here on the canvas
//    we keep the raw CSS blur value (no /2) because we ARE using backdrop-filter.
//    The result should match the SVG output after the backend normalisation.
//
// 3. BORDER — changed from CSS `outline` to `box-shadow inset` approach.
//    CSS `outline` adds outside the element and does NOT reduce the inner area,
//    whereas SVG `stroke` is centered on the element boundary (half inside, half
//    outside for a non-zero stroke-width).
//    To closely match SVG behaviour: use `box-shadow: inset 0 0 0 ${w}px ${color}`
//    which renders entirely inside the element boundary, similar to SVG stroke.
//
// 4. SCALE — badge scaling on the canvas is purely display: CSS transform.
//    The raw item.scale value (NOT multiplied by getScale(size)) is what gets
//    sent to the backend. The canvas multiplies by getScale(size) for display only.
//
// 5. REF SYNC — useEffect replaced by direct render-body assignment (no change
//    in behaviour, just more explicit about why we do it).

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
  // Canvas display scale = user-set item.scale * size-scale
  // This is ONLY for canvas rendering; the URL sends item.scale alone.
  const itemScale   = itemConfig?.scale ?? 1.0;
  const sizeScale   = getScale(config.size);
  const displayScale = itemScale * sizeScale;

  const width  = BASE_BADGE_W * displayScale;
  const height = BASE_BADGE_H * displayScale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);

  // Keep refs current without re-registering listeners
  const onDragEndRef   = useRef(onDragEnd);
  const onSelectRef    = useRef(onSelect);
  const isSelectedRef  = useRef(isSelected);
  const canvasScaleRef = useRef(canvasScale);

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
    const onMM = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMU = (e: MouseEvent) => handleEnd(e);
    const onTM = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTE = (e: TouchEvent) => handleEnd(e);

    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup',   onMU);
    window.addEventListener('touchmove', onTM, { passive: false });
    window.addEventListener('touchend',  onTE);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup',   onMU);
      window.removeEventListener('touchmove', onTM);
      window.removeEventListener('touchend',  onTE);
    };
  }, [isDragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSelected) onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    handleStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isSelected) onSelect(badgeId, false);
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  // ── Visual style from config ──────────────────────────────────────────────
  const blurVal   = itemConfig?.blur   ?? config.blur;
  const alphaVal  = itemConfig?.alpha  ?? config.alpha;
  const radiusVal = (itemConfig?.radius ?? config.radius) * displayScale; // scale radius proportionally
  const rawShadow = itemConfig?.shadow ?? config.shadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;
  const showIcon  = itemConfig?.icon ?? config.icon ?? true;

  // Background
  const rawBg = itemConfig?.bg ?? config.bg;
  const bgFill = (() => {
    if (!rawBg) return `rgba(0,0,0,${alphaVal})`;
    if (rawBg.startsWith('grad:')) {
      const [, c1, c2] = rawBg.split(':');
      return `linear-gradient(135deg, ${c1}, ${c2 || c1})`;
    }
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

  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  const txtColor    = itemConfig?.txt || '#ffffff';

  // ── SHADOW: matched to backend SVG filter formula ─────────────────────────
  // Backend (filters.js):
  //   stdDev = val * 0.25
  //   dy     = val * 0.25 + 1.0
  //   slope  = min(0.65, val * 0.025 + 0.20)
  // CSS equivalent (CSS blur ≈ 2 × SVG stdDev):
  //   blur   = val * 0.5 px  (= stdDev * 2)
  //   offset = dy = val * 0.25 + 1.0 px
  //   alpha  = slope
  // Using filter:drop-shadow instead of box-shadow to avoid the "3D card" look
  // that box-shadow produces (it doesn't follow the element's actual shape).
  const dropShadowFilter = shadowVal > 0
    ? (() => {
        const blurPx  = (shadowVal * 0.5).toFixed(2);
        const dyPx    = (shadowVal * 0.25 + 1.0).toFixed(2);
        const opacity = Math.min(0.65, shadowVal * 0.025 + 0.20).toFixed(3);
        return `drop-shadow(0 ${dyPx}px ${blurPx}px rgba(0,0,0,${opacity}))`;
      })()
    : '';

  // ── BORDER: use box-shadow inset to mimic SVG stroke (stays inside boundary) ──
  // SVG stroke is centered on the element edge (half inside/outside). CSS `outline`
  // is entirely OUTSIDE, causing size mismatch. `box-shadow inset` stays inside,
  // more closely matching SVG stroke visual weight.
  const borderBoxShadow = borderWidth > 0
    ? `inset 0 0 0 ${borderWidth}px ${borderColor}`
    : '';

  const slantPattern = `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`;
  const finalBackground = isObscuring ? `${slantPattern}, ${bgFill}` : bgFill;

  // Scale badge icon/font sizes proportionally
  const iconSize  = 36 * displayScale;
  const iconLeft  = 10 * displayScale;
  const iconTop   = 12 * displayScale;
  const textRight = 10 * displayScale;
  const fontSize  = 28 * displayScale;

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

    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute border-2 rounded opacity-50"
            style={{
              inset: `${2.5 * displayScale}px`,
              borderColor: txtColor,
              borderRadius: `${4 * displayScale}px`,
            }}
          />
          <span style={{ fontSize, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor }}>
            PG-13
          </span>
        </div>
      );
    }

    if (!showIcon) {
      return (
        <span style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize, fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 'bold', color: txtColor, lineHeight: 1,
        }}>
          {dummyVal}
        </span>
      );
    }

    const iconKey  = badgeId === 'rt' ? 'rt_fresh' : badgeId === 'rt_popcorn' ? 'popcorn_fresh' : badgeId;
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
        <span style={{
          position: 'absolute', right: textRight, top: '50%',
          transform: 'translateY(-50%)',
          fontSize, fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 'bold', color: txtColor, lineHeight: 1,
        }}>
          {dummyVal}
        </span>
      </>
    );
  };

  const selectionDotSize = 14 * displayScale;
  const selectionDotInnerSize = 6 * displayScale;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className="badge-item absolute select-none cursor-move z-50"
      style={{
        width:          `${width}px`,
        height:         `${height}px`,
        left:           `${x}px`,
        top:            `${y}px`,
        background:     finalBackground,
        borderRadius:   `${radiusVal}px`,
        // FIX: box-shadow inset for border (matches SVG stroke better than outline)
        boxShadow:      [borderBoxShadow].filter(Boolean).join(', ') || 'none',
        // FIX: drop-shadow filter for shadow (matches SVG filter formula)
        filter:         dropShadowFilter || 'none',
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        opacity:        isObscuring ? 0.35 : 1,
        pointerEvents:  isObscuring ? 'none' : 'auto',
        touchAction:    'none',
        transform:      'translateZ(0)',
      }}
    >
      {renderContent()}

      {isSelected && (
        <div
          className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top:    `${-(selectionDotSize / 2)}px`,
            right:  `${-(selectionDotSize / 2)}px`,
            width:  `${selectionDotSize}px`,
            height: `${selectionDotSize}px`,
          }}
        >
          <div
            className="bg-white"
            style={{
              width:        `${selectionDotInnerSize}px`,
              height:       `${selectionDotInnerSize}px`,
              borderRadius: `${1.5 * displayScale}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DraggableBadge;