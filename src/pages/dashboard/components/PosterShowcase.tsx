// components/PosterShowcase.tsx
// "THE PRINT ROOM" — editorial contact-sheet layout.
// Every image is a live GET to api.spicydevs.xyz — no screenshots, no mocks.
// Replaces the interactive LiveAPIDemo: no controls needed, just accurate output.
import { memo, useState, useCallback } from 'react';
import { API } from '../constants';
import { AmberTag } from './primitives';

// ── Showcase entries ──────────────────────────────────────────────
// Each represents a real API URL with different badge configurations.
// Positions chosen so badges never overlap and demonstrate placement variety.
interface ShowcaseEntry {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  badges: string;           // r= param value
  blur: number;
  alpha: number;
  rad: number;
  positions: string;        // pre-built &key=val string
  label: string;            // SHORT_LABEL above poster
  caption: string;          // one-liner under label
  accent: string;           // hex for the label background tint
}

const SHOWCASE: ShowcaseEntry[] = [
  {
    id: '155',    type: 'movie', title: 'The Dark Knight', year: '2008',
    badges:    'imdb,rt,meta,tmdb',
    blur: 8,   alpha: 0.45, rad: 12,
    positions: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
    label:    'FULL STACK',
    caption:  'All four badges — right-aligned column',
    accent:   'rgba(196,124,46,0.18)',
  },
  {
    id: '27205', type: 'movie', title: 'Inception', year: '2010',
    badges:    'imdb,rt',
    blur: 7,   alpha: 0.40, rad: 10,
    positions: 'imdb_x=16&imdb_y=16&rt_x=16&rt_y=90',
    label:    'DUAL · LEFT',
    caption:  'IMDb + RT, left-aligned stack',
    accent:   'rgba(168,32,24,0.18)',
  },
  {
    id: '872585', type: 'movie', title: 'Oppenheimer', year: '2023',
    badges:    'rt,meta',
    blur: 9,   alpha: 0.48, rad: 14,
    positions: 'rt_x=16&rt_y=16&meta_x=310&meta_y=16',
    label:    'CRITICS · SPLIT',
    caption:  'RT top-left, Metacritic top-right',
    accent:   'rgba(60,100,200,0.18)',
  },
  {
    id: '238',   type: 'movie', title: 'The Godfather', year: '1972',
    badges:    'imdb',
    blur: 6,   alpha: 0.38, rad: 8,
    positions: 'imdb_x=16&imdb_y=16',
    label:    'SOLO · MINIMAL',
    caption:  'Single badge, top-left corner',
    accent:   'rgba(60,179,113,0.15)',
  },
];

// ── Individual showcase card ──────────────────────────────────────
const ShowcaseCard = memo<{ entry: ShowcaseEntry; index: number }>(({ entry, index }) => {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const src = `${API}/${entry.type}/${entry.id}.svg`
    + `?r=${entry.badges}&source=tmdb`
    + `&blur=${entry.blur}&alpha=${entry.alpha}&rad=${entry.rad}`
    + `&${entry.positions}`;

  const shortUrl = `/${entry.type}/${entry.id}.svg?r=${entry.badges}&…`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      opacity: 1,
      // staggered entrance via CSS animation-delay
      animation: `fade-up 0.7s cubic-bezier(0.16,1,0.3,1) ${0.1 + index * 0.1}s both`,
    }}>
      {/* Label bar */}
      <div style={{
        padding: '7px 10px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: entry.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span className="mono-font" style={{
          fontSize: 8, fontWeight: 700,
          color: 'var(--film-amber)', letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          {entry.label}
        </span>
        <span className="mono-font" style={{
          fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.08em',
        }}>
          {entry.year}
        </span>
      </div>

      {/* Poster image — 2:3 aspect */}
      <div style={{
        aspectRatio: '2/3',
        position: 'relative',
        overflow: 'hidden',
        background: '#151310',
        flexShrink: 0,
      }}>
        {/* Skeleton */}
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s linear infinite',
          }} />
        )}
        <img
          src={src}
          alt={`${entry.title} — ${entry.label}`}
          loading={index < 2 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
      </div>

      {/* URL strip */}
      <div style={{
        padding: '10px 10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(14,13,11,0.8)',
        flexShrink: 0,
      }}>
        <div className="syne-font" style={{
          fontSize: 10, fontWeight: 700, color: 'var(--film-cream)',
          marginBottom: 5, letterSpacing: '0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {entry.title}
        </div>
        <div className="body-font" style={{
          fontSize: 9, color: 'rgba(110,104,96,0.65)', marginBottom: 7,
          lineHeight: 1.4,
        }}>
          {entry.caption}
        </div>
        <code className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.04em',
          display: 'block',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {shortUrl}
        </code>
      </div>
    </div>
  );
});
ShowcaseCard.displayName = 'ShowcaseCard';

// ── URL anatomy breakdown ─────────────────────────────────────────
const UrlAnatomy = memo(() => {
  const parts = [
    { text: 'https://api.spicydevs.xyz', color: '#7a8ef0', label: 'base' },
    { text: '/movie/155',               color: 'var(--film-amber)', label: 'type / id' },
    { text: '.svg',                      color: 'var(--film-cream)', label: 'format' },
    { text: '?r=imdb,rt',              color: '#DC4040', label: 'badges' },
    { text: '&blur=8&alpha=0.45',      color: '#8aaaee', label: 'style' },
    { text: '&imdb_x=310&imdb_y=22',   color: '#3cb371', label: 'position' },
  ];

  return (
    <div style={{
      margin: '32px clamp(20px,5vw,64px)',
      background: 'rgba(14,13,11,0.85)',
      border: '1px solid rgba(196,124,46,0.1)',
      borderRadius: 6, overflow: 'hidden',
    }}>
      {/* Code line */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        overflowX: 'auto', scrollbarWidth: 'none',
        whiteSpace: 'nowrap',
      }}>
        <code className="mono-font" style={{ fontSize: 11, letterSpacing: '0.02em' }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: p.color }}>{p.text}</span>
          ))}
        </code>
      </div>

      {/* Label row */}
      <div style={{
        padding: '8px 20px 10px',
        display: 'flex', gap: 20, flexWrap: 'wrap',
      }}>
        {parts.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: p.color, flexShrink: 0,
              opacity: 0.8,
            }} />
            <span className="mono-font" style={{
              fontSize: 8, color: 'rgba(122,117,110,0.5)', letterSpacing: '0.12em',
            }}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
UrlAnatomy.displayName = 'UrlAnatomy';

// ── Section ───────────────────────────────────────────────────────
const PosterShowcase = memo(() => (
  <section
    id="showcase"
    aria-label="Print Room — API Output Showcase"
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(196,124,46,0.07)',
      paddingBottom: 0,
    }}
  >
    {/* Header */}
    <div style={{
      padding: 'clamp(56px,7vw,88px) clamp(20px,5vw,64px) 0',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div>
        <AmberTag style={{ marginBottom: 12 }}>Live API Output</AmberTag>
        <h2 className="poster-font" style={{
          fontSize: 'clamp(40px,6vw,80px)',
          color: 'var(--film-cream)', lineHeight: 0.9,
          letterSpacing: '0.02em', marginTop: 10,
        }}>
          THE PRINT
          <br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(196,124,46,0.4)' }}>
            ROOM
          </span>
        </h2>
      </div>

      <p className="syne-font" style={{
        fontSize: 12, color: 'var(--film-silver)',
        maxWidth: 360, lineHeight: 1.68, textAlign: 'right',
      }}>
        Every poster below is a live{' '}
        <code className="mono-font" style={{ color: 'var(--film-amber)', fontSize: 11 }}>GET</code>
        {' '}to the API — not a screenshot. Each demonstrates a different badge placement strategy.
      </p>
    </div>

    {/* Amber divider rule */}
    <div aria-hidden="true" style={{
      margin: '24px clamp(20px,5vw,64px) 0',
      height: 1,
      background: 'linear-gradient(90deg,transparent,rgba(196,124,46,0.18),transparent)',
    }} />

    {/* URL anatomy */}
    <UrlAnatomy />

    {/* 4-column contact sheet grid */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 2,
      background: 'rgba(255,255,255,0.025)',
    }}>
      {SHOWCASE.map((entry, i) => (
        <ShowcaseCard key={entry.id + entry.badges} entry={entry} index={i} />
      ))}
    </div>

    {/* Footer note */}
    <div style={{
      padding: '14px clamp(20px,5vw,64px)',
      borderTop: '1px solid rgba(196,124,46,0.07)',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span className="mono-font" style={{
        fontSize: 8, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.12em',
      }}>
        SVG output · CORS enabled · No auth · Real-time scores
      </span>
      <span style={{ flex: 1, height: 1, background: 'rgba(196,124,46,0.07)' }} />
      <span className="mono-font" style={{
        fontSize: 8, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.1em',
      }}>
        api.spicydevs.xyz
      </span>
    </div>
  </section>
));

PosterShowcase.displayName = 'PosterShowcase';
export default PosterShowcase;