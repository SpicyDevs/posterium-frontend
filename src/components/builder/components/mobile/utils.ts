export type DrawerSide = 'left' | 'right';
export type LeftDrawerTab = 'source' | 'layers';
export type RightDrawerTab = 'badges' | 'selection';
export type MobileDrawerTab = LeftDrawerTab | RightDrawerTab;

export const MIN_DRAWER_HEIGHT = 180;
export const DOCK_HEIGHT = 64;
export const TOOLBAR_HEIGHT = 48;
export const POSTER_RESERVE = 80;
export const DEFAULT_ANIMATION = 'grid-template-rows 0.38s cubic-bezier(0.16, 1, 0.3, 1)';

export const vibrate = (duration: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

export const getMaxDrawerHeight = () => {
  if (typeof window === 'undefined') return 520;
  return Math.max(
    MIN_DRAWER_HEIGHT,
    window.innerHeight - TOOLBAR_HEIGHT - DOCK_HEIGHT - POSTER_RESERVE
  );
};

export const getDefaultDrawerHeight = () => {
  if (typeof window === 'undefined') return 360;
  return Math.max(MIN_DRAWER_HEIGHT, Math.min(getMaxDrawerHeight(), window.innerHeight * 0.52 - DOCK_HEIGHT));
};

export const getSnapPoints = () => {
  const half = getDefaultDrawerHeight();
  const max = getMaxDrawerHeight();
  return [MIN_DRAWER_HEIGHT, Math.min(half, max), max];
};

export const closestSnap = (height: number, velocity = 0) => {
  const points = getSnapPoints();
  const currentIndex = points.reduce((best, point, index) => {
    return Math.abs(point - height) < Math.abs(points[best] - height) ? index : best;
  }, 0);

  if (velocity > 400) return points[Math.max(0, currentIndex - 1)];
  if (velocity < -400) return points[Math.min(points.length - 1, currentIndex + 1)];
  return points[currentIndex];
};

export const getSnapLevel = (height: number) => {
  const points = getSnapPoints();
  return points.reduce((best, point, index) => {
    return Math.abs(point - height) < Math.abs(points[best] - height) ? index : best;
  }, 0);
};
