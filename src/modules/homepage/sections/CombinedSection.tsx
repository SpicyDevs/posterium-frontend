// src/components/dashboard/sections/CombinedSection.tsx
import { memo, useState, useCallback, useEffect } from 'react';
import { FEATURES, USE_CASES, API } from '@/lib/dashboard/constants';
import { useInView } from '@/lib/dashboard/hooks/index';
import { ProgressiveImage } from '@/ui/ProgressiveImage';
import { SectionHeader } from '@/modules/homepage/SectionHeader';

const FEATURE_TUPLES = [
  ['Drag-Drop Editor', '⌖', '155', 'movie', 'imdb,rt,meta,tmdb', 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244'],
  ['Instant API URL', '⚡', '27205', 'movie', 'imdb,rt', 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88'],
  ['Multiple Sources', '⊞', '872585', 'movie', 'rt,meta', 'rt_x=14&rt_y=14&meta_x=310&meta_y=14'],
  ['Live Ratings', '◉', '1396', 'tv', 'imdb', 'imdb_x=14&imdb_y=14'],
  ['Movies, TV & Anime', '▣', '238', 'movie', 'imdb,meta', 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88'],
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
    `${API}/${type}/${id}.webp?r=${r}&source=tmdb&blur=7&alpha=0.43&rad=10&${pos}`,
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
        width: 'clamp(150px,40vw,240px)',
        aspectRatio: '2/3',
        borderRadius: 4,
        border: '1px solid rgba(196,124,46,0.14)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
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
        gridTemplateColumns: 'clamp(180px,30%,260px) 1fr',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        minHeight: 340,
      }}
    >
      {/* Left list */}
      <div className="combined-features-list" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        {FEATURES.map((feat, i) => {
          const isActive = active === i;
          return (
            <button
              key={feat.title}
              onClick={() => select(i)}
              className={isActive ? undefined : 'hover-bg-subtle'}
              style={{
                width: '100%', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.028)',
                borderLeft: isActive ? '2px solid var(--film-amber)' : '2px solid transparent',
                cursor: 'pointer', textAlign: 'left', padding: '12px 18px',
                background: isActive ? 'rgba(196,124,46,0.04)' : 'transparent',
                transition: 'background 0.18s, border-color 0.18s',
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateX(0)' : 'translateX(-10px)',
                transitionProperty: 'background,border-color,opacity,transform',
                transitionDuration: `0.18s,0.18s,0.5s,0.5s`,
                transitionDelay: `0s,0s,${i * 0.04}s,${i * 0.04}s`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{
                fontSize: 13, fontFamily: 'monospace', lineHeight: 1, flexShrink: 0,
                color: isActive ? 'var(--film-amber)' : 'rgba(196,185,165,0.5)',
                transition: 'color 0.18s',
              }}>
                {ICON_MAP[feat.title] ?? '◆'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="syne-font" style={{
                  fontSize: 11, fontWeight: 700,
                  color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.55)',
                  transition: 'color 0.18s',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {feat.title}
                </div>
                <div className="mono-font" style={{
                  fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1,
                  color: isActive ? 'rgba(214,156,84,0.7)' : 'rgba(196,185,165,0.38)',
                  transition: 'color 0.18s',
                }}>
                  {feat.tag}
                </div>
              </div>
              {isActive && (
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#36A240', boxShadow: '0 0 5px rgba(54,162,64,0.55)', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Right detail — just the API hint and poster */}
      <div
        key={active}
        className="combined-features-detail"
        style={{
          padding: 'clamp(24px,3vw,40px)',
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
          animation: 'fade-up 0.28s ease both',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Feature number + tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span className="poster-font" style={{ fontSize: 'clamp(40px,6vw,64px)', lineHeight: 0.88, color: 'rgba(196,124,46,0.08)', letterSpacing: '0.02em', userSelect: 'none' }}>
              {String(active + 1).padStart(2, '0')}
            </span>
            <div>
              <span className="mono-font" style={{
                fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(214,156,84,0.75)', background: 'rgba(196,124,46,0.06)',
                border: '1px solid rgba(196,124,46,0.12)', borderRadius: 2, padding: '2px 7px',
                display: 'block', marginBottom: 5,
              }}>
                {f.tag}
              </span>
              <div className="syne-font" style={{ fontSize: 'clamp(15px,2vw,20px)', fontWeight: 800, color: 'var(--film-cream)' }}>
                {f.title}
              </div>
            </div>
          </div>

          {/* API hint — the real useful bit */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(14,13,11,0.9)', border: '1px solid rgba(196,124,46,0.1)', borderRadius: 3, padding: '8px 14px', maxWidth: '100%', overflow: 'hidden' }}>
            <span className="mono-font" style={{ fontSize: 7, color: 'rgba(196,124,46,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>API</span>
            <code className="mono-font" style={{ fontSize: 9, color: 'rgba(240,230,204,0.8)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.hint}
            </code>
          </div>

          {f.desc && (
            <p className="body-font" style={{ fontSize: 11, color: 'var(--film-silver)', lineHeight: 1.65, marginTop: 16 }}>
              {f.desc}
            </p>
          )}
        </div>

        <ThumbImg title={f.title} alt={f.title} />
      </div>
    </div>
  );
});
FeaturesPane.displayName = 'FeaturesPane';

const IntegrationsPane = memo<{ vis: boolean }>(({ vis }) => (
  <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
    {USE_CASES.map((uc, i) => (
      <div key={uc.title} className="integrations-cell" style={{
        padding: 'clamp(18px,2.5vw,28px)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(14px)',
        transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`,
      }}>
        <div style={{ fontSize: 'clamp(16px,2vw,20px)', marginBottom: 10, lineHeight: 1 }}>{uc.icon}</div>
        <h3 className="syne-font" style={{ fontSize: 'clamp(10px,1.4vw,12px)', fontWeight: 800, color: 'var(--film-cream)', marginBottom: 6, margin: '0 0 6px' }}>
          {uc.title}
        </h3>
        <p className="body-font" style={{ fontSize: 'clamp(10px,1.2vw,11px)', color: 'var(--film-silver)', lineHeight: 1.65, marginBottom: 10 }}>
          {uc.desc}
        </p>
        {uc.codeSnippet && (
          <code className="integrations-code mono-font" style={{ fontSize: 'clamp(7px,0.9vw,8px)', color: 'rgba(196,124,46,0.5)', letterSpacing: '0.03em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: 'rgba(196,124,46,0.04)', border: '1px solid rgba(196,124,46,0.08)', borderRadius: 3, padding: '4px 8px' }}>
            {uc.codeSnippet}
          </code>
        )}
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
      if (window.location.hash === '#integrations') setTab('integrations');
      else setTab('features');
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
      style={{ background: 'var(--film-dark)', borderTop: '1px solid rgba(196,124,46,0.06)', position: 'relative' }}
    >
      <span id="integrations" aria-hidden="true" style={{ position: 'absolute', top: 0 }} />
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.55s ease' }}>
        <SectionHeader
          tag="Capabilities"
          title={tab === 'features' ? 'Features' : 'Integrations'}
          rightContent={
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)', borderRadius: 5, padding: 3 }}>
              {(['features', 'integrations'] as const).map((t) => {
                const active = tab === t;
                return (
                  <button key={t} onClick={() => setTab(t)} className="syne-font" style={{
                    background: active ? 'rgba(196,124,46,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(196,124,46,0.28)' : '1px solid transparent',
                    borderRadius: 3, color: active ? 'var(--film-amber)' : 'rgba(196,185,165,0.6)',
                    cursor: 'pointer', padding: '6px 16px', fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s',
                  }}>
                    {t === 'features' ? 'Features' : 'Integrations'}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>
      {tab === 'features' ? <FeaturesPane vis={vis} /> : <IntegrationsPane vis={vis} />}
      <div style={{
        padding: '8px clamp(20px,5vw,64px)', background: 'rgba(255,255,255,0.006)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <span className="mono-font" style={{ fontSize: 7, color: 'rgba(196,185,165,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {tab === 'features' ? `${FEATURES.length} features · MIT license · Open source` : `${USE_CASES.length} integrations · CORS open · Open source`}
        </span>
        <span className="mono-font" style={{ fontSize: 7, color: 'rgba(196,185,165,0.4)', letterSpacing: '0.1em' }}>© SPICYDEVS</span>
      </div>
    </section>
  );
});
CombinedSection.displayName = 'CombinedSection';
