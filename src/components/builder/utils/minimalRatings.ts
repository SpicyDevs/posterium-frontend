import type { PosterConfig, RatingType } from '../types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types';

export function resolveShadow(v: number | boolean | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v === 'boolean') return v ? 6 : 0;
  return v;
}

export const makeDefaultMinimalRating = (provider: RatingType = 'imdb', x = 342, y = 688) => ({
  provider,
  enabled: true,
  x,
  y,
  size: 26,
  color: '#facc15',
  opacity: 1,
  iconMode: 'star' as const,
  symbol: '★',
  bgEnabled: false,
  bgColor: '#000000',
  bgOpacity: 0,
  borderW: 0,
  borderColor: '#ffffff',
  borderOpacity: 0.7,
  radius: 0,
  paddingX: 0,
  paddingY: 0,
  shadowEnabled: false,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000',
});

export const placeMinimalRatings = (
  ratings: NonNullable<PosterConfig['minimalRatings']>,
  preset: PosterConfig['preset'],
  layout: PosterConfig['layout']
) => {
  const activePreset = preset === 'custom' ? 'bc' : preset;
  const activeLayout = layout === 'custom' ? 'row' : layout;
  const gap = 14;
  const chipW = 120;
  const chipH = 34;
  const total = ratings.length;
  if (total === 0) return ratings;
  const groupW = activeLayout === 'row' ? total * chipW + (total - 1) * gap : chipW;
  const groupH = activeLayout === 'col' ? total * chipH + (total - 1) * gap : chipH;
  let startX = 0;
  let startY = 0;
  if (activePreset.includes('l')) startX = 20;
  else if (activePreset.includes('r')) startX = CANVAS_WIDTH - groupW - 20;
  else startX = Math.round((CANVAS_WIDTH - groupW) / 2);
  if (activePreset.includes('t')) startY = 20;
  else if (activePreset.includes('b')) startY = CANVAS_HEIGHT - groupH - 26;
  else startY = Math.round((CANVAS_HEIGHT - groupH) / 2);
  return ratings.map((item, index) => ({
    ...item,
    x: Math.round(startX + (activeLayout === 'row' ? index * (chipW + gap) : 0)),
    y: Math.round(startY + (activeLayout === 'col' ? index * (chipH + gap) : 0)),
  }));
};
