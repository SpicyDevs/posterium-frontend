export type MediaType = 'movie' | 'tv';
export type RatingType = 'imdb' | 'rt' | 'meta' | 'tmdb' | 'age' | 'runtime';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp'; // Added 'webp'

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
  tmdbId: "157336",
  ratings: ['imdb', 'rt', 'meta'],
  source: 'tmdb',
  theme: 'glass',
  size: 'md',
  shadow: true,
  layout: 'col',
  preset: 'tr',
  blur: 8,
  alpha: 0.4,
  radius: 12,
  extension: 'jpg',
  items: {},
  keys: {}
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;