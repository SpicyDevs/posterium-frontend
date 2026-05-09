import React, { useState, useEffect, useCallback } from 'react';
import { Combobox, Switch } from '@headlessui/react';
import {
  Check,
  Search,
  Loader2,
  Film,
  Tv,
  Clapperboard,
  Badge,
  ImagePlay,
  KeyRound,
} from 'lucide-react';
import clsx from 'clsx';
import type { PosterConfig } from '../../types';
import { DEFAULT_CONFIG } from '../../types';
import { DEFAULT_API_BASE } from '../../utils';
import SidebarLayout from '../SidebarLayout';
import { Section, ToggleRow, SelectBox, SegmentedRow } from '../ui';
import ApiKeysPanel from './ApiKeysPanel';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

interface SourceTabContentProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  disableBadges: (opts?: { persistPreference?: boolean }) => void;
  enableBadges: () => void;
  badgesVisible: boolean;
  setLiveRatings: (ratings: Record<string, string>) => void;
  setLiveTitle: (title: string) => void;
  setLiveYear: (year: string) => void;
  detailLevel?: 'simple' | 'advanced';
}

const SourceTabContent: React.FC<SourceTabContentProps> = ({
  config,
  setConfig,
  disableBadges,
  enableBadges,
  badgesVisible,
  setLiveRatings,
  setLiveTitle,
  setLiveYear,
  detailLevel = 'simple',
}) => {
  const isAdvanced = detailLevel === 'advanced';
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchedData, setFetchedData] = useState<Record<string, string>>({});

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
    if (!config.tmdbId && !config.imdbId) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const idPath = config.imdbId
          ? `/poster/${config.imdbId}`
          : `/${config.mediaType}/${config.tmdbId}`;
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
        setFetchedData(merged);
        const liveRatingsFiltered: Record<string, string> = {};
        if (data.ratings) {
          Object.entries(data.ratings).forEach(([k, v]) => {
            if (VALID_RATING_KEYS.includes(k)) liveRatingsFiltered[k] = String(v);
          });
        }
        setLiveRatings(liveRatingsFiltered);
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
    setLiveRatings,
    setLiveTitle,
    setLiveYear,
    setConfig,
  ]);

  const handleSelectMedia = useCallback(
    (item: SearchResult | null) => {
      if (!item) return;
      setFetchedData({
        title: item.title || item.name || '',
        year: (item.release_date || item.first_air_date)?.split('-')[0] || '',
      });
      setConfig((prev) => ({
        ...prev,
        tmdbId: item.id.toString(),
        imdbId: undefined,
        mediaType: item.media_type as PosterConfig['mediaType'],
      }));
      setSearchQuery('');
      setResults([]);
    },
    [setConfig]
  );

  const updateConfig = useCallback(
    <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig]
  );

  const MediaIcon =
    config.mediaType === 'tv' ? Tv : config.mediaType === 'anime' ? Clapperboard : Film;

  const sourceOptions = [
    { id: 'tmdb', label: 'TMDB' },
    { id: 'fanart', label: 'Fanart.tv' },
    { id: 'metahub', label: 'Metahub' },
    { id: 'imdb', label: 'IMDb' },
    ...(config.mediaType === 'anime'
      ? [
          { id: 'mal', label: 'MyAnimeList' },
          { id: 'anilist', label: 'AniList' },
        ]
      : []),
  ];

  const ptypeOptions = [
    { id: 'auto', label: 'Auto (Default)' },
    { id: 'top1', label: 'Top 1' },
    { id: 'top2', label: 'Top 2' },
    { id: 'top3', label: 'Top 3' },
    ...(config.source === 'tmdb' ? [{ id: 'best', label: 'Best (Bayesian)' }] : []),
    ...(config.source === 'fanart'
      ? [
          { id: 'latest', label: 'Latest' },
          { id: 'oldest', label: 'Oldest' },
        ]
      : []),
    { id: 'random', label: 'Random' },
  ];

  const logoSourceOptions = [
    { id: 'auto', label: 'Auto' },
    { id: 'fanart', label: 'Fanart' },
    { id: 'tmdb', label: 'TMDB' },
    { id: 'metahub', label: 'Hub' },
  ];

  const titleBadgeEnabled = config.ratings.includes('title');

  return (
    <div className="space-y-4 px-1">
      {/* Media info card */}
      {(fetchedData.title || config.tmdbId) && (
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="syne-font font-semibold leading-tight line-clamp-2"
                style={{ fontSize: 12, color: 'var(--film-cream)' }}
              >
                {fetchedData.title || (
                  <span style={{ color: 'var(--film-text-dim)', fontStyle: 'italic' }}>
                    Untitled
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {fetchedData.year && (
                  <span
                    className="mono-font"
                    style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
                  >
                    {fetchedData.year}
                  </span>
                )}
                <span
                  className="syne-font inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background:
                      config.mediaType === 'tv'
                        ? 'rgba(59,130,246,0.12)'
                        : config.mediaType === 'anime'
                        ? 'rgba(168,85,247,0.12)'
                        : 'rgba(196,124,46,0.12)',
                    color:
                      config.mediaType === 'tv'
                        ? '#60a5fa'
                        : config.mediaType === 'anime'
                        ? '#c084fc'
                        : 'var(--film-amber)',
                  }}
                >
                  <MediaIcon size={9} />
                  {config.mediaType}
                </span>
                {config.imdbId && (
                  <span
                    className="mono-font"
                    style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
                  >
                    {config.imdbId}
                  </span>
                )}
              </div>
            </div>
            <div
              className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
              style={{
                background:
                  config.mediaType === 'tv'
                    ? 'rgba(59,130,246,0.08)'
                    : config.mediaType === 'anime'
                    ? 'rgba(168,85,247,0.08)'
                    : 'rgba(196,124,46,0.08)',
              }}
            >
              <MediaIcon
                size={16}
                style={{
                  color:
                    config.mediaType === 'tv'
                      ? 'rgba(96,165,250,0.6)'
                      : config.mediaType === 'anime'
                      ? 'rgba(192,132,252,0.6)'
                      : 'rgba(196,124,46,0.6)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div>
        <p
          className="syne-font uppercase tracking-widest mb-1.5"
          style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
        >
          Search Media
        </p>
        <Combobox value={null as SearchResult | null} onChange={handleSelectMedia}>
          <div className="relative">
            <div
              className="relative flex items-center h-9 rounded-lg transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.contains(document.activeElement)) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div className="pl-3" style={{ color: 'var(--film-text-dim)', flexShrink: 0 }}>
                {isSearching ? (
                  <Loader2
                    size={12}
                    className="animate-spin"
                    style={{ color: 'var(--film-amber)' }}
                  />
                ) : (
                  <Search size={12} />
                )}
              </div>
              <Combobox.Input
                className="flex-1 bg-transparent border-none text-[11px] placeholder-[var(--film-text-dim)] px-2 focus:outline-none focus:ring-0 h-full syne-font"
                style={{ color: 'var(--film-pale)' }}
                onChange={(e) => setSearchQuery(e.target.value)}
                displayValue={() => ''}
                placeholder="Movie or TV show…"
              />
            </div>
            {results.length > 0 && (
              <Combobox.Options
                transition
                className="absolute top-full mt-1 z-50 w-full custom-scrollbar py-1.5 focus:outline-none transition duration-75 ease-in data-[closed]:opacity-0 max-h-64 overflow-y-auto"
                style={{
                  background: 'var(--film-mid)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                }}
              >
                {results.map((item) => (
                  <Combobox.Option
                    key={item.id}
                    value={item}
                    className={({ active }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                        active && 'bg-[rgba(196,124,46,0.08)]'
                      )
                    }
                  >
                    <img
                      src={item.poster_path}
                      alt=""
                      className="w-8 h-11 object-cover rounded-md shrink-0"
                      style={{ background: 'var(--film-char)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="syne-font font-medium truncate"
                        style={{ fontSize: 11, color: 'var(--film-cream)' }}
                      >
                        {item.title || item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="mono-font"
                          style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
                        >
                          {(item.release_date || item.first_air_date)?.split('-')[0]}
                        </span>
                        <span
                          className="syne-font px-1 py-px rounded"
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              item.media_type === 'tv'
                                ? 'rgba(59,130,246,0.12)'
                                : 'rgba(196,124,46,0.12)',
                            color: item.media_type === 'tv' ? '#60a5fa' : 'var(--film-amber)',
                          }}
                        >
                          {item.media_type}
                        </span>
                      </div>
                    </div>
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            )}
          </div>
        </Combobox>
      </div>

      {/* Media type + ID */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div>
          <p
            className="syne-font uppercase tracking-widest mb-1.5"
            style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
          >
            Media Type
          </p>
          <SelectBox
            value={config.mediaType}
            onChange={(v) => updateConfig('mediaType', v as PosterConfig['mediaType'])}
            options={[
              { id: 'movie', label: '🎬 Movie' },
              { id: 'tv', label: '📺 TV Series' },
              { id: 'anime', label: '🎌 Anime' },
            ]}
          />
        </div>
        <div className="w-24">
          <p
            className="syne-font uppercase tracking-widest mb-1.5"
            style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
          >
            IMDb ID
          </p>
          <input
            type="text"
            value={config.imdbId || config.tmdbId}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val.startsWith('tt')) {
                setConfig((prev) => ({ ...prev, imdbId: val }));
              } else {
                setConfig((prev) => ({ ...prev, tmdbId: val, imdbId: undefined }));
              }
            }}
            className="w-full h-9 px-2 rounded-lg mono-font text-center focus:outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 11,
              color: 'var(--film-pale)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          />
        </div>
      </div>

      {/* Source + ptype (simple mode: hide ptype) */}
      {isAdvanced && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p
              className="syne-font uppercase tracking-widest mb-1.5"
              style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
            >
              Poster Source
            </p>
            <SelectBox
              value={config.source}
              onChange={(v) => updateConfig('source', v as PosterConfig['source'])}
              options={sourceOptions}
            />
          </div>
          {['fanart', 'tmdb', 'imdb'].includes(config.source) && (
            <div>
              <p
                className="syne-font uppercase tracking-widest mb-1.5"
                style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
              >
                Poster Type
              </p>
              <SelectBox
                value={config.ptype || 'auto'}
                onChange={(v) => updateConfig('ptype', v)}
                options={ptypeOptions}
              />
            </div>
          )}
        </div>
      )}

      {/* Textless toggle */}
      <ToggleRow
        label="Textless Poster"
        sub="Remove title text from image"
        checked={['metahub', 'imdb'].includes(config.source) ? false : config.textless}
        onChange={(v) => updateConfig('textless', v)}
        disabled={['metahub', 'imdb'].includes(config.source)}
      />

      {/* Poster blur + grayscale moved to here from poster tab */}
      <Section title="Poster Effects" defaultOpen>
        <div className="space-y-3">
          <ToggleRow
            label="Blur"
            sub="Apply blur to background image"
            checked={config.posterBlur > 0}
            onChange={(v) => updateConfig('posterBlur', v ? 10 : 0)}
          />
          <ToggleRow
            label="Grayscale"
            sub="Desaturate poster image"
            checked={config.grayscale}
            onChange={(v) => updateConfig('grayscale', v)}
          />
        </div>
      </Section>

      <div className="pt-1 space-y-2">
        <ToggleRow
          label="Title Layer"
          sub="Show title as draggable badge layer"
          checked={titleBadgeEnabled}
          onChange={(v) =>
            setConfig((prev) => ({
              ...prev,
              ratings: v
                ? prev.ratings.includes('title')
                  ? prev.ratings
                  : [...prev.ratings, 'title']
                : prev.ratings.filter((r) => r !== 'title'),
            }))
          }
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="body-font font-medium flex items-center gap-1.5"
              style={{ fontSize: 11, color: 'var(--film-text-label)' }}
            >
              <Badge size={11} /> Badges
            </p>
            <p
              className="body-font mt-0.5"
              style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
            >
              Show/hide all layers with badge behavior
            </p>
          </div>
          <Switch
            checked={badgesVisible}
            onChange={(v) => {
              if (v) enableBadges();
              else disableBadges({ persistPreference: true });
            }}
            className={clsx(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
              badgesVisible ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
            )}
          >
            <span
              className={clsx(
                'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                badgesVisible ? 'translate-x-[18px]' : 'translate-x-[3px]'
              )}
            />
          </Switch>
        </div>
      </div>

      {/* Logo overlay */}
      <div className="pt-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <ImagePlay
              size={13}
              style={{ color: config.logo ? 'var(--film-amber)' : 'var(--film-text-dim)' }}
            />
            <div>
              <p
                className="syne-font font-semibold"
                style={{ fontSize: 11, color: 'var(--film-text-label)' }}
              >
                Logo Overlay
              </p>
              <p className="body-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
                {config.logo
                  ? 'Enabled · Customizable in the Badges/Logo tab'
                  : 'Transparent title art overlay'}
              </p>
            </div>
          </div>
          <Switch
            checked={config.logo}
            onChange={(v) => updateConfig('logo', v)}
            className={clsx(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
              config.logo ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
            )}
          >
            <span
              className={clsx(
                'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                config.logo ? 'translate-x-[18px]' : 'translate-x-[3px]'
              )}
            />
          </Switch>
        </div>
        <div className="px-1">
          <SegmentedRow
            label="Logo Source"
            value={String(config.logoSource ?? 'auto')}
            onChange={(v) =>
              updateConfig(
                'logoSource',
                v === 'auto' ? null : (v as PosterConfig['logoSource'])
              )
            }
            options={logoSourceOptions}
          />
        </div>
        <div
          className="mt-5 mx-1"
          style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
          aria-hidden="true"
        />
      </div>

      {isAdvanced && (
        <Section
          inset="compact"
          title="API Keys"
          icon={<KeyRound size={13} />}
          defaultOpen={false}
        >
          <ApiKeysPanel config={config} setConfig={setConfig} />
        </Section>
      )}
    </div>
  );
};

export default SourceTabContent;