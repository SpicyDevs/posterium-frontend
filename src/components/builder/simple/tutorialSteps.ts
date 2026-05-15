import type { PosterConfig, RatingType } from '../types';
import { getSimplePreset, type SimplePresetId } from './presets';

export type TutorialOptionId = 'a' | 'b' | 'c' | 'd';
export type MiniPreviewTone = 'ember' | 'noir-blue' | 'plum' | 'silver' | 'redline' | 'mono';
export type MiniPreviewLayout = 'bottom-row' | 'right-stack' | 'top-ribbon' | 'title-block';
export type MiniPreviewFinish = 'glass' | 'solid' | 'minimal';

export interface MiniPreview {
  tone: MiniPreviewTone;
  layout: MiniPreviewLayout;
  finish: MiniPreviewFinish;
  badges: string[];
  title: string;
}

export interface TutorialOption {
  id: TutorialOptionId;
  label: string;
  description: string;
  preview: MiniPreview;
  apply: (config: PosterConfig) => PosterConfig;
}

export interface TutorialStep {
  id: string;
  eyebrow: string;
  title: string;
  helper: string;
  direction: string;
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
    eyebrow: 'Act I · Choose the look',
    title: 'Set the poster’s opening shot.',
    helper:
      'Pick a bold direction. Each card previews the actual overlay structure at thumbnail scale—not placeholder art.',
    direction: 'Select the strongest visual identity for this poster.',
    options: [
      {
        id: 'a',
        label: 'Cinematic bottom row',
        description: 'Trailer-grade lower-third badges with amber glass and big-screen contrast.',
        preview: getSimplePreset('cinematic-row').preview,
        apply: setPreset('cinematic-row'),
      },
      {
        id: 'b',
        label: 'Streaming-library clean',
        description: 'Compact metadata stack built for Plex/Jellyfin browsing distance.',
        preview: getSimplePreset('streaming-clean').preview,
        apply: setPreset('streaming-clean'),
      },
      {
        id: 'c',
        label: 'Minimal title + ratings',
        description: 'Festival-poster typography with scores as restrained editorial details.',
        preview: getSimplePreset('minimal-ratings').preview,
        apply: setPreset('minimal-ratings'),
      },
      {
        id: 'd',
        label: 'Glass badges',
        description: 'Frosted hero chips, white edge light, and a glossy marquee feel.',
        preview: getSimplePreset('glass-badges').preview,
        apply: setPreset('glass-badges'),
      },
    ],
  },
  {
    id: 'ratings',
    eyebrow: 'Act II · Cast the data',
    title: 'Choose what deserves the spotlight.',
    helper: 'The score set changes immediately on the live canvas behind the wizard.',
    direction: 'Make the metadata read like a confident editorial choice.',
    options: [
      {
        id: 'a',
        label: 'Critic + audience',
        description: 'IMDb, Tomatometer, and audience score for broad movie discovery.',
        preview: {
          tone: 'ember',
          layout: 'bottom-row',
          finish: 'glass',
          badges: ['IMDb 8.7', 'RT 73%', 'AUD 91%'],
          title: 'CRITICS CUT',
        },
        apply: setRatings(['imdb', 'rt', 'rt_popcorn']),
      },
      {
        id: 'b',
        label: 'Library essentials',
        description: 'IMDb, TMDB, age rating, and runtime for practical streaming lists.',
        preview: {
          tone: 'noir-blue',
          layout: 'right-stack',
          finish: 'solid',
          badges: ['IMDb', 'TMDB', 'PG-13', '1h 52m'],
          title: 'SHELF READY',
        },
        apply: setRatings(['imdb', 'tmdb', 'age', 'runtime']),
      },
      {
        id: 'c',
        label: 'Awards-board style',
        description: 'Title, year, IMDb, Rotten Tomatoes, and Metacritic.',
        preview: {
          tone: 'plum',
          layout: 'title-block',
          finish: 'minimal',
          badges: ['2024', 'IMDb 8.7', 'META 76'],
          title: 'AWARDS NIGHT',
        },
        apply: setRatings(['title', 'year', 'imdb', 'rt', 'meta']),
      },
      {
        id: 'd',
        label: 'Community picks',
        description: 'IMDb, Letterboxd, TMDB, and Rotten Tomatoes for fan-forward posters.',
        preview: {
          tone: 'silver',
          layout: 'top-ribbon',
          finish: 'glass',
          badges: ['IMDb', 'LB 4.2', 'TMDB', 'RT'],
          title: 'FAN CANON',
        },
        apply: setRatings(['imdb', 'letterboxd', 'tmdb', 'rt']),
      },
    ],
  },
  {
    id: 'placement',
    eyebrow: 'Act III · Block the scene',
    title: 'Place the overlay with intent.',
    helper:
      'Pick a composition zone that protects the poster art while making the overlay feel designed.',
    direction: 'The live canvas stays visible so you can judge the balance instantly.',
    options: [
      {
        id: 'a',
        label: 'Bottom centered',
        description: 'A theatrical lower-third that keeps faces and key art clear.',
        preview: {
          tone: 'ember',
          layout: 'bottom-row',
          finish: 'glass',
          badges: ['IMDb', 'RT', 'AUD'],
          title: 'LOWER THIRD',
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'bc', items: {} }),
      },
      {
        id: 'b',
        label: 'Bottom right stack',
        description: 'A compact corner rail that behaves like streaming-library metadata.',
        preview: {
          tone: 'noir-blue',
          layout: 'right-stack',
          finish: 'solid',
          badges: ['IMDb', 'TMDB', 'AGE'],
          title: 'CORNER RAIL',
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'col', preset: 'br', items: {} }),
      },
      {
        id: 'c',
        label: 'Top marquee',
        description: 'A confident ribbon that announces scores before the eye drops into the art.',
        preview: {
          tone: 'silver',
          layout: 'top-ribbon',
          finish: 'glass',
          badges: ['IMDb', 'RT', 'LB'],
          title: 'TOP BILLING',
        },
        apply: (config) => ({ ...config, uiPreset: 'b', layout: 'row', preset: 'tc', items: {} }),
      },
      {
        id: 'd',
        label: 'Title block',
        description:
          'A typography-led lower third for posters that need a premium editorial finish.',
        preview: {
          tone: 'plum',
          layout: 'title-block',
          finish: 'minimal',
          badges: ['★ 8.7', 'RT 73%', '2024'],
          title: 'TITLE FIRST',
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
    eyebrow: 'Final Act · Color grade',
    title: 'Finish it like a release poster.',
    helper: 'Tune contrast, glass, blur, and readability without leaving the guided flow.',
    direction: 'Commit to a finish. Export or move to Advanced from the next screen.',
    options: [
      {
        id: 'a',
        label: 'Warm cinematic',
        description: 'Amber edge light, warm text, and a soft theatrical glow.',
        preview: {
          tone: 'ember',
          layout: 'bottom-row',
          finish: 'glass',
          badges: ['IMDb', 'RT', 'AUD'],
          title: 'WARM GRADE',
        },
        apply: (config) => ({
          ...config,
          theme: 'glass',
          posterBlur: Math.max(config.posterBlur, 3),
          grayscale: false,
          blur: 16,
          alpha: 0.5,
          radius: 20,
          shadow: 18,
          bg: '#080706',
          txt: '#f8ead2',
          borderW: 1,
          borderC: '#d79a45',
        }),
      },
      {
        id: 'b',
        label: 'Crisp solid',
        description: 'Opaque midnight chips for maximum legibility on busy artwork.',
        preview: {
          tone: 'noir-blue',
          layout: 'right-stack',
          finish: 'solid',
          badges: ['IMDb', 'TMDB', 'PG'],
          title: 'CLEAN CUT',
        },
        apply: (config) => ({
          ...config,
          theme: 'solid',
          posterBlur: 0,
          grayscale: false,
          blur: 0,
          alpha: 0.86,
          radius: 12,
          shadow: 10,
          bg: '#0f172a',
          txt: '#f8fafc',
          borderW: 0,
          borderC: undefined,
        }),
      },
      {
        id: 'c',
        label: 'Premium glass',
        description: 'Frosted badges, visible edge light, and a glossy streaming-hero feel.',
        preview: {
          tone: 'silver',
          layout: 'top-ribbon',
          finish: 'glass',
          badges: ['IMDb', 'RT', 'LB'],
          title: 'FROSTED HERO',
        },
        apply: (config) => ({
          ...config,
          theme: 'glass',
          posterBlur: Math.max(config.posterBlur, 7),
          grayscale: false,
          blur: 22,
          alpha: 0.36,
          radius: 24,
          shadow: 24,
          bg: '#ffffff',
          txt: '#ffffff',
          borderW: 1,
          borderC: '#ffffff',
        }),
      },
      {
        id: 'd',
        label: 'Editorial monochrome',
        description: 'Desaturated art, stark typography, and restrained festival-card overlays.',
        preview: {
          tone: 'mono',
          layout: 'title-block',
          finish: 'minimal',
          badges: ['★ 8.7', 'RT 73%', '2024'],
          title: 'MONO CUT',
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
