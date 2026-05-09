/**
 * Convert hex color to rgba format
 * @param hex - Hex color code (with or without #)
 * @param alpha - Opacity value 0-1
 */
export const toRgba = (hex: string | undefined, alpha: number): string => {
  const c = (hex ?? '#000000').trim();
  const fullHex = /^#[0-9a-fA-F]{3}$/.test(c)
    ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`
    : c;
  if (!/^#[0-9a-fA-F]{6}$/.test(fullHex)) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(fullHex.slice(1, 3), 16);
  const g = parseInt(fullHex.slice(3, 5), 16);
  const b = parseInt(fullHex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Expand shorthand hex to full format
 */
export const expandHex = (hex: string): string => {
  if (!/^#[0-9a-fA-F]{3}$/.test(hex)) return hex;
  return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
};

/**
 * Validate hex color format
 */
export const isValidHex = (hex: string): boolean => {
  const expanded = expandHex(hex);
  return /^#[0-9a-fA-F]{6}$/.test(expanded);
};