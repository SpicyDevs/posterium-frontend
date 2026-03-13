// components/sections/UseCasesSection.tsx
// "THE CIRCUIT" — tabbed integration showcase with live API previews.
// Each use case tab shows the actual API output image for that context.
// This turns the section from a static list into a live product demo.
import { memo, useState, useCallback } from 'react';
import { USE_CASES } from '../../constants';
import { useInView } from '../../hooks';
import { AmberTag } from '../primitives';
import { API } from '../../constants';

// Live preview panel — loads the actual API URL for the selected use case
const LivePreview = memo<{ uc: typeof USE_CASES[0] }>(({ uc }) => {
  const [loaded, setLoaded] = useState(false);

  const src = `${API}/${uc.previewType}/${uc.previewId}.svg`
    + `?r=${uc.previewBadges}&source=tmdb&blur=8&alpha=0.45&rad=12&${uc.previewPositions}`;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 0,
    }}>
      {/* Live badge */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(7,7,6,0.5)',
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.12em',
        }}>
          LIVE API OUTPUT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#36A240', boxShadow: '0 0 5px rgba(54,162,64,0.5)',
          }} />
          <span className="mono-font" style={{
            fontSize: 7, color: '#36A240', letterSpacing: '0.12em',
          }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Poster */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0908',
        padding: '24px 20px',
      }}>
        <div style={{
          width: 'min(200px, 55%)',
          aspectRatio: '2/3',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid rgba(196,124,46,0.2)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.08)',
          position: 'relative',
          background: '#151310',
        }}>
          {!loaded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite',
            }} />
          )}
          <img
            src={src} alt={`${uc.title} preview`}
            loading="lazy" decoding="async"
            onLoad={() => setLoaded(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease',
            }}
          />
        </div>

        {/* Ambient glow behind poster */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,124,46,0.04) 0%, transparent 70%)',
        }} />
      </div>

      {/* Code snippet */}
      {uc.codeSnippet && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(196,124,46,0.08)',
          background: 'rgba(7,7,6,0.7)',
          overflow: 'hidden',
        }}>
          <div className="mono-font" style={{
            fontSize: 7, color: 'rgba(122,117,110,0.38)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            Example
          </div>
          <code className="mono-font" style={{
            fontSize: 9, color: 'rgba(196,124,46,0.6)',
            letterSpacing: '0.03em', lineHeight: 1.6,
            display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {uc.codeSnippet}
          </code>
        </div>
      )}
    </div>
  );
});
LivePreview.displayName = 'LivePreview';

export const UseCasesSection = memo(() => {
  const { ref, vis } = useInView(0.05);
  const [active, setActive] = useState(0);
  const select = useCallback((i: number) => setActive(i), []);
  const uc = USE_CASES[active];

  return (
    <section
      id="use-cases"
      ref={ref}
      aria-label="Where It Runs"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: 'clamp(56px,7vw,80px) clamp(20px,5vw,64px) 40px',
        opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <AmberTag style={{ marginBottom: 12 }}>Integration Hub</AmberTag>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginTop: 10,
        }}>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px,6vw,80px)',
            color: 'var(--film-cream)', lineHeight: 0.9, letterSpacing: '0.02em',
          }}>
            WHERE IT<br />
            <span style={{ color: 'var(--film-amber)' }}>RUNS</span>
          </h2>
          <p className="syne-font" style={{
            fontSize: 12, color: 'var(--film-silver)', maxWidth: 340,
            lineHeight: 1.68, textAlign: 'right', paddingBottom: 6,
          }}>
            Click any integration to see the live API output for that context.
          </p>
        </div>
      </div>

      {/* Main panel — tab list + live preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(200px,34%,320px) 1fr',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        minHeight: 'clamp(380px,50vw,520px)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
      }}>
        {/* Left tab list */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
          {USE_CASES.map((u, i) => {
            const isActive = active === i;
            return (
              <button
                key={u.title}
                onClick={() => select(i)}
                style={{
                  width: '100%', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: isActive ? '2px solid var(--film-amber)' : '2px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  padding: 'clamp(14px,2vw,22px) clamp(16px,2.5vw,28px)',
                  background: isActive ? 'rgba(196,124,46,0.04)' : 'transparent',
                  transition: 'background 0.2s, border-color 0.2s',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.018)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0, marginTop: 1 }}>
                  {u.icon}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div className="syne-font" style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.01em',
                    color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.6)',
                    transition: 'color 0.2s', marginBottom: 3,
                  }}>
                    {u.title}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {u.tags.slice(0, 2).map(t => (
                      <span key={t} className="syne-font" style={{
                        fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: isActive ? 'rgba(196,124,46,0.55)' : 'rgba(122,117,110,0.35)',
                        transition: 'color 0.2s',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: description + live preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr clamp(180px,36%,280px)',
          minHeight: '100%',
        }}>
          {/* Description panel */}
          <div style={{
            padding: 'clamp(24px,4vw,44px) clamp(20px,4vw,40px)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            animation: 'fade-up 0.3s ease both',
          }}>
            <div style={{ fontSize: 28, marginBottom: 16, lineHeight: 1 }}>
              {uc.icon}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            }}>
              <span className="mono-font" style={{
                fontSize: 8, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.12em',
              }}>
                {String(active + 1).padStart(2, '0')}/{String(USE_CASES.length).padStart(2, '0')}
              </span>
              <div style={{ height: 1, flex: 1, background: 'rgba(196,124,46,0.1)' }} />
            </div>

            <h3 className="syne-font" style={{
              fontSize: 'clamp(18px,2.8vw,26px)', fontWeight: 800,
              color: 'var(--film-cream)', letterSpacing: '0.01em', marginBottom: 14,
            }}>
              {uc.title}
            </h3>

            <p className="body-font" style={{
              fontSize: 12, color: 'var(--film-silver)', lineHeight: 1.72, marginBottom: 20,
            }}>
              {uc.desc}
            </p>

            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {uc.tags.map(t => (
                <span key={t} className="syne-font" style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(110,104,96,0.5)',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '3px 7px', borderRadius: 2,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Live preview column */}
          <div style={{ background: 'rgba(7,7,6,0.4)' }}>
            <LivePreview uc={uc} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.28)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          {USE_CASES.length} INTEGRATIONS · NO AUTH · CORS ENABLED
        </span>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.35)', letterSpacing: '0.1em',
        }}>
          api.spicydevs.xyz
        </span>
      </div>
    </section>
  );
});
UseCasesSection.displayName = 'UseCasesSection';