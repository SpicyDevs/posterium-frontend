export type RatingType = 'imdb' | 'rt' | 'meta';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc';
export type SourceType = 'tmdb' | 'fanart';
export type ExtensionType = 'svg' | 'jpg' | 'png';

export interface BadgePosition {
  x: number;
  y: number;
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
  customBg: string; // Stored as #RRGGBB
  customTxt: string; // Stored as #RRGGBB
  extension: ExtensionType;
  // Independent coordinates. If undefined/null, they follow the preset.
  pos: {
    imdb?: BadgePosition;
    rt?: BadgePosition;
    meta?: BadgePosition;
  };
}

export const DEFAULT_CONFIG: PosterConfig = {
  tmdbId: "157336", // Interstellar
  ratings: ['imdb', 'rt', 'meta'],
  source: 'tmdb',
  theme: 'glass',
  size: 'md',
  shadow: true,
  layout: 'col',
  preset: 'tr',
  customBg: '',
  customTxt: '',
  extension: 'jpg',
  pos: {}
};

// Worker constants
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;

// To simulate badge dimensions based on scale
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;