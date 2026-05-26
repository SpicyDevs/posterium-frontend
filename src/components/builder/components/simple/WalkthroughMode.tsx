import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Download,
  ExternalLink,
  ImagePlus,
  Layers3,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { ExtensionType, PosterConfig, PresetType, RatingType } from '../../types';
import { ALL_BADGES, DEFAULT_CONFIG } from '../../types';
import PreviewCanvas from '../PreviewCanvas';
import { Button, Card } from '@/components/ui';
import ExportMenu from '@/components/shared/ExportMenu';
import MediaPicker from './MediaPicker';
import type { BuilderMode } from '../navigation/ModeToggle';
import { SIMPLE_BADGE_OPTIONS } from './constants';
import { generateApiUrl } from '../../utils';

type WalkthroughTheme = 'glass' | 'solid' | 'minimal' | 'text-only';
type WalkthroughStage =
  | 'media'
  | 'path'
  | 'presets'
  | 'community'
  | 'theme'
  | 'icon-style'
  | 'ratings'
  | 'misc'
  | 'layout'
  | 'export';
type WalkthroughBranch = 'preset' | 'community' | 'guided' | null;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onLoadConfig: (url: string) => void;
  onExtensionChange: (ext: ExtensionType) => void;
  onExit: (mode: BuilderMode) => void;
}

interface QuickPresetOption {
  id: string;
  label: string;
  description: string;
  config: Partial<PosterConfig>;
}

const PRESET_OPTIONS: { id: PresetType; label: string }[] = [
  { id: 'bl', label: 'Bottom Left' },
  { id: 'br', label: 'Bottom Right' },
  { id: 'tl', label: 'Top Left' },
  { id: 'tr', label: 'Top Right' },
  { id: 'bc', label: 'Bottom Center' },
  { id: 'tc', label: 'Top Center' },
];

const SOURCE_OPTIONS = [
  { id: 'tmdb', label: 'TMDB' },
  { id: 'fanart', label: 'Fanart.tv' },
  { id: 'metahub', label: 'Metahub' },
  { id: 'imdb', label: 'IMDb' },
] as const;

const PTYPE_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'top1', label: 'Top 1' },
  { id: 'top2', label: 'Top 2' },
  { id: 'top3', label: 'Top 3' },
  { id: 'best', label: 'Best' },
  { id: 'latest', label: 'Latest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'random', label: 'Random' },
];

const LOGO_SOURCE_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'fanart', label: 'Fanart' },
  { id: 'tmdb', label: 'TMDB' },
  { id: 'metahub', label: 'Hub' },
];

const QUICK_PRESET_OPTIONS: QuickPresetOption[] = [
  {
    id: 'glass-stack',
    label: 'Glass Stack',
    description: 'Polished glass badges in a lower-left festival style stack.',
    config: {
      theme: 'glass',
      uiPreset: 'b',
      layout: 'row',
      preset: 'bl',
      ratings: ['imdb', 'rt', 'tmdb', 'letterboxd'],
    },
  },
  {
    id: 'spotlight-solid',
    label: 'Spotlight Solid',
    description: 'Crisp solid badges pinned to the upper-right for a modern marquee look.',
    config: {
      theme: 'solid',
      uiPreset: 'b',
      layout: 'row',
      preset: 'tr',
      ratings: ['imdb', 'rt_popcorn', 'meta'],
    },
  },
  {
    id: 'minimal-marquee',
    label: 'Minimal Marquee',
    description: 'Minimal typography-first composition with title-led metadata.',
    config: {
      theme: 'solid',
      uiPreset: 'm',
      layout: 'row',
      preset: 'tc',
      ratings: ['title', 'year', 'imdb'],
      icon: true,
      showText: true,
    },
  },
];

const STAGE_COPY: Record<
  WalkthroughStage,
  { label: string; title: string; subtitle: string }
> = {
  media: {
    label: 'Main Preview Poster',
    title: 'Pick the poster source',
    subtitle: 'Search the title, then optionally fine-tune source, poster choice, and textless mode.',
  },
  path: {
    label: 'Path Selection',
    title: 'Choose a workflow',
    subtitle: 'Jump to presets, open community ideas, or continue through the guided setup.',
  },
  presets: {
    label: 'Show Presets',
    title: 'Choose a ready-made preset',
    subtitle: 'Selecting one applies it immediately and jumps straight to export.',
  },
  community: {
    label: 'Community Presets',
    title: 'Community presets placeholder',
    subtitle: 'Browse the shared gallery on /examples for community-made poster styles.',
  },
  theme: {
    label: 'Theme',
    title: 'Set the visual treatment',
    subtitle: 'Match the diagram flow with solid, glass, minimal, or text-only styles.',
  },
  'icon-style': {
    label: 'Icon Style',
    title: 'Choose the icon style',
    subtitle: 'Solid and glass routes surface all icon style variants before ratings.',
  },
  ratings: {
    label: 'Ratings',
    title: 'Curate the applicable ratings',
    subtitle: 'Toggle the ratings you want on the poster while the preview stays live.',
  },
  misc: {
    label: 'Misc',
    title: 'Optional extras',
    subtitle: 'Logo, title text, rating text, and source preferences are all optional here.',
  },
  layout: {
    label: 'Layout',
    title: 'Choose the layout',
    subtitle: 'Pick the final badge arrangement before exporting or moving the work.',
  },
  export: {
    label: 'Export',
    title: 'Export or move the work',
    subtitle: 'Download now, or jump into simple or advanced mode for more tuning.',
  },
};

const mergePosterConfig = (base: PosterConfig, patch: Partial<PosterConfig>): PosterConfig => ({
  ...base,
  ...patch,
  items: patch.items ? { ...base.items, ...patch.items } : base.items,
  ratings: patch.ratings ? [...patch.ratings] : base.ratings,
  fallbackPool: patch.fallbackPool ? [...patch.fallbackPool] : base.fallbackPool,
  minimalRatings: patch.minimalRatings ? [...patch.minimalRatings] : base.minimalRatings,
});

const buildPosterUrl = (config: PosterConfig, baseUrl: string): string => {
  if (!config.tmdbId && !config.imdbId) return '';
  try {
    return generateApiUrl(config, baseUrl);
  } catch {
    return '';
  }
};

const createCarouselVariant = (config: PosterConfig, side: 'left' | 'right'): PosterConfig => {
  const ratings =
    config.ratings.length > 0
      ? side === 'left'
        ? config.ratings.slice(0, Math.min(3, config.ratings.length))
        : [...config.ratings].reverse().slice(0, Math.min(4, config.ratings.length)).reverse()
      : DEFAULT_CONFIG.ratings.slice(0, 3);

  return mergePosterConfig(config, {
    theme: side === 'left' ? (config.theme === 'glass' ? 'solid' : 'glass') : config.theme,
    layout: 'row',
    uiPreset: side === 'left' ? 'b' : config.uiPreset ?? 'b',
    preset: side === 'left' ? 'tl' : 'br',
    ratings,
  });
};

const WalkthroughMode: React.FC<Props> = ({
  config,
  setConfig,
  baseUrl,
  onLoadConfig,
  onExtensionChange,
  onExit,
}) => {
  const [stage, setStage] = useState<WalkthroughStage>('media');
  const [branch, setBranch] = useState<WalkthroughBranch>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);

  const selectedTheme: WalkthroughTheme = useMemo(() => {
    if ((config.uiPreset ?? 'b') === 'm') return 'minimal';
    if (config.icon === false && config.showText !== false) return 'text-only';
    return config.theme;
  }, [config.icon, config.showText, config.theme, config.uiPreset]);

  const stageOrder = useMemo<WalkthroughStage[]>(() => {
    if (branch === 'preset') return ['media', 'path', 'presets', 'export'];
    if (branch === 'community') return ['media', 'path', 'community'];
    if (branch === 'guided') {
      return [
        'media',
        'path',
        'theme',
        ...(selectedTheme === 'glass' || selectedTheme === 'solid' ? (['icon-style'] as const) : []),
        'ratings',
        'misc',
        'layout',
        'export',
      ];
    }
    return ['media', 'path'];
  }, [branch, selectedTheme]);

  const currentStep = Math.max(1, stageOrder.indexOf(stage) + 1);
  const totalSteps = stageOrder.length;
  const hasMedia = !!config.tmdbId || !!config.imdbId;
  const stageCopy = STAGE_COPY[stage];
  const leftPosterUrl = useMemo(
    () => buildPosterUrl(createCarouselVariant(config, 'left'), baseUrl),
    [baseUrl, config]
  );
  const rightPosterUrl = useMemo(
    () => buildPosterUrl(createCarouselVariant(config, 'right'), baseUrl),
    [baseUrl, config]
  );

  const applyTheme = (theme: WalkthroughTheme) => {
    setConfig((prev) => {
      if (theme === 'minimal') {
        return {
          ...prev,
          theme: 'solid',
          uiPreset: 'm',
          icon: true,
          showText: true,
          minimalRatingsEnabled: true,
        };
      }
      if (theme === 'text-only') {
        return {
          ...prev,
          theme: 'solid',
          uiPreset: 'b',
          icon: false,
          showText: true,
          minimalRatingsEnabled: false,
          ratings: prev.ratings.length > 0 ? prev.ratings : ['title', 'year'],
        };
      }
      return {
        ...prev,
        theme,
        uiPreset: 'b',
        icon: true,
        showText: true,
        minimalRatingsEnabled: false,
      };
    });
  };

  const applyQuickPreset = (option: QuickPresetOption) => {
    setConfig((prev) => mergePosterConfig(prev, option.config));
    setStage('export');
  };

  const toggleBadge = (id: RatingType, enabled: boolean) => {
    setConfig((prev) => {
      if (enabled && !prev.ratings.includes(id)) return { ...prev, ratings: [...prev.ratings, id] };
      if (!enabled) return { ...prev, ratings: prev.ratings.filter((rating) => rating !== id) };
      return prev;
    });
  };

  const goBack = () => {
    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex <= 0) return;
    setStage(stageOrder[currentIndex - 1]);
  };

  const goNext = () => {
    if (stage === 'media' && hasMedia) {
      setStage('path');
      return;
    }
    if (stage === 'theme') {
      setStage(selectedTheme === 'glass' || selectedTheme === 'solid' ? 'icon-style' : 'ratings');
      return;
    }
    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      setStage(stageOrder[currentIndex + 1]);
    }
  };

  const canAdvance =
    (stage === 'media' && hasMedia) ||
    stage === 'theme' ||
    stage === 'icon-style' ||
    stage === 'ratings' ||
    stage === 'misc' ||
    stage === 'layout';

  const renderSegmented = (
    value: string,
    options: { id: string; label: string }[],
    onChange: (value: string) => void
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className="rounded-full px-3 py-2 syne-font text-[11px] uppercase tracking-[0.18em]"
            style={{
              border: active
                ? '1px solid rgba(196,124,46,0.45)'
                : '1px solid rgba(255,255,255,0.08)',
              background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? 'var(--film-amber)' : 'var(--film-text-label)',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto px-4 py-5 md:px-8 md:py-6" style={{ background: 'var(--film-black)' }}>
      <style>{`
        @keyframes walkthroughFadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto grid max-w-[1440px] gap-5 xl:grid-cols-[minmax(0,1.1fr)_460px]">
        <div className="space-y-4 xl:sticky xl:top-6 self-start">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p
                className="syne-font uppercase tracking-[0.3em]"
                style={{ fontSize: 10, color: 'var(--film-amber)' }}
              >
                Walkthrough
              </p>
              <h2 className="syne-font" style={{ fontSize: 28, color: 'var(--film-cream)' }}>
                {stageCopy.title}
              </h2>
              <p className="body-font max-w-xl" style={{ fontSize: 13, color: 'var(--film-text-dim)' }}>
                {stageCopy.subtitle}
              </p>
            </div>
            <div
              className="rounded-2xl px-3 py-2 text-right"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="syne-font uppercase tracking-[0.24em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                Progress
              </p>
              <p className="syne-font" style={{ fontSize: 16, color: 'var(--film-cream)' }}>
                {currentStep} / {totalSteps}
              </p>
            </div>
          </div>

          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div
              className="relative min-h-[440px] md:min-h-[620px]"
              style={{
                background:
                  'radial-gradient(circle at top, rgba(196,124,46,0.12), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              }}
            >
              <div className="absolute inset-x-6 top-5 z-20 flex items-center justify-between">
                <div
                  className="rounded-full px-3 py-1 syne-font text-[10px] uppercase tracking-[0.22em]"
                  style={{
                    color: 'var(--film-amber)',
                    background: 'rgba(0,0,0,0.55)',
                    border: '1px solid rgba(196,124,46,0.18)',
                  }}
                >
                  <Sparkles size={11} className="inline mr-1.5" />
                  Persistent preview
                </div>
                <div
                  className="rounded-full px-3 py-1 syne-font text-[10px] uppercase tracking-[0.22em]"
                  style={{
                    color: 'var(--film-text-label)',
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  3-poster cover flow
                </div>
              </div>

              <div className="relative flex h-full min-h-[440px] items-center justify-center px-5 py-12 md:px-10 md:py-16">
                <div className="absolute left-3 top-1/2 hidden w-[30%] max-w-[220px] -translate-y-1/2 sm:block">
                  <div
                    className="overflow-hidden rounded-[24px] border shadow-2xl"
                    style={{
                      opacity: 0.55,
                      filter: 'blur(1px) saturate(0.85)',
                      transform: 'perspective(1200px) rotateY(18deg) scale(0.9)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      {leftPosterUrl ? (
                        <img src={leftPosterUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-end p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))' }}>
                          <span className="syne-font text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--film-text-dim)' }}>
                            Alt A
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-full max-w-[420px]">
                  <div
                    className="overflow-hidden rounded-[30px] border shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(7,7,6,0.92)',
                    }}
                  >
                    <div className="pointer-events-none relative h-[460px] md:h-[620px]">
                      <PreviewCanvas
                        config={config}
                        setConfig={setConfig}
                        selectedIds={new Set<RatingType>()}
                        onSelect={() => undefined}
                        onContextMenu={() => undefined}
                        onLogoContextMenu={() => undefined}
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute right-3 top-1/2 hidden w-[30%] max-w-[220px] -translate-y-1/2 sm:block">
                  <div
                    className="overflow-hidden rounded-[24px] border shadow-2xl"
                    style={{
                      opacity: 0.55,
                      filter: 'blur(1px) saturate(0.85)',
                      transform: 'perspective(1200px) rotateY(-18deg) scale(0.9)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      {rightPosterUrl ? (
                        <img src={rightPosterUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-end justify-end p-4" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))' }}>
                          <span className="syne-font text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--film-text-dim)' }}>
                            Alt B
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className={`grid gap-2 ${stageOrder.length > 6 ? 'grid-cols-4 md:grid-cols-8' : 'grid-cols-4'}`}>
            {stageOrder.map((flowStage, index) => {
              const active = flowStage === stage;
              const complete = index + 1 < currentStep;
              return (
                <div
                  key={flowStage}
                  className="rounded-2xl px-2 py-2 text-center"
                  style={{
                    border: `1px solid ${active || complete ? 'rgba(196,124,46,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    background: active
                      ? 'rgba(196,124,46,0.12)'
                      : complete
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <p className="syne-font uppercase tracking-[0.18em]" style={{ fontSize: 9, color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }}>
                    {STAGE_COPY[flowStage].label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card
            variant="elevated"
            className="space-y-5"
            style={{ animation: 'walkthroughFadeSlide 260ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="space-y-1">
              <p className="syne-font uppercase tracking-[0.26em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                {stageCopy.label}
              </p>
              <h3 className="syne-font" style={{ fontSize: 20, color: 'var(--film-cream)' }}>
                {stageCopy.title}
              </h3>
            </div>

            {stage === 'media' && (
              <div className="space-y-4">
                <MediaPicker config={config} setConfig={setConfig} title="Search media" />

                <div className="space-y-2">
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Poster source
                  </p>
                  {renderSegmented(config.source, [...SOURCE_OPTIONS], (value) =>
                    setConfig((prev) => ({ ...prev, source: value as PosterConfig['source'] }))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Poster choice
                  </p>
                  {renderSegmented(config.ptype || 'auto', PTYPE_OPTIONS, (value) =>
                    setConfig((prev) => ({ ...prev, ptype: value }))
                  )}
                </div>

                <label
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div>
                    <p className="syne-font" style={{ fontSize: 14, color: 'var(--film-cream)' }}>
                      Textless poster
                    </p>
                    <p className="body-font" style={{ fontSize: 11, color: 'var(--film-text-dim)' }}>
                      Prefer textless artwork when the chosen source supports it.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={['metahub', 'imdb'].includes(config.source) ? false : config.textless}
                    disabled={['metahub', 'imdb'].includes(config.source)}
                    onChange={(event) =>
                      setConfig((prev) => ({ ...prev, textless: event.target.checked }))
                    }
                  />
                </label>
              </div>
            )}

            {stage === 'path' && (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBranch('preset');
                    setStage('presets');
                  }}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <ImagePlus size={16} style={{ color: 'var(--film-amber)' }} />
                  <p className="syne-font mt-3" style={{ fontSize: 15, color: 'var(--film-cream)' }}>
                    Preset
                  </p>
                  <p className="body-font mt-1" style={{ fontSize: 12, color: 'var(--film-text-dim)' }}>
                    Show curated presets and skip the rest of the walkthrough.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBranch('community');
                    setStage('community');
                  }}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Compass size={16} style={{ color: 'var(--film-amber)' }} />
                  <p className="syne-font mt-3" style={{ fontSize: 15, color: 'var(--film-cream)' }}>
                    Community Presets
                  </p>
                  <p className="body-font mt-1" style={{ fontSize: 12, color: 'var(--film-text-dim)' }}>
                    Open the examples gallery for community-created poster ideas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBranch('guided');
                    setStage('theme');
                  }}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    border: '1px solid rgba(196,124,46,0.18)',
                    background: 'rgba(196,124,46,0.07)',
                  }}
                >
                  <Wand2 size={16} style={{ color: 'var(--film-amber)' }} />
                  <p className="syne-font mt-3" style={{ fontSize: 15, color: 'var(--film-cream)' }}>
                    Guided Setup
                  </p>
                  <p className="body-font mt-1" style={{ fontSize: 12, color: 'var(--film-text-dim)' }}>
                    Continue through theme, icon style, ratings, misc, layout, and export.
                  </p>
                </button>
              </div>
            )}

            {stage === 'presets' && (
              <div className="space-y-3">
                {QUICK_PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyQuickPreset(option)}
                    className="w-full rounded-2xl px-4 py-4 text-left transition-all"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="syne-font" style={{ fontSize: 16, color: 'var(--film-cream)' }}>
                          {option.label}
                        </p>
                        <p className="body-font mt-1" style={{ fontSize: 12, color: 'var(--film-text-dim)' }}>
                          {option.description}
                        </p>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--film-text-dim)' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {stage === 'community' && (
              <div
                className="rounded-2xl p-5"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-label)' }}>
                  Community presets live in the examples gallery. This placeholder follows the diagram while
                  still giving you the redirect path.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  rightIcon={<ExternalLink size={12} />}
                  onClick={() => window.location.assign('/examples')}
                >
                  Go to /examples
                </Button>
              </div>
            )}

            {stage === 'theme' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    { id: 'solid', label: 'Solid' },
                    { id: 'glass', label: 'Glass' },
                    { id: 'minimal', label: 'Minimal' },
                    { id: 'text-only', label: 'Text Only' },
                  ] as const
                ).map((option) => {
                  const active = selectedTheme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => applyTheme(option.id)}
                      className="rounded-2xl p-4 text-left transition-all"
                      style={{
                        border: active
                          ? '1px solid rgba(196,124,46,0.45)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                        color: 'var(--film-cream)',
                      }}
                    >
                      <p className="syne-font" style={{ fontSize: 15 }}>{option.label}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {stage === 'icon-style' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { id: 1, label: 'Default' },
                  { id: 2, label: 'Alt' },
                  { id: 3, label: 'Mono' },
                ].map((option) => {
                  const active = (config.iconType ?? 1) === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, iconType: option.id }))
                      }
                      className="rounded-2xl p-4 text-left transition-all"
                      style={{
                        border: active
                          ? '1px solid rgba(196,124,46,0.45)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                        color: 'var(--film-cream)',
                      }}
                    >
                      <p className="syne-font" style={{ fontSize: 15 }}>{option.label}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {stage === 'ratings' && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {SIMPLE_BADGE_OPTIONS.map((id) => {
                  const label = ALL_BADGES.find((badge) => badge.id === id)?.label ?? id;
                  const active = config.ratings.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleBadge(id, !active)}
                      className="w-full rounded-2xl px-3 py-3 text-left syne-font text-[11px] uppercase tracking-[0.16em]"
                      style={{
                        border: active
                          ? '1px solid rgba(196,124,46,0.45)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                        color: active ? 'var(--film-amber)' : 'var(--film-text-label)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {stage === 'misc' && (
              <div className="space-y-3">
                {[
                  {
                    label: 'Show logo',
                    checked: config.logo,
                    onChange: (checked: boolean) =>
                      setConfig((prev) => ({ ...prev, logo: checked })),
                  },
                  {
                    label: 'Show title text',
                    checked: config.ratings.includes('title'),
                    onChange: (checked: boolean) => toggleBadge('title', checked),
                  },
                  {
                    label: 'Show rating text',
                    checked: config.showText !== false,
                    onChange: (checked: boolean) =>
                      setConfig((prev) => ({ ...prev, showText: checked })),
                  },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="syne-font" style={{ fontSize: 14, color: 'var(--film-cream)' }}>
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => item.onChange(event.target.checked)}
                    />
                  </label>
                ))}

                <div className="space-y-2">
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Logo source
                  </p>
                  {renderSegmented(String(config.logoSource ?? 'auto'), LOGO_SOURCE_OPTIONS, (value) =>
                    setConfig((prev) => ({
                      ...prev,
                      logoSource: value === 'auto' ? null : (value as PosterConfig['logoSource']),
                    }))
                  )}
                </div>
              </div>
            )}

            {stage === 'layout' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Layout direction
                  </p>
                  {renderSegmented(config.layout, [
                    { id: 'row', label: 'Row' },
                    { id: 'col', label: 'Column' },
                    { id: 'custom', label: 'Custom' },
                  ], (value) =>
                    setConfig((prev) => ({ ...prev, layout: value as PosterConfig['layout'] }))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Preset position
                  </p>
                  {renderSegmented(config.preset, PRESET_OPTIONS, (value) =>
                    setConfig((prev) => ({ ...prev, preset: value as PresetType, layout: 'row' }))
                  )}
                </div>
              </div>
            )}

            {stage === 'export' && (
              <div className="space-y-3">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <p className="syne-font uppercase tracking-[0.22em]" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                    Final enlarged preview
                  </p>
                  <p className="body-font mt-2" style={{ fontSize: 12, color: 'var(--film-text-label)' }}>
                    Export now or move the work into simple or advanced mode.
                  </p>
                </div>

                <Button
                  ref={exportBtnRef}
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<Download size={13} />}
                  onClick={() => setExportOpen((open) => !open)}
                >
                  Export Options
                </Button>
                {exportOpen && (
                  <ExportMenu
                    config={config}
                    onLoadConfig={onLoadConfig}
                    baseUrl={baseUrl}
                    onExtensionChange={onExtensionChange}
                    isOpen={exportOpen}
                    onClose={() => setExportOpen(false)}
                    anchorRef={exportBtnRef}
                  />
                )}

                <div className="grid gap-2 md:grid-cols-2">
                  <Button variant="secondary" size="md" fullWidth onClick={() => onExit('advanced')}>
                    Advanced Mode
                  </Button>
                  <Button variant="secondary" size="md" fullWidth onClick={() => onExit('simple')}>
                    Simple Mode
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={12} />}
              onClick={goBack}
              disabled={stageOrder.indexOf(stage) <= 0}
            >
              Back
            </Button>
            {stage !== 'path' && stage !== 'presets' && stage !== 'community' && stage !== 'export' && (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight size={12} />}
                onClick={goNext}
                disabled={!canAdvance}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughMode;
