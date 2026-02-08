export type MediaType = 'movie' | 'tv';
export type RatingType = 'imdb' | 'rt' | 'rt_popcorn' | 'letterboxd' | 'meta' | 'tmdb' | 'age' | 'runtime';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';

export interface BadgeConfig {
  x?: number;
  y?: number;
  bg?: string;
  txt?: string;
  blur?: number;
  alpha?: number;
  radius?: number;
  shadow?: boolean;
  icon?: boolean;
}

export interface ApiKeys {
  tmdb?: string;
  fanart?: string;
  omdb?: string;
  mdblist?: string; // <--- FIXED: Added this line
}

export interface PosterConfig {
  mediaType: MediaType;
  tmdbId: string;
  ratings: RatingType[];
  source: SourceType;
  theme: ThemeType;
  size: SizeType;
  shadow: boolean;
  layout: LayoutType;
  preset: PresetType;
  blur: number;
  alpha: number;
  radius: number;
  extension: ExtensionType;
  items: Partial<Record<RatingType, BadgeConfig>>;
  keys?: ApiKeys;
}

export const DEFAULT_CONFIG: PosterConfig = {
  mediaType: 'movie',
  tmdbId: "453395",
  ratings: ['imdb', 'rt', 'age'],
  source: 'tmdb',
  theme: 'glass',
  size: 'md',
  shadow: true,
  layout: 'custom',
  preset: 'custom',
  blur: 8,
  alpha: 0.4,
  radius: 12,
  extension: 'png',
  items: {
      imdb: { x: 340, y: 20 },
      rt: { x: 340, y: 90 },
      age: { x: 8, y: 683 }
  },
  keys: {}
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;