// src/components/dashboard/sections/CombinedSection.tsx
// Import paths corrected: ../../constants → @/lib/dashboard/constants, ../../hooks → @/lib/dashboard/hooks
import { memo, useState, useCallback, useEffect } from 'react';
import { FEATURES, USE_CASES, API } from '@/lib/dashboard/constants';
import { useInView } from '@/lib/dashboard/hooks/index';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { SectionHeader } from '@/components/dashboard/components/SectionHeader';

const FEATURE_TUPLES = [
  [
    'Drag-Drop Editor',
    '⌖',
    '155',
    'movie',
    'imdb,rt,meta,tmdb',
    'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
  ],
  ['Instant API URL', '⚡', '27205', 'movie', 'imdb,rt', 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88'],
  ['Multiple Sources', '⊞', '872585', 'movie', 'rt,meta', 'rt_x=14&rt_y=14&meta_x=310&meta_y=14'],
  ['Live Ratings', '◉', '1396', 'tv', 'imdb', 'imdb_x=14&imdb_y=14'],
  [
    'Movies, TV & Anime',
    '▣',
    '238',
    'movie',
    'imdb,meta',
    'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88',
  ],
  ['Any Export Format', '◫', '475557', 'movie', 'rt', 'rt_x=14&rt_y=14'],
  ['Textless Posters', '◻', '157336', 'movie', 'imdb', 'imdb_x=310&imdb_y=14'],
  ['Plex & Jellyfin Ready', '▤', '680', 'movie', 'imdb,rt', 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88'],
] as const;
const ICON_MAP: Record<string, string> = Object.fromEntries(
  FEATURE_TUPLES.map(([title, icon]) => [title, icon])
);

const FEATURE_SRCS: Record<string, string> = Object.fromEntries(
  FEATURE_TUPLES.map(([title, , id, type, r, pos]) => [
    title,
    `${API}/${type}/${id}.svg?r=${r}&source=tmdb&blur=7&alpha=0.43&rad=10&${pos}`,
  ])
);

const ThumbImg = memo<{ title: string; alt: string }>(({ title, alt }) => {
  const src = FEATURE_SRCS[title];
  if (!src) return null;
  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      containerStyle={{
        width: 'clamp(96px,18%,148px)',
        aspectRatio: '2/3',
        borderRadius: 4,
        border: '1px solid rgba(196,124,46,0.16)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
        flexShrink: 0,
        background: '#111009',
      }}
      loading="lazy"
      decoding="async"
    />
  );
});
ThumbImg.displayName = 'ThumbImg';

const FeaturesPane = memo<{ vis: boolean }>(({ vis }) => {
  const [active, setActive] = useState(0);
  const select = useCallback((i: number) => setActive(i), []);
  const f = FEATURES[active];
  return (
    <div
      className="combined-features-pane"
      style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(200px,34%,300px) 1fr',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        minHeight: 400,
      }}
    >
      <div className="combined-features-list" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        {FEATURES.map((feat, i) => {
          const isActive = active === i;
          return (
            <button
              key={feat.title}
              onClick={() => select(i)}
              className={isActive ? undefined : 'hover-bg-subtle'}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.028)',
                borderLeft: isActive ? '2px solid var(--film-amber)' : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '14px 20px',
                background: isActive ? 'rgba(196,124,46,0.038)' : 'transparent',
                transition: 'background 0.18s, border-color 0.18s',
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateX(0)' : 'translateX(-10px)',
                transitionProperty: 'background,border-color,opacity,transform',
                transitionDuration: `0.18s,0.18s,0.5s,0.5s`,
                transitionDelay: `0s,0s,${i * 0.04}s,${i * 0.04}s`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color: isActive ? 'var(--film-amber)' : 'rgba(196,185,165,0.72)',
                  transition: 'color 0.18s',
                  flexShrink: 0,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {ICON_MAP[feat.title] ?? '◆'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.6)',
                    transition: 'color 0.18s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {feat.title}
                </div>
                <div
                  className="mono-font"
                  style={{
                    fontSize: 7,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isActive ? 'rgba(214,156,84,0.82)' : 'rgba(196,185,165,0.74)',
                    transition: 'color 0.18s',
                    marginTop: 1,
                  }}
                >
                  {feat.tag}
                </div>
              </div>
              {isActive && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#36A240',
                    boxShadow: '0 0 5px rgba(54,162,64,0.55)',
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div
        key={active}
        className="combined-features-detail"
        style={{
          padding: 'clamp(20px,3vw,36px)',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
          animation: 'fade-up 0.3s ease both',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span
              className="poster-font"
              style={{
                fontSize: 'clamp(36px,5vw,56px)',
                lineHeight: 0.9,
                color: 'rgba(196,124,46,0.1)',
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}
            >
              {String(active + 1).padStart(2, '0')}
            </span>
            <div>
              <span
                className="mono-font"
                style={{
                  fontSize: 7,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(214,156,84,0.82)',
                  background: 'rgba(196,124,46,0.06)',
                  border: '1px solid rgba(196,124,46,0.14)',
                  borderRadius: 2,
                  padding: '2px 7px',
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                {f.tag}
              </span>
              <div
                className="syne-font"
                style={{
                  fontSize: 'clamp(14px,2vw,19px)',
                  fontWeight: 800,
                  color: 'var(--film-cream)',
                }}
              >
                {f.title}
              </div>
            </div>
          </div>
          <p
            className="body-font"
            style={{
              fontSize: 12,
              color: 'var(--film-silver)',
              lineHeight: 1.75,
              maxWidth: 440,
              marginBottom: 18,
            }}
          >
            {f.desc}
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(14,13,11,0.9)',
              border: '1px solid rgba(196,124,46,0.12)',
              borderRadius: 3,
              padding: '7px 12px',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <span
              className="mono-font"
              style={{
                fontSize: 7,
                color: 'rgba(196,124,46,0.35)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              API
            </span>
            <code
              className="mono-font"
              style={{
                fontSize: 8,
                color: 'rgba(240,230,204,0.82)',
                letterSpacing: '0.04em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {f.hint}
            </code>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#36A240',
                boxShadow: '0 0 5px rgba(54,162,64,0.5)',
              }}
            />
            <span
              className="mono-font"
              style={{ fontSize: 7, color: '#36A240', letterSpacing: '0.14em' }}
            >
              LIVE · FREE · {f.size.toUpperCase()}
            </span>
          </div>
        </div>
        <ThumbImg title={f.title} alt={f.title} />
      </div>
    </div>
  );
});
FeaturesPane.displayName = 'FeaturesPane';

const IntegrationsPane = memo<{ vis: boolean }>(({ vis }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 0,
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}
  >
    {USE_CASES.map((uc, i) => (
      <div
        key={uc.title}
        style={{
          padding: 'clamp(20px,3vw,32px)',
          borderRight: i % 3 !== 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          borderBottom: i < USE_CASES.length - 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(16px)',
          transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`,
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 12, lineHeight: 1 }}>{uc.icon}</div>
        <h3
          className="syne-font"
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--film-cream)',
            marginBottom: 8,
            margin: 0,
          }}
        >
          {/* If you ever create dedicated landing pages, link them here. Otherwise, a self-referential anchor creates the keyword association. */}
          <a
            href={`#${uc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {uc.title}
          </a>
        </h3>
        <p
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-silver)', lineHeight: 1.72, marginBottom: 14 }}
        >
          {uc.desc}
        </p>
        {uc.codeSnippet && (
          <code
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'rgba(196,124,46,0.55)',
              letterSpacing: '0.03em',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              background: 'rgba(196,124,46,0.04)',
              border: '1px solid rgba(196,124,46,0.1)',
              borderRadius: 3,
              padding: '5px 8px',
            }}
          >
            {uc.codeSnippet}
          </code>
        )}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
          {uc.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="syne-font"
              style={{
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(196,185,165,0.72)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.045)',
                padding: '2px 6px',
                borderRadius: 2,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
));
IntegrationsPane.displayName = 'IntegrationsPane';

export const CombinedSection = memo(() => {
  const { ref, vis } = useInView(0.04);
  const [tab, setTab] = useState<'features' | 'integrations'>('features');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#integrations') {
        setTab('integrations');
      } else {
        setTab('features');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <section
      id="combined"
      ref={ref}
      aria-label="Features and Integrations"
      style={{
        background: 'var(--film-dark)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
        position: 'relative',
      }}
    >
      <span id="integrations" aria-hidden="true" style={{ position: 'absolute', top: 0 }} />
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.55s ease' }}>
        <SectionHeader
          tag="Capabilities"
          title={tab === 'features' ? 'Features' : 'Integrations'}
          rightContent={
            <div
              style={{
                display: 'flex',
                gap: 2,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.055)',
                borderRadius: 5,
                padding: 3,
              }}
            >
              {(['features', 'integrations'] as const).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="syne-font"
                    style={{
                      background: active ? 'rgba(196,124,46,0.14)' : 'transparent',
                      border: active ? '1px solid rgba(196,124,46,0.3)' : '1px solid transparent',
                      borderRadius: 3,
                      color: active ? 'var(--film-amber)' : 'rgba(196,185,165,0.74)',
                      cursor: 'pointer',
                      padding: '7px 18px',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'features' ? 'Features' : 'Integrations'}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>
      {tab === 'features' ? <FeaturesPane vis={vis} /> : <IntegrationsPane vis={vis} />}
      <div
        style={{
          padding: '10px clamp(20px,5vw,64px)',
          background: 'rgba(255,255,255,0.008)',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: 7,
            color: 'rgba(196,185,165,0.74)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {tab === 'features'
            ? `${FEATURES.length} features · MIT license · Open source`
            : `${USE_CASES.length} integrations · No auth · CORS enabled`}
        </span>
        <span
          className="mono-font"
          style={{ fontSize: 7, color: 'rgba(196,185,165,0.72)', letterSpacing: '0.1em' }}
        >
          © SPICYDEVS
        </span>
      </div>
    </section>
  );
});
CombinedSection.displayName = 'CombinedSection';
