import type { RatingType } from '../types';

const envApiUrl =
  typeof import.meta !== 'undefined' &&
  (import.meta as any).env?.VITE_API_URL as string | undefined;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.posterium.xyz';

export const V3_KEY_TO_CODE: Partial<Record<RatingType, string>> = {
  imdb: 'i',
  rt: 'r',
  rt_popcorn: 'p',
  letterboxd: 'l',
  meta: 'm',
  tmdb: 't',
  mal: 'M',
  anilist: 'A',
  age: 'a',
  runtime: 'n',
};

export const V3_CODE_TO_KEY: Record<string, RatingType> = Object.fromEntries(
  Object.entries(V3_KEY_TO_CODE).map(([k, v]) => [v, k as RatingType])
);

export const API_RATING_KEYS: RatingType[] = [
  'imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'mal', 'anilist', 'age', 'runtime',
];

export const isApiRatingKey = (k: RatingType): boolean => API_RATING_KEYS.includes(k);

export const PROVIDER_SHORT: Partial<Record<RatingType, string>> = V3_KEY_TO_CODE;
export const SHORT_PROVIDER: Record<string, RatingType> = V3_CODE_TO_KEY;

export const DEFAULTS = {
  blur: 0,
  alpha: 0.4,
  radius: 12,
  shadow: 6,
  scale: 1.0,
  borderW: 0,
  icon: true,
  posterBlur: 0,
  grayscale: false,
  logoY: 630,
  logoW: 380,
  logoH: 100,
  logoOpacity: 1.0,
  logoShadow: 6,
  logoBgOpacity: 0.45,
  logoBgRadius: 12,
  logoBgPadding: 10,
  logoBgBorderW: 0,
  logoBgShadow: 6,
  iconType: 1,
  labelSize: 11,
  minimalTextSize: 60,
  minimalTextX: 26,
  minimalTextY: 556,
} as const;
