// src/components/builder/utils/badgeDimensions.ts
import type { PosterConfig, RatingType } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';

/**
 * Single source of truth for badge dimension calculation.
 * Previously duplicated across DraggableBadge, PreviewCanvas, and utils.ts.
 *
 * @param id       - Rating type identifier
 * @param itemCfg  - Per-item config overrides from PosterConfig.items
 * @param config   - Full poster config (for scale, size, etc.)
 * @param liveTitle - Live title string (for title badge sizing)
 * @param liveYear  - Live year string (for year badge sizing)
 * @param baseValue - Override the live value (for snapshot calculations)
 */
export function getBadgeDimensions(
  id: RatingType,
  itemCfg: PosterConfig['items'][RatingType],
  config: Pick<PosterConfig, 'scale' | 'size'>,
  liveTitle = '',
  liveYear = '',
  baseValue?: string
): { w: number; h: number } {
  const scale = getScale(config.size) * (itemCfg?.scale ?? config.scale ?? 1.0);
  const h = BASE_BADGE_H * scale;

  if (id !== 'title' && id !== 'year') {
    return { w: BASE_BADGE_W * scale, h };
  }

  const textSize = Math.max(8, itemCfg?.textSize ?? 28) * scale;
  const textLetterSpacing = (itemCfg?.textLetterSpacing ?? 0) * scale;
  const textMaxChars = Math.max(0, itemCfg?.textMaxChars ?? 0);
  const textLineHeight = itemCfg?.textLineHeight ?? 1.1;
  const legacyMaxLinesRaw = Math.round(itemCfg?.textMaxLines ?? 0);

  const raw = (baseValue ?? (id === 'year' ? liveYear : liveTitle) ?? '').trim();
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
        ? Math.max(4, Math.round((legacyWidthPx - 16 * scale) / approxCharPx))
        : undefined;
    const charWidth = Math.max(
      4,
      Math.min(80, Math.round(itemCfg?.textCharWidth ?? legacyFromPx ?? 24))
    );
    const legacyHeightPx = itemCfg?.textBoxHeight;
    const legacyHeightLines =
      legacyHeightPx && legacyHeightPx > 16
        ? Math.max(1, Math.round(legacyHeightPx / 36))
        : undefined;
    const charHeight = Math.max(
      1,
      Math.min(
        12,
        Math.round(
          itemCfg?.textCharHeight ??
            legacyHeightLines ??
            (legacyMaxLinesRaw > 0 ? legacyMaxLinesRaw : 1)
        )
      )
    );

    const w = Math.max(120, Math.round(charWidth * approxCharPx + 16 * scale));
    const titleHeight = Math.max(32, Math.round(charHeight * textSize * textLineHeight + 16 * scale));
    return { w, h: titleHeight };
  }

  // Year badge
  const w = Math.max(
    BASE_BADGE_W * scale,
    Math.ceil(shown.length * (textSize * 0.62 + textLetterSpacing) + 28 * scale)
  );
  return { w, h };
}
