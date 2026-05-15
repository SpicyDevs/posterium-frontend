import type { PosterConfig, RatingType } from '../types';
import { getSimplePreset, type SimplePresetId } from './presets';

export type TutorialOptionId = 'a' | 'b' | 'c' | 'd';

export interface TutorialOption {
  id: TutorialOptionId;
  label: string;
  description: string;
  visual: string;
  apply: (config: PosterConfig) => PosterConfig;
}

export interface TutorialStep {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  options: TutorialOption[];
}

const setPreset =
  (presetId: SimplePresetId) =>
  (config: PosterConfig): PosterConfig =>
    getSimplePreset(presetId).apply(config);

const setRatings =
  (ratings: RatingType[]) =>
  (config: PosterConfig): PosterConfig => ({
    ...config,
    ratings,
    minimalRatings:
      config.uiPreset === 'm'
        ? (config.minimalRatings ?? []).filter((rating) => ratings.includes(rating.provider))
        : config.minimalRatings,
  });

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'starting-point',
    eyebrow: 'Step 1',
    title: 'Pick a starting point',
    helper: 'Choose the poster language closest to your goal. You can refine every choice later.',
    options: [
      {
        id: 'a',
        label: 'Cinematic bottom row',
        description: 'Best when the poster art should stay dramatic and badges feel like credits.',
        visual: 'Bottom row',
        apply: setPreset('cinematic-row'),
      },
      {
        id: 'b',
        label: 'Streaming-library clean',
        description: 'Tidy corner stack optimized for browsing at smaller sizes.',
        visual: 'Right rail',
        apply: setPreset('streaming-clean'),
      },
      {
        id: 'c',
        label: 'Minimal title + ratings',
        description: 'Large title, small score metadata, and fewer visual interruptions.',
        visual: 'Type first',
        apply: setPreset('minimal-ratings'),
      },
      {
        id: 'd',
        label: 'Glass badges',
        description: 'A polished translucent system for modern hero artwork.',
        visual: 'Glass chips',
        apply: setPreset('glass-badges'),
      },
    ],
  },
  {
    id: 'ratings',
    eyebrow: 'Step 2',
    title: 'Which info should viewers see first?',
    helper: 'This updates the included rating and metadata layers immediately on the live canvas.',
    options: [
      {
        id: 'a',
        label: 'Critic + audience',
        description: 'IMDb, Tomatometer, and audience score for broad movie discovery.',
        visual: 'IMDb · RT · Popcorn',
        apply: setRatings(['imdb', 'rt', 'rt_popcorn']),
      },
      {
        id: 'b',
        label: 'Library essentials',
        description: 'IMDb, TMDB, age rating, and runtime for practical streaming lists.',
        visual: 'Score · Age · Time',
        apply: setRatings(['imdb', 'tmdb', 'age', 'runtime']),
      },
      {
        id: 'c',
        label: 'Awards-board style',
        description: 'Title, year, IMDb, Rotten Tomatoes, and Metacritic.',
        visual: 'Title · Year · Scores',
        apply: setRatings(['title', 'year', 'imdb', 'rt', 'meta']),
      },
      {
        id: 'd',
        label: 'Community picks',
        description: 'IMDb, Letterboxd, TMDB, and Rotten Tomatoes for fan-forward posters.',
        visual: 'IMDb · LB · TMDB',
        apply: setRatings(['imdb', 'letterboxd', 'tmdb', 'rt']),
      },
    ],
  },
  {
    id: 'placement',
    eyebrow: 'Step 3',
    title: 'Where should the overlay live?',
    helper:
      'Pick a safe composition zone. Advanced mode can still drag individual layers pixel-by-pixel.',
    options: [
      {
        id: 'a',
        label: 'Bottom centered',
        description: 'Works well for theatrical posters and keeps faces unobstructed.',
        visual: '▁ ▁ ▁',
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'bc', items: {} }),
      },
      {
        id: 'b',
        label: 'Bottom right stack',
        description: 'A compact metadata rail for library covers.',
        visual: '▌\n▌\n▌',
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'col', preset: 'br', items: {} }),
      },
      {
        id: 'c',
        label: 'Top ribbon',
        description: 'Makes scores instantly visible before the artwork details.',
        visual: '▔ ▔ ▔',
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'tc', items: {} }),
      },
      {
        id: 'd',
        label: 'Title block',
        description: 'Switches into the minimal typography layout near the lower third.',
        visual: 'Title\n★ ★',
        apply: (config) => ({
          ...config,
          uiPreset: 'm',
          layout: 'custom',
          preset: 'custom',
          ratings: ['title', 'year', 'imdb', 'rt'],
          minimalTitleEnabled: true,
          minimalRatingsEnabled: true,
          minimalYearEnabled: true,
          minimalDurationEnabled: true,
          minimalTextX: 28,
          minimalTextY: 615,
          minimalTitleWidth: 420,
          minimalMetaX: 28,
          minimalMetaY: 706,
          minimalDurationX: 118,
          minimalDurationY: 706,
          items: {},
        }),
      },
    ],
  },
  {
    id: 'finish',
    eyebrow: 'Step 4',
    title: 'Choose the final finish',
    helper:
      'These choices tune contrast, glass, blur, and readability while preserving the layout.',
    options: [
      {
        id: 'a',
        label: 'Warm cinematic',
        description: 'Soft amber border, warm text, and gentle background blur.',
        visual: 'Amber glow',
        apply: (config) => ({
          ...config,
          theme: 'glass',
          posterBlur: Math.max(config.posterBlur, 2),
          grayscale: false,
          blur: 12,
          alpha: 0.48,
          radius: 18,
          shadow: 14,
          bg: '#080706',
          txt: '#f8ead2',
          borderW: 1,
          borderC: '#d79a45',
        }),
      },
      {
        id: 'b',
        label: 'Crisp solid',
        description: 'Opaque dark chips for maximum legibility on busy art.',
        visual: 'High contrast',
        apply: (config) => ({
          ...config,
          theme: 'solid',
          posterBlur: 0,
          grayscale: false,
          blur: 0,
          alpha: 0.82,
          radius: 10,
          shadow: 8,
          bg: '#0f172a',
          txt: '#f8fafc',
          borderW: 0,
          borderC: undefined,
        }),
      },
      {
        id: 'c',
        label: 'Premium glass',
        description: 'More blur, lighter translucent badges, and subtle white outlines.',
        visual: 'Frosted',
        apply: (config) => ({
          ...config,
          theme: 'glass',
          posterBlur: Math.max(config.posterBlur, 6),
          grayscale: false,
          blur: 18,
          alpha: 0.34,
          radius: 22,
          shadow: 20,
          bg: '#ffffff',
          txt: '#ffffff',
          borderW: 1,
          borderC: '#ffffff',
        }),
      },
      {
        id: 'd',
        label: 'Editorial monochrome',
        description: 'Desaturated poster, clean white type, and restrained overlays.',
        visual: 'B/W',
        apply: (config) => ({
          ...config,
          theme: 'glass',
          posterBlur: 0,
          grayscale: true,
          blur: 8,
          alpha: 0.28,
          radius: 14,
          shadow: 10,
          bg: '#000000',
          txt: '#ffffff',
          borderW: 1,
          borderC: '#e5e7eb',
          minimalTitleColor: '#ffffff',
          minimalMetaColor: '#e5e7eb',
        }),
      },
    ],
  },
];
