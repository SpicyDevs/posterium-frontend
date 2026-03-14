// components/sections/FooterSection.tsx
// Film archive / cinematheque catalog aesthetic.
// Features a live Quick URL builder — type a TMDB ID, select badges,
// get a working API URL. Demonstrates the product right in the footer.
import { memo } from 'react';
import { Film, Github, ArrowUpRight } from 'lucide-react';
import { Link } from '../../../Router';
import { QuickBuilder } from '../QuickBuilder';

// ── Footer links ──────────────────────────────────────────────────
const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Poster Builder', href: '/build', internal: true },
      { label: 'API Showcase', href: '#showcase', internal: false },
      { label: 'Badge Atlas', href: '#atlas', internal: false },
      { label: 'Feature Set', href: '#features', internal: false },
    ],
  },
  {
    heading: 'Integrations',
    links: [
      { label: 'Plex & Jellyfin', href: '#use-cases', internal: false },
      { label: 'Discord Bots', href: '#use-cases', internal: false },
      { label: 'Notion & n8n', href: '#use-cases', internal: false },
      { label: 'Print & Design', href: '#use-cases', internal: false },
    ],
  },
  {
    heading: 'Open Source',
    links: [
      { label: 'GitHub Repo', href: 'https://github.com/xdaayush/freeposterapi', internal: false },
      { label: 'SpicyDevs', href: 'https://spicydevs.xyz', internal: false },
      {
        label: 'MIT License',
        href: 'https://github.com/xdaayush/freeposterapi/blob/main/LICENSE',
        internal: false,
      },
    ],
  },
] as const;

const linkStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--film-silver)',
  textDecoration: 'none',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'color 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-dark)',
      borderTop: '1px solid rgba(196,124,46,0.09)',
    }}
  >
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 20px 0' }}>
      {/* Top row: logo + tagline */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 24,
          marginBottom: 40,
          paddingBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: 'linear-gradient(140deg,#C47C2E,#D4A245)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(196,124,46,0.28)',
              }}
            >
              <Film size={16} color="#070706" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="poster-font"
                style={{
                  fontSize: 22,
                  color: 'var(--film-cream)',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                }}
              >
                POSTERIUM
              </span>
              <div
                className="mono-font"
                style={{
                  fontSize: 7,
                  color: 'rgba(196,124,46,0.45)',
                  letterSpacing: '0.14em',
                  marginTop: 1,
                }}
              >
                by SpicyDevs · v2
              </div>
            </div>
          </div>
          <p
            className="body-font"
            style={{
              fontSize: 12,
              color: 'rgba(110,104,96,0.65)',
              lineHeight: 1.72,
              maxWidth: 340,
            }}
          >
            A free, open-source API for generating movie and TV poster images with live rating
            badges. No account, no rate limits, no catch.
          </p>
        </div>

        {/* Quick builder */}
        <div style={{ flex: '1 1 360px', maxWidth: 480 }}>
          <QuickBuilder />
        </div>
      </div>

      {/* Link columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0 clamp(20px,5vw,60px)',
          marginBottom: 32,
        }}
      >
        {FOOTER_LINKS.map((group) => (
          <div key={group.heading}>
            <div
              className="syne-font"
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: 'rgba(196,124,46,0.45)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.links.map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={linkStyle}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
                    }}
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
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
                    }}
                  >
                    {link.label}
                    {link.href.startsWith('http') && (
                      <ArrowUpRight size={9} style={{ opacity: 0.4 }} />
                    )}
                  </a>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          paddingTop: 18,
          paddingBottom: 24,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span
          className="syne-font"
          style={{
            fontSize: 10,
            color: 'rgba(110,104,96,0.4)',
          }}
        >
          Open source · No account · Free forever ·{' '}
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--film-amber)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Github size={10} /> GitHub
          </a>
        </span>

        {/* Film-strip bottom decoration */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 7,
                background: i % 2 === 0 ? 'rgba(196,124,46,0.12)' : 'rgba(196,124,46,0.04)',
                borderRadius: 1,
                border: '1px solid rgba(196,124,46,0.08)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';
