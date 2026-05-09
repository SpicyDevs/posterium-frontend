import React from 'react';
import type { RatingType, PosterConfig } from '../../types';
import { BADGE_ICONS } from '../../constants';

const DUMMY_VALUES: Record<string, string> = {
  imdb: '8.7',
  rt: '73%',
  rt_popcorn: '88%',
  letterboxd: '4.2',
  meta: '74',
  tmdb: '85%',
  runtime: '2h 15m',
  year: '2026',
  title: 'Title',
  mal: '8.5',
  anilist: '85%',
};

interface BadgeContentProps {
  badgeId: RatingType;
  config: PosterConfig;
  itemConfig: PosterConfig['items'][RatingType] | undefined;
  displayScale: number;
  value?: string;
  showText: boolean;
  txtColor: string;
}

const BadgeContent: React.FC<BadgeContentProps> = ({
  badgeId,
  config,
  itemConfig,
  displayScale,
  value,
  showText,
  txtColor,
}) => {
  const normalizeVal = itemConfig?.normalize ?? config.normalize ?? false;
  const outOfVal = itemConfig?.outOf ?? config.outOf;
  const showIcon = itemConfig?.icon ?? config.icon ?? true;
  const textSize = Math.max(8, itemConfig?.textSize ?? 28) * displayScale;
  const textWeight = Math.max(100, Math.min(900, itemConfig?.textWeight ?? 700));
  const textLetterSpacing = (itemConfig?.textLetterSpacing ?? 0) * displayScale;
  const textLineHeight = itemConfig?.textLineHeight ?? 1.1;
  const textAlign = itemConfig?.textAlign ?? 'left';
  const textMaxChars = Math.max(0, itemConfig?.textMaxChars ?? 0);
  const wrapEnabled = itemConfig?.textWrapEnabled ?? true;
  const textShadowEnabled = itemConfig?.textShadowEnabled ?? false;
  const textShadowX = itemConfig?.textShadowX ?? 0;
  const textShadowY = itemConfig?.textShadowY ?? 2;
  const textShadowBlur = itemConfig?.textShadowBlur ?? 8;
  const textShadowColor = itemConfig?.textShadowColor ?? '#000000';

  const textShadow = textShadowEnabled
    ? `${textShadowX}px ${textShadowY}px ${textShadowBlur}px ${textShadowColor}`
    : 'none';

  const rawValue = (value ?? DUMMY_VALUES[badgeId] ?? '0.0').trim();
  
  const normalized = (() => {
    if (!normalizeVal) return rawValue;
    const pct = rawValue.match(/^(-?\d+(?:\.\d+)?)%$/);
    if (pct) {
      const n = Number(pct[1]);
      if (!Number.isFinite(n)) return rawValue;
      return `${((Math.max(0, n) / 100) * 10).toFixed(1).replace(/\.0$/, '')}`;
    }
    const num = Number(rawValue);
    if (!Number.isFinite(num)) return rawValue;
    if (num > 10) return `${(num / 10).toFixed(1).replace(/\.0$/, '')}`;
    return `${num.toFixed(1).replace(/\.0$/, '')}`;
  })();

  const runtimeCompact = (() => {
    if (badgeId !== 'runtime') return normalized;
    const m = normalized.match(/^(\d+)\s*h(?:\s*(\d+)\s*m?)?$/i);
    if (!m) return normalized;
    const hh = m[1];
    const mm = (m[2] ?? '0').padStart(2, '0');
    return `${hh}:${mm}`;
  })();

  const numericDisplay =
    badgeId === 'year'
      ? runtimeCompact.replace(/\.0+$/, '')
      : /^\d+(\.\d+)?$/.test(runtimeCompact)
      ? Number(runtimeCompact).toFixed(1)
      : runtimeCompact;

  const displayValue = numericDisplay;

  // Title/Year text rendering
  if (badgeId === 'title' || badgeId === 'year') {
    const truncatedValue =
      badgeId === 'title' && textMaxChars > 0 && displayValue.length > textMaxChars
        ? `${displayValue.slice(0, textMaxChars).trimEnd()}…`
        : displayValue;

    return showText ? (
      <span
        style={{
          position: 'absolute',
          left: 8 * displayScale,
          right: 8 * displayScale,
          top: badgeId === 'title' ? 8 * displayScale : '50%',
          bottom: badgeId === 'title' ? 8 * displayScale : 'auto',
          transform: badgeId === 'title' ? 'none' : 'translateY(-50%)',
          fontSize: textSize,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: textWeight,
          color: txtColor,
          lineHeight: textLineHeight,
          letterSpacing: `${textLetterSpacing}px`,
          textAlign,
          textShadow,
          whiteSpace: badgeId === 'title' ? 'normal' : 'nowrap',
          wordBreak: badgeId === 'title' ? 'break-word' : 'normal',
          overflow: badgeId === 'title' ? 'hidden' : textMaxChars > 0 ? 'hidden' : 'visible',
          textOverflow: badgeId === 'title' ? 'clip' : textMaxChars > 0 ? 'ellipsis' : 'clip',
          display: badgeId === 'title' && wrapEnabled ? '-webkit-box' : 'inline-block',
          WebkitBoxOrient: badgeId === 'title' ? 'vertical' : undefined,
          WebkitLineClamp: badgeId === 'title' && wrapEnabled ? itemConfig?.textCharHeight : undefined,
          pointerEvents: 'none',
        }}
      >
        {badgeId === 'title' ? truncatedValue : displayValue}
      </span>
    ) : null;
  }

  // Age rating
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
        {showText && (
          <span
            style={{
              fontSize: 28 * displayScale,
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

  // No icon - center text only
  if (!showIcon) {
    return showText ? (
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28 * displayScale,
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

  // Icon + value
  const iconType = Math.max(1, Math.min(3, itemConfig?.iconType ?? config.iconType ?? 1));
  const iconKey =
    badgeId === 'rt'
      ? iconType === 2
        ? 'rt_rotten'
        : 'rt_fresh'
      : badgeId === 'rt_popcorn'
      ? iconType === 2
        ? 'popcorn_rotten'
        : 'popcorn_fresh'
      : (badgeId as keyof typeof BADGE_ICONS);
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

  const iconSize = 36 * displayScale;
  const iconLeft = 10 * displayScale;
  const iconTop = 12 * displayScale;
  const textRight = 10 * displayScale;
  const fontSize = 28 * displayScale;

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
            style={{
              display: 'block',
              color: txtColor,
              pointerEvents: 'none',
              filter: iconType === 3 ? 'grayscale(1) contrast(1.15)' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: iconData.body }}
          />
        </div>
      )}
      {showText && (
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

export default BadgeContent;