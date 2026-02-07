export type RatingType = 'imdb' | 'rt' | 'meta' | 'tmdb';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc';
export type SourceType = 'tmdb' | 'fanart';
export type ExtensionType = 'svg' | 'jpg' | 'png';

export interface BadgeConfig {
  x?: number;
  y?: number;
  bg?: string;
  txt?: string;
}

export interface PosterConfig {
  tmdbId: string;
  ratings: RatingType[];
  source: SourceType;
  theme: ThemeType;
  size: SizeType;
  shadow: boolean;
  layout: LayoutType;
  preset: PresetType;
  
  // Global defaults
  blur: number;
  alpha: number;
  radius: number;
  
  extension: ExtensionType;
  
  // Per-item overrides
  items: Partial<Record<RatingType, BadgeConfig>>;
}

export const DEFAULT_CONFIG: PosterConfig = {
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
  items: {}
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;