export type MediaType = 'movie' | 'tv' | 'anime';
export type RatingType = 'imdb' | 'rt' | 'rt_popcorn' | 'letterboxd' | 'meta' | 'tmdb' | 'age' | 'runtime' | 'mal' | 'anilist';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;

export interface BadgeConfig {
  x?: number; y?: number; bg?: string; txt?: string; blur?: number;
  alpha?: number; radius?: number; shadow?: number; icon?: boolean;
  scale?: number; borderW?: number; borderC?: string;
  /** Whether to show the rating text (number/value). Defaults true. */
  showText?: boolean;
  /** Normalize score to /10 (ignored for age/runtime). */
  normalize?: boolean;
  /** Append denominator after the value, e.g. /10. When normalize is set defaults to 10. */
  outOf?: number;
  /** Icon variant index (>1 selects alternate; falls back to type 1 if variant missing). */
  iconType?: number;
  /** Position of the label relative to the value: above | below | left | right. */
  labelPos?: 'above' | 'below' | 'left' | 'right';
  /** Custom label string override. */
  labelText?: string;
  /** Label font size (6–32, default 11). */
  labelSize?: number;
  /** Label color override. */
  labelColor?: string;
}

export interface ApiKeys { tmdb?: string; fanart?: string; omdb?: string; mdblist?: string; }

export interface PosterConfig {
  mediaType: MediaType;
  tmdbId: string;
  imdbId?: string;
  ratings: RatingType[];
  source: SourceType; ptype: string; textless: boolean; theme: ThemeType;
  size: SizeType;
  shadow: number;
  layout: LayoutType; preset: PresetType;
  blur: number; alpha: number; radius: number; extension: ExtensionType;
  posterBlur: number; grayscale: boolean; scale?: number; borderW?: number;
  borderC?: string;
  bg?: string;
  txt?: string;
  icon?: boolean;
  /** Global showText setting for all badges. Defaults true. */
  showText?: boolean;
  items: Partial<Record<RatingType, BadgeConfig>>; keys?: ApiKeys;
  logo: boolean; logoSource: LogoSourceType; logoX: number | null;
  logoY: number; logoW: number; logoH: number; logoOpacity: number; logoShadow: number;
  fallbackEnabled: boolean;
  fallbackPool: RatingType[];
  /** Normalize all provider scores to /10 (ignored for age/runtime). */
  normalize?: boolean;
  /** Append denominator after every badge value. When normalize is set, defaults to 10. */
  outOf?: number;
  /** Global icon variant index (>1 selects alternate; falls back to 1 if missing). */
  iconType?: number;
  /** Global label position relative to value: above | below | left | right. */
  labelPos?: 'above' | 'below' | 'left' | 'right';
  /** Global custom label string override. */
  labelText?: string;
  /** Global label font size (6–32, default 11). */
  labelSize?: number;
  /** Global label color override. */
  labelColor?: string;
  /** v3 display preset: 'b' = badge (default), 'm' = minimal. */
  uiPreset?: 'b' | 'm';
}

export const DEFAULT_CONFIG: PosterConfig = {
  mediaType: 'movie', tmdbId: '453395', imdbId: 'tt12042730',
  ratings: ['imdb', 'rt', 'age'],
  source: 'tmdb', ptype: 'auto', textless: false, theme: 'glass', size: 'md',
  shadow: 6,
  layout: 'custom', preset: 'custom', blur: 8, alpha: 0.4, radius: 12,
  extension: 'png', posterBlur: 0, grayscale: false,
  showText: true,
  items: { imdb: { x: 340, y: 20 }, rt: { x: 340, y: 90 }, age: { x: 8, y: 683 } },
  keys: {},
  logo: false, logoSource: null, logoX: null, logoY: 630,
  logoW: 380, logoH: 100, logoOpacity: 1.0, logoShadow: 6,
  fallbackEnabled: false, fallbackPool: [],
};

export const CANVAS_WIDTH  = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W  = 140;
export const BASE_BADGE_H  = 60;
export const GAP     = 10;
export const PADDING = 20;

export const ALL_BADGES: { id: RatingType; label: string }[] = [
  { id: 'imdb',       label: 'IMDb' },
  { id: 'rt',         label: 'Rotten Tomatoes' },
  { id: 'rt_popcorn', label: 'Audience Score' },
  { id: 'letterboxd', label: 'Letterboxd' },
  { id: 'meta',       label: 'Metacritic' },
  { id: 'tmdb',       label: 'TMDB' },
  { id: 'mal',        label: 'MyAnimeList' },
  { id: 'anilist',    label: 'AniList' },
  { id: 'age',        label: 'Age Rating' },
  { id: 'runtime',    label: 'Runtime' },
];
