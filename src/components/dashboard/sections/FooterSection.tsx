// src/components/dashboard/sections/FooterSection.tsx
// Cleaner footer: no sprocket strips, single white line bottom, removed slop text

import { memo } from 'react';
import { Film, Github, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = [
  ['Poster Builder', '/build'],
  ['Project Repo', '#', false],
  ['API Docs', '#combined'],
] as const;

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(196,124,46,0.12)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,5vw,64px) 0', position: 'relative' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
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
                  fontSize: 'clamp(32px,5vw,48px)',
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
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                Free Poster API
              </div>
            </div>
          </div>

          <p
            className="body-font"
            style={{
              fontSize: 'clamp(12px,1.5vw,15px)',
              color: 'rgba(205,195,178,0.75)',
              lineHeight: 1.6,
              maxWidth: 520,
              marginBottom: 0,
            }}
          >
            Generate movie and TV posters with live rating badges. No account. No rate limits.
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          margin: 'clamp(28px,4vw,40px) clamp(20px,5vw,64px)',
          height: 1,
          background: 'linear-gradient(90deg, var(--film-amber), rgba(196,124,46,0.08) 50%, transparent 100%)',
          opacity: 0.5,
        }}
      />

      {/* ── Main nav links ────────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          flexWrap: 'wrap',
          marginBottom: 'clamp(20px,3vw,32px)',
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
                  padding: '4px 0',
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
                    margin: '0 12px',
                    color: 'rgba(196,124,46,0.2)',
                    fontSize: 10,
                  }}
                >
                  ·
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* ── Bottom metadata bar ─────────────────────────────────────────── */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px) clamp(28px,4vw,48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ display: 'flex', gap: 'clamp(12px,2.5vw,24px)', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            ['© 2026', ''],
            ['MIT License', ''],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                className="mono-font"
                style={{
                  fontSize: 7,
                  color: 'rgba(196,124,46,0.35)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                {k}
              </span>
            </div>
          ))}
        </div>

        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: 'rgba(196,124,46,0.45)',
            textDecoration: 'none',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 8,
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

    {/* ── Clapboard end line (white) ────────────────────────────────────── */}
    <div
      aria-hidden="true"
      style={{
        height: 2,
        background: 'rgba(255,255,255,0.12)',
        marginTop: 'clamp(24px,3vw,36px)',
      }}
    />

    {/* ── API URL footer ──────────────────────────────────────────────────── */}
    <div
      style={{
        background: 'rgba(5,5,4,0.95)',
        padding: '8px clamp(20px,5vw,64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <code
        className="mono-font"
        style={{ fontSize: 8, color: 'rgba(196,124,46,0.28)', letterSpacing: '0.08em' }}
      >
        api.posterium.xyz/movie/{'{id}'}.svg
      </code>
    </div>
  </footer>
));

FooterSection.displayName = 'FooterSection';
