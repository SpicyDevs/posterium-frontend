// src/pages/dashboard/components/PosterShowcase.tsx
// "THE DARKROOM" - asymmetric masonry contact-sheet layout.
// Breaks the uniform 4-column grid: one large anchor poster (col-span-2, row-span-2)
// + staggered smaller prints. Red-amber safelight aesthetic.
// All images are live API calls - zero screenshots.
import { memo, useState, useCallback } from 'react';
import { API } from '../constants';
import { AmberTag } from './primitives';

interface DarkroomEntry {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  badges: string;
  blur: number;
  alpha: number;
  rad: number;
  positions: string;
  label: string;
  note: string;
  span?: 'large'; // col-span-2 row-span-2
}

const PRINTS: DarkroomEntry[] = [
  {
    id: '155',
    type: 'movie',
    title: 'The Dark Knight',
    year: '2008',
    badges: 'imdb,rt,meta,tmdb',
    blur: 8,
    alpha: 0.45,
    rad: 12,
    positions: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
    label: 'FULL STACK',
    note: 'Four-badge right column',
    span: 'large',
  },
  {
    id: '27205',
    type: 'movie',
    title: 'Inception',
    year: '2010',
    badges: 'imdb,rt',
    blur: 7,
    alpha: 0.4,
    rad: 10,
    positions: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
    label: 'DUAL LEFT',
    note: 'Classic pair, top-left',
  },
  {
    id: '872585',
    type: 'movie',
    title: 'Oppenheimer',
    year: '2023',
    badges: 'rt,meta',
    blur: 9,
    alpha: 0.48,
    rad: 14,
    positions: 'rt_x=14&rt_y=14&meta_x=310&meta_y=14',
    label: 'SPLIT CORNERS',
    note: 'Critics facing each other',
  },
  {
    id: '238',
    type: 'movie',
    title: 'The Godfather',
    year: '1972',
    badges: 'imdb',
    blur: 6,
    alpha: 0.38,
    rad: 8,
    positions: 'imdb_x=14&imdb_y=14',
    label: 'SOLO',
    note: 'One badge, maximum silence',
  },
  {
    id: '475557',
    type: 'movie',
    title: 'Joker',
    year: '2019',
    badges: 'rt,meta,tmdb',
    blur: 8,
    alpha: 0.44,
    rad: 11,
    positions: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96&tmdb_x=310&tmdb_y=170',
    label: 'TRIPLE RIGHT',
    note: 'Critics column, right side',
  },
];

// URL anatomy - color-coded breakdown
const URL_PARTS = [
  { text: 'https://api.spicydevs.xyz', color: '#7a8ef0', label: 'base' },
  { text: '/movie/155', color: 'var(--film-amber)', label: 'type · id' },
  { text: '.svg', color: 'var(--film-cream)', label: 'format' },
  { text: '?r=imdb,rt', color: '#DC4040', label: 'badges' },
  { text: '&blur=8&alpha=0.45', color: '#8aaaee', label: 'style' },
  { text: '&imdb_x=310&imdb_y=22', color: '#3cb371', label: 'position' },
];

const PrintCard = memo<{ entry: DarkroomEntry; eager?: boolean }>(({ entry, eager = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const src =
    `${API}/${entry.type}/${entry.id}.svg` +
    `?r=${entry.badges}&source=tmdb` +
    `&blur=${entry.blur}&alpha=${entry.alpha}&rad=${entry.rad}` +
    `&${entry.positions}`;

  const isLarge = entry.span === 'large';

  return (
    <div
      style={{
        gridColumn: isLarge ? 'span 2' : 'span 1',
        gridRow: isLarge ? 'span 2' : 'span 1',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0908',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Print number strip */}
      <div
        style={{
          padding: '5px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.035)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(7,7,6,0.8)',
          flexShrink: 0,
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: 7,
            color: 'rgba(196,124,46,0.45)',
            letterSpacing: '0.12em',
          }}
        >
          {entry.label}
        </span>
        <span
          className="mono-font"
          style={{
            fontSize: 6,
            color: 'rgba(122,117,110,0.3)',
            letterSpacing: '0.08em',
          }}
        >
          {entry.year}
        </span>
      </div>

      {/* Poster */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: isLarge ? undefined : '2/3',
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
          alt={`${entry.title} - ${entry.label}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.16,1,0.3,1)',
            transform: hovered ? 'scale(1.03)' : 'scale(1)',
            // Subtle darkroom tint
            filter: 'contrast(1.03) saturate(0.98)',
          }}
        />

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: hovered ? 'rgba(7,7,6,0.64)' : 'rgba(7,7,6,0)',
            transition: 'background 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.25s ease 0.06s, transform 0.25s ease 0.06s',
              textAlign: 'center',
              padding: '0 16px',
            }}
          >
            <div
              className="syne-font"
              style={{
                fontSize: isLarge ? 15 : 11,
                fontWeight: 700,
                color: '#F0E6CC',
                marginBottom: 6,
              }}
            >
              {entry.title}
            </div>
            <div
              className="body-font"
              style={{
                fontSize: 10,
                color: 'rgba(240,230,204,0.5)',
                lineHeight: 1.4,
                marginBottom: 10,
              }}
            >
              {entry.note}
            </div>
            <code
              className="mono-font"
              style={{
                fontSize: 8,
                color: 'rgba(196,124,46,0.65)',
                letterSpacing: '0.06em',
                background: 'rgba(7,7,6,0.7)',
                padding: '3px 8px',
                borderRadius: 2,
              }}
            >
              ?r={entry.badges}
            </code>
          </div>
        </div>

        {/* Corner crop marks always visible */}
        {['tl', 'tr', 'bl', 'br'].map((c) => (
          <div
            key={c}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: c.startsWith('t') ? 8 : 'auto',
              bottom: c.startsWith('b') ? 8 : 'auto',
              left: c.endsWith('l') ? 8 : 'auto',
              right: c.endsWith('r') ? 8 : 'auto',
              width: isLarge ? 12 : 8,
              height: isLarge ? 12 : 8,
              borderTop: c.startsWith('t') ? '1px solid rgba(196,124,46,0.22)' : 'none',
              borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.22)' : 'none',
              borderLeft: c.endsWith('l') ? '1px solid rgba(196,124,46,0.22)' : 'none',
              borderRight: c.endsWith('r') ? '1px solid rgba(196,124,46,0.22)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Bottom meta strip */}
      <div
        style={{
          padding: '5px 10px 6px',
          borderTop: '1px solid rgba(255,255,255,0.03)',
          background: 'rgba(7,7,6,0.85)',
          flexShrink: 0,
        }}
      >
        <code
          className="mono-font"
          style={{
            fontSize: 7,
            color: 'rgba(196,124,46,0.4)',
            letterSpacing: '0.06em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          /{entry.type}/{entry.id}.svg?r={entry.badges}
        </code>
      </div>
    </div>
  );
});
PrintCard.displayName = 'PrintCard';

const PosterShowcase = memo(() => (
  <section
    id="showcase"
    aria-label="The Darkroom - API Output Showcase"
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(196,124,46,0.07)',
    }}
  >
    {/* Header */}
    <div
      style={{
        padding: 'clamp(56px,7vw,88px) clamp(20px,5vw,64px) 0',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div>
        <AmberTag style={{ marginBottom: 12 }}>Live API Output</AmberTag>
        <h2
          className="poster-font"
          style={{
            fontSize: 'clamp(40px,6vw,80px)',
            color: 'var(--film-cream)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            marginTop: 10,
          }}
        >
          THE DARK
          <br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(196,124,46,0.4)' }}>
            ROOM
          </span>
        </h2>
      </div>

      <p
        className="syne-font"
        style={{
          fontSize: 12,
          color: 'var(--film-silver)',
          maxWidth: 360,
          lineHeight: 1.68,
          textAlign: 'right',
        }}
      >
        Every print below is a live{' '}
        <code className="mono-font" style={{ color: 'var(--film-amber)', fontSize: 11 }}>
          GET
        </code>{' '}
        - not a screenshot. Hover to inspect the badge configuration.
      </p>
    </div>

    {/* Divider */}
    <div
      aria-hidden="true"
      style={{
        margin: '24px clamp(20px,5vw,64px) 0',
        height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(196,124,46,0.18),transparent)',
      }}
    />

    {/* URL anatomy */}
    <div
      style={{
        margin: '24px clamp(20px,5vw,64px)',
        background: 'rgba(10,9,8,0.9)',
        border: '1px solid rgba(196,124,46,0.1)',
        borderRadius: 5,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: 8,
            color: 'rgba(122,117,110,0.3)',
            letterSpacing: '0.14em',
            marginRight: 10,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          GET
        </span>
        {URL_PARTS.map((p, i) => (
          <code
            key={i}
            className="mono-font"
            style={{ fontSize: 10, color: p.color, letterSpacing: '0.02em' }}
          >
            {p.text}
          </code>
        ))}
      </div>
      <div
        style={{
          padding: '8px 18px 10px',
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {URL_PARTS.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: p.color,
                opacity: 0.75,
                flexShrink: 0,
              }}
            />
            <span
              className="mono-font"
              style={{
                fontSize: 7,
                color: 'rgba(122,117,110,0.45)',
                letterSpacing: '0.12em',
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Asymmetric masonry grid */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: '1fr',
        gap: 2,
        background: 'rgba(196,124,46,0.025)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
        borderBottom: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {PRINTS.map((entry, i) => (
        <PrintCard key={entry.id + entry.badges} entry={entry} eager={i === 0} />
      ))}
    </div>

    {/* Footer */}
    <div
      style={{
        padding: '14px clamp(20px,5vw,64px)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span
        className="mono-font"
        style={{
          fontSize: 8,
          color: 'rgba(122,117,110,0.38)',
          letterSpacing: '0.12em',
        }}
      >
        SVG output · CORS enabled · No auth · Real-time scores · No screenshots
      </span>
      <span style={{ flex: 1, height: 1, background: 'rgba(196,124,46,0.06)' }} />
      <span
        className="mono-font"
        style={{
          fontSize: 8,
          color: 'rgba(196,124,46,0.38)',
          letterSpacing: '0.1em',
        }}
      >
        api.spicydevs.xyz
      </span>
    </div>
  </section>
));

PosterShowcase.displayName = 'PosterShowcase';
export default PosterShowcase;
