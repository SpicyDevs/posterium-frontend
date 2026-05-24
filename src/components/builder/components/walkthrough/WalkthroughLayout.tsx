import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Loader2, Search, X } from 'lucide-react';
import type { PosterConfig, RatingType } from '../../types';
import { ALL_BADGES } from '../../types';
import { BADGE_ICONS } from '../../constants';
import { DEFAULT_API_BASE } from '../../utils';
import { useEditor } from '../../context/EditorContext';
import PreviewCanvas from '../PreviewCanvas';
import StepIndicator from './StepIndicator';
import SkeletonLayoutSelector, { type SkeletonLayoutOption } from './SkeletonLayoutSelector';
import RevealAndExport from './RevealAndExport';
import type { BuilderMode } from '../navigation/ModeToggle';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onModeChange: (mode: BuilderMode) => void;
}

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

const STEP_LABELS = ['Source', 'Layout', 'Badges', 'Reveal'];

const LAYOUT_OPTIONS: SkeletonLayoutOption[] = [
  {
    id: 'top-corners',
    label: 'Top Corners',
    description: 'Cluster ratings at the top for classic studio posters.',
    preset: 'tl',
    layout: 'row',
    blocks: [
      { x: 10, y: 14, w: 26, h: 16 },
      { x: 64, y: 14, w: 26, h: 16 },
    ],
  },
  {
    id: 'bottom-bar',
    label: 'Bottom Bar',
    description: 'A cinematic footer strip that anchors the ratings.',
    preset: 'bc',
    layout: 'row',
    blocks: [{ x: 18, y: 68, w: 64, h: 16 }],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    description: 'Centered stack for a clean, gallery-like layout.',
    preset: 'cc',
    layout: 'col',
    blocks: [
      { x: 36, y: 28, w: 28, h: 12 },
      { x: 36, y: 46, w: 28, h: 12 },
      { x: 36, y: 64, w: 28, h: 12 },
    ],
  },
];

const WALKTHROUGH_BADGES = ALL_BADGES.filter((badge) => !['title', 'year'].includes(badge.id));

const getBadgeIconKey = (id: RatingType) =>
  id === 'rt' ? 'rt_fresh' : id === 'rt_popcorn' ? 'popcorn_fresh' : id;

const WalkthroughLayout: React.FC<Props> = ({ config, setConfig, baseUrl, onModeChange }) => {
  const { setLiveRatings, setLiveTitle, setLiveYear, setFallbackEnabled } = useEditor();
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);

  const ambientPoster = selectedMedia?.poster_path ?? null;

  useEffect(() => {
    if ((config.uiPreset ?? 'b') !== 'b') {
      setConfig((prev) => ({ ...prev, uiPreset: 'b' }));
    }
  }, [config.uiPreset, setConfig]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`${DEFAULT_API_BASE}/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (data.results)
          setResults(
            data.results.filter(
              (i: SearchResult) => i.poster_path && ['movie', 'tv'].includes(i.media_type)
            )
          );
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery) setResults([]);
  }, [searchQuery]);

  useEffect(() => {
    setFallbackEnabled(config.fallbackEnabled);
  }, [config.fallbackEnabled, setFallbackEnabled]);

  useEffect(() => {
    if (!config.tmdbId && !config.imdbId) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const idPath = config.imdbId ? `/poster/${config.imdbId}` : `/${config.mediaType}/${config.tmdbId}`;
        const res = await fetch(`${DEFAULT_API_BASE}${idPath}.json?source=${config.source}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const merged: Record<string, string> = {};
        if (data.meta?.title) merged.title = data.meta.title;
        if (data.meta?.year) merged.year = String(data.meta.year).replace(/\.0+$/, '');
        const VALID_RATING_KEYS = [
          'imdb',
          'rt',
          'rt_popcorn',
          'letterboxd',
          'meta',
          'tmdb',
          'mal',
          'anilist',
          'age',
          'runtime',
        ];
        if (data.ratings) {
          Object.entries(data.ratings).forEach(([k, v]) => {
            if (VALID_RATING_KEYS.includes(k)) merged[k] = String(v);
          });
        }
        setLiveRatings(
          Object.fromEntries(
            Object.entries(merged).filter(([k]) => VALID_RATING_KEYS.includes(k))
          )
        );
        setLiveTitle(merged.title ?? '');
        setLiveYear(merged.year ?? '');
        if (data.ids?.imdb && data.ids.imdb !== config.imdbId) {
          setConfig((prev) => ({ ...prev, imdbId: data.ids.imdb }));
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    })();
    return () => ctrl.abort();
  }, [
    config.tmdbId,
    config.imdbId,
    config.mediaType,
    config.source,
    setConfig,
    setLiveRatings,
    setLiveTitle,
    setLiveYear,
  ]);

  const handleSelectMedia = useCallback(
    (item: SearchResult) => {
      setSelectedMedia(item);
      setConfig((prev) => ({
        ...prev,
        tmdbId: item.id.toString(),
        imdbId: undefined,
        mediaType: item.media_type as PosterConfig['mediaType'],
      }));
      setSearchQuery('');
      setResults([]);
      setCurrentStep((prev) => (prev === 0 ? 1 : prev));
    },
    [setConfig]
  );

  const activeLayoutId = useMemo(() => {
    const match = LAYOUT_OPTIONS.find(
      (option) => option.preset === config.preset && option.layout === config.layout
    );
    return match?.id ?? null;
  }, [config.layout, config.preset]);

  const applyLayout = useCallback(
    (option: SkeletonLayoutOption) => {
      setConfig((prev) => {
        const nextItems = { ...prev.items };
        (Object.keys(nextItems) as RatingType[]).forEach((key) => {
          if (nextItems[key]) {
            const { x: _x, y: _y, ...rest } = nextItems[key]!;
            nextItems[key] = rest;
          }
        });
        return {
          ...prev,
          preset: option.preset,
          layout: option.layout,
          uiPreset: 'b',
          items: nextItems,
        };
      });
    },
    [setConfig]
  );

  const toggleBadge = useCallback(
    (id: RatingType) => {
      setConfig((prev) => {
        const exists = prev.ratings.includes(id);
        const nextRatings = exists
          ? prev.ratings.filter((r) => r !== id)
          : [id, ...prev.ratings];
        return { ...prev, ratings: nextRatings };
      });
    },
    [setConfig]
  );

  const canProceed = useMemo(() => {
    if (currentStep === 0) return Boolean(config.tmdbId || config.imdbId);
    if (currentStep === 1) return true;
    if (currentStep === 2) return config.ratings.length > 0;
    return true;
  }, [config.imdbId, config.ratings.length, config.tmdbId, currentStep]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
  }, [canProceed]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  return (
    <div
      className="builder-ui relative flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        background: 'var(--film-black)',
        color: 'var(--film-cream)',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <style>{`
        .walkthrough-step { transition: opacity 0.5s ease, transform 0.5s ease; }
      `}</style>

      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top, rgba(196,124,46,0.18), transparent 55%), radial-gradient(circle at bottom, rgba(15,15,18,0.9), rgba(7,7,8,0.9))',
          }}
        />
        {ambientPoster && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${ambientPoster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) saturate(1.2)',
              opacity: 0.35,
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'rgba(7,7,8,0.55)' }} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4">
        <a
          href="/"
          className="poster-font tracking-[0.2em]"
          style={{ fontSize: 16, color: 'var(--film-cream)', textDecoration: 'none' }}
        >
          POSTERIUM
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange('advanced')}
            className="h-9 px-4 rounded-full syne-font text-[10px] uppercase tracking-widest transition-all"
            style={{
              border: '1px solid rgba(196,124,46,0.4)',
              background: 'rgba(196,124,46,0.12)',
              color: 'var(--film-cream)',
            }}
          >
            Switch to Advanced Mode
          </button>
          <a
            href="/"
            className="flex items-center gap-1.5 h-9 px-3 rounded-full syne-font text-[10px] uppercase tracking-widest transition-all"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--film-text-dim)',
              textDecoration: 'none',
            }}
          >
            <X size={12} />
            Exit
          </a>
        </div>
      </header>

      <div className="relative z-10 px-4 sm:px-6 pb-4">
        <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />
      </div>

      <div className="relative z-10 flex-1 overflow-hidden">
        {STEP_LABELS.map((label, index) => (
          <section
            key={label}
            className={clsx(
              'walkthrough-step absolute inset-0',
              index === currentStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
            )}
          >
            {index === 0 && (
              <div className="h-full overflow-y-auto px-4 sm:px-6 pb-12">
                <div className="max-w-5xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <p
                      className="syne-font uppercase tracking-[0.5em]"
                      style={{ fontSize: 11, color: 'var(--film-amber)' }}
                    >
                      Step 01
                    </p>
                    <h2 className="poster-font text-3xl sm:text-4xl">Choose the Source</h2>
                    <p className="body-font" style={{ color: 'var(--film-text-dim)', fontSize: 14 }}>
                      Search for a movie or TV show to anchor your poster.
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <div
                      className="flex items-center gap-2 rounded-full px-4 h-12"
                      style={{
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {isSearching ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--film-amber)' }} />
                      ) : (
                        <Search size={16} style={{ color: 'var(--film-text-dim)' }} />
                      )}
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search TMDB titles..."
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                        style={{ color: 'var(--film-cream)' }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((item) => {
                      const isActive = selectedMedia?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectMedia(item)}
                          className="group text-left rounded-2xl overflow-hidden transition-all"
                          style={{
                            border: isActive ? '1px solid rgba(196,124,46,0.5)' : '1px solid rgba(255,255,255,0.1)',
                            background: isActive ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="relative">
                            <img
                              src={item.poster_path}
                              alt={item.title || item.name || 'Poster'}
                              className="w-full h-60 object-cover"
                              style={{ filter: isActive ? 'none' : 'saturate(0.9)' }}
                            />
                            {isActive && (
                              <div
                                className="absolute inset-0"
                                style={{ boxShadow: 'inset 0 0 0 2px rgba(196,124,46,0.8)' }}
                              />
                            )}
                          </div>
                          <div className="p-4 space-y-1">
                            <p className="syne-font text-sm" style={{ color: 'var(--film-cream)' }}>
                              {item.title || item.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--film-text-dim)' }}>
                              <span>{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
                              <span className="uppercase tracking-widest">
                                {item.media_type === 'tv' ? 'Series' : 'Movie'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {index === 1 && (
              <div className="h-full overflow-y-auto px-4 sm:px-6 pb-12">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <p
                      className="syne-font uppercase tracking-[0.5em]"
                      style={{ fontSize: 11, color: 'var(--film-amber)' }}
                    >
                      Step 02
                    </p>
                    <h2 className="poster-font text-3xl sm:text-4xl">Pick the Skeleton</h2>
                    <p className="body-font" style={{ color: 'var(--film-text-dim)', fontSize: 14 }}>
                      Choose a layout frame before we reveal the real poster.
                    </p>
                  </div>

                  <SkeletonLayoutSelector
                    options={LAYOUT_OPTIONS}
                    value={activeLayoutId}
                    onChange={applyLayout}
                  />
                </div>
              </div>
            )}

            {index === 2 && (
              <div className="h-full overflow-y-auto px-4 sm:px-6 pb-12">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <p
                      className="syne-font uppercase tracking-[0.5em]"
                      style={{ fontSize: 11, color: 'var(--film-amber)' }}
                    >
                      Step 03
                    </p>
                    <h2 className="poster-font text-3xl sm:text-4xl">Select Ratings</h2>
                    <p className="body-font" style={{ color: 'var(--film-text-dim)', fontSize: 14 }}>
                      Tap the badges you want to feature.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {WALKTHROUGH_BADGES.map((badge) => {
                      const isActive = config.ratings.includes(badge.id);
                      const iconKey = getBadgeIconKey(badge.id);
                      const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id];
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => toggleBadge(badge.id)}
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                          style={{
                            border: `1px solid ${
                              isActive ? 'rgba(196,124,46,0.55)' : 'rgba(255,255,255,0.1)'
                            }`,
                            background: isActive ? 'rgba(196,124,46,0.14)' : 'rgba(255,255,255,0.03)',
                            transform: isActive ? 'translateY(-1px) scale(1.01)' : 'none',
                          }}
                        >
                          <span
                            className="flex items-center justify-center w-10 h-10 rounded-full"
                            style={{
                              background: 'rgba(7,7,8,0.6)',
                              border: `1px solid ${
                                isActive ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.1)'
                              }`,
                            }}
                          >
                            {iconData ? (
                              <svg
                                width="22"
                                height="22"
                                viewBox={iconData.vb}
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ color: iconData.color }}
                                dangerouslySetInnerHTML={{ __html: iconData.body }}
                              />
                            ) : (
                              <span className="syne-font" style={{ fontSize: 11 }}>
                                {badge.label.slice(0, 2)}
                              </span>
                            )}
                          </span>
                          <div className="flex-1">
                            <p className="syne-font text-sm" style={{ color: 'var(--film-cream)' }}>
                              {badge.label}
                            </p>
                            <p className="body-font text-xs" style={{ color: 'var(--film-text-dim)' }}>
                              {isActive ? 'Included' : 'Tap to add'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {index === 3 && (
              <div className="h-full flex flex-col">
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full max-w-5xl px-4 sm:px-6 flex items-center justify-center">
                      <div className="w-full h-full relative pointer-events-none">
                        <PreviewCanvas
                          config={config}
                          setConfig={setConfig}
                          selectedIds={new Set()}
                          onSelect={() => {}}
                          onContextMenu={() => {}}
                          onLogoContextMenu={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative px-4 sm:px-6 pb-8 -mt-16">
                  <RevealAndExport
                    config={config}
                    baseUrl={baseUrl}
                    onExtensionChange={(ext) => setConfig((prev) => ({ ...prev, extension: ext }))}
                    onOpenAdvanced={() => onModeChange('advanced')}
                  />
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {currentStep < STEP_LABELS.length - 1 && (
        <div className="relative z-10 px-4 sm:px-6 pb-6 pt-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 h-10 px-4 rounded-full syne-font text-[10px] uppercase tracking-widest transition-all disabled:opacity-40"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--film-text-dim)',
              }}
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2 h-10 px-5 rounded-full syne-font text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
              style={{
                border: '1px solid rgba(196,124,46,0.4)',
                background: 'rgba(196,124,46,0.12)',
                color: 'var(--film-cream)',
              }}
            >
              Next
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkthroughLayout;
