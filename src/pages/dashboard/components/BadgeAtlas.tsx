// src/pages/dashboard/components/BadgeAtlas.tsx
// Shows a 3×2 grid of ACTUAL API output — different badge combinations on real posters.
// Each cell is a live <img> load from api.spicydevs.xyz.
// This is the "proof of product" section — no HTML recreations, the real SVG output.
import { memo, useState, useCallback } from 'react';
import { API } from '../constants';
import { AmberTag } from './primitives';

interface AtlasEntry {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  r: string;             // comma-separated badge IDs
  label: string;         // displayed badge combo name
  desc: string;          // one-liner about this config
  positions: string;     // pre-built position query string
}

const ATLAS: AtlasEntry[] = [
  {
    id: '155', type: 'movie', title: 'The Dark Knight', year: '2008',
    r: 'imdb,rt,meta,tmdb',
    label: 'FULL STACK',
    desc: 'All four badges — IMDb, RT, Meta, TMDB',
    positions: 'imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&tmdb_x=310&tmdb_y=230',
  },
  {
    id: '27205', type: 'movie', title: 'Inception', year: '2010',
    r: 'imdb,rt',
    label: 'DUAL SCORE',
    desc: 'IMDb + Rotten Tomatoes — the classic pair',
    positions: 'imdb_x=310&imdb_y=20&rt_x=310&rt_y=90',
  },
  {
    id: '1396', type: 'tv', title: 'Breaking Bad', year: '2008',
    r: 'imdb',
    label: 'SOLO IMDb',
    desc: 'Clean single badge — maximum minimalism',
    positions: 'imdb_x=310&imdb_y=20',
  },
  {
    id: '872585', type: 'movie', title: 'Oppenheimer', year: '2023',
    r: 'rt,meta,tmdb',
    label: 'CRITICS TRIPLE',
    desc: 'Critics-only stack — RT, Metacritic, TMDB',
    positions: 'rt_x=310&rt_y=20&meta_x=310&meta_y=90&tmdb_x=310&tmdb_y=160',
  },
  {
    id: '238', type: 'movie', title: 'The Godfather', year: '1972',
    r: 'imdb,meta',
    label: 'SPLIT PAIR',
    desc: 'IMDb audience + Metacritic critic — left side placement',
    positions: 'imdb_x=10&imdb_y=20&meta_x=10&meta_y=90',
  },
  {
    id: '475557', type: 'movie', title: 'Joker', year: '2019',
    r: 'rt,meta',
    label: 'CRITIC DUEL',
    desc: 'Rotten Tomatoes vs. Metacritic — for the debaters',
    positions: 'rt_x=310&rt_y=20&meta_x=310&meta_y=90',
  },
];

// Individual atlas cell
const AtlasCell = memo<{ entry: AtlasEntry; delay: number }>(({ entry, delay }) => {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const src = `${API}/${entry.type}/${entry.id}.svg`
    + `?r=${entry.r}&source=tmdb&blur=8&alpha=0.45&rad=12&${entry.positions}`;

  return (
    <div
      className="atlas-cell"
      style={{
        position: 'relative',
        aspectRatio: '2/3',
        overflow: 'hidden',
        cursor: 'pointer',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Skeleton */}
      {!loaded && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s linear infinite',
          }}
        />
      )}

      {/* Actual API output image */}
      <img
        src={src}
        alt={`${entry.title} — ${entry.label}`}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }}
      />

      {/* Info overlay — revealed on hover */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: hovered ? 'rgba(7,7,6,0.76)' : 'rgba(7,7,6,0)',
          transition: 'background 0.3s ease',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 14px 16px',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
      >
        {/* Top: badge combo label */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.25s ease 0.05s, transform 0.25s ease 0.05s',
          }}
        >
          <span
            className="mono-font"
            style={{
              background: 'rgba(196,124,46,0.2)',
              border: '1px solid rgba(196,124,46,0.5)',
              color: 'var(--film-amber)',
              fontSize: 8, fontWeight: 700,
              letterSpacing: '0.14em',
              padding: '2px 7px', borderRadius: 2,
            }}
          >
            {entry.label}
          </span>
        </div>

        {/* Bottom: title + desc + badge list */}
        <div
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.25s ease 0.08s, transform 0.25s ease 0.08s',
          }}
        >
          <div
            className="syne-font"
            style={{ fontSize: 12, fontWeight: 700, color: '#F0E6CC', marginBottom: 4 }}
          >
            {entry.title}
          </div>
          <div
            className="body-font"
            style={{ fontSize: 10, color: 'rgba(240,230,204,0.55)', lineHeight: 1.4, marginBottom: 8 }}
          >
            {entry.desc}
          </div>
          <div
            className="mono-font"
            style={{ fontSize: 8, color: 'rgba(196,124,46,0.6)', letterSpacing: '0.12em' }}
          >
            ?r={entry.r}
          </div>
        </div>
      </div>

      {/* Always-visible bottom label strip */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '6px 10px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(7,7,6,0.82)',
          display: hovered ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span
          className="mono-font"
          style={{ fontSize: 7, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.1em' }}
        >
          {entry.r.toUpperCase().replace(/,/g, ' · ')}
        </span>
        <span
          className="mono-font"
          style={{ fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.08em' }}
        >
          {entry.year}
        </span>
      </div>
    </div>
  );
});
AtlasCell.displayName = 'AtlasCell';

// ── BadgeAtlas Section ────────────────────────────────────────────
const BadgeAtlas = memo(() => (
  <section
    id="atlas"
    aria-label="Badge Atlas — API output showcase"
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
        gap: 14,
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
          THE ATLAS
          <br />
          <span
            style={{
              color: 'transparent',
              WebkitTextStroke: '1.5px rgba(196,124,46,0.4)',
            }}
          >
            OF BADGES
          </span>
        </h2>
      </div>
      <p
        className="syne-font"
        style={{
          fontSize: 12, color: 'var(--film-silver)',
          maxWidth: 340, lineHeight: 1.68,
          textAlign: 'right',
        }}
      >
        Every image below is a live{' '}
        <code
          className="mono-font"
          style={{ color: 'var(--film-amber)', fontSize: 11 }}
        >
          GET
        </code>{' '}
        to the API — not a screenshot. Hover any poster to inspect the badge
        combination and query string.
      </p>
    </div>

    {/* Divider rule */}
    <div
      aria-hidden="true"
      style={{
        margin: '0 clamp(20px,5vw,64px) 28px',
        height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(196,124,46,0.18),transparent)',
      }}
    />

    {/* 3×2 tight grid — no gap, joined edges */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      {ATLAS.map((entry, i) => (
        <AtlasCell key={entry.id + entry.r} entry={entry} delay={i * 60} />
      ))}
    </div>

    {/* Footer note */}
    <div
      style={{
        padding: '16px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span
        className="mono-font"
        style={{ fontSize: 8, color: 'rgba(122,117,110,0.45)', letterSpacing: '0.12em' }}
      >
        All images served as SVG · No CDN or caching layer · Response includes CORS headers
      </span>
      <span
        style={{ flex: 1, height: 1, background: 'rgba(196,124,46,0.07)', flexShrink: 0 }}
      />
      <span
        className="mono-font"
        style={{ fontSize: 8, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.1em' }}
      >
        api.spicydevs.xyz
      </span>
    </div>
  </section>
));
BadgeAtlas.displayName = 'BadgeAtlas';

export default BadgeAtlas;