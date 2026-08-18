// builder/utils/typography.ts
//
// Frontend mirror of the backend pickFontSize (renderer/valueHelpers.js).
// Backend sizes badge text by display-value length; the DOM preview must
// replicate the exact thresholds so exported SVG matches the builder (R1).

export const pickFontSize = (val: string, hasIcon: boolean, isRuntime: boolean): number => {
  const len = val.length;
  if (isRuntime) return len > 7 ? 16 : len > 5 ? 20 : 26;
  if (hasIcon) return len > 8 ? 17 : len > 5 ? 21 : 27;
  return len > 8 ? 18 : len > 5 ? 22 : 28;
};
