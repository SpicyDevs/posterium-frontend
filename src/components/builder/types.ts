// src/components/builder/types.ts

export type MediaType    = 'movie' | 'tv' | 'anime';
export type RatingType   = 'imdb' | 'rt' | 'rt_popcorn' | 'letterboxd' | 'meta' | 'tmdb' | 'age' | 'runtime' | 'mal' | 'anilist';
export type ThemeType    = 'glass' | 'solid';
export type SizeType     = 'sm' | 'md' | 'lg';
export type LayoutType   = 'row' | 'col' | 'custom';
export type PresetType   = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType   = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;

// ── Per-badge overrides ───────────────────────────────────────────────────────
// All fields are optional — absent means "inherit from global PosterConfig".
export interface BadgeConfig {
  // Position (set by canvas drag; cleared when layout/preset changes)
  x?: number;
  y?: number;

  // Shape
  blur?:    number;   // glass blur, px
  alpha?:   number;   // background opacity, 0–1
  radius?:  number;   // corner radius, px
  shadow?:  number;   // drop shadow size, px
  scale?:   number;   // uniform scale multiplier, e.g. 1.0 = 100 %

  // Colors
  bg?:     string;   // background hex
  txt?:    string;   // text + icon hex
  borderW?: number;  // border width, px
  borderC?: string;  // border hex

  // Visibility
  icon?:     boolean;  // show rating icon
  showText?: boolean;  // show rating value text

  // Icon style
  iconType?: number;  // 1 = default, 2 = alternate (falls back to 1 if unavailable)

  // Score display
  normalize?: boolean; // normalize score to a 0–10 scale
  outOf?:     number;  // append "/<n>" denominator after value (0 = off)

  // Label
  labelPos?:   'above' | 'below' | 'left' | 'right'; // position relative to value
  labelText?:  string;  // custom label string (default: provider name)
  labelSize?:  number;  // label font size, 6–32 (default: 11)
  labelColor?: string;  // label hex color override
}

// ── API keys ──────────────────────────────────────────────────────────────────
export interface ApiKeys {
  tmdb?:    string;
  fanart?:  string;
  omdb?:    string;
  mdblist?: string;
}

// ── Global poster config ──────────────────────────────────────────────────────
export interface PosterConfig {
  // Media identity
  mediaType: MediaType;
  tmdbId:    string;
  imdbId?:   string;

  // Ratings to display
  ratings: RatingType[];

  // Image source
  source:   SourceType;
  ptype:    string;
  textless: boolean;

  // Poster styling
  theme:      ThemeType;
  size:       SizeType;
  extension:  ExtensionType;
  posterBlur: number;    // blur applied to the poster image, px
  grayscale:  boolean;   // desaturate the poster image

  // Badge layout
  layout: LayoutType;
  preset: PresetType;

  // ── Global badge defaults (overridable per-badge via `items`) ──────────────

  // Shape
  blur:    number;   // glass blur, px
  alpha:   number;   // background opacity, 0–1
  radius:  number;   // corner radius, px
  shadow:  number;   // drop shadow size, px
  scale?:  number;   // uniform scale multiplier (default 1.0)

  // Colors
  bg?:      string;  // background hex (absent = theme default)
  txt?:     string;  // text + icon hex (absent = theme default)
  borderW?: number;  // border width, px (default 0)
  borderC?: string;  // border hex

  // Visibility
  icon?:     boolean;  // show rating icons (default true)
  showText?: boolean;  // show rating value text (default true)

  // Icon style
  iconType?: number;  // 1 = default, 2 = alternate (default 1)

  // Display preset
  uiPreset?: 'b' | 'm';  // 'b' = badge (default), 'm' = minimal

  // Score display
  normalize?: boolean;  // normalize all scores to 0–10 (default false)
  outOf?:     number;   // append "/<n>" denominator (0 / absent = off)

  // Label
  labelPos?:   'above' | 'below' | 'left' | 'right';  // (default: 'below')
  labelText?:  string;  // custom label (default: provider name)
  labelSize?:  number;  // label font size, 6–32 (default: 11)
  labelColor?: string;  // label hex color override

  // Per-badge item overrides (keyed by RatingType)
  items: Partial<Record<RatingType, BadgeConfig>>;

  // Logo overlay
  logo:         boolean;
  logoSource:   LogoSourceType;
  logoX:        number | null;
  logoY:        number;
  logoW:        number;
  logoH:        number;
  logoOpacity:  number;
  logoShadow:   number;

  // Fallback chain
  fallbackEnabled: boolean;
  fallbackPool:    RatingType[];

  // API keys (optional, stored client-side only)
  keys?: ApiKeys;
}

// ── Default configuration ─────────────────────────────────────────────────────
export const DEFAULT_CONFIG: PosterConfig = {
  // Media identity
  mediaType: 'movie',
  tmdbId:    '',
  imdbId:    'tt9419884',

  // Ratings
  ratings: ['imdb', 'rt', 'age'],

  // Source
  source:   'tmdb',
  ptype:    'auto',
  textless: false,

  // Poster styling
  theme:      'glass',
  size:       'md',
  extension:  'png',
  posterBlur: 0,
  grayscale:  false,

  // Badge layout
  layout: 'custom',
  preset: 'custom',

  // Global badge shape
  blur:   0,
  alpha:  0.4,
  radius: 12,
  shadow: 6,
  scale:  1.0,

  // Global badge colors (absent = theme default)
  borderW: 0,

  // Global badge visibility
  icon:     true,
  showText: true,

  // Global icon style
  iconType: 1,

  // Display preset
  uiPreset: 'b',

  // Score display
  normalize: false,

  // Per-badge items (pre-positioned for default layout)
  items: {
    imdb: { x: 340, y: 20  },
    rt:   { x: 340, y: 90  },
    age:  { x: 8,   y: 683 },
  },

  // Logo
  logo:        false,
  logoSource:  null,
  logoX:       null,
  logoY:       630,
  logoW:       380,
  logoH:       100,
  logoOpacity: 1.0,
  logoShadow:  6,

  // Fallback
  fallbackEnabled: false,
  fallbackPool:    [],

  keys: {},
};

// ── Canvas geometry constants ─────────────────────────────────────────────────
export const CANVAS_WIDTH  = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W  = 140;
export const BASE_BADGE_H  = 60;
export const GAP     = 10;
export const PADDING = 20;

// ── Badge catalogue ───────────────────────────────────────────────────────────
export const ALL_BADGES: { id: RatingType; label: string }[] = [
  { id: 'imdb',       label: 'IMDb'             },
  { id: 'rt',         label: 'Rotten Tomatoes'  },
  { id: 'rt_popcorn', label: 'Audience Score'   },
  { id: 'letterboxd', label: 'Letterboxd'       },
  { id: 'meta',       label: 'Metacritic'       },
  { id: 'tmdb',       label: 'TMDB'             },
  { id: 'mal',        label: 'MyAnimeList'      },
  { id: 'anilist',    label: 'AniList'          },
  { id: 'age',        label: 'Age Rating'       },
  { id: 'runtime',    label: 'Runtime'          },
];
