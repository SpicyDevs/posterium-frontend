// src/builder/components/DraggableBadge.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';

// Dummy values shown when real ratings have not yet loaded
const DUMMY_VALS: Record<string, string> = {
  imdb:       '8.7',
  rt:         '73%',
  rt_popcorn: '88%',
  letterboxd: '4.2',
  meta:       '74',
  tmdb:       '85%',
  runtime:    '2h 15m',
  mal:        '8.5',
  anilist:    '85%',
  age:        'PG-13',
};

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
  /** Live rating value from the API (e.g. "8.5", "73%", "PG-13"). */
  liveRating?: string;
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
  liveRating,
}) => {
  const itemConfig = config.items[badgeId];
  const scale  = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width  = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);

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
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
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

  // ── Resolve the display value ─────────────────────────────────────────────
  // Use the live API rating if available; otherwise show a plausible dummy.
  const displayVal = liveRating ?? DUMMY_VALS[badgeId] ?? '—';
  const isLive     = !!liveRating;

  // ── Badge style resolution ────────────────────────────────────────────────
  const blurVal   = itemConfig?.blur   ?? config.blur;
  const alphaVal  = itemConfig?.alpha  ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;

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
  const txtColor    = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop  = 12 * scale;
  const textRight = 10 * scale;
  const textTop   = '50%';

  // ── Icon key — use live value to determine fresh/rotten accurately ────────
  let iconKey: string = badgeId;
  if (badgeId === 'rt') {
    const pct = parseInt(displayVal);
    iconKey = (!isNaN(pct) && pct >= 60) ? 'rt_fresh' : 'rt_rotten';
  } else if (badgeId === 'rt_popcorn') {
    const pct = parseInt(displayVal);
    iconKey = (!isNaN(pct) && pct >= 60) ? 'popcorn_fresh' : 'popcorn_rotten';
  }

  const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];

  const renderContent = () => {
    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute inset-0 m-2.5 border-2 rounded opacity-50"
            style={{ borderColor: txtColor }}
          />
          <span
            style={{
              fontSize: `${Math.min(28, (displayVal.length > 4 ? 22 : 28)) * scale}px`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 'bold',
              color: txtColor,
            }}
          >
            {displayVal}
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
          {displayVal}
        </span>
      );
    }

    const isRuntime = badgeId === 'runtime';
    const hasIcon   = showIcon && iconData;

    if (hasIcon) {
      let fSize = 28;
      if (isRuntime && displayVal.length > 5) fSize = 22;
      else if (displayVal.length > 5) fSize = 24;

      return (
        <>
          <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
            <svg
              viewBox={iconData.vb}
              width={iconSize}
              height={iconSize}
              style={{ display: 'block', color: txtColor }}
              dangerouslySetInnerHTML={{ __html: iconData.body }}
            />
          </div>
          <span
            style={{
              position: 'absolute',
              right: textRight,
              top: textTop,
              transform: 'translateY(-50%)',
              fontSize: `${fSize * scale}px`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 'bold',
              color: txtColor,
              lineHeight: 1,
            }}
          >
            {displayVal}
          </span>
        </>
      );
    }

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
        {displayVal}
      </span>
    );
  };

  const dropShadow     = shadowVal > 0
    ? `0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0,0,0,0.5)` : '';
  const slantPattern   = `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`;
  const finalBackground = isObscuring ? `${slantPattern}, ${backgroundStyle}` : backgroundStyle;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className="badge-item absolute select-none cursor-move z-50"
      style={{
        width:            `${width}px`,
        height:           `${height}px`,
        left:             `${x}px`,
        top:              `${y}px`,
        background:       finalBackground,
        borderRadius:     `${radiusVal}px`,
        outline:          borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        backdropFilter:   `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        boxShadow:        dropShadow || 'none',
        opacity:          isObscuring ? 0.35 : 1,
        pointerEvents:    isObscuring ? 'none' : 'auto',
        touchAction:      'none',
        transform:        'translateZ(0)',
        transition:       isDragging ? 'none' : 'box-shadow 0.15s',
      }}
    >
      {renderContent()}

      {/* Selection handle */}
      {isSelected && (
        <div
          className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top:    `${-7 * scale * 1.15}px`,
            right:  `${-7 * scale * 1.15}px`,
            width:  `${14 * scale * 1.15}px`,
            height: `${14 * scale * 1.15}px`,
          }}
        >
          <div
            className="bg-white"
            style={{
              width:        `${6 * scale * 1.15}px`,
              height:       `${6 * scale * 1.15}px`,
              borderRadius: `${1.5 * scale * 1.15}px`,
            }}
          />
        </div>
      )}

      {/* Live indicator dot — subtle pulse when real data is showing */}
      {isLive && !isObscuring && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom:       `${2 * scale}px`,
            left:         `${5 * scale}px`,
            width:        `${4 * scale}px`,
            height:       `${4 * scale}px`,
            borderRadius: '50%',
            background:   '#4ade80',
            opacity:      0.8,
          }}
        />
      )}
    </div>
  );
};

export default DraggableBadge;