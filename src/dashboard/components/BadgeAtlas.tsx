// src/pages/dashboard/components/BadgeAtlas.tsx
// "THE CONTACT SHEET" — interactive darkroom contact-print layout.
// One large featured poster updates live as the user selects badge combos.
// Right column: 4 static contact prints showing positional variety.
// Bottom strip: full-width film-print row with diverse configs.
import { memo, useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { API } from '../constants';
import { AmberTag } from './primitives';

// ── Badge selector options ────────────────────────────────────────
interface BadgeCombo {
  id: string;
  label: string;
  r: string;
  positions: string;
  desc: string;
}

const COMBOS: BadgeCombo[] = [
  { id: 'all',    label: 'ALL FOUR',    r: 'imdb,rt,meta,tmdb', desc: 'Full stack right column',   positions: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244' },
  { id: 'dual',   label: 'DUAL LEFT',  r: 'imdb,rt',           desc: 'Classic pair top-left',      positions: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88'                                              },
  { id: 'split',  label: 'SPLIT',      r: 'rt,meta',           desc: 'Critics split corners',      positions: 'rt_x=14&rt_y=14&meta_x=310&meta_y=14'                                             },
  { id: 'solo',   label: 'SOLO',       r: 'imdb',              desc: 'One badge, maximum clean',   positions: 'imdb_x=14&imdb_y=14'                                                              },
  { id: 'triple', label: 'TRIPLE',     r: 'rt,meta,tmdb',      desc: 'Critics-only right stack',   positions: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96&tmdb_x=310&tmdb_y=170'                     },
];

// Contact print data — right column + bottom strip
interface ContactEntry {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  r: string;
  positions: string;
  frame: string; // frame number label
}

const CONTACT_PRINTS: ContactEntry[] = [
  {
    id: '27205', type: 'movie', title: 'Inception', year: '2010',
    r: 'imdb,rt', positions: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
    frame: '02',
  },
  {
    id: '1396', type: 'tv', title: 'Breaking Bad', year: '2008',
    r: 'imdb', positions: 'imdb_x=14&imdb_y=14',
    frame: '03',
  },
  {
    id: '872585', type: 'movie', title: 'Oppenheimer', year: '2023',
    r: 'rt,meta,tmdb', positions: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96&tmdb_x=310&tmdb_y=170',
    frame: '04',
  },
  {
    id: '238', type: 'movie', title: 'The Godfather', year: '1972',
    r: 'imdb,meta', positions: 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88',
    frame: '05',
  },
];

const STRIP_PRINTS: ContactEntry[] = [
  { id: '475557', type: 'movie', title: 'Joker',    year: '2019', r: 'rt,meta', positions: 'rt_x=310&rt_y=22&meta_x=310&meta_y=96', frame: '06' },
  { id: '680',    type: 'movie', title: 'Pulp Fiction', year: '1994', r: 'imdb,rt', positions: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88', frame: '07' },
  { id: '550',    type: 'movie', title: 'Fight Club', year: '1999', r: 'imdb', positions: 'imdb_x=14&imdb_y=14', frame: '08' },
  { id: '157336', type: 'movie', title: 'Interstellar', year: '2014', r: 'imdb,rt,meta', positions: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88&meta_x=14&meta_y=162', frame: '09' },
  { id: '278',    type: 'movie', title: 'Shawshank', year: '1994', r: 'imdb,rt,meta,tmdb', positions: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244', frame: '10' },
];

// ── Small contact print cell ──────────────────────────────────────
const ContactPrint = memo<{
  entry: ContactEntry;
  size?: 'sm' | 'xs';
}>(({ entry, size = 'sm' }) => {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const src = `${API}/${entry.type}/${entry.id}.svg?r=${entry.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${entry.positions}`;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Frame label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 6px',
        background: 'rgba(7,7,6,0.7)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span className="mono-font" style={{
          fontSize: 7, color: 'rgba(196,124,46,0.45)', letterSpacing: '0.1em',
        }}>
          ▪ {entry.frame}
        </span>
        <span className="mono-font" style={{
          fontSize: 6, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.08em',
        }}>
          {entry.year}
        </span>
      </div>

      {/* Poster */}
      <div style={{
        aspectRatio: '2/3', position: 'relative', overflow: 'hidden',
        background: '#0e0d0b',
      }}>
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s linear infinite',
          }} />
        )}
        <img
          src={src} alt={entry.title} loading="lazy" decoding="async"
          onLoad={onLoad}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease',
            // Slight sepia tint — darkroom contact-print aesthetic
            filter: 'sepia(0.06) contrast(1.02)',
          }}
        />
        {/* Corner crop marks */}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} aria-hidden="true" style={{
            position: 'absolute',
            top: c.startsWith('t') ? 5 : 'auto',
            bottom: c.startsWith('b') ? 5 : 'auto',
            left: c.endsWith('l') ? 5 : 'auto',
            right: c.endsWith('r') ? 5 : 'auto',
            width: 8, height: 8,
            borderTop: c.startsWith('t') ? '1px solid rgba(196,124,46,0.25)' : 'none',
            borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.25)' : 'none',
            borderLeft: c.endsWith('l') ? '1px solid rgba(196,124,46,0.25)' : 'none',
            borderRight: c.endsWith('r') ? '1px solid rgba(196,124,46,0.25)' : 'none',
          }} />
        ))}
      </div>

      {/* Caption strip */}
      <div style={{
        padding: '4px 6px 5px',
        background: 'rgba(7,7,6,0.85)',
        borderTop: '1px solid rgba(255,255,255,0.035)',
      }}>
        <div className="mono-font" style={{
          fontSize: 7, color: 'rgba(196,124,46,0.5)', letterSpacing: '0.1em',
          textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.r.toUpperCase().replace(/,/g, ' ·')}
        </div>
      </div>
    </div>
  );
});
ContactPrint.displayName = 'ContactPrint';

// ── Featured large poster (interactive) ──────────────────────────
const FeaturedPoster = memo<{
  combo: BadgeCombo;
  movieId?: string;
  movieType?: 'movie' | 'tv';
}>(({ combo, movieId = '155', movieType = 'movie' }) => {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const src = `${API}/${movieType}/${movieId}.svg?r=${combo.r}&source=tmdb&blur=8&alpha=0.45&rad=12&${combo.positions}`;
  const shortUrl = `/${movieType}/${movieId}.svg?r=${combo.r}&…`;

  const copy = () => {
    navigator.clipboard.writeText(`${API}${shortUrl.replace('…', `blur=8&alpha=0.45&rad=12&${combo.positions}`)}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top label */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(196,124,46,0.06)',
        borderBottom: '1px solid rgba(196,124,46,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono-font" style={{
            fontSize: 7, color: 'rgba(196,124,46,0.5)', letterSpacing: '0.12em',
          }}>
            ▪ 01
          </span>
          <span className="mono-font" style={{
            fontSize: 8, color: 'var(--film-amber)', letterSpacing: '0.14em',
            fontWeight: 700, textTransform: 'uppercase',
          }}>
            {combo.label}
          </span>
        </div>
        <span className="body-font" style={{
          fontSize: 9, color: 'rgba(110,104,96,0.55)',
        }}>
          {combo.desc}
        </span>
      </div>

      {/* Poster */}
      <div style={{
        aspectRatio: '2/3', position: 'relative', overflow: 'hidden',
        background: '#0e0d0b',
      }}>
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.6s linear infinite',
          }} />
        )}
        <img
          src={src} alt="Featured poster" loading="eager" decoding="async"
          onLoad={onLoad}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease',
          }}
        />
        {/* Corner crop marks — larger */}
        {['tl','tr','bl','br'].map(c => (
          <div key={c} aria-hidden="true" style={{
            position: 'absolute',
            top: c.startsWith('t') ? 10 : 'auto',
            bottom: c.startsWith('b') ? 10 : 'auto',
            left: c.endsWith('l') ? 10 : 'auto',
            right: c.endsWith('r') ? 10 : 'auto',
            width: 14, height: 14,
            borderTop: c.startsWith('t') ? '1.5px solid rgba(196,124,46,0.35)' : 'none',
            borderBottom: c.startsWith('b') ? '1.5px solid rgba(196,124,46,0.35)' : 'none',
            borderLeft: c.endsWith('l') ? '1.5px solid rgba(196,124,46,0.35)' : 'none',
            borderRight: c.endsWith('r') ? '1.5px solid rgba(196,124,46,0.35)' : 'none',
          }} />
        ))}
        {/* FEATURED badge */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        }}>
          <span className="mono-font" style={{
            fontSize: 7, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.16em',
            background: 'rgba(7,7,6,0.75)', padding: '2px 8px', borderRadius: 2,
            border: '1px solid rgba(196,124,46,0.18)',
          }}>
            FEATURED
          </span>
        </div>
      </div>

      {/* URL strip */}
      <div style={{
        padding: '8px 12px 10px',
        background: 'rgba(7,7,6,0.9)',
        borderTop: '1px solid rgba(196,124,46,0.08)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <code className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.04em',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {shortUrl}
        </code>
        <button
          onClick={copy}
          style={{
            background: copied ? 'rgba(54,162,64,0.12)' : 'rgba(196,124,46,0.08)',
            border: `1px solid ${copied ? 'rgba(54,162,64,0.3)' : 'rgba(196,124,46,0.2)'}`,
            borderRadius: 3, color: copied ? '#36A240' : 'var(--film-amber)',
            cursor: 'pointer', padding: '3px 7px',
            display: 'flex', alignItems: 'center', gap: 3,
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {copied ? <Check size={9} /> : <Copy size={9} />}
          <span className="mono-font" style={{ fontSize: 7, letterSpacing: '0.1em' }}>
            {copied ? 'COPIED' : 'COPY'}
          </span>
        </button>
      </div>
    </div>
  );
});
FeaturedPoster.displayName = 'FeaturedPoster';

// ── BadgeAtlas Section ────────────────────────────────────────────
const BadgeAtlas = memo(() => {
  const [activeCombo, setActiveCombo] = useState(0);

  return (
    <section
      id="atlas"
      aria-label="Badge Atlas — Interactive Contact Sheet"
      style={{ background: 'var(--film-black)', padding: '72px 0 0' }}
    >
      {/* Header */}
      <div style={{
        padding: '0 clamp(20px,5vw,64px)', marginBottom: 32,
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
      }}>
        <div>
          <AmberTag style={{ marginBottom: 12 }}>Interactive · Live API Output</AmberTag>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px,6vw,80px)', color: 'var(--film-cream)',
            lineHeight: 0.9, letterSpacing: '0.02em', marginTop: 10,
          }}>
            THE CONTACT
            <br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(196,124,46,0.4)' }}>
              SHEET
            </span>
          </h2>
        </div>
        <p className="syne-font" style={{
          fontSize: 12, color: 'var(--film-silver)', maxWidth: 340, lineHeight: 1.68, textAlign: 'right',
        }}>
          Select a badge combination below — the featured poster updates live.
          Every image is a real{' '}
          <code className="mono-font" style={{ color: 'var(--film-amber)', fontSize: 11 }}>GET</code>
          {' '}to the API.
        </p>
      </div>

      {/* Divider */}
      <div aria-hidden="true" style={{
        margin: '0 clamp(20px,5vw,64px) 24px', height: 1,
        background: 'linear-gradient(90deg,transparent,rgba(196,124,46,0.18),transparent)',
      }} />

      {/* Badge combo selector */}
      <div style={{
        padding: '0 clamp(20px,5vw,64px)', marginBottom: 16,
        display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.14em',
          marginRight: 8, textTransform: 'uppercase',
        }}>
          Badge config
        </span>
        {COMBOS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveCombo(i)}
            className="mono-font"
            style={{
              background: activeCombo === i ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${activeCombo === i ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 3, color: activeCombo === i ? 'var(--film-amber)' : 'rgba(122,117,110,0.55)',
              cursor: 'pointer', padding: '5px 12px', fontSize: 8,
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Contact sheet grid — exposed to window edges, no side padding */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 2,
        background: 'rgba(196,124,46,0.04)',
        borderTop: '1px solid rgba(196,124,46,0.08)',
        borderBottom: '1px solid rgba(196,124,46,0.08)',
      }}>
        {/* Large featured poster (spans 2 rows) */}
        <div style={{ gridRow: '1 / 3' }}>
          <FeaturedPoster combo={COMBOS[activeCombo]} />
        </div>

        {/* 4 contact prints */}
        {CONTACT_PRINTS.map(entry => (
          <ContactPrint key={entry.id + entry.r} entry={entry} />
        ))}
      </div>

      {/* Bottom film strip — 5 across */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 2,
        background: 'rgba(196,124,46,0.03)',
        borderBottom: '1px solid rgba(196,124,46,0.06)',
      }}>
        {STRIP_PRINTS.map(entry => (
          <ContactPrint key={entry.id + entry.r} entry={entry} size="xs" />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.12em',
        }}>
          All images are live SVG · Real-time scores · CORS enabled · No auth
        </span>
        <span style={{ flex: 1, height: 1, background: 'rgba(196,124,46,0.07)' }} />
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.1em',
        }}>
          api.spicydevs.xyz
        </span>
      </div>
    </section>
  );
});

BadgeAtlas.displayName = 'BadgeAtlas';
export default BadgeAtlas;