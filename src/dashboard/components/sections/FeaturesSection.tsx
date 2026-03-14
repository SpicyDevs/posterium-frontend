// components/sections/FeaturesSection.tsx
// "THE FEATURE SET" — split-panel layout.
// Left: scrollable numbered feature list (select active row).
// Right: large detail pane with live API preview thumbnail.
// Ditches the exposure-sheet spreadsheet look entirely.
import { memo, useState, useCallback } from 'react';
import { FEATURES } from '../../constants';
import { useInView } from '../../hooks';
import { AmberTag } from '../primitives';
import { API } from '../../constants';

// Map each feature to a live demo image
const FEATURE_DEMOS: Record<string, { id: string; type: 'movie' | 'tv'; r: string; pos: string }> =
  {
    'Drag-Drop Editor': {
      id: '155',
      type: 'movie',
      r: 'imdb,rt,meta,tmdb',
      pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
    },
    'Instant API URL': {
      id: '27205',
      type: 'movie',
      r: 'imdb,rt',
      pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
    },
    'Multiple Sources': {
      id: '872585',
      type: 'movie',
      r: 'rt,meta',
      pos: 'rt_x=14&rt_y=14&meta_x=310&meta_y=14',
    },
    'Live Ratings': { id: '1396', type: 'tv', r: 'imdb', pos: 'imdb_x=14&imdb_y=14' },
    'Movies, TV & Anime': {
      id: '238',
      type: 'movie',
      r: 'imdb,meta',
      pos: 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88',
    },
    'Any Export Format': { id: '475557', type: 'movie', r: 'rt', pos: 'rt_x=14&rt_y=14' },
    'Textless Posters': { id: '157336', type: 'movie', r: 'imdb', pos: 'imdb_x=310&imdb_y=14' },
    'Plex & Jellyfin Ready': {
      id: '680',
      type: 'movie',
      r: 'imdb,rt',
      pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
    },
  };

const ICON_MAP: Record<string, string> = {
  'Drag-Drop Editor': '⌖',
  'Instant API URL': '⚡',
  'Multiple Sources': '⊞',
  'Live Ratings': '◉',
  'Movies, TV & Anime': '▣',
  'Any Export Format': '◫',
  'Textless Posters': '◻',
  'Plex & Jellyfin Ready': '▤',
};

const DemoImage = memo<{ feature: (typeof FEATURES)[0] }>(({ feature }) => {
  const [loaded, setLoaded] = useState(false);
  const demo = FEATURE_DEMOS[feature.title];
  if (!demo) return null;

  const src = `${API}/${demo.type}/${demo.id}.svg?r=${demo.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${demo.pos}`;

  return (
    <div
      style={{
        width: 'clamp(120px,22%,200px)',
        aspectRatio: '2/3',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid rgba(196,124,46,0.18)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,124,46,0.06)',
        flexShrink: 0,
        background: '#151310',
        position: 'relative',
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s linear infinite',
          }}
        />
      )}
      <img
        src={src}
        alt={feature.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      />
      {/* Hint overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '6px 8px',
          background: 'linear-gradient(to top, rgba(7,7,6,0.92), transparent)',
        }}
      >
        <code
          className="mono-font"
          style={{
            fontSize: 7,
            color: 'rgba(196,124,46,0.65)',
            letterSpacing: '0.06em',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {feature.hint}
        </code>
      </div>
    </div>
  );
});
DemoImage.displayName = 'DemoImage';

export const FeaturesSection = memo(() => {
  const { ref, vis } = useInView(0.04);
  const [active, setActive] = useState(0);
  const f = FEATURES[active];

  const select = useCallback((i: number) => setActive(i), []);

  return (
    <section
      id="features"
      ref={ref}
      aria-label="Features"
      style={{
        background: 'var(--film-dark)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'clamp(56px,7vw,80px) clamp(20px,5vw,64px) 0',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <AmberTag style={{ marginBottom: 12 }}>Feature Set</AmberTag>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 10,
            marginBottom: 36,
          }}
        >
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(40px,6vw,80px)',
              color: 'var(--film-cream)',
              lineHeight: 0.9,
              letterSpacing: '0.02em',
            }}
          >
            WHAT IT
            <br />
            <span style={{ color: 'var(--film-amber)' }}>DOES</span>
          </h2>
          <span
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'rgba(122,117,110,0.35)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              paddingBottom: 8,
            }}
          >
            {FEATURES.length} features · all free · no account
          </span>
        </div>
      </div>

      {/* Split layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(220px,38%,360px) 1fr',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          minHeight: 480,
        }}
      >
        {/* LEFT: feature list */}
        <div
          style={{
            borderRight: '1px solid rgba(255,255,255,0.04)',
            overflowY: 'auto',
          }}
        >
          {FEATURES.map((feat, i) => {
            const isActive = active === i;
            return (
              <button
                key={feat.title}
                onClick={() => select(i)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: isActive ? '2px solid var(--film-amber)' : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 'clamp(14px,2vw,20px) clamp(16px,3vw,28px)',
                  background: isActive ? 'rgba(196,124,46,0.04)' : 'transparent',
                  transition: 'background 0.2s, border-color 0.2s',
                  opacity: vis ? 1 : 0,
                  transform: vis ? 'translateX(0)' : 'translateX(-12px)',
                  transitionProperty: 'background,border-color,opacity,transform',
                  transitionDuration: `0.2s,0.2s,0.5s,0.5s`,
                  transitionDelay: `0s,0s,${i * 0.05}s,${i * 0.05}s`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <span
                  style={{
                    fontSize: 16,
                    color: isActive ? 'var(--film-amber)' : 'rgba(122,117,110,0.4)',
                    transition: 'color 0.2s',
                    lineHeight: 1,
                    flexShrink: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {ICON_MAP[feat.title] ?? '◆'}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="syne-font"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.65)',
                      transition: 'color 0.2s',
                      marginBottom: 2,
                    }}
                  >
                    {feat.title}
                  </div>
                  <span
                    className="mono-font"
                    style={{
                      fontSize: 7,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: isActive ? 'rgba(196,124,46,0.6)' : 'rgba(122,117,110,0.3)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#36A240',
                      boxShadow: '0 0 6px rgba(54,162,64,0.6)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT: detail pane */}
        <div
          key={active}
          style={{
            padding: 'clamp(24px,4vw,48px) clamp(20px,4vw,48px)',
            display: 'flex',
            gap: 'clamp(20px,4vw,48px)',
            alignItems: 'flex-start',
            animation: 'fade-up 0.35s ease both',
          }}
        >
          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Number + tag */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <span
                className="poster-font"
                style={{
                  fontSize: 'clamp(48px,7vw,80px)',
                  lineHeight: 0.9,
                  color: 'rgba(196,124,46,0.12)',
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
                    fontSize: 8,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(196,124,46,0.55)',
                    background: 'rgba(196,124,46,0.07)',
                    border: '1px solid rgba(196,124,46,0.15)',
                    borderRadius: 2,
                    padding: '3px 8px',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {f.tag}
                </span>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 'clamp(16px,2.5vw,22px)',
                    fontWeight: 800,
                    color: 'var(--film-cream)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {f.title}
                </div>
              </div>
            </div>

            <p
              className="body-font"
              style={{
                fontSize: 13,
                color: 'var(--film-silver)',
                lineHeight: 1.78,
                maxWidth: 540,
                marginBottom: 24,
              }}
            >
              {f.desc}
            </p>

            {/* API hint */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(14,13,11,0.9)',
                border: '1px solid rgba(196,124,46,0.14)',
                borderRadius: 4,
                padding: '8px 14px',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              <span
                className="mono-font"
                style={{
                  fontSize: 8,
                  color: 'rgba(196,124,46,0.38)',
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
                  fontSize: 9,
                  color: 'rgba(240,230,204,0.55)',
                  letterSpacing: '0.04em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.hint}
              </code>
            </div>

            {/* Status pill */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#36A240',
                  boxShadow: '0 0 6px rgba(54,162,64,0.5)',
                }}
              />
              <span
                className="mono-font"
                style={{
                  fontSize: 8,
                  color: '#36A240',
                  letterSpacing: '0.14em',
                }}
              >
                LIVE · FREE TIER · {f.size.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Live demo image */}
          <DemoImage feature={f} />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px clamp(20px,5vw,64px)',
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid rgba(255,255,255,0.035)',
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
            fontSize: 8,
            color: 'rgba(122,117,110,0.28)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {FEATURES.length} FEATURES · MIT LICENSE · OPEN SOURCE
        </span>
        <span
          className="mono-font"
          style={{
            fontSize: 8,
            color: 'rgba(122,117,110,0.22)',
            letterSpacing: '0.1em',
          }}
        >
          © SPICYDEVS
        </span>
      </div>
    </section>
  );
});
FeaturesSection.displayName = 'FeaturesSection';
