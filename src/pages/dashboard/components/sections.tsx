// src/pages/dashboard/components/sections.tsx
// Remaining sections bundled in one file — each is a separate named export.
import React, { memo, useState } from 'react';
import { Link } from '../../../Router';
import {
  ArrowRight, Github, Star, Zap, Globe, MousePointer2,
  Layers, Film, Shield, RefreshCw, Image as ImageIcon,
  Copy, Check,
} from 'lucide-react';
import { STATS, FEATURES, USE_CASES, API_PARAMS, API } from '../constants';
import { useInView } from '../hooks';
import { AmberTag, AmberDivider } from './primitives';

const SAMPLE_URL =
  `${API}/movie/453395.png?r=imdb,rt,meta,tmdb&blur=8&alpha=0.45&rad=12` +
  `&v=2&g_scale=1.000&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90` +
  `&meta_x=310&meta_y=160&tmdb_x=310&tmdb_y=230`;

// Feature icons — kept here so FEATURES data in constants.ts stays serializable
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Drag-Drop Editor':    <MousePointer2 size={17} />,
  'Instant API URL':     <Zap size={17} />,
  'Multiple Sources':    <Globe size={17} />,
  'Live Ratings':        <RefreshCw size={17} />,
  'Movies, TV & Anime':  <Film size={17} />,
  'Any Export Format':   <ImageIcon size={17} />,
  'Textless Posters':    <Shield size={17} />,
  'Plex & Jellyfin Ready': <Layers size={17} />,
};

// ── StatsBar ──────────────────────────────────────────────────────
export const StatsBar = memo(() => {
  const { ref, vis } = useInView(0.15);
  return (
    <section
      ref={ref}
      aria-label="Statistics"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.09)',
        borderBottom: '1px solid rgba(196,124,46,0.09)',
        padding: '44px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center',
              padding: '14px 20px',
              borderRight:
                i < STATS.length - 1
                  ? '1px solid rgba(196,124,46,0.09)'
                  : 'none',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(18px)',
              transition: `opacity 0.65s ease ${i * 0.1}s, transform 0.65s ease ${i * 0.1}s`,
            }}
          >
            <div
              className="poster-font"
              style={{
                fontSize: 'clamp(38px, 6.5vw, 70px)',
                color: 'var(--film-cream)',
                lineHeight: 1,
                textShadow: '0 0 44px rgba(196,124,46,0.12)',
              }}
            >
              {s.value}
            </div>
            <div
              className="syne-font"
              style={{
                fontSize: 10,
                color: 'var(--film-silver)',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {s.label}
            </div>
            <div
              className="body-font"
              style={{
                fontSize: 10,
                color: 'rgba(110,104,96,0.55)',
                marginTop: 3,
                lineHeight: 1.4,
              }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';

// ── FeaturesSection ───────────────────────────────────────────────
export const FeaturesSection = memo(() => {
  const { ref, vis } = useInView(0.08);
  return (
    <section
      id="features"
      ref={ref}
      aria-label="Features"
      style={{ background: 'var(--film-dark)', padding: '90px 20px' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 60,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <AmberTag style={{ marginBottom: 14 }}>Built for Power Users</AmberTag>
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(38px, 6.5vw, 76px)',
              color: 'var(--film-cream)',
              lineHeight: 0.92,
              letterSpacing: '0.02em',
              marginTop: 12,
            }}
          >
            EVERYTHING
            <br />
            <span style={{ color: 'var(--film-amber)' }}>YOU NEED</span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(234px, 1fr))',
            gap: 14,
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feat-card"
              style={{
                padding: '22px 20px',
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateY(0)' : 'translateY(22px)',
                transition: `opacity 0.6s ease ${i * 0.055}s, transform 0.6s ease ${i * 0.055}s`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 7,
                  background: 'rgba(196,124,46,0.09)',
                  border: '1px solid rgba(196,124,46,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  color: 'var(--film-amber)',
                }}
              >
                {FEATURE_ICONS[f.title] ?? <Zap size={17} />}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                <h3
                  className="syne-font"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--film-cream)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {f.title}
                </h3>
                <span
                  className="film-tag"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  {f.tag}
                </span>
              </div>
              <p
                className="body-font"
                style={{
                  fontSize: 11,
                  color: 'var(--film-silver)',
                  lineHeight: 1.68,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
FeaturesSection.displayName = 'FeaturesSection';

// ── APISection ────────────────────────────────────────────────────
export const APISection = memo(() => {
  const [copied, setCopied]   = useState(false);
  const { ref, vis }          = useInView(0.08);

  const handleCopy = () => {
    navigator.clipboard.writeText(SAMPLE_URL).catch(() => {
      // Fallback for environments where clipboard API is unavailable
      const ta = document.createElement('textarea');
      ta.value = SAMPLE_URL;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  };

  return (
    <section
      id="api"
      ref={ref}
      aria-label="API Documentation"
      style={{
        background: 'var(--film-black)',
        padding: '90px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Watermark */}
      <div
        aria-hidden="true"
        className="poster-font"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-10deg)',
          fontSize: 'clamp(110px, 22vw, 300px)',
          color: 'rgba(196,124,46,0.018)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        API
      </div>

      <div
        style={{
          maxWidth: 880,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 48,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <AmberTag style={{ marginBottom: 14 }}>Simple API</AmberTag>
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(38px, 6.5vw, 76px)',
              color: 'var(--film-cream)',
              lineHeight: 0.92,
              marginBottom: 14,
              marginTop: 12,
            }}
          >
            ONE URL.
            <br />
            <span style={{ color: 'var(--film-amber)' }}>INFINITE POSTERS.</span>
          </h2>
          <p
            className="syne-font"
            style={{
              fontSize: 13,
              color: 'var(--film-silver)',
              maxWidth: 460,
              lineHeight: 1.62,
            }}
          >
            No auth. No rate limits. No account. Just a URL that returns a poster
            image with live ratings baked in — ready to embed anywhere.
          </p>
        </div>

        {/* Code block */}
        <div
          className="code-block"
          style={{
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(22px)',
            transition: 'opacity 0.7s ease 0.14s, transform 0.7s ease 0.14s',
          }}
        >
          {/* Terminal bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 18px',
              borderBottom: '1px solid rgba(196,124,46,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#BF3028', '#C47C2E', '#36A240'].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: c,
                      opacity: 0.72,
                    }}
                  />
                ))}
              </div>
              <span
                className="mono-font"
                style={{
                  fontSize: 9,
                  color: 'var(--film-silver)',
                  marginLeft: 4,
                }}
              >
                GET /movie/453395.png
              </span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--film-silver)',
                fontSize: 9,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 3,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(196,124,46,0.07)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
            >
              {copied ? (
                <Check size={9} color="#36A240" />
              ) : (
                <Copy size={9} />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Code body */}
          <div style={{ padding: '22px 26px', overflowX: 'auto' }}>
            <pre
              className="mono-font"
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                lineHeight: 2.1,
                margin: 0,
                whiteSpace: 'pre',
                color: '#6E6860',
              }}
            >
              <span style={{ color: '#7a8ef0' }}>https://api.spicydevs.xyz</span>
              <span style={{ color: 'var(--film-amber)' }}>/movie/453395.png</span>{'\n'}
              <span style={{ color: '#3A3630' }}>  ?</span>
              <span style={{ color: '#D4A245' }}>r</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#3A9E4A' }}>imdb,rt,meta,tmdb</span>{'\n'}
              <span style={{ color: '#3A3630' }}>  &amp;</span>
              <span style={{ color: '#D4A245' }}>source</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#3A9E4A' }}>tmdb</span>{'\n'}
              <span style={{ color: '#3A3630' }}>  &amp;</span>
              <span style={{ color: '#D4A245' }}>blur</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#60a5fa' }}>8</span>
              {'  '}
              <span style={{ color: '#3A3630' }}>&amp;</span>
              <span style={{ color: '#D4A245' }}>alpha</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#60a5fa' }}>0.45</span>
              {'  '}
              <span style={{ color: '#3A3630' }}>&amp;</span>
              <span style={{ color: '#D4A245' }}>rad</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#60a5fa' }}>12</span>{'\n'}
              <span style={{ color: '#3A3630' }}>  &amp;</span>
              <span style={{ color: '#D4A245' }}>imdb_x</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#60a5fa' }}>310</span>
              {'  '}
              <span style={{ color: '#3A3630' }}>&amp;</span>
              <span style={{ color: '#D4A245' }}>imdb_y</span>
              <span style={{ color: '#3A3630' }}>=</span>
              <span style={{ color: '#60a5fa' }}>20</span>
            </pre>
          </div>

          {/* Response status */}
          <div
            style={{
              padding: '8px 18px',
              borderTop: '1px solid rgba(196,124,46,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              className="syne-font"
              style={{
                background: 'rgba(54,162,64,0.14)',
                border: '1px solid rgba(54,162,64,0.28)',
                color: '#36A240',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.14em',
                padding: '3px 7px',
                borderRadius: 2,
              }}
            >
              200 OK
            </span>
            <span
              className="mono-font"
              style={{ fontSize: 9, color: 'var(--film-silver)' }}
            >
              Content-Type: image/png
            </span>
          </div>
        </div>

        {/* Parameter grid */}
        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))',
            gap: 9,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(22px)',
            transition: 'opacity 0.7s ease 0.28s, transform 0.7s ease 0.28s',
          }}
        >
          {API_PARAMS.map(p => (
            <div
              key={p.p}
              style={{
                background: 'var(--film-mid)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 5,
                padding: '11px 13px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <code
                className="mono-font"
                style={{ fontSize: 9, color: 'var(--film-amber)' }}
              >
                {p.p}
              </code>
              <span
                className="body-font"
                style={{ fontSize: 10, color: 'var(--film-silver)', lineHeight: 1.5 }}
              >
                {p.d}
              </span>
              <code
                className="mono-font"
                style={{ fontSize: 8, color: 'rgba(110,104,96,0.45)' }}
              >
                {p.e}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
APISection.displayName = 'APISection';

// ── UseCasesSection ───────────────────────────────────────────────
export const UseCasesSection = memo(() => {
  const { ref, vis } = useInView(0.08);
  return (
    <section
      id="use-cases"
      ref={ref}
      aria-label="Use Cases"
      style={{ background: 'var(--film-dark)', padding: '90px 20px' }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 56,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          <AmberTag style={{ marginBottom: 14 }}>Where People Use It</AmberTag>
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(38px, 6.5vw, 76px)',
              color: 'var(--film-cream)',
              lineHeight: 0.92,
              marginTop: 12,
            }}
          >
            ENDLESS
            <br />
            <span style={{ color: 'var(--film-amber)' }}>USE CASES</span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))',
            gap: 14,
          }}
        >
          {USE_CASES.map((uc, i) => (
            <div
              key={uc.title}
              className="uc-card"
              style={{
                // Intentional slight rotation per card — feels designed not generated
                transform: `rotate(${uc.rotateHint * 0.15}deg)`,
                opacity: vis ? 1 : 0,
                transition: `opacity 0.6s ease ${i * 0.065}s, transform 0.6s ease ${i * 0.065}s, border-color 0.3s, box-shadow 0.3s`,
              }}
            >
              <span className="uc-icon" style={{ fontSize: 30, display: 'inline-block', marginBottom: 14 }}>
                {uc.icon}
              </span>
              <h3
                className="syne-font"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--film-cream)',
                  marginBottom: 8,
                }}
              >
                {uc.title}
              </h3>
              <p
                className="body-font"
                style={{
                  fontSize: 11,
                  color: 'var(--film-silver)',
                  lineHeight: 1.68,
                  marginBottom: 14,
                }}
              >
                {uc.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {uc.tags.map(t => (
                  <span
                    key={t}
                    className="syne-font"
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(110,104,96,0.65)',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '2px 6px',
                      borderRadius: 2,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
UseCasesSection.displayName = 'UseCasesSection';

// ── CTASection ────────────────────────────────────────────────────
export const CTASection = memo(() => {
  const { ref, vis } = useInView(0.18);
  return (
    <section
      ref={ref}
      aria-label="Call to Action"
      style={{
        background: 'var(--film-black)',
        padding: '90px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Faint horizontal rules */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: `${22 + i * 28}%`,
            left: 0,
            right: 0,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(196,124,46,0.08), transparent)',
          }}
        />
      ))}

      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.85s ease, transform 0.85s ease',
        }}
      >
        {/* Film leader countdown */}
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            marginBottom: 38,
          }}
        >
          {[5, 4, 3, 2, 1].map((n, i) => (
            <div
              key={n}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                border: '1.5px solid rgba(196,124,46,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.14 + i * 0.18,
              }}
            >
              <span
                className="poster-font"
                style={{ fontSize: 17, color: 'var(--film-amber)' }}
              >
                {n}
              </span>
            </div>
          ))}
        </div>

        <h2
          className="poster-font"
          style={{
            fontSize: 'clamp(50px, 11.5vw, 116px)',
            color: 'var(--film-cream)',
            lineHeight: 0.88,
            marginBottom: 22,
            letterSpacing: '0.02em',
          }}
        >
          READY
          <br />
          TO BUILD?
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <AmberDivider width={108} opacity={0.48} />
        </div>

        <p
          className="syne-font"
          style={{
            fontSize: 14,
            color: 'var(--film-silver)',
            lineHeight: 1.72,
            maxWidth: 400,
            margin: '0 auto 40px',
          }}
        >
          Design your perfect poster in the visual editor. No account required
          — drag, drop, and copy your API URL.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'var(--film-amber)',
              color: '#070706',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '13px 30px',
              borderRadius: 5,
            }}
          >
            Open Free Builder
            <ArrowRight size={13} />
          </Link>
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            className="syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              color: 'var(--film-cream)',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '13px 26px',
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.025)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(196,124,46,0.38)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.1)';
            }}
          >
            <Github size={13} /> Star on GitHub{' '}
            <Star size={10} color="var(--film-amber)" fill="var(--film-amber)" />
          </a>
        </div>
      </div>
    </section>
  );
});
CTASection.displayName = 'CTASection';

// ── FooterSection ─────────────────────────────────────────────────
const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Movie Poster Builder', href: '/build',    internal: true  },
      { label: 'API Docs',             href: '#api',      internal: false },
      { label: 'Badge Showcase',       href: '#features', internal: false },
    ],
  },
  {
    heading: 'Use Cases',
    links: [
      { label: 'Plex & Jellyfin', href: '#use-cases', internal: false },
      { label: 'Discord Bots',    href: '#use-cases', internal: false },
      { label: 'Notion',          href: '#use-cases', internal: false },
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

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-dark)',
      borderTop: '1px solid rgba(196,124,46,0.09)',
      padding: '44px 20px 28px',
    }}
  >
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 30,
          marginBottom: 36,
        }}
      >
        {FOOTER_LINKS.map(group => (
          <div key={group.heading}>
            <div
              className="syne-font"
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: 'rgba(196,124,46,0.5)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              {group.heading}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
              }}
            >
              {group.links.map(link =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={{
                      fontSize: 11,
                      color: 'var(--film-silver)',
                      textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--film-cream)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--film-silver)';
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
                    style={{
                      fontSize: 11,
                      color: 'var(--film-silver)',
                      textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--film-cream)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color =
                        'var(--film-silver)';
                    }}
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: 'linear-gradient(135deg, var(--film-amber), #D4A245)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Film size={10} color="#070706" strokeWidth={2.5} />
          </div>
          <span
            className="syne-font"
            style={{ fontSize: 10, color: 'var(--film-silver)' }}
          >
            <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>
              Posterium
            </strong>{' '}
            — by{' '}
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
        <span
          className="syne-font"
          style={{
            fontSize: 9,
            color: 'rgba(110,104,96,0.45)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Open source · No account · Free forever
        </span>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';