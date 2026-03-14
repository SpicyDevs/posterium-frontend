// src/dashboard/components/BadgeAtlas.tsx
// "THE CONTACT SHEET" — compact 4×3 grid of predefined poster+badge combos.
// No interactive badge selector. Each cell shows a real API output with a
// film-frame aesthetic. Clean, dark, cinema-archive feel.
import { memo, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { API } from '../constants';
import { AmberTag } from './primitives';

interface SheetEntry {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  r: string;
  pos: string;
  frame: string;
  label: string;
}

const SHEET: SheetEntry[] = [
  {
    id: '155', type: 'movie', title: 'The Dark Knight', year: '2008',
    r: 'imdb,rt,meta,tmdb',
    pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
    frame: '01', label: 'FULL STACK',
  },
  {
    id: '27205', type: 'movie', title: 'Inception', year: '2010',
    r: 'imdb,rt',
    pos: 'imdb_x=10&imdb_y=14&rt_x=10&rt_y=88',
    frame: '02', label: 'DUAL LEFT',
  },
  {
    id: '872585', type: 'movie', title: 'Oppenheimer', year: '2023',
    r: 'rt,meta',
    pos: 'rt_x=10&rt_y=14&meta_x=310&meta_y=14',
    frame: '03', label: 'SPLIT',
  },
  {
    id: '238', type: 'movie', title: 'The Godfather', year: '1972',
    r: 'imdb',
    pos: 'imdb_x=10&imdb_y=14',
    frame: '04', label: 'SOLO',
  },
  {
    id: '475557', type: 'movie', title: 'Joker', year: '2019',
    r: 'rt,meta,tmdb',
    pos: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96&tmdb_x=310&tmdb_y=170',
    frame: '05', label: 'TRIPLE',
  },
  {
    id: '1396', type: 'tv', title: 'Breaking Bad', year: '2008',
    r: 'imdb',
    pos: 'imdb_x=10&imdb_y=14',
    frame: '06', label: 'TV · SOLO',
  },
  {
    id: '680', type: 'movie', title: 'Pulp Fiction', year: '1994',
    r: 'imdb,rt',
    pos: 'imdb_x=10&imdb_y=14&rt_x=10&rt_y=88',
    frame: '07', label: 'DUAL LEFT',
  },
  {
    id: '157336', type: 'movie', title: 'Interstellar', year: '2014',
    r: 'imdb,rt,meta',
    pos: 'imdb_x=10&imdb_y=14&rt_x=10&rt_y=88&meta_x=10&meta_y=162',
    frame: '08', label: 'TRIPLE LEFT',
  },
  {
    id: '278', type: 'movie', title: 'Shawshank', year: '1994',
    r: 'imdb,rt,meta,tmdb',
    pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
    frame: '09', label: 'FULL STACK',
  },
  {
    id: '550', type: 'movie', title: 'Fight Club', year: '1999',
    r: 'imdb,meta',
    pos: 'imdb_x=10&imdb_y=14&meta_x=10&meta_y=88',
    frame: '10', label: 'DUAL LEFT',
  },
  {
    id: '76341', type: 'movie', title: 'Mad Max', year: '2015',
    r: 'rt,meta',
    pos: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96',
    frame: '11', label: 'SPLIT RIGHT',
  },
  {
    id: '324857', type: 'movie', title: 'Spider-Verse', year: '2018',
    r: 'imdb,rt',
    pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96',
    frame: '12', label: 'DUAL RIGHT',
  },
];

const SheetCell = memo<{ entry: SheetEntry; eager?: boolean }>(
  ({ entry, eager = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const onLoad = useCallback(() => setLoaded(true), []);

    const src =
      `${API}/${entry.type}/${entry.id}.svg` +
      `?r=${entry.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${entry.pos}`;

    const copy = useCallback(() => {
      navigator.clipboard.writeText(src).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }, [src]);

    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', background: '#0b0a08' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Frame strip header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.035)',
            background: 'rgba(5,5,4,0.9)',
          }}
        >
          <span
            className="mono-font"
            style={{ fontSize: 7, color: 'rgba(196,124,46,0.45)', letterSpacing: '0.1em' }}
          >
            ▪ {entry.frame}
          </span>
          <span
            className="mono-font"
            style={{ fontSize: 6, color: 'rgba(110,104,96,0.3)', letterSpacing: '0.08em' }}
          >
            {entry.year}
          </span>
        </div>

        {/* Poster */}
        <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden' }}>
          {!loaded && (
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s linear infinite',
              }}
            />
          )}
          <img
            src={src}
            alt={entry.title}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={onLoad}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.35s ease, transform 0.4s ease',
              transform: hovered ? 'scale(1.03)' : 'scale(1)',
              filter: 'contrast(1.02)',
            }}
          />

          {/* Hover: copy button */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: hovered ? 'rgba(7,7,6,0.55)' : 'rgba(7,7,6,0)',
              transition: 'background 0.25s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: hovered ? 'all' : 'none',
            }}
          >
            <button
              onClick={copy}
              style={{
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'scale(1)' : 'scale(0.85)',
                transition: 'opacity 0.2s, transform 0.2s',
                background: copied ? 'rgba(54,162,64,0.14)' : 'rgba(196,124,46,0.1)',
                border: `1px solid ${copied ? 'rgba(54,162,64,0.4)' : 'rgba(196,124,46,0.3)'}`,
                borderRadius: 3,
                color: copied ? '#36A240' : 'var(--film-amber)',
                cursor: 'pointer',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copied ? <Check size={9} /> : <Copy size={9} />}
              <span className="mono-font" style={{ fontSize: 7, letterSpacing: '0.1em' }}>
                {copied ? 'COPIED' : 'COPY URL'}
              </span>
            </button>
          </div>

          {/* Corner crop marks */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <div
              key={c}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: c.startsWith('t') ? 5 : 'auto',
                bottom: c.startsWith('b') ? 5 : 'auto',
                left: c.endsWith('l') ? 5 : 'auto',
                right: c.endsWith('r') ? 5 : 'auto',
                width: 7, height: 7,
                borderTop: c.startsWith('t') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                borderLeft: c.endsWith('l') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                borderRight: c.endsWith('r') ? '1px solid rgba(196,124,46,0.22)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Caption */}
        <div
          style={{
            padding: '4px 8px 5px',
            background: 'rgba(5,5,4,0.9)',
            borderTop: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <div
            className="mono-font"
            style={{
              fontSize: 6,
              color: 'rgba(196,124,46,0.45)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {entry.label} · {entry.r.toUpperCase().replace(/,/g, ' ·')}
          </div>
        </div>
      </div>
    );
  }
);
SheetCell.displayName = 'SheetCell';

const BadgeAtlas = memo(() => (
  <section
    id="atlas"
    aria-label="Contact Sheet — Badge Configurations"
    style={{ background: 'var(--film-black)', padding: '72px 0 0' }}
  >
    {/* Header */}
    <div
      style={{
        padding: '0 clamp(20px,5vw,64px)',
        marginBottom: 32,
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
            fontSize: 'clamp(36px,5.5vw,72px)',
            color: 'var(--film-cream)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            marginTop: 10,
          }}
        >
          THE CONTACT
          <br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(196,124,46,0.4)' }}>
            SHEET
          </span>
        </h2>
      </div>
      <div style={{ textAlign: 'right', maxWidth: 320 }}>
        <p
          className="syne-font"
          style={{
            fontSize: 11,
            color: 'var(--film-silver)',
            lineHeight: 1.65,
            marginBottom: 10,
          }}
        >
          Every image is a live{' '}
          <code
            className="mono-font"
            style={{ color: 'var(--film-amber)', fontSize: 10 }}
          >
            GET
          </code>{' '}
          to the API — 12 badge configurations. Hover to copy the URL.
        </p>
        <code
          className="mono-font"
          style={{
            fontSize: 9,
            color: 'rgba(196,124,46,0.45)',
            letterSpacing: '0.04em',
          }}
        >
          api.spicydevs.xyz/&#123;type&#125;/&#123;id&#125;.svg?r=imdb,rt&amp;imdb_x=10&amp;imdb_y=14
        </code>
      </div>
    </div>

    {/* Divider */}
    <div
      aria-hidden="true"
      style={{
        margin: '0 clamp(20px,5vw,64px) 0',
        height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(196,124,46,0.16),transparent)',
      }}
    />

    {/* 4×3 contact sheet grid */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 2,
        background: 'rgba(196,124,46,0.03)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        borderBottom: '1px solid rgba(196,124,46,0.07)',
        marginTop: 0,
      }}
    >
      {SHEET.map((entry, i) => (
        <SheetCell key={entry.id + entry.r + i} entry={entry} eager={i < 4} />
      ))}
    </div>

    {/* Footer */}
    <div
      style={{
        padding: '12px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(196,124,46,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span
        className="mono-font"
        style={{
          fontSize: 7,
          color: 'rgba(122,117,110,0.35)',
          letterSpacing: '0.12em',
        }}
      >
        12 configurations · SVG output · CORS enabled · Real-time scores
      </span>
      <span style={{ flex: 1, height: 1, background: 'rgba(196,124,46,0.06)' }} />
      <span
        className="mono-font"
        style={{ fontSize: 7, color: 'rgba(196,124,46,0.35)', letterSpacing: '0.1em' }}
      >
        api.spicydevs.xyz
      </span>
    </div>
  </section>
));

BadgeAtlas.displayName = 'BadgeAtlas';
export default BadgeAtlas;