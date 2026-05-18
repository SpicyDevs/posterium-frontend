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

export const DEFAULT_APPLICATION_RATING: AggregateRatingConfig = {
  ratingValue: 4.9,
  ratingCount: 1200,
  bestRating: 5,
  worstRating: 1,
};
