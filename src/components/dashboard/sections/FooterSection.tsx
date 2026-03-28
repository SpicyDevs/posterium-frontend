// src/components/dashboard/sections/FooterSection.tsx
// Change: internal Link → <a href>. No Router import. All other code identical.
import { memo } from 'react';
import { Film, Github, ExternalLink } from 'lucide-react';
import { SprocketStrip } from '../primitives';

const FOOTER_LINKS: Array<{
  label: string;
  href: string;
  internal?: boolean;
  external?: boolean;
}> = [
  { label: 'Poster Builder', href: '/build', internal: true },
  { label: 'GitHub', href: 'https://github.com/xdaayush/freeposterapi', external: true },
  { label: 'SpicyDevs', href: 'https://spicydevs.xyz', external: true },
  {
    label: 'MIT License',
    href: 'https://github.com/xdaayush/freeposterapi/blob/main/LICENSE',
    external: true,
  },
  { label: 'API Docs', href: '#combined' },
];

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(196,124,46,0.12)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Top sprocket strip */}
    <div
      style={{
        background: 'rgba(255,255,255,0.012)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <SprocketStrip count={64} />
    </div>

    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Wordmark section */}
      <div
        style={{ padding: 'clamp(56px,8vw,100px) clamp(20px,5vw,64px) 0', position: 'relative' }}
      >
        {/* Ghost backdrop */}
        <div
          aria-hidden="true"
          className="poster-font"
          style={{
            position: 'absolute',
            top: '50%',
            left: '-2%',
            transform: 'translateY(-50%)',
            fontSize: 'clamp(180px,25vw,360px)',
            lineHeight: 0.8,
            letterSpacing: '0.04em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(196,124,46,0.045)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          POSTERIUM
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(140deg, #C47C2E, #D4A245)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 32px rgba(196,124,46,0.28), 0 4px 16px rgba(0,0,0,0.5)',
                flexShrink: 0,
              }}
            >
              <Film size={20} color="#070706" strokeWidth={2.5} />
            </div>
            <div>
              <div
                className="poster-font"
                style={{
                  fontSize: 'clamp(32px,5vw,52px)',
                  color: 'var(--film-cream)',
                  letterSpacing: '0.08em',
                  lineHeight: 0.9,
                }}
              >
                POSTERIUM
              </div>
              <div
                className="mono-font"
                style={{
                  fontSize: 8,
                  color: 'rgba(196,124,46,0.5)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                Free Poster API · MIT License
              </div>
            </div>
          </div>

          <p
            className="syne-font"
            style={{
              fontSize: 'clamp(12px,1.6vw,16px)',
              color: 'rgba(110,104,96,0.7)',
              lineHeight: 1.7,
              maxWidth: 520,
              marginBottom: 0,
            }}
          >
            Generate custom movie and TV poster images with glassmorphism rating badges. One URL. No
            account. No rate limits.
          </p>
        </div>
      </div>

      {/* Amber rule */}
      <div
        aria-hidden="true"
        style={{
          margin: 'clamp(28px,4vw,44px) clamp(20px,5vw,64px)',
          height: 1,
          background:
            'linear-gradient(90deg, var(--film-amber), rgba(196,124,46,0.12) 70%, transparent 100%)',
          opacity: 0.45,
        }}
      />

      {/* Nav links — all <a> now, no Router */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'wrap',
        }}
      >
        {FOOTER_LINKS.map((link, i) => {
          const isLast = i === FOOTER_LINKS.length - 1;
          const baseStyle: React.CSSProperties = {
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: 'rgba(110,104,96,0.55)',
            fontFamily: 'Syne, sans-serif',
            padding: '5px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color 0.18s',
          };

          const el = (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
              style={baseStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = link.internal
                  ? 'var(--film-cream)'
                  : 'var(--film-amber)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(110,104,96,0.55)';
              }}
            >
              {link.label}
              {link.external && <ExternalLink size={8} style={{ opacity: 0.4 }} />}
            </a>
          );

          return (
            <span key={link.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {el}
              {!isLast && (
                <span
                  aria-hidden="true"
                  style={{
                    margin: '0 16px',
                    color: 'rgba(196,124,46,0.2)',
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                >
                  ·
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Divider */}
      <div
        aria-hidden="true"
        style={{
          margin: 'clamp(24px,3.5vw,40px) clamp(20px,5vw,64px)',
          height: 1,
          background: 'rgba(255,255,255,0.04)',
        }}
      />

      {/* Production credits */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px) clamp(40px,5vw,60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px,3vw,36px)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {[
            ['PROD', 'SpicyDevs'],
            ['DIR', 'Aayu5h'],
            ['REL', '2.0'],
            ['LIC', 'MIT'],
            [`© 2026`, ''],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span
                className="mono-font"
                style={{
                  fontSize: 7,
                  color: 'rgba(196,124,46,0.38)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                {k}
              </span>
              {v && (
                <span
                  className="syne-font"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(110,104,96,0.45)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {v}
                </span>
              )}
            </div>
          ))}
        </div>

        <a
          href="https://github.com/xdaayush/freeposterapi"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(196,124,46,0.45)',
            textDecoration: 'none',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'color 0.18s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(196,124,46,0.45)';
          }}
        >
          <Github size={12} />
          Open Source
        </a>
      </div>
    </div>

    {/* Bottom sprocket */}
    <div
      style={{
        background: 'rgba(255,255,255,0.012)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <SprocketStrip count={64} />
    </div>

    {/* API URL strip */}
    <div
      style={{
        background: 'rgba(5,5,4,0.95)',
        padding: '8px clamp(20px,5vw,64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <code
        className="mono-font"
        style={{ fontSize: 8, color: 'rgba(196,124,46,0.28)', letterSpacing: '0.08em' }}
      >
        api.spicydevs.xyz/&#123;type&#125;/&#123;id&#125;.svg?r=imdb,rt&amp;source=tmdb
      </code>
      <span
        className="mono-font"
        style={{
          fontSize: 7,
          color: 'rgba(122,117,110,0.2)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Free · CORS Enabled · No Auth · SVG/PNG/JPG/WebP
      </span>
    </div>
  </footer>
));

FooterSection.displayName = 'FooterSection';
