// src/components/dashboard/sections/FooterSection.tsx
// MOBILE OVERHAUL: Remove PROD, DIR, SCENE, TAKE, ROLL metadata; use single grey line finisher

import { memo } from 'react';
import { Film, Github, ExternalLink } from 'lucide-react';
import { SprocketStrip } from '../primitives';

const FOOTER_LINKS = [
  ['Poster Builder', '/build'],
  ['Project Repo', '#', false],
  ['Project Team', '#', false],
  ['MIT License', '#', false],
  ['API Docs', '#combined'],
] as const;

const LEGAL_LINKS = [
  ['Privacy Policy', '/privacy'],
  ['Terms of Service', '/terms'],
] as const;

const SprocketEdge = memo<{ border: 'borderTop' | 'borderBottom' }>(({ border }) => (
  <div
    style={{ background: 'rgba(255,255,255,0.012)', [border]: '1px solid rgba(255,255,255,0.04)' }}
  >
    <SprocketStrip count={64} />
  </div>
));
SprocketEdge.displayName = 'SprocketEdge';

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(196,124,46,0.12)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <SprocketEdge border="borderBottom" />

    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{ padding: 'clamp(56px,8vw,100px) clamp(20px,5vw,64px) 0', position: 'relative' }}
      >
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
              color: 'rgba(205,195,178,0.78)',
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

      {/* ── Main nav links ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'wrap',
        }}
      >
        {FOOTER_LINKS.map(([label, href, external], i) => {
          const isLast = i === FOOTER_LINKS.length - 1;
          return (
            <span key={label}>
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className={external ? 'hover-amber' : 'hover-cream'}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: 'rgba(212,198,172,0.74)',
                  fontFamily: 'Syne, sans-serif',
                  padding: '5px 0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.18s',
                }}
              >
                {label}
                {external && <ExternalLink size={8} style={{ opacity: 0.4 }} />}
              </a>
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

      <div
        aria-hidden="true"
        style={{
          margin: 'clamp(24px,3.5vw,40px) clamp(20px,5vw,64px)',
          height: 1,
          background: 'rgba(255,255,255,0.04)',
        }}
      />

      {/* ── Bottom bar: copyright + legal links + GitHub ────────────────────────── */}
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
        {/* Left: copyright + legal links */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'clamp(8px,2vw,24px)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              className="mono-font"
              style={{
                fontSize: 8,
                color: 'rgba(212,198,172,0.62)',
                letterSpacing: '0.08em',
              }}
            >
              © 2026 SpicyDevs
            </span>
          </div>

          {/* Legal links row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {LEGAL_LINKS.map(([label, href], i) => (
              <span key={label}>
                <a
                  href={href}
                  className="hover-amber"
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: 'rgba(212,198,172,0.64)',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'color 0.18s',
                  }}
                >
                  {label}
                </a>
                {i < LEGAL_LINKS.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      margin: '0 12px',
                      color: 'rgba(196,124,46,0.15)',
                      fontSize: 8,
                      fontFamily: 'monospace',
                    }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Right: GitHub */}
        <a
          href="#"
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
        >
          <Github size={12} />
          Open Source
        </a>
      </div>
    </div>

    {/* ── Simple grey line finisher (instead of second reel) ──────────────────────── */}
    <div
      style={{
        background: 'rgba(5,5,4,0.95)',
        padding: '12px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
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
        {'api.posterium.xyz/{type}/{id}.svg?r=imdb,rt&source=tmdb'}
      </code>
      <span
        className="mono-font"
        style={{
          fontSize: 7,
          color: 'rgba(212,198,172,0.5)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Free · CORS Enabled · No Auth · SVG/PNG/JPG/WebP
      </span>
    </div>

    {/* ── Final grey line separator ────────────────────────────────────────────────── */}
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: 'rgba(255,255,255,0.08)',
      }}
    />
  </footer>
));

FooterSection.displayName = 'FooterSection';
