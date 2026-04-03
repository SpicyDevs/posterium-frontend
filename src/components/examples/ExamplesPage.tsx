import React, { memo, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import MainNavbar from '@/components/shared/MainNavbar';
import ExportMenu from '@/components/shared/ExportMenu';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import examplesData from '@/data/examples.json';
import { API, REEL_ITEMS } from '@/lib/dashboard/constants';
import type { ExtensionType, PosterConfig } from '@/components/builder/types';
import { DEFAULT_CONFIG } from '@/components/builder/types';

interface ExamplePreset {
  id: string;
  title: string;
  description: string;
  query: string;
}

const presets = examplesData as ExamplePreset[];

const DEFAULT_IMDB = 'tt0468569';

const toSearchParams = (query: string): URLSearchParams => {
  const normalized = query.trim();
  const q = normalized.startsWith('?') ? normalized.slice(1) : normalized;
  return new URLSearchParams(q);
};

const setExtInQuery = (query: string, ext: ExtensionType): string => {
  const params = toSearchParams(query);
  params.set('ext', ext);
  return params.toString();
};

const buildPreviewUrl = (mediaType: 'movie' | 'tv', tmdbId: string, query: string): string => {
  const params = toSearchParams(query);
  params.delete('ext');
  const clean = params.toString();
  return `${API}/${mediaType}/${tmdbId}.webp${clean ? `?${clean}` : ''}`;
};

const buildBuilderUrl = (query: string): string => {
  const params = toSearchParams(query);
  const extParam = params.get('ext');
  const extension: ExtensionType =
    extParam === 'svg' || extParam === 'png' || extParam === 'jpg' || extParam === 'webp'
      ? extParam
      : 'png';

  params.delete('ext');
  const finalQuery = params.toString();
  const posterUrl = `${API}/poster/${DEFAULT_IMDB}.${extension}${finalQuery ? `?${finalQuery}` : ''}`;
  return `/build?url=${encodeURIComponent(posterUrl)}`;
};

const baseConfig: PosterConfig = {
  ...DEFAULT_CONFIG,
  mediaType: 'movie',
  tmdbId: '',
  imdbId: DEFAULT_IMDB,
  ratings: ['imdb', 'rt', 'meta'],
  extension: 'webp',
  source: 'tmdb',
};

const ExamplesPage = memo(() => {
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [queries, setQueries] = useState<Record<string, string>>(() =>
    Object.fromEntries(presets.map((preset) => [preset.id, preset.query]))
  );

  const exportBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const reelFallback = REEL_ITEMS.filter((item) => item.type === 'movie');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = presets.map((preset, index) => {
      const movie = reelFallback[index % reelFallback.length];
      const query = queries[preset.id] ?? preset.query;
      return {
        preset,
        movie,
        query,
        previewUrl: buildPreviewUrl(movie.type, movie.id, query),
        builderUrl: buildBuilderUrl(query),
      };
    });

    if (!q) return items;
    return items.filter(
      ({ preset, query }) =>
        preset.title.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        query.toLowerCase().includes(q)
    );
  }, [search, reelFallback, queries]);

  const getQueryExtension = (query: string): ExtensionType => {
    const extParam = toSearchParams(query).get('ext');
    return extParam === 'svg' || extParam === 'png' || extParam === 'jpg' || extParam === 'webp'
      ? extParam
      : 'webp';
  };

  return (
    <div
      style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)' }}
    >
      <MainNavbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search examples…',
        }}
        keepSearchOnMobile
        showMobileBuildCta
      />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '84px 20px 40px' }}>
        <header style={{ marginBottom: 18 }}>
          <h1
            className="poster-font"
            style={{
              margin: 0,
              fontSize: 'clamp(34px,7vw,62px)',
              lineHeight: 0.88,
              letterSpacing: '0.08em',
            }}
          >
            EXAMPLES
          </h1>
          <p
            className="body-font"
            style={{ margin: '10px 0 0', color: 'var(--film-text-dim)', fontSize: 14 }}
          >
            Badge position/style presets from JSON query strings. Edit query and open in builder.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))',
            gap: 14,
          }}
        >
          {filtered.map(({ preset, movie, query, previewUrl, builderUrl }) => {
            const isOpen = activeMenuId === preset.id;

            return (
              <article
                key={preset.id}
                style={{
                  position: 'relative',
                  border: '1px solid rgba(196,124,46,0.15)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(22,20,16,0.8), rgba(14,13,11,0.95))',
                }}
              >
                <div style={{ aspectRatio: '2 / 3', position: 'relative' }}>
                  <ProgressiveImage
                    src={previewUrl}
                    alt={`${preset.title} preview`}
                    containerStyle={{ width: '100%', height: '100%' }}
                    imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={
                      <div
                        className="body-font"
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--film-text-dim)',
                        }}
                      >
                        Failed to load
                      </div>
                    }
                  />

                  <div
                    className="example-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      gap: 8,
                      padding: 10,
                      background:
                        'linear-gradient(180deg, rgba(7,7,6,0) 34%, rgba(7,7,6,0.9) 100%)',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <button
                      ref={(el) => {
                        exportBtnRefs.current[preset.id] = el;
                      }}
                      type="button"
                      onClick={() =>
                        setActiveMenuId((prev) => (prev === preset.id ? null : preset.id))
                      }
                      className="syne-font"
                      style={{
                        border: '1px solid rgba(196,124,46,0.2)',
                        background: 'rgba(18,17,14,0.9)',
                        color: 'var(--film-cream)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Export
                    </button>

                    <a
                      href={builderUrl}
                      className="syne-font"
                      style={{
                        textDecoration: 'none',
                        border: '1px solid rgba(196,124,46,0.25)',
                        background: 'var(--film-amber)',
                        color: '#070706',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.09em',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <ExternalLink size={12} /> Open in Builder
                    </a>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    className="syne-font"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--film-cream)',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {preset.title}
                  </div>
                  <div
                    className="body-font"
                    style={{ fontSize: 11, color: 'var(--film-text-dim)' }}
                  >
                    {preset.description}
                  </div>
                  <div
                    className="body-font"
                    style={{ fontSize: 10, color: 'var(--film-text-ghost)' }}
                  >
                    Preview poster: {movie.title}
                  </div>

                  <textarea
                    value={query}
                    readOnly
                    className="mono-font"
                    style={{
                      width: '100%',
                      minHeight: 74,
                      resize: 'none',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'var(--film-text-dim)',
                      fontSize: 10,
                      lineHeight: 1.4,
                      padding: 8,
                      cursor: 'not-allowed',
                      opacity: 0.9,
                    }}
                    spellCheck={false}
                    aria-label={`${preset.title} query preset`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(query);
                      setCopiedQueryId(preset.id);
                      window.setTimeout(() => {
                        setCopiedQueryId((current) => (current === preset.id ? null : current));
                      }, 1600);
                    }}
                    className="syne-font"
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--film-text-dim)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                    aria-label={`Copy ${preset.title} query`}
                  >
                    {copiedQueryId === preset.id ? (
                      <Check size={11} className="text-emerald-400" />
                    ) : (
                      <Copy size={11} />
                    )}{' '}
                    {copiedQueryId === preset.id ? 'Query Copied' : 'Copy Query'}
                  </button>
                </div>

                <ExportMenu
                  config={{ ...baseConfig, extension: getQueryExtension(query) }}
                  baseUrl={API}
                  onExtensionChange={(ext) => {
                    setQueries((prev) => ({
                      ...prev,
                      [preset.id]: setExtInQuery(prev[preset.id] ?? preset.query, ext),
                    }));
                  }}
                  isOpen={isOpen}
                  onClose={() => setActiveMenuId(null)}
                  anchorRef={{ current: exportBtnRefs.current[preset.id] }}
                  urlOverride={`${API}/poster/${DEFAULT_IMDB}.${getQueryExtension(query)}${(() => {
                    const params = toSearchParams(query);
                    params.delete('ext');
                    const clean = params.toString();
                    return clean ? `?${clean}` : '';
                  })()}`}
                  openInBuilderHref={builderUrl}
                />
              </article>
            );
          })}
        </section>

        {!filtered.length ? (
          <div
            className="syne-font"
            style={{
              marginTop: 14,
              border: '1px solid rgba(196,124,46,0.14)',
              background: 'rgba(24,22,18,0.6)',
              borderRadius: 10,
              padding: 16,
              color: 'var(--film-text-dim)',
              fontSize: 13,
            }}
          >
            No examples matched your search.
          </div>
        ) : null}
      </main>

      <style>{`
        article:hover .example-overlay,
        article:focus-within .example-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
});

ExamplesPage.displayName = 'ExamplesPage';

export default ExamplesPage;
