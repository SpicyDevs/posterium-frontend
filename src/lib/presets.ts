// src/lib/presets.ts
// Named preset configurations exposed via ?preset= URL param.
// Keys are URL-safe strings (lowercase, no spaces).
// Values are Partial<PosterConfig> merged over DEFAULT_CONFIG.
//
// To add a new preset: add an entry here, then link to it from
// faq.astro, examples.astro, etc. using /build?preset=<key>.

import type { PosterConfig, RatingType } from '@/components/builder/types';

export type PresetKey =
  | 'glass'
  | 'minimal'
  | 'imdb-only'
  | 'ratings-bar'
  | 'plex'
  | 'jellyfin'
  | 'discord'
  | 'anime'
  | 'dark-row';

/** Human-readable metadata for each preset, used in UI/FAQ links */
export const PRESET_META: Record<PresetKey, { label: string; description: string }> = {
  glass: {
    label: 'Glass (Default)',
    description: 'Glassmorphism badges with blur, bottom-centre layout.',
  },
  minimal: {
    label: 'Minimal',
    description: 'Clean score-only mode with no background badge.',
  },
  'imdb-only': {
    label: 'IMDb Only',
    description: 'Single IMDb rating badge, bottom-left.',
  },
  'ratings-bar': {
    label: 'Ratings Bar',
    description: 'IMDb + RT + Meta in a horizontal row, bottom-centre.',
  },
  plex: {
    label: 'Plex Optimised',
    description: 'Designed for Plex posters — large badges, bottom-right.',
  },
  jellyfin: {
    label: 'Jellyfin Optimised',
    description: 'Jellyfin-friendly layout, bottom-left aligned.',
  },
  discord: {
    label: 'Discord Embed',
    description: 'Compact IMDb + RT badges for Discord rich embeds.',
  },
  anime: {
    label: 'Anime Pack',
    description: 'MAL + AniList badges for anime posters.',
  },
  'dark-row': {
    label: 'Dark Row',
    description: 'Dark background badges in a horizontal row.',
  },
};

/** Config overrides applied when ?preset=<key> is used */
export const PRESET_CONFIGS: Record<PresetKey, Partial<PosterConfig>> = {
  glass: {
    // default — do nothing, just a named alias for DEFAULT_CONFIG
  },
  minimal: {
    uiPreset: 'm',
    ratings: ['imdb'] as RatingType[],
  },
  'imdb-only': {
    ratings: ['imdb'] as RatingType[],
    preset: 'bl',
    layout: 'custom',
    alpha: 0.55,
    radius: 14,
  },
  'ratings-bar': {
    ratings: ['imdb', 'rt', 'meta'] as RatingType[],
    layout: 'row',
    preset: 'bc',
    alpha: 0.5,
    radius: 12,
    blur: 4,
  },
  plex: {
    ratings: ['imdb', 'rt', 'meta'] as RatingType[],
    layout: 'row',
    preset: 'br',
    alpha: 0.6,
    blur: 6,
    radius: 10,
    shadow: 8,
  },
  jellyfin: {
    ratings: ['imdb', 'rt'] as RatingType[],
    layout: 'col',
    preset: 'bl',
    alpha: 0.55,
    radius: 12,
    blur: 4,
  },
  discord: {
    ratings: ['imdb', 'rt'] as RatingType[],
    layout: 'row',
    preset: 'bc',
    alpha: 0.7,
    radius: 8,
    blur: 0,
    shadow: 4,
    scale: 0.85,
  },
  anime: {
    ratings: ['mal', 'anilist'] as RatingType[],
    layout: 'row',
    preset: 'bc',
    alpha: 0.5,
    radius: 12,
    blur: 4,
  },
  'dark-row': {
    ratings: ['imdb', 'rt', 'meta'] as RatingType[],
    layout: 'row',
    preset: 'bc',
    alpha: 0.9,
    radius: 8,
    blur: 0,
    shadow: 6,
    bg: '#0d0d0d',
  },
};

/** Returns true if the string is a valid preset key */
export function isPresetKey(key: string): key is PresetKey {
  return key in PRESET_CONFIGS;
}
