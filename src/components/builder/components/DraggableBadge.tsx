// src/builder/components/DraggableBadge.tsx
//
// RENDERING FIXES vs. PREVIOUS VERSION
// ──────────────────────────────────────
// 1. SHADOW — updated CSS formula to match the new backend SVG filter formula.
// 2. BLUR — CSS `backdrop-filter: blur(Xpx)` ≈ SVG stdDeviation X/2.
// 3. BORDER — rendered as an outline layer so border width does not shrink badge content.
// 4. SCALE — badge scaling on the canvas is purely display: CSS transform.
// 5. showText — badge value text is hidden when showText === false (nt=1).
// 6. labels — labelPos/labelText/labelSize/labelColor render outside badge.
// 7. uiPreset — minimal preset applies alpha=0/radius=0/shadow=0/icon=false defaults.

import React, { useState, useRef, useEffect } from 'react';
import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';

// ── Preset defaults (mirrors backend presets/badge.js and presets/minimal.js) ──
const PRESET_DEFAULTS = {
  b: { blur: 0, alpha: 0.4, radius: 12, shadow: 6, icon: true },
  m: { blur: 0, alpha: 0.0, radius: 0, shadow: 0, icon: false },
} as const;

// ── Provider display names for default label text ──────────────────────────
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  imdb: 'IMDb',
  rt: 'Rotten Tomatoes',
  rt_popcorn: 'Audience Score',
  tmdb: 'TMDB',
  letterboxd: 'Letterboxd',
  meta: 'Metacritic',
  mal: 'MyAnimeList',
  anilist: 'AniList',
  age: 'Age Rating',
  runtime: 'Runtime',
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
  onContextMenu?: (id: RatingType, e: React.MouseEvent) => void;
  isObscuring?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
  value?: string;
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
  onContextMenu,
  isObscuring,
  onHoverChange,
  value,
}) => {
  const itemConfig = config.items[badgeId];
  const itemScale = itemConfig?.scale ?? 1.0;
  const sizeScale = getScale(config.size);
  const displayScale = itemScale * sizeScale;

  const width = BASE_BADGE_W * displayScale;
  const height = BASE_BADGE_H * displayScale;

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
      const isCtrl = 'ctrlKey' in e ? e.ctrlKey : false;
      const isMeta = 'metaKey' in e ? e.metaKey : false;
      if (isSelectedRef.current && !(isShift || isCtrl || isMeta)) {
        onSelectRef.current(badgeId, false);
      }
    }

    onDragEndRef.current(badgeId, dx, dy);
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
      onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    }
  };

  // ── Resolve preset defaults ───────────────────────────────────────────────
  // uiPreset 'm' (minimal) overrides base defaults before per-item overrides apply.
  const uiPreset = config.uiPreset ?? 'b';
  const pd = PRESET_DEFAULTS[uiPreset] ?? PRESET_DEFAULTS.b;

  // Backend precedence: preset defaults apply first, then explicit params override.
  // In builder state global fields are always populated with default values, so in
  // minimal mode we treat unchanged defaults as "not explicitly set" and keep preset
  // values, while honoring non-default globals as explicit overrides.
  const isExplicitGlobal = {
    blur: config.blur !== PRESET_DEFAULTS.b.blur,
    alpha: config.alpha !== PRESET_DEFAULTS.b.alpha,
    radius: config.radius !== PRESET_DEFAULTS.b.radius,
    shadow: config.shadow !== PRESET_DEFAULTS.b.shadow,
    icon: (config.icon ?? PRESET_DEFAULTS.b.icon) !== PRESET_DEFAULTS.b.icon,
  };

  const baseBlur = uiPreset === 'm' && !isExplicitGlobal.blur ? pd.blur : (config.blur ?? pd.blur);
  const baseAlpha =
    uiPreset === 'm' && !isExplicitGlobal.alpha ? pd.alpha : (config.alpha ?? pd.alpha);
  const baseRadius =
    uiPreset === 'm' && !isExplicitGlobal.radius ? pd.radius : (config.radius ?? pd.radius);
  const baseShadow =
    uiPreset === 'm' && !isExplicitGlobal.shadow ? pd.shadow : (config.shadow ?? pd.shadow);
  const baseIcon = uiPreset === 'm' && !isExplicitGlobal.icon ? pd.icon : (config.icon ?? pd.icon);

  // ── Visual style from config ──────────────────────────────────────────────
  const blurVal = itemConfig?.blur ?? baseBlur;
  const alphaVal = itemConfig?.alpha ?? baseAlpha;
  const radiusRaw = itemConfig?.radius ?? baseRadius;
  const radiusVal = radiusRaw * displayScale;
  const rawShadow = itemConfig?.shadow ?? baseShadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;
  const showIcon = itemConfig?.icon ?? baseIcon;
  const showTextVal = itemConfig?.showText ?? config.showText ?? true;
  const normalizeVal = itemConfig?.normalize ?? config.normalize ?? false;
  const outOfVal = itemConfig?.outOf ?? config.outOf;

  // ── Label props ───────────────────────────────────────────────────────────
  const labelPos = itemConfig?.labelPos ?? config.labelPos ?? null;
  const labelText =
    itemConfig?.labelText ??
    config.labelText ??
    PROVIDER_DISPLAY_NAMES[badgeId] ??
    badgeId.toUpperCase();
  const labelSizeRaw = itemConfig?.labelSize ?? config.labelSize ?? 11;
  const labelSizeVal = labelSizeRaw * displayScale;
  const labelColorVal = itemConfig?.labelColor ?? config.labelColor ?? '#a1a1aa';

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
  const txtColor = itemConfig?.txt || config.txt || '#ffffff';

  // ── SHADOW ────────────────────────────────────────────────────────────────
  const dropShadowFilter =
    shadowVal > 0
      ? (() => {
          const blurPx = (shadowVal * 0.5).toFixed(2);
          const dyPx = (shadowVal * 0.25 + 1.0).toFixed(2);
          const opacity = Math.min(0.65, shadowVal * 0.025 + 0.2).toFixed(3);
          return `drop-shadow(0 ${dyPx}px ${blurPx}px rgba(0,0,0,${opacity}))`;
        })()
      : '';

  const slantPattern = `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`;
  const finalBackground = isObscuring ? `${slantPattern}, ${bgFill}` : bgFill;

  const iconSize = 36 * displayScale;
  const iconLeft = 10 * displayScale;
  const iconTop = 12 * displayScale;
  const textRight = 10 * displayScale;
  const fontSize = 28 * displayScale;

  // ── Label layout helpers ──────────────────────────────────────────────────
  const LABEL_GAP = 5 * displayScale;

  const labelStyle = (pos: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      fontSize: labelSizeVal,
      color: labelColorVal,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      lineHeight: 1,
      textShadow: '0 1px 2px rgba(0,0,0,0.45)',
    };
    switch (pos) {
      case 'above':
        return {
          ...base,
          bottom: `calc(100% + ${LABEL_GAP}px)`,
          left: 0,
          right: 0,
          textAlign: 'center',
        };
      case 'below':
        return {
          ...base,
          top: `calc(100% + ${LABEL_GAP}px)`,
          left: 0,
          right: 0,
          textAlign: 'center',
        };
      case 'left':
        return {
          ...base,
          right: `calc(100% + ${LABEL_GAP}px)`,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        };
      case 'right':
        return {
          ...base,
          left: `calc(100% + ${LABEL_GAP}px)`,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
        };
      default:
        return base;
    }
  };

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
    const rawValue = (value ?? dummyVals[badgeId] ?? '0.0').trim();
    const normalized = (() => {
      if (!normalizeVal) return rawValue;
      const pct = rawValue.match(/^(-?\d+(?:\.\d+)?)%$/);
      if (pct) {
        const n = Number(pct[1]);
        if (!Number.isFinite(n)) return rawValue;
        return `${((Math.max(0, n) / 100) * 10).toFixed(1)}`;
      }
      const num = Number(rawValue);
      if (!Number.isFinite(num)) return rawValue;
      if (num > 10) return `${(num / 10).toFixed(1)}`;
      return `${num.toFixed(1)}`;
    })();
    const runtimeCompact = (() => {
      if (badgeId !== 'runtime') return normalized;
      const m = normalized.match(/^(\d+)\s*h(?:\s*(\d+)\s*m?)?$/i);
      if (!m) return normalized;
      const hh = m[1];
      const mm = (m[2] ?? '0').padStart(2, '0');
      return `${hh}:${mm}`;
    })();
    const numericDisplay = /^\d+(\.\d+)?$/.test(runtimeCompact)
      ? Number(runtimeCompact).toFixed(1)
      : runtimeCompact;
    const displayValue = numericDisplay;

    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute rounded opacity-50"
            style={{
              inset: `${2.5 * displayScale}px`,
              borderColor: txtColor,
              borderRadius: `${4 * displayScale}px`,
            }}
          />
          {showTextVal && (
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
          )}
        </div>
      );
    }

    if (!showIcon) {
      // No icon — centre the value text (or nothing if showText is off)
      return showTextVal ? (
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
          {displayValue}
        </span>
      ) : null;
    }

    const iconType = itemConfig?.iconType ?? config.iconType ?? 1;
    const iconKey =
      badgeId === 'rt'
        ? iconType > 1
          ? 'rt_rotten'
          : 'rt_fresh'
        : badgeId === 'rt_popcorn'
          ? iconType > 1
            ? 'popcorn_rotten'
            : 'popcorn_fresh'
          : badgeId;
    const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];
    const isRtPercent = (badgeId === 'rt' || badgeId === 'rt_popcorn') && /%$/.test(displayValue);
    const rtBase = isRtPercent ? displayValue.replace(/%$/, '') : displayValue;
    const valueNode =
      outOfVal && outOfVal > 0 && /^\d+(\.\d+)?$/.test(displayValue) ? (
        <span className="inline-flex items-end gap-[0.1em]">
          <span>{displayValue}</span>
          <span style={{ fontSize: '0.72em', opacity: 0.9, lineHeight: 1 }}>{`/${outOfVal}`}</span>
        </span>
      ) : isRtPercent ? (
        <span className="inline-flex items-end gap-[0.08em]">
          <span>{rtBase}</span>
          <span style={{ fontSize: '0.7em', lineHeight: 1, opacity: 0.92 }}>%</span>
        </span>
      ) : (
        displayValue
      );

    return (
      <>
        {iconData && (
          <div
            style={{
              position: 'absolute',
              left: iconLeft,
              top: iconTop,
              lineHeight: 0,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox={iconData.vb}
              width={iconSize}
              height={iconSize}
              style={{ display: 'block', color: txtColor, pointerEvents: 'none' }}
              dangerouslySetInnerHTML={{ __html: iconData.body }}
            />
          </div>
        )}
        {/* Value text — hidden when showText is false */}
        {showTextVal && (
          <span
            style={{
              position: 'absolute',
              right: textRight,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 'bold',
              color: txtColor,
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {valueNode}
          </span>
        )}
      </>
    );
  };

  const selectionDotSize = 14 * displayScale;
  const selectionDotInnerSize = 6 * displayScale;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(badgeId, e);
      }}
      className="badge-item absolute select-none cursor-move z-50"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
        // overflow visible so labels can render outside badge bounds
        overflow: 'visible',
        background: finalBackground,
        borderRadius: `${radiusVal}px`,
        boxShadow: 'none',
        filter: dropShadowFilter || 'none',
        backdropFilter: `blur(${blurVal}px)`,
        WebkitBackdropFilter: `blur(${blurVal}px)`,
        opacity: isObscuring ? 0.35 : 1,
        pointerEvents: isObscuring ? 'none' : 'auto',
        touchAction: 'none',
        transform: 'translateZ(0)',
      }}
    >
      {/* Clip inner content to badge bounds (prevents icon/text from overflowing) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${radiusVal}px`,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {renderContent()}
      </div>

      {borderWidth > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            borderRadius: `${radiusVal}px`,
            outline: `${borderWidth}px solid ${borderColor}`,
            outlineOffset: 0,
          }}
        />
      )}

      {/* Label — rendered outside the clipping div so it shows outside badge bounds */}
      {labelPos && <div style={labelStyle(labelPos)}>{labelText}</div>}

      {/* Selection dot */}
      {isSelected && (
        <div
          className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{
            top: `${-(selectionDotSize / 2)}px`,
            right: `${-(selectionDotSize / 2)}px`,
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

export default DraggableBadge;
