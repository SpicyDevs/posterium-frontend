import React, { useState, useRef, useEffect } from 'react';
import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';
import BadgeContent from './draggable-badge/BadgeContent';
import BadgeLabel from './draggable-badge/BadgeLabel';
import SelectionDot from './draggable-badge/SelectionDot';
import { resolveShadow, calculateBadgeSize } from '../utils/badge';
import { toRgba } from '../utils/color';

const PRESET_DEFAULTS = {
  b: { blur: 0, alpha: 0.4, radius: 12, shadow: 6, icon: true },
  m: { blur: 0, alpha: 0.0, radius: 0, shadow: 0, icon: false },
} as const;

const TITLE_ACCENT_MIN_RADIUS = 6;

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
  year: 'Year',
  title: 'Title',
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
  zIndex?: number;
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
  zIndex,
}) => {
  const itemConfig = config.items[badgeId];
  const itemScale = itemConfig?.scale ?? config.scale ?? 1.0;
  const sizeScale = getScale(config.size);
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

    const moveThreshold = 2;
    if (Math.abs(dx) < moveThreshold && Math.abs(dy) < moveThreshold) {
      onDragEndRef.current(badgeId, 0, 0);
    } else {
      onDragEndRef.current(badgeId, dx, dy);
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
      onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    }
  };

  const uiPreset = config.uiPreset ?? 'b';
  const pd = PRESET_DEFAULTS[uiPreset] ?? PRESET_DEFAULTS.b;

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

  const blurVal = itemConfig?.blur ?? baseBlur;
  const alphaVal = itemConfig?.alpha ?? baseAlpha;
  const radiusRaw = itemConfig?.radius ?? baseRadius;
  const radiusVal = radiusRaw * displayScale;
  const rawShadow = itemConfig?.shadow ?? baseShadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;
  const showIcon = itemConfig?.icon ?? baseIcon;
  const showTextVal = itemConfig?.showText ?? config.showText ?? true;

  const labelPos = itemConfig?.labelPos ?? config.labelPos ?? null;
  const labelText =
    itemConfig?.labelText ??
    config.labelText ??
    PROVIDER_DISPLAY_NAMES[badgeId] ??
    badgeId.toUpperCase();
  const labelSizeRaw = itemConfig?.labelSize ?? config.labelSize ?? 11;
  const labelSizeVal = labelSizeRaw * displayScale;
  const labelColorVal = itemConfig?.labelColor ?? config.labelColor ?? '#a1a1aa';

  const rawBg = itemConfig?.bg ?? config.bg;
  const bgFill = (() => {
    if (!rawBg) return `rgba(0,0,0,${alphaVal})`;
    if (rawBg.startsWith('grad:')) {
      const [, c1, c2] = rawBg.split(':');
      return `linear-gradient(135deg, ${c1}, ${c2 || c1})`;
    }
    return `rgba(0,0,0,${alphaVal})`;
  })();

  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  const txtColor = itemConfig?.txt || config.txt || '#ffffff';

  const shadowX = itemConfig?.shadowX ?? config.shadowX ?? 0;
  const shadowY = itemConfig?.shadowY ?? config.shadowY ?? 2;
  const shadowColor = itemConfig?.shadowColor ?? config.shadowColor ?? '#000000';
  const shadowOpacity =
    itemConfig?.shadowOpacity ??
    config.shadowOpacity ??
    Math.min(0.65, shadowVal * 0.025 + 0.2);
  const dropShadowFilter =
    shadowVal > 0
      ? `drop-shadow(${shadowX}px ${shadowY}px ${(shadowVal * 0.5).toFixed(2)}px ${toRgba(
          shadowColor,
          Number(Math.max(0, Math.min(1, shadowOpacity)).toFixed(3))
        )})`
      : '';

  const slantPattern = `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`;
  const finalBackground = isObscuring ? `${slantPattern}, ${bgFill}` : bgFill;

  const { w: width, h: height } = calculateBadgeSize(
    badgeId,
    config,
    itemConfig,
    displayScale,
    value
  );

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
      className="badge-item absolute select-none cursor-move"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        left: `${x}px`,
        top: `${y}px`,
        zIndex: zIndex ?? 120,
        overflow: 'visible',
        boxShadow: 'none',
        opacity: isObscuring ? 0.35 : 1,
        pointerEvents: isObscuring ? 'none' : 'auto',
        touchAction: 'none',
        transform: 'translateZ(0)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${radiusVal}px`,
          background: finalBackground,
          filter: dropShadowFilter || 'none',
          backdropFilter: `blur(${blurVal}px)`,
          WebkitBackdropFilter: `blur(${blurVal}px)`,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${radiusVal}px`,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <BadgeContent
            badgeId={badgeId}
            config={config}
            itemConfig={itemConfig}
            displayScale={displayScale}
            value={value}
            showText={showTextVal}
            txtColor={txtColor}
          />
        </div>
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
      {badgeId === 'title' && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            borderRadius: `${Math.max(radiusVal, TITLE_ACCENT_MIN_RADIUS)}px`,
            border: '1px dotted rgba(196,124,46,0.4)',
          }}
        />
      )}

      {labelPos && (
        <BadgeLabel
          position={labelPos}
          text={labelText}
          size={labelSizeVal}
          color={labelColorVal}
        />
      )}

      {isSelected && (
        <SelectionDot size={selectionDotSize} innerSize={selectionDotInnerSize} />
      )}
    </div>
  );
};

export default DraggableBadge;