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
}

export interface ApiKeys { tmdb?: string; fanart?: string; omdb?: string; mdblist?: string; }

export interface PosterConfig {
  mediaType: MediaType;
  tmdbId: string;
  /** Resolved IMDb ID (tt-prefixed). When set, generateApiUrl uses /poster/{imdbId} */
  imdbId?: string;
  ratings: RatingType[];
  source: SourceType; ptype: string; textless: boolean; theme: ThemeType;
  size: SizeType;
  /** Drop-shadow intensity 0–30. Default 6 to match backend parseConfig default. */
  shadow: number;
  layout: LayoutType; preset: PresetType;
  blur: number; alpha: number; radius: number; extension: ExtensionType;
  posterBlur: number; grayscale: boolean; scale?: number; borderW?: number;
  borderC?: string;
  /** Global badge background color. Maps to g_bg query param. */
  bg?: string;
  /** Global badge text color. Maps to g_txt query param. */
  txt?: string;
  icon?: boolean;
  items: Partial<Record<RatingType, BadgeConfig>>; keys?: ApiKeys;
  logo: boolean; logoSource: LogoSourceType; logoX: number | null;
  logoY: number; logoW: number; logoH: number; logoOpacity: number; logoShadow: number;
  /** Whether fallback badges are enabled (v3 fb= param). */
  fallbackEnabled: boolean;
  /** Priority-ordered pool of disabled badges used as fallbacks when fallbackEnabled is true. */
  fallbackPool: RatingType[];
}

export const DEFAULT_CONFIG: PosterConfig = {
  mediaType: 'movie', tmdbId: '453395', imdbId: 'tt12042730',
  ratings: ['imdb', 'rt', 'age'],
  source: 'tmdb', ptype: 'auto', textless: false, theme: 'glass', size: 'md',
  shadow: 6, // matches backend parseConfig default
  layout: 'custom', preset: 'custom', blur: 8, alpha: 0.4, radius: 12,
  extension: 'png', posterBlur: 0, grayscale: false,
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