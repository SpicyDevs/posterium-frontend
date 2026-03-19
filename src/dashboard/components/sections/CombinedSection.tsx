// src/dashboard/components/sections/CombinedSection.tsx
// Performance: FEATURE_DEMOS, ICON_MAP, USE_CASE tab labels are all
// module-level constants — they were previously recreated on every render
// because they lived inside the component body.
// ThumbImg src is computed inside the component but is stable per feature
// so it triggers no unnecessary re-fetches.
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { FEATURES, USE_CASES, API } from '../../constants';
import { useInView } from '../../hooks';
import { AmberTag } from '../primitives';

// ── Module-level constants ────────────────────────────────────────
// These were previously defined inside component bodies,
// causing object recreation on every render.
const FEATURE_DEMOS: Record<string, { id: string; type: 'movie' | 'tv'; r: string; pos: string }> = {
  'Drag-Drop Editor':     { id: '155',    type: 'movie', r: 'imdb,rt,meta,tmdb', pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244' },
  'Instant API URL':      { id: '27205',  type: 'movie', r: 'imdb,rt',           pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88' },
  'Multiple Sources':     { id: '872585', type: 'movie', r: 'rt,meta',           pos: 'rt_x=14&rt_y=14&meta_x=310&meta_y=14' },
  'Live Ratings':         { id: '1396',   type: 'tv',    r: 'imdb',              pos: 'imdb_x=14&imdb_y=14' },
  'Movies, TV & Anime':   { id: '238',    type: 'movie', r: 'imdb,meta',         pos: 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88' },
  'Any Export Format':    { id: '475557', type: 'movie', r: 'rt',                pos: 'rt_x=14&rt_y=14' },
  'Textless Posters':     { id: '157336', type: 'movie', r: 'imdb',              pos: 'imdb_x=310&imdb_y=14' },
  'Plex & Jellyfin Ready':{ id: '680',    type: 'movie', r: 'imdb,rt',           pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88' },
};

const ICON_MAP: Record<string, string> = {
  'Drag-Drop Editor':     '⌖',
  'Instant API URL':      '⚡',
  'Multiple Sources':     '⊞',
  'Live Ratings':         '◉',
  'Movies, TV & Anime':   '▣',
  'Any Export Format':    '◫',
  'Textless Posters':     '◻',
  'Plex & Jellyfin Ready':'▤',
};

// Pre-compute all ThumbImg srcs — stable references, no allocation in render
const FEATURE_SRCS: Record<string, string> = Object.fromEntries(
  Object.entries(FEATURE_DEMOS).map(([title, d]) => [
    title,
    `${API}/${d.type}/${d.id}.svg?r=${d.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${d.pos}`,
  ])
);

// ── ThumbImg ──────────────────────────────────────────────────────
const ThumbImg = memo<{ title: string; alt: string }>(({ title, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const src = FEATURE_SRCS[title];
  const imgRef = useRef<HTMLImageElement>(null);
  const handleLoad = useCallback(() => setLoaded(true), []);

  // Handle already-cached images: onLoad won't fire if the browser
  // completed loading before React attached the handler (e.g. on page reload).
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) handleLoad();
  }, [handleLoad]);

  if (!src) return null;

  return (
    <div
      style={{
        width: 'clamp(96px,18%,148px)', aspectRatio: '2/3', borderRadius: 4,
        overflow: 'hidden', border: '1px solid rgba(196,124,46,0.16)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.7)', flexShrink: 0,
        background: '#111009', position: 'relative',
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite',
          }}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
      />
    </div>
  );
});
ThumbImg.displayName = 'ThumbImg';

// ── FeaturesPane ──────────────────────────────────────────────────
const FeaturesPane = memo<{ vis: boolean }>(({ vis }) => {
  const [active, setActive] = useState(0);
  const select = useCallback((i: number) => setActive(i), []);
  const f = FEATURES[active];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'clamp(200px,34%,300px) 1fr', borderTop: '1px solid rgba(255,255,255,0.04)', minHeight: 400 }}>
      {/* Left list */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        {FEATURES.map((feat, i) => {
          const isActive = active === i;
          return (
            <button
              key={feat.title}
              onClick={() => select(i)}
              style={{
                width: '100%', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.028)',
                borderLeft: isActive ? '2px solid var(--film-amber)' : '2px solid transparent',
                cursor: 'pointer', textAlign: 'left', padding: '14px 20px',
                background: isActive ? 'rgba(196,124,46,0.038)' : 'transparent',
                transition: 'background 0.18s, border-color 0.18s',
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateX(0)' : 'translateX(-10px)',
                transitionProperty: 'background,border-color,opacity,transform',
                transitionDuration: `0.18s,0.18s,0.5s,0.5s`,
                transitionDelay: `0s,0s,${i * 0.04}s,${i * 0.04}s`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.018)'; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 14, color: isActive ? 'var(--film-amber)' : 'rgba(122,117,110,0.38)', transition: 'color 0.18s', flexShrink: 0, fontFamily: 'monospace', lineHeight: 1 }}>
                {ICON_MAP[feat.title] ?? '◆'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="syne-font" style={{ fontSize: 11, fontWeight: 700, color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.6)', transition: 'color 0.18s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {feat.title}
                </div>
                <div className="mono-font" style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? 'rgba(196,124,46,0.55)' : 'rgba(122,117,110,0.28)', transition: 'color 0.18s', marginTop: 1 }}>
                  {feat.tag}
                </div>
              </div>
              {isActive && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#36A240', boxShadow: '0 0 5px rgba(54,162,64,0.55)', flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {/* Right detail */}
      <div key={active} style={{ padding: 'clamp(20px,3vw,36px)', display: 'flex', gap: 24, alignItems: 'flex-start', animation: 'fade-up 0.3s ease both' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="poster-font" style={{ fontSize: 'clamp(36px,5vw,56px)', lineHeight: 0.9, color: 'rgba(196,124,46,0.1)', letterSpacing: '0.02em', userSelect: 'none' }}>
              {String(active + 1).padStart(2, '0')}
            </span>
            <div>
              <span className="mono-font" style={{ fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,124,46,0.5)', background: 'rgba(196,124,46,0.06)', border: '1px solid rgba(196,124,46,0.14)', borderRadius: 2, padding: '2px 7px', display: 'block', marginBottom: 5 }}>
                {f.tag}
              </span>
              <div className="syne-font" style={{ fontSize: 'clamp(14px,2vw,19px)', fontWeight: 800, color: 'var(--film-cream)' }}>
                {f.title}
              </div>
            </div>
          </div>

          <p className="body-font" style={{ fontSize: 12, color: 'var(--film-silver)', lineHeight: 1.75, maxWidth: 440, marginBottom: 18 }}>
            {f.desc}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(14,13,11,0.9)', border: '1px solid rgba(196,124,46,0.12)', borderRadius: 3, padding: '7px 12px', maxWidth: '100%', overflow: 'hidden' }}>
            <span className="mono-font" style={{ fontSize: 7, color: 'rgba(196,124,46,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>API</span>
            <code className="mono-font" style={{ fontSize: 8, color: 'rgba(240,230,204,0.5)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.hint}</code>
          </div>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#36A240', boxShadow: '0 0 5px rgba(54,162,64,0.5)' }} />
            <span className="mono-font" style={{ fontSize: 7, color: '#36A240', letterSpacing: '0.14em' }}>
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

// ── IntegrationsPane ──────────────────────────────────────────────
const IntegrationsPane = memo<{ vis: boolean }>(({ vis }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
        <div className="syne-font" style={{ fontSize: 13, fontWeight: 800, color: 'var(--film-cream)', marginBottom: 8 }}>{uc.title}</div>
        <p className="body-font" style={{ fontSize: 11, color: 'var(--film-silver)', lineHeight: 1.72, marginBottom: 14 }}>{uc.desc}</p>
        {uc.codeSnippet && (
          <code className="mono-font" style={{ fontSize: 8, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.03em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(196,124,46,0.04)', border: '1px solid rgba(196,124,46,0.1)', borderRadius: 3, padding: '5px 8px' }}>
            {uc.codeSnippet}
          </code>
        )}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
          {uc.tags.slice(0, 2).map((t) => (
            <span key={t} className="syne-font" style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(110,104,96,0.45)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.045)', padding: '2px 6px', borderRadius: 2 }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
));
IntegrationsPane.displayName = 'IntegrationsPane';

// ── CombinedSection ───────────────────────────────────────────────
export const CombinedSection = memo(() => {
  const { ref, vis } = useInView(0.04);
  const [tab, setTab] = useState<'features' | 'integrations'>('features');

  return (
    <section id="combined" ref={ref} aria-label="Features and Integrations" style={{ background: 'var(--film-dark)', borderTop: '1px solid rgba(196,124,46,0.06)' }}>
      {/* Header */}
      <div style={{ padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,64px) 0', opacity: vis ? 1 : 0, transition: 'opacity 0.55s ease' }}>
        <AmberTag style={{ marginBottom: 12 }}>Capabilities</AmberTag>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginTop: 10, marginBottom: 32 }}>
          <h2 className="poster-font" style={{ fontSize: 'clamp(36px,5.5vw,72px)', color: 'var(--film-cream)', lineHeight: 0.9, letterSpacing: '0.02em' }}>
            {tab === 'features' ? (<>WHAT IT<br /><span style={{ color: 'var(--film-amber)' }}>DOES</span></>) : (<>WHERE IT<br /><span style={{ color: 'var(--film-amber)' }}>RUNS</span></>)}
          </h2>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: 5, padding: 3 }}>
            {(['features', 'integrations'] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="syne-font"
                  style={{ background: active ? 'rgba(196,124,46,0.14)' : 'transparent', border: active ? '1px solid rgba(196,124,46,0.3)' : '1px solid transparent', borderRadius: 3, color: active ? 'var(--film-amber)' : 'rgba(110,104,96,0.55)', cursor: 'pointer', padding: '7px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
                >
                  {t === 'features' ? 'Features' : 'Integrations'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === 'features' ? <FeaturesPane vis={vis} /> : <IntegrationsPane vis={vis} />}

      {/* Footer strip */}
      <div style={{ padding: '10px clamp(20px,5vw,64px)', background: 'rgba(255,255,255,0.008)', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span className="mono-font" style={{ fontSize: 7, color: 'rgba(122,117,110,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {tab === 'features' ? `${FEATURES.length} features · MIT license · Open source` : `${USE_CASES.length} integrations · No auth · CORS enabled`}
        </span>
        <span className="mono-font" style={{ fontSize: 7, color: 'rgba(122,117,110,0.18)', letterSpacing: '0.1em' }}>© SPICYDEVS</span>
      </div>
    </section>
  );
});
CombinedSection.displayName = 'CombinedSection';