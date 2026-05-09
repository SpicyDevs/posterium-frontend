import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from './index';

/**
 * Resolve shadow value - handles legacy boolean format
 */
export const resolveShadow = (v: number | boolean | undefined, fallback: number): number => {
  if (v === undefined) return fallback;
  if (typeof v === 'boolean') return v ? 6 : 0;
  return v;
};

/**
 * Calculate badge dimensions with text wrapping
 */
export const calculateBadgeSize = (
  id: RatingType,
  config: PosterConfig,
  itemCfg: PosterConfig['items'][RatingType] | undefined,
  displayScale: number,
  baseValue?: string
): { w: number; h: number } => {
  const h = BASE_BADGE_H * displayScale;
  const textSize = Math.max(8, itemCfg?.textSize ?? 28) * displayScale;
  const textLetterSpacing = (itemCfg?.textLetterSpacing ?? 0) * displayScale;
  const textMaxChars = Math.max(0, itemCfg?.textMaxChars ?? 0);
  const textLineHeight = itemCfg?.textLineHeight ?? 1.1;

  if (id !== 'title' && id !== 'year') return { w: BASE_BADGE_W * displayScale, h };

  const raw = (baseValue ?? '').trim();
  const fallback = id === 'year' ? '2026' : 'Title';
  const measured = raw.length > 0 ? raw : fallback;
  const shown =
    id === 'title' && textMaxChars > 0 && measured.length > textMaxChars
      ? `${measured.slice(0, textMaxChars).trimEnd()}…`
      : measured;

  if (id === 'title') {
    const approxCharPx = Math.max(1, textSize * 0.54 + Math.max(0, textLetterSpacing));
    const legacyWidthPx = itemCfg?.textBoxWidth;
    const legacyFromPx =
      legacyWidthPx && legacyWidthPx > 120
        ? Math.max(4, Math.round((legacyWidthPx - 16 * displayScale) / approxCharPx))
        : undefined;
    const charWidth = Math.max(
      4,
      Math.min(80, Math.round(itemCfg?.textCharWidth ?? legacyFromPx ?? 24))
    );
    const legacyHeightPx = itemCfg?.textBoxHeight;
    const legacyHeightLines =
      legacyHeightPx && legacyHeightPx > 16 ? Math.max(1, Math.round(legacyHeightPx / 36)) : undefined;
    const charHeight = Math.max(
      1,
      Math.min(
        12,
        Math.round(itemCfg?.textCharHeight ?? legacyHeightLines ?? 1)
      )
    );

    const w = Math.max(120, Math.round(charWidth * approxCharPx + 16 * displayScale));
    const titleHeight = Math.max(
      32,
      Math.round(charHeight * textSize * textLineHeight + 16 * displayScale)
    );
    return { w, h: titleHeight };
  }

  const w = Math.max(
    BASE_BADGE_W * displayScale,
    Math.ceil(shown.length * (textSize * 0.62 + textLetterSpacing) + 28 * displayScale)
  );
  return { w, h };
};