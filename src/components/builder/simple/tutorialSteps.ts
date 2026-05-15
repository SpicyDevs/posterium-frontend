import type { PosterConfig, RatingType } from '../types';
import { getSimplePreset, type SimplePresetId } from './presets';

export type TutorialOptionId = 'a' | 'b' | 'c' | 'd';

export type TutorialPreviewPlacement =
  | 'bottom-row'
  | 'right-stack'
  | 'top-ribbon'
  | 'title-block'
  | 'split-corners';

export type TutorialPreviewStyle = 'warm' | 'solid' | 'minimal' | 'glass' | 'mono';

export interface TutorialPreview {
  placement: TutorialPreviewPlacement;
  style: TutorialPreviewStyle;
  labels: string[];
  title?: string;
}

export interface TutorialOption {
  id: TutorialOptionId;
  label: string;
  description: string;
  visual: string;
  preview: TutorialPreview;
  apply: (config: PosterConfig) => PosterConfig;
}

export interface TutorialStep {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  directive: string;
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
    eyebrow: 'Scene 01',
    title: 'Choose the poster trailer.',
    helper:
      'Pick the direction with the strongest first impression. The live canvas updates as soon as you choose.',
    directive: 'Make a confident opening cut',
    options: [
      {
        id: 'a',
        label: 'Cinematic bottom row',
        description: 'A wide theatrical lower-third with warm glass and critic/audience scores.',
        visual: 'Wide lower-third score bar',
        preview: {
          placement: 'bottom-row',
          style: 'warm',
          labels: ['IMDb 8.7', 'RT 73%', 'Audience 91%'],
        },
        apply: setPreset('cinematic-row'),
      },
      {
        id: 'b',
        label: 'Streaming-library clean',
        description: 'A compact right-side stack that reads clearly in Plex and Jellyfin grids.',
        visual: 'Library metadata stack',
        preview: {
          placement: 'right-stack',
          style: 'solid',
          labels: ['IMDb', 'TMDB', 'PG-13', '126m'],
        },
        apply: setPreset('streaming-clean'),
      },
      {
        id: 'c',
        label: 'Minimal title + ratings',
        description:
          'A prestige-title treatment with scores tucked into the lower typography block.',
        visual: 'Title card metadata',
        preview: {
          placement: 'title-block',
          style: 'minimal',
          labels: ['★ 8.7', '🍅 73%', '2024'],
          title: 'THE FEATURE',
        },
        apply: setPreset('minimal-ratings'),
      },
      {
        id: 'd',
        label: 'Glass badges',
        description: 'A premium frosted ribbon with glossy badge highlights over hero art.',
        visual: 'Frosted top ribbon',
        preview: {
          placement: 'top-ribbon',
          style: 'glass',
          labels: ['IMDb', 'RT', 'LB', 'META'],
        },
        apply: setPreset('glass-badges'),
      },
    ],
  },
  {
    id: 'ratings',
    eyebrow: 'Scene 02',
    title: 'Cast the information hierarchy.',
    helper:
      'Choose which facts earn screen time. This immediately changes the layers on the live poster.',
    directive: 'Decide what gets top billing',
    options: [
      {
        id: 'a',
        label: 'Critic + audience',
        description: 'IMDb, Tomatometer, and audience score for instant social proof.',
        visual: 'IMDb · RT · Popcorn',
        preview: {
          placement: 'bottom-row',
          style: 'warm',
          labels: ['IMDb 8.7', 'RT 73%', 'AUD 91%'],
        },
        apply: setRatings(['imdb', 'rt', 'rt_popcorn']),
      },
      {
        id: 'b',
        label: 'Library essentials',
        description: 'IMDb, TMDB, age rating, and runtime for practical browsing decisions.',
        visual: 'Score · age · runtime',
        preview: {
          placement: 'right-stack',
          style: 'solid',
          labels: ['IMDb', 'TMDB', 'PG-13', '2h 6m'],
        },
        apply: setRatings(['imdb', 'tmdb', 'age', 'runtime']),
      },
      {
        id: 'c',
        label: 'Festival slate',
        description: 'Title, year, IMDb, Rotten Tomatoes, and Metacritic for an editorial poster.',
        visual: 'Title · year · critics',
        preview: {
          placement: 'title-block',
          style: 'minimal',
          labels: ['2024', 'IMDb', 'RT', 'META'],
          title: 'FEATURE PRESENTATION',
        },
        apply: setRatings(['title', 'year', 'imdb', 'rt', 'meta']),
      },
      {
        id: 'd',
        label: 'Community buzz',
        description: 'IMDb, Letterboxd, TMDB, and Rotten Tomatoes for fan-forward collections.',
        visual: 'IMDb · LB · TMDB · RT',
        preview: {
          placement: 'split-corners',
          style: 'glass',
          labels: ['IMDb', 'LB', 'TMDB', 'RT'],
        },
        apply: setRatings(['imdb', 'letterboxd', 'tmdb', 'rt']),
      },
    ],
  },
  {
    id: 'placement',
    eyebrow: 'Scene 03',
    title: 'Block the overlay like a shot.',
    helper:
      'Pick a composition zone that protects the poster art. Advanced mode can still move every layer later.',
    directive: 'Place the camera move',
    options: [
      {
        id: 'a',
        label: 'Hero lower-third',
        description: 'A cinematic bottom row that feels intentional without covering faces.',
        visual: 'Bottom centered',
        preview: {
          placement: 'bottom-row',
          style: 'warm',
          labels: ['IMDb', 'RT', 'AUD'],
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'bc', items: {} }),
      },
      {
        id: 'b',
        label: 'Right-side credits',
        description: 'A metadata rail with the rhythm of a streaming service detail card.',
        visual: 'Bottom-right stack',
        preview: {
          placement: 'right-stack',
          style: 'solid',
          labels: ['IMDb', 'TMDB', 'AGE'],
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'col', preset: 'br', items: {} }),
      },
      {
        id: 'c',
        label: 'Opening title ribbon',
        description: 'A high-impact top ribbon that announces scores immediately.',
        visual: 'Top centered ribbon',
        preview: {
          placement: 'top-ribbon',
          style: 'glass',
          labels: ['IMDb', 'RT', 'LB', 'META'],
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'tc', items: {} }),
      },
      {
        id: 'd',
        label: 'Prestige title block',
        description: 'A lower title card with scores treated like festival laurels.',
        visual: 'Title block',
        preview: {
          placement: 'title-block',
          style: 'minimal',
          labels: ['★ 8.7', 'RT 73%', '2024'],
          title: 'THE FEATURE',
        },
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
    eyebrow: 'Final scene',
    title: 'Grade the final look.',
    helper:
      'Lock in the finish for contrast, glass, blur, and mood while keeping the composition intact.',
    directive: 'Color grade the poster',
    options: [
      {
        id: 'a',
        label: 'Warm blockbuster',
        description: 'Amber glow, soft glass, and heavy shadows for a trailer-poster finish.',
        visual: 'Amber theatrical grade',
        preview: {
          placement: 'bottom-row',
          style: 'warm',
          labels: ['IMDb', 'RT', 'AUD'],
        },
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
        label: 'Clean studio slate',
        description: 'Opaque high-contrast chips that stay readable on chaotic art.',
        visual: 'Crisp production slate',
        preview: {
          placement: 'right-stack',
          style: 'solid',
          labels: ['IMDb', 'TMDB', 'PG'],
        },
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
        label: 'Premium glass premiere',
        description: 'Frosted translucent badges with bright specular edges.',
        visual: 'Frosted premiere lights',
        preview: {
          placement: 'top-ribbon',
          style: 'glass',
          labels: ['IMDb', 'RT', 'LB', 'META'],
        },
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
        label: 'Noir festival cut',
        description: 'Desaturated artwork, white type, and restrained editorial overlays.',
        visual: 'Black-and-white festival cut',
        preview: {
          placement: 'title-block',
          style: 'mono',
          labels: ['★ 8.7', 'RT 73%', '2024'],
          title: 'NOIR CUT',
        },
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
