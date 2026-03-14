// src/dashboard/components/sections/FooterSection.tsx
// Improved footer: ghost POSTERIUM wordmark as decorative backdrop,
// cleaner link columns, more visual interest in the bottom bar.
import { memo } from 'react';
import { Film, Github, ArrowUpRight } from 'lucide-react';
import { Link } from '../../../Router';
import { QuickBuilder } from '../QuickBuilder';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Poster Builder', href: '/build', internal: true },
      { label: 'API Showcase', href: '#atlas', internal: false },
      { label: 'Features', href: '#combined', internal: false },
      { label: 'Integrations', href: '#combined', internal: false },
    ],
  },
  {
    heading: 'Sources',
    links: [
      { label: 'IMDb', href: '#atlas', internal: false },
      { label: 'Rotten Tomatoes', href: '#atlas', internal: false },
      { label: 'Metacritic', href: '#atlas', internal: false },
      { label: 'TMDB · Letterboxd · MAL', href: '#atlas', internal: false },
    ],
  },
  {
    heading: 'Open Source',
    links: [
      { label: 'GitHub', href: 'https://github.com/xdaayush/freeposterapi', internal: false },
      { label: 'SpicyDevs', href: 'https://spicydevs.xyz', internal: false },
      {
        label: 'MIT License',
        href: 'https://github.com/xdaayush/freeposterapi/blob/main/LICENSE',
        internal: false,
      },
    ],
  },
] as const;

const linkBaseStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(110,104,96,0.6)',
  textDecoration: 'none',
  fontFamily: 'DM Sans, sans-serif',
  transition: 'color 0.18s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-dark)',
      borderTop: '1px solid rgba(196,124,46,0.08)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Ghost wordmark — decorative background */}
    <div
      aria-hidden="true"
      className="poster-font"
      style={{
        position: 'absolute',
        bottom: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 'clamp(100px, 18vw, 200px)',
        lineHeight: 0.8,
        letterSpacing: '0.06em',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(196,124,46,0.055)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      POSTERIUM
    </div>

    <div
      style={{
        maxWidth: 1160,
        margin: '0 auto',
        padding: '48px 20px 0',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Top row: logo + description + quick builder */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          marginBottom: 40,
          paddingBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          alignItems: 'start',
        }}
      >
        {/* Left: logo + tagline */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: 'linear-gradient(140deg,#C47C2E,#D4A245)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(196,124,46,0.26)',
                flexShrink: 0,
              }}
            >
              <Film size={16} color="#070706" strokeWidth={2.5} />
            </div>
            <span
              className="poster-font"
              style={{
                fontSize: 22,
                color: 'var(--film-cream)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              POSTERIUM
            </span>
          </div>

          <p
            className="body-font"
            style={{
              fontSize: 12,
              color: 'rgba(110,104,96,0.6)',
              lineHeight: 1.75,
              maxWidth: 360,
              marginBottom: 24,
            }}
          >
            A free, open-source API for generating movie and TV poster images with live rating
            badges. No account, no rate limits, no catch.
          </p>

          {/* Capsule stats */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['∞ Free', 'MIT License', 'No Account', 'CORS Enabled'].map((label) => (
              <span
                key={label}
                className="mono-font"
                style={{
                  fontSize: 7,
                  letterSpacing: '0.1em',
                  color: 'rgba(196,124,46,0.5)',
                  background: 'rgba(196,124,46,0.06)',
                  border: '1px solid rgba(196,124,46,0.14)',
                  borderRadius: 2,
                  padding: '3px 8px',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Quick builder */}
        <QuickBuilder />
      </div>

      {/* Link columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0 clamp(20px,5vw,60px)',
          marginBottom: 0,
        }}
      >
        {FOOTER_LINKS.map((group) => (
          <div key={group.heading}>
            <div
              className="syne-font"
              style={{
                fontSize: 7,
                fontWeight: 700,
                color: 'rgba(196,124,46,0.4)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(196,124,46,0.08)',
              }}
            >
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {group.links.map((link) =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={linkBaseStyle}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(110,104,96,0.6)';
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
                    style={linkBaseStyle}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(110,104,96,0.6)';
                    }}
                  >
                    {link.label}
                    {link.href.startsWith('http') && (
                      <ArrowUpRight size={9} style={{ opacity: 0.35 }} />
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
          marginTop: 40,
          paddingTop: 20,
          paddingBottom: 28,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {/* Left: copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            className="mono-font"
            style={{
              fontSize: 9,
              color: 'rgba(110,104,96,0.38)',
              letterSpacing: '0.08em',
            }}
          >
            © {new Date().getFullYear()} SpicyDevs
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'rgba(196,124,46,0.3)',
              flexShrink: 0,
            }}
          />
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'rgba(196,124,46,0.55)',
              textDecoration: 'none',
              fontSize: 9,
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              letterSpacing: '0.06em',
              transition: 'color 0.18s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(196,124,46,0.55)';
            }}
          >
            <Github size={11} />
            GitHub
          </a>
        </div>

        {/* Right: film strip decoration */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i % 3 === 0 ? 14 : 9,
                height: 6,
                background:
                  i % 2 === 0
                    ? 'rgba(196,124,46,0.14)'
                    : 'rgba(196,124,46,0.04)',
                borderRadius: 1,
                border: '1px solid rgba(196,124,46,0.07)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';