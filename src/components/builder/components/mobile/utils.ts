export type MobileDrawerSide = 'left' | 'right';
export type LeftMobileTab = 'source' | 'layers';
export type RightMobileTab = 'badges' | 'selection';
export type MobileTab = LeftMobileTab | RightMobileTab;

export const COMPACT_DRAWER_HEIGHT = 180;
export const TOOLBAR_HEIGHT = 48;
export const DOCK_HEIGHT = 64;
export const POSTER_RESERVE = 80;

export const vibrate = (duration: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

export const getMaxDrawerHeight = () => {
  if (typeof window === 'undefined') return 520;
  return Math.max(
    COMPACT_DRAWER_HEIGHT,
    window.innerHeight - TOOLBAR_HEIGHT - DOCK_HEIGHT - POSTER_RESERVE
  );
};

export const getDefaultDrawerHeight = () => {
  if (typeof window === 'undefined') return 360;
  return Math.max(
    COMPACT_DRAWER_HEIGHT,
    Math.min(window.innerHeight * 0.52 - DOCK_HEIGHT, getMaxDrawerHeight())
  );
};

export const getSnapPoints = () => {
  const max = getMaxDrawerHeight();
  const half = Math.max(COMPACT_DRAWER_HEIGHT, Math.min(getDefaultDrawerHeight(), max));
  return [COMPACT_DRAWER_HEIGHT, half, max];
};

export const clampDrawerHeight = (height: number) =>
  Math.max(0, Math.min(getMaxDrawerHeight(), height));

export const nearestSnapPoint = (height: number, velocity = 0) => {
  const points = getSnapPoints();
  const currentIndex = points.reduce((bestIndex, point, index) => {
    return Math.abs(point - height) < Math.abs(points[bestIndex] - height) ? index : bestIndex;
  }, 0);
  if (velocity > 400) return points[Math.max(0, currentIndex - 1)];
  if (velocity < -400) return points[Math.min(points.length - 1, currentIndex + 1)];
  return points[currentIndex];
};
