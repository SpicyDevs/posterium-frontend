import type { PosterConfig, RatingType, BadgeConfig } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
  GAP,
  PADDING,
} from '../types';

export const getScale = (size: string): number => (size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1.0);
export const SNAP_GRID_SIZE = 10;
export const snapToGridSize = (n: number, gridSize = SNAP_GRID_SIZE): number =>
  Math.round(n / gridSize) * gridSize;

const clampTitleCharWidth = (n: number) => Math.max(4, Math.min(80, Math.round(n)));
const clampTitleCharHeight = (n: number) => Math.max(1, Math.min(12, Math.round(n)));

const resolveTitleCharWidth = (item: BadgeConfig | undefined, sizeScale: number, perBadgeScale: number) => {
  const textSize = Math.max(8, item?.textSize ?? 36) * sizeScale * perBadgeScale;
  const letterSpacing = (item?.textLetterSpacing ?? 0) * sizeScale * perBadgeScale;
  const approxCharPx = Math.max(1, textSize * 0.54 + Math.max(0, letterSpacing));
  const legacyPx = item?.textBoxWidth;
  const fromLegacy =
    legacyPx && legacyPx > 120 ? Math.max(4, Math.round((legacyPx - 16 * sizeScale * perBadgeScale) / approxCharPx)) : undefined;
  return clampTitleCharWidth(item?.textCharWidth ?? fromLegacy ?? 24);
};

const resolveTitleCharHeight = (item: BadgeConfig | undefined) => {
  const legacyPx = item?.textBoxHeight;
  const fromLegacy = legacyPx && legacyPx > 16 ? Math.max(1, Math.round(legacyPx / 36)) : undefined;
  return clampTitleCharHeight(item?.textCharHeight ?? fromLegacy ?? 1);
};

export const calculateAutoPosition = (
  ratingId: RatingType,
  index: number,
  totalBadges: number,
  config: PosterConfig
): { x: number; y: number } => {
  const sizeScale = getScale(config.size);
  const globalScale = config.scale ?? 1.0;
  const ratings = config.ratings.slice(0, totalBadges);
  const fallbackId = ratings[index] ?? ratingId;
  const orderedIds = ratings.length > 0 ? ratings : [fallbackId];
  const dims = orderedIds.map((id) => {
    const perBadgeScale = config.items[id]?.scale ?? globalScale;
    const isTitle = id === 'title';
    const item = config.items[id];
    const titleCharsW = resolveTitleCharWidth(item, sizeScale, perBadgeScale);
    const titleCharsH = resolveTitleCharHeight(item);
    const titleTextSize = Math.max(8, item?.textSize ?? 36) * sizeScale * perBadgeScale;
    const titleLetterSpacing = (item?.textLetterSpacing ?? 0) * sizeScale * perBadgeScale;
    const titleLineHeight = item?.textLineHeight ?? 1.1;
    const titleWidthPx = Math.max(
      120,
      Math.round(titleCharsW * (titleTextSize * 0.54 + Math.max(0, titleLetterSpacing)) + 16 * sizeScale * perBadgeScale)
    );
    const titleHeightPx = Math.max(
      32,
      Math.round(titleCharsH * titleTextSize * titleLineHeight + 16 * sizeScale * perBadgeScale)
    );
    return {
      id,
      w: isTitle
        ? titleWidthPx
        : BASE_BADGE_W * sizeScale * perBadgeScale,
      h: isTitle
        ? titleHeightPx
        : BASE_BADGE_H * sizeScale * perBadgeScale,
    };
  });
  if (dims.length === 0) {
    const fallbackW = BASE_BADGE_W * sizeScale;
    const fallbackH = BASE_BADGE_H * sizeScale;
    return {
      x: Math.round((CANVAS_WIDTH - fallbackW) / 2),
      y: Math.round((CANVAS_HEIGHT - fallbackH) / 2),
    };
  }
  const current = dims[index] ?? dims.find((d) => d.id === ratingId) ?? dims[0];
  const isRow = config.layout === 'row';

  const availW = CANVAS_WIDTH - 2 * PADDING;

  if (isRow) {
    const rows: { start: number; end: number; rowW: number; rowH: number }[] = [];
    let rowStart = 0;
    let rowW = 0;
    let maxRowH = 0;
    for (let i = 0; i < dims.length; i++) {
      const d = dims[i];
      const needed = rowW === 0 ? d.w : rowW + GAP + d.w;
      if (needed > availW && rowW > 0) {
        rows.push({ start: rowStart, end: i, rowW, rowH: maxRowH });
        rowStart = i;
        rowW = d.w;
        maxRowH = d.h;
      } else {
        rowW = needed;
        maxRowH = Math.max(maxRowH, d.h);
      }
    }
    if (rowStart < dims.length) {
      rows.push({ start: rowStart, end: dims.length, rowW, rowH: maxRowH });
    }

    const totalH = rows.reduce((sum, r) => sum + r.rowH, 0) + Math.max(rows.length - 1, 0) * GAP;

    let baseY: number;
    if (config.preset.includes('t')) baseY = PADDING;
    else if (config.preset.includes('b')) baseY = CANVAS_HEIGHT - totalH - PADDING;
    else baseY = (CANVAS_HEIGHT - totalH) / 2;

    let rowOffsetY = 0;
    for (const row of rows) {
      if (index >= row.start && index < row.end) {
        const precedingW = dims.slice(row.start, index).reduce((sum, d) => sum + d.w, 0) + (index - row.start) * GAP;

        let baseX: number;
        if (config.preset.includes('l')) baseX = PADDING;
        else if (config.preset.includes('r')) baseX = CANVAS_WIDTH - PADDING - row.rowW;
        else baseX = (CANVAS_WIDTH - row.rowW) / 2;

        return {
          x: Math.round(baseX + precedingW),
          y: Math.round(baseY + rowOffsetY + (row.rowH - current.h) / 2),
        };
      }
      rowOffsetY += row.rowH + GAP;
    }

    return { x: Math.round((CANVAS_WIDTH - current.w) / 2), y: Math.round(baseY) };
  }

  const groupW = Math.max(...dims.map((d) => d.w), current.w);
  const groupH = dims.reduce((sum, d) => sum + d.h, 0) + Math.max(dims.length - 1, 0) * GAP;

  let presetX = 0,
    presetY = 0;

  if (config.preset.includes('l')) presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else presetX = (CANVAS_WIDTH - groupW) / 2;

  if (config.preset.includes('t')) presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else presetY = (CANVAS_HEIGHT - groupH) / 2;

  const x = presetX + (groupW - current.w) / 2;
  const y = presetY + dims.slice(0, index).reduce((sum, d) => sum + d.h, 0) + index * GAP;

  return { x: Math.round(x), y: Math.round(y) };
};
