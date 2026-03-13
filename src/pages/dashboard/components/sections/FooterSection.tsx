// components/sections/FooterSection.tsx
import { memo } from 'react';
import { Film } from 'lucide-react';
import { Link } from '../../../../Router';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Movie Poster Builder', href: '/build',   internal: true  },
      { label: 'API Docs',             href: '#showcase', internal: false },
      { label: 'Badge Showcase',       href: '#atlas',    internal: false },
    ],
  },
  {
    heading: 'Use Cases',
    links: [
      { label: 'Plex & Jellyfin', href: '#use-cases', internal: false },
      { label: 'Discord Bots',    href: '#use-cases', internal: false },
      { label: 'Notion & n8n',    href: '#use-cases', internal: false },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'GitHub',    href: 'https://github.com/xdaayush/freeposterapi', internal: false },
      { label: 'SpicyDevs', href: 'https://spicydevs.xyz',                     internal: false },
    ],
  },
] as const;

const linkStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--film-silver)',
  textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
  transition: 'color 0.2s',
};

export const FooterSection = memo(() => (
  <footer style={{
    background: 'var(--film-dark)',
    borderTop: '1px solid rgba(196,124,46,0.09)',
    padding: '44px 20px 28px',
  }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
        gap: 30, marginBottom: 36,
      }}>
        {FOOTER_LINKS.map(group => (
          <div key={group.heading}>
            <div className="syne-font" style={{
              fontSize: 8, fontWeight: 700,
              color: 'rgba(196,124,46,0.5)',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
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
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        paddingTop: 20,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 4,
            background: 'linear-gradient(135deg,var(--film-amber),#D4A245)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Film size={10} color="#070706" strokeWidth={2.5} />
          </div>
          <span className="syne-font" style={{ fontSize: 10, color: 'var(--film-silver)' }}>
            <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Posterium</strong>
            {' — by '}
            <a
              href="https://spicydevs.xyz"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--film-amber)', textDecoration: 'none' }}
            >
              SpicyDevs
            </a>
          </span>
        </div>
        <span className="syne-font" style={{
          fontSize: 9, color: 'rgba(110,104,96,0.45)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Open source · No account · Free forever
        </span>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';