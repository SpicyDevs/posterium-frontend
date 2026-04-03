import React, { memo, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import MainNavbar from '@/components/shared/MainNavbar';
import ExportMenu from '@/components/shared/ExportMenu';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { API, REEL_ITEMS } from '@/lib/dashboard/constants';
import type { ExtensionType, PosterConfig } from '@/components/builder/types';
import { DEFAULT_CONFIG } from '@/components/builder/types';
import { generateApiUrl } from '@/components/builder/utils';

interface ShowcasePoster {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  genre: string;
  tagline: string;
  url: string;
  config: PosterConfig;
}

const baseConfigFor = (item: (typeof REEL_ITEMS)[number]): PosterConfig => {
  const imdbSeed = item.type === 'tv' ? 'tt0903747' : 'tt0468569';
  return {
    ...DEFAULT_CONFIG,
    mediaType: item.type,
    tmdbId: item.id,
    imdbId: imdbSeed,
    ratings: ['imdb', 'rt', 'meta'],
    extension: 'png',
    source: 'tmdb',
    preset: 'tr',
    layout: 'row',
    items: {},
  };
};

const showcaseItems: ShowcasePoster[] = REEL_ITEMS.slice(0, 14).map((item) => {
  const config = baseConfigFor(item);
  const baseQuery = 'r=imdb,rt,meta&source=tmdb&blur=7&alpha=0.43&rad=10&imdb_x=10&imdb_y=12&rt_x=10&rt_y=84&meta_x=10&meta_y=156';
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    year: item.year,
    genre: item.genre,
    tagline: item.tagline,
    url: `${API}/${item.type}/${item.id}.png?${baseQuery}`,
    config,
  };
});

const ExamplesPage = memo(() => {
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<Partial<Record<string, ExtensionType>>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return showcaseItems;
    return showcaseItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.genre.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--film-black)',
        color: 'var(--film-cream)',
      }}
    >
      <MainNavbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search examples…',
        }}
      />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '84px 20px 40px' }}>
        <header style={{ marginBottom: 18 }}>
          <h1 className="poster-font" style={{ margin: 0, fontSize: 'clamp(34px,7vw,62px)', lineHeight: 0.88, letterSpacing: '0.08em' }}>
            EXAMPLES
          </h1>
          <p className="body-font" style={{ margin: '10px 0 0', color: 'var(--film-text-dim)', fontSize: 14 }}>
            Showcase gallery with export actions and one-click handoff to the builder.
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
            gap: 14,
          }}
        >
          {filtered.map((item) => {
            const isOpen = activeMenuId === item.id;
            const currentExtension = extensions[item.id] ?? item.config.extension;
            const exportConfig: PosterConfig = { ...item.config, extension: currentExtension };
            const exportUrl = generateApiUrl(exportConfig, API);
            const openBuilderHref = `/build?url=${encodeURIComponent(exportUrl)}`;
            return (
              <article
                key={item.id}
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
                    src={item.url}
                    alt={`${item.title} poster example`}
                    containerStyle={{ width: '100%', height: '100%' }}
                    imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallback={
                      <div className="body-font" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--film-text-dim)' }}>
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
                      background: 'linear-gradient(180deg, rgba(7,7,6,0) 34%, rgba(7,7,6,0.9) 100%)',
                      opacity: isOpen ? 1 : 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenuId((prev) => (prev === item.id ? null : item.id))}
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
                      href={openBuilderHref}
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

                <div style={{ padding: '10px 12px 12px' }}>
                  <div className="syne-font" style={{ fontSize: 12, fontWeight: 700, color: 'var(--film-cream)', letterSpacing: '0.03em' }}>
                    {item.title}
                  </div>
                  <div className="body-font" style={{ fontSize: 11, color: 'var(--film-text-dim)', marginTop: 4 }}>
                    {item.year} • {item.genre}
                  </div>
                </div>

                <ExportMenu
                  config={exportConfig}
                  baseUrl={API}
                  onExtensionChange={(ext) => {
                    setExtensions((prev) => ({ ...prev, [item.id]: ext }));
                  }}
                  isOpen={isOpen}
                  onClose={() => setActiveMenuId(null)}
                  containerStyle={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 300,
                    zIndex: 20,
                  }}
                  urlOverride={exportUrl}
                  openInBuilderHref={openBuilderHref}
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
