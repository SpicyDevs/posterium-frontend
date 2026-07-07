export interface AggregateRatingConfig {
  ratingValue: number;
  ratingCount: number;
  bestRating?: number;
  worstRating?: number;
}

export const SOFTWARE_APPLICATION_FEATURES: string[] = [
  'Live IMDb rating badges',
  'Rotten Tomatoes score overlays',
  'Metacritic score badges',
  'Drag-and-drop poster editor',
  'Per-badge style controls',
  'SVG, PNG, JPG, and WebP exports',
  'Shareable API URL generation',
];

const parseNumber = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const APPLICATION_AGGREGATE_RATING: AggregateRatingConfig | undefined = (() => {
  const ratingValue = parseNumber(import.meta.env.PUBLIC_APP_RATING_VALUE);
  const ratingCount = parseNumber(import.meta.env.PUBLIC_APP_RATING_COUNT);

  if (!ratingValue || !ratingCount || ratingValue <= 0 || ratingCount <= 0) return undefined;

  return {
    ratingValue,
    ratingCount,
    bestRating: 5,
    worstRating: 1,
  };
})();
