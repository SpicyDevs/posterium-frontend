// components/sections/FooterSection.tsx
// Film archive / cinematheque catalog aesthetic.
// Features a live Quick URL builder — type a TMDB ID, select badges,
// get a working API URL. Demonstrates the product right in the footer.
import { memo, useState } from 'react';
import { Film, Github, ArrowUpRight, Copy, Check } from 'lucide-react';
import { Link } from '../../../Router';
import { API } from '../../constants';

// ── Quick URL Builder ─────────────────────────────────────────────
const BADGE_OPTIONS = [
  { id: 'imdb', label: 'IMDb',        color: '#E8B848' },
  { id: 'rt',   label: 'RT',          color: '#DC4040' },
  { id: 'meta', label: 'Metacritic',  color: '#8aaaee' },
  { id: 'tmdb', label: 'TMDB',        color: '#3cb371' },
];

const QuickBuilder = memo(() => {
  const [tmdbId, setTmdbId] = useState('155');
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(new Set(['imdb', 'rt']));
  const [copied, setCopied] = useState(false);

  const toggleBadge = (id: string) => {
    setSelectedBadges(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const badgeStr = BADGE_OPTIONS.filter(b => selectedBadges.has(b.id)).map(b => b.id).join(',');
  const url = badgeStr
    ? `${API}/${mediaType}/${tmdbId || '155'}.svg?r=${badgeStr}&source=tmdb`
    : `${API}/${mediaType}/${tmdbId || '155'}.svg?source=tmdb`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{
      background: 'rgba(14,13,11,0.8)',
      border: '1px solid rgba(196,124,46,0.14)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 40,
    }}>
      {/* Builder header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(196,124,46,0.04)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--film-amber)',
          boxShadow: '0 0 6px rgba(196,124,46,0.5)',
          display: 'inline-block',
        }} />
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Quick URL Builder
        </span>
      </div>

      {/* Controls */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* TMDB ID input */}
        <div>
          <div className="mono-font" style={{
            fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            TMDB ID
          </div>
          <input
            type="text"
            value={tmdbId}
            onChange={e => setTmdbId(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 155"
            maxLength={8}
            style={{
              background: 'rgba(7,7,6,0.8)',
              border: '1px solid rgba(196,124,46,0.18)',
              borderRadius: 3,
              color: 'var(--film-cream)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              padding: '5px 10px',
              width: 90,
              outline: 'none',
            }}
          />
        </div>

        {/* Type toggle */}
        <div>
          <div className="mono-font" style={{
            fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            Type
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['movie', 'tv'] as const).map(t => (
              <button key={t} onClick={() => setMediaType(t)} className="mono-font" style={{
                background: mediaType === t ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${mediaType === t ? 'rgba(196,124,46,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 3, cursor: 'pointer', padding: '5px 10px',
                fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: mediaType === t ? 'var(--film-amber)' : 'rgba(122,117,110,0.5)',
                transition: 'all 0.15s',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Badge toggles */}
        <div>
          <div className="mono-font" style={{
            fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 5,
          }}>
            Badges
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {BADGE_OPTIONS.map(b => {
              const on = selectedBadges.has(b.id);
              return (
                <button key={b.id} onClick={() => toggleBadge(b.id)} className="mono-font" style={{
                  background: on ? `${b.color}22` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${on ? `${b.color}55` : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 3, cursor: 'pointer', padding: '5px 9px',
                  fontSize: 7, letterSpacing: '0.1em',
                  color: on ? b.color : 'rgba(122,117,110,0.45)',
                  transition: 'all 0.15s',
                }}>
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generated URL */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <code className="mono-font" style={{
          fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'rgba(240,230,204,0.6)', letterSpacing: '0.02em',
        }}>
          <span style={{ color: 'rgba(196,124,46,0.5)' }}>api.spicydevs.xyz</span>
          <span style={{ color: 'rgba(240,230,204,0.4)' }}>/{mediaType}/{tmdbId || '155'}.svg</span>
          {badgeStr && <span style={{ color: '#DC4040' }}>?r={badgeStr}</span>}
          {badgeStr && <span style={{ color: 'rgba(240,230,204,0.3)' }}>&source=tmdb</span>}
        </code>
        <a
          href={url} target="_blank" rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            color: 'rgba(122,117,110,0.5)',
            textDecoration: 'none', flexShrink: 0,
          }}
          title="Open in new tab"
        >
          <ArrowUpRight size={12} />
        </a>
        <button onClick={copy} style={{
          background: copied ? 'rgba(54,162,64,0.12)' : 'rgba(196,124,46,0.08)',
          border: `1px solid ${copied ? 'rgba(54,162,64,0.3)' : 'rgba(196,124,46,0.18)'}`,
          borderRadius: 3, color: copied ? '#36A240' : 'var(--film-amber)',
          cursor: 'pointer', padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 3,
          transition: 'all 0.2s', flexShrink: 0,
        }}>
          {copied ? <Check size={9} /> : <Copy size={9} />}
          <span className="mono-font" style={{ fontSize: 7, letterSpacing: '0.1em' }}>
            {copied ? 'COPIED' : 'COPY'}
          </span>
        </button>
      </div>
    </div>
  );
});
QuickBuilder.displayName = 'QuickBuilder';

// ── Footer links ──────────────────────────────────────────────────
const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Poster Builder',   href: '/build',    internal: true  },
      { label: 'API Showcase',     href: '#showcase', internal: false },
      { label: 'Badge Atlas',      href: '#atlas',    internal: false },
      { label: 'Feature Set',      href: '#features', internal: false },
    ],
  },
  {
    heading: 'Integrations',
    links: [
      { label: 'Plex & Jellyfin',  href: '#use-cases', internal: false },
      { label: 'Discord Bots',     href: '#use-cases', internal: false },
      { label: 'Notion & n8n',     href: '#use-cases', internal: false },
      { label: 'Print & Design',   href: '#use-cases', internal: false },
    ],
  },
  {
    heading: 'Open Source',
    links: [
      { label: 'GitHub Repo',      href: 'https://github.com/xdaayush/freeposterapi', internal: false },
      { label: 'SpicyDevs',        href: 'https://spicydevs.xyz',                     internal: false },
      { label: 'MIT License',      href: 'https://github.com/xdaayush/freeposterapi/blob/main/LICENSE', internal: false },
    ],
  },
] as const;

const linkStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--film-silver)',
  textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
  transition: 'color 0.2s',
  display: 'flex', alignItems: 'center', gap: 4,
};

export const FooterSection = memo(() => (
  <footer style={{
    background: 'var(--film-dark)',
    borderTop: '1px solid rgba(196,124,46,0.09)',
  }}>
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 20px 0' }}>
      {/* Top row: logo + tagline */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 24,
        marginBottom: 40,
        paddingBottom: 32,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 6,
              background: 'linear-gradient(140deg,#C47C2E,#D4A245)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(196,124,46,0.28)',
            }}>
              <Film size={16} color="#070706" strokeWidth={2.5} />
            </div>
            <div>
              <span className="poster-font" style={{
                fontSize: 22, color: 'var(--film-cream)', letterSpacing: '0.06em',
                lineHeight: 1,
              }}>
                POSTERIUM
              </span>
              <div className="mono-font" style={{
                fontSize: 7, color: 'rgba(196,124,46,0.45)', letterSpacing: '0.14em',
                marginTop: 1,
              }}>
                by SpicyDevs · v2
              </div>
            </div>
          </div>
          <p className="body-font" style={{
            fontSize: 12, color: 'rgba(110,104,96,0.65)', lineHeight: 1.72,
            maxWidth: 340,
          }}>
            A free, open-source API for generating movie and TV poster images with
            live rating badges. No account, no rate limits, no catch.
          </p>
        </div>

        {/* Quick builder */}
        <div style={{ flex: '1 1 360px', maxWidth: 480 }}>
          <QuickBuilder />
        </div>
      </div>

      {/* Link columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0 clamp(20px,5vw,60px)',
        marginBottom: 32,
      }}>
        {FOOTER_LINKS.map(group => (
          <div key={group.heading}>
            <div className="syne-font" style={{
              fontSize: 8, fontWeight: 700,
              color: 'rgba(196,124,46,0.45)',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.links.map(link =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={linkStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)'; }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                    style={linkStyle}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)'; }}
                  >
                    {link.label}
                    {link.href.startsWith('http') && (
                      <ArrowUpRight size={9} style={{ opacity: 0.4 }} />
                    )}
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        paddingTop: 18, paddingBottom: 24,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <span className="syne-font" style={{
          fontSize: 10, color: 'rgba(110,104,96,0.4)',
        }}>
          Open source · No account · Free forever ·{' '}
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank" rel="noreferrer"
            style={{
              color: 'var(--film-amber)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}
          >
            <Github size={10} /> GitHub
          </a>
        </span>

        {/* Film-strip bottom decoration */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 7,
              background: i % 2 === 0 ? 'rgba(196,124,46,0.12)' : 'rgba(196,124,46,0.04)',
              borderRadius: 1, border: '1px solid rgba(196,124,46,0.08)',
            }} />
          ))}
        </div>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';