// src/modules/homepage/sections/PlexProofSection.tsx
import { memo } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';
import { SectionHeader } from '@/modules/homepage/SectionHeader';
import { AmberTag, FilmCorners } from '@/modules/homepage/primitives';
import { HERO_POSTER_SRCS } from '@/generated/homePosters';

interface PlexRow {
  id: string;
  title: string;
  badges: string;
  live?: boolean;
}

const PLEX_ROW: PlexRow[] = [
  { id: '872585', title: 'Oppenheimer', badges: 'RT · META' },
  { id: '155', title: 'The Dark Knight', badges: 'IMDb · RT', live: true },
  { id: '238', title: 'The Godfather', badges: 'IMDb' },
  { id: '680', title: 'Pulp Fiction', badges: 'IMDb · RT · META' },
  { id: '27205', title: 'Inception', badges: 'IMDb · RT' },
  { id: '278', title: 'The Shawshank Redemption', badges: 'IMDb' },
];

export const PlexProofSection = memo(() => {
  const { ref, vis } = useInView(0.1);

  return (
    <section
      ref={ref}
      id="plex-proof"
      aria-label="The Plex proof"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        paddingBottom: 'clamp(48px,6vw,80px)',
      }}
    >
      <SectionHeader
        tag="Showtime"
        title={
          <>
            THE PLEX
            <br />
            <span style={{ color: 'var(--film-amber)' }}>PROOF</span>
          </>
        }
        description="One URL, pasted once. Every poster in your library keeps its scores current on its own."
        padding="clamp(48px,6vw,72px) clamp(20px,5vw,64px) 0"
      />

      <div style={{ padding: '0 clamp(16px,4vw,64px)', maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(14,13,11,0.7) 0%, rgba(10,9,8,0.9) 100%)',
            border: '1px solid rgba(196,124,46,0.12)',
            borderRadius: 16,
            boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(16px)',
            transition:
              'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }}
        >
          {/* URL bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px clamp(14px,2.5vw,20px)',
              borderBottom: '1px solid rgba(196,124,46,0.12)',
              background: 'rgba(7,7,6,0.6)',
              borderRadius: '16px 16px 0 0',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--film-amber)',
                  boxShadow: '0 0 8px rgba(196,124,46,0.8)',
                  flexShrink: 0,
                }}
              />
              <span
                className="mono-font"
                style={{ fontSize: 8, color: 'var(--film-amber)', letterSpacing: '0.14em' }}
              >
                LIVE
              </span>
            </span>
            <code
              className="mono-font"
              style={{
                fontSize: 10,
                color: 'var(--film-cream)',
                letterSpacing: '0.04em',
                background: 'rgba(196,124,46,0.05)',
                border: '1px solid rgba(196,124,46,0.1)',
                borderRadius: 4,
                padding: '4px 10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: '1 1 auto',
                minWidth: 0,
              }}
            >
              https://api.posterium.xyz/movie/155.svg?r=imdb,rt
            </code>
            <span
              className="plex-proof-hint mono-font"
              style={{
                fontSize: 8,
                color: 'rgba(122,117,110,0.5)',
                letterSpacing: '0.12em',
                flexShrink: 0,
              }}
            >
              PASTE INTO CUSTOM ARTWORK FIELD
            </span>
          </div>

          {/* Library row */}
          <div
            role="list"
            aria-label="Plex library preview — six posters with live rating badges"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 'clamp(10px,1.6vw,18px)',
              padding: 'clamp(18px,3vw,28px)',
            }}
          >
            {PLEX_ROW.map((p) => {
              const src = HERO_POSTER_SRCS[p.id];
              if (!src) return null;
              return (
                <div role="listitem" key={p.id} style={{ minWidth: 0 }}>
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '2/3',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: '#111009',
                      border: p.live
                        ? '1px solid rgba(196,124,46,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: p.live
                        ? '0 18px 40px rgba(0,0,0,0.65), 0 0 34px rgba(196,124,46,0.14)'
                        : '0 10px 24px rgba(0,0,0,0.5)',
                      transition:
                        'transform 0.38s cubic-bezier(0.16,1,0.3,1), box-shadow 0.38s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    {p.live && <FilmCorners />}
                    <img
                      src={src}
                      alt={`Poster for ${p.title} with live ${p.badges} rating badges`}
                      loading="lazy"
                      decoding="async"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {p.live && (
                      <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }}>
                        <AmberTag
                          style={{
                            background: 'var(--film-amber)',
                            color: '#070706',
                            boxShadow: '0 0 14px rgba(196,124,46,0.45)',
                          }}
                        >
                          Live
                        </AmberTag>
                      </div>
                    )}
                  </div>
                  <div
                    className="mono-font"
                    style={{
                      fontSize: 8,
                      color: p.live ? 'rgba(240,230,204,0.85)' : 'rgba(178,166,146,0.55)',
                      letterSpacing: '0.08em',
                      marginTop: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    className="mono-font"
                    style={{
                      fontSize: 8,
                      color: p.live ? 'var(--film-amber)' : 'rgba(122,117,110,0.4)',
                      letterSpacing: '0.1em',
                      marginTop: 1,
                    }}
                  >
                    {p.badges}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom meta bar */}
          <div
            style={{
              padding: '8px clamp(14px,2.5vw,20px)',
              borderTop: '1px solid rgba(196,124,46,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              className="mono-font"
              style={{
                fontSize: 8,
                color: 'var(--film-text-ghost)',
                letterSpacing: '0.16em',
                flexShrink: 0,
              }}
            >
              Scores refresh on every load
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, var(--film-amber), #D4A245)',
                  opacity: 0.55,
                }}
              />
            </div>
            <span
              className="mono-font"
              style={{
                fontSize: 8,
                color: 'var(--film-text-ghost)',
                flexShrink: 0,
                letterSpacing: '0.1em',
              }}
            >
              6 titles · 1 URL
            </span>
          </div>
        </div>

        <p
          className="syne-font"
          style={{
            fontSize: 12,
            color: 'var(--film-silver)',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: 'clamp(20px,3vw,28px) auto 0',
            textAlign: 'center',
          }}
        >
          Open any item in Plex or Jellyfin, paste the URL into the custom artwork field, and you're
          done. The scores on that poster are fetched fresh the moment it loads — no cron jobs, no
          re-uploads.
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plex-proof-hint { display: none; }
          [aria-label="Plex library preview — six posters with live rating badges"] { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 540px) {
          [aria-label="Plex library preview — six posters with live rating badges"] { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
});

PlexProofSection.displayName = 'PlexProofSection';
