// src/pages/dashboard/components/sections.tsx
// All sections except Hero, Reel, BadgeAtlas, LiveAPIDemo.
// Every section uses a fundamentally different layout system.
import React, { memo, useState } from 'react';
import { Link } from '../../Router';
import {
  ArrowRight, Github, Star, Zap, Globe, MousePointer2,
  Layers, Film, Shield, RefreshCw, Image as ImageIcon, ChevronDown, ChevronRight,
} from 'lucide-react';
import { STATS, FEATURES, USE_CASES } from '../constants';
import { useInView, useCounter } from '../hooks';
import { AmberTag, AmberDivider } from './primitives';

// ── THE MANIFEST ─────────────────────────────────────────────────
// Film production manifest / docket aesthetic.
// Stats displayed as memo line items, not a card grid.
// Large stencil numbers, typewriter-style labels.
const ManifestLine = memo<{
  stat: typeof STATS[0];
  index: number;
  vis: boolean;
}>(({ stat, index, vis }) => {
  const numericTarget = parseInt(stat.value.replace(/\D/g, ''), 10) || 0;
  const isSpecial = stat.value === '∞' || stat.value === '0';
  const count = useCounter(numericTarget, 1400, vis);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        alignItems: 'start',
        gap: '0 20px',
        padding: '22px 0',
        borderBottom: '1px solid rgba(196,124,46,0.07)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateX(0)' : 'translateX(-18px)',
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
      }}
    >
      {/* Line number */}
      <span
        className="mono-font"
        style={{ fontSize: 9, color: 'rgba(122,117,110,0.35)', letterSpacing: '0.1em', paddingTop: 4 }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Label + sub */}
      <div>
        <div
          className="syne-font"
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)', letterSpacing: '0.02em', marginBottom: 4 }}
        >
          {stat.label}
        </div>
        <div
          className="body-font"
          style={{ fontSize: 10, color: 'rgba(110,104,96,0.6)', lineHeight: 1.45 }}
        >
          {stat.sub}
        </div>
      </div>

      {/* Value — large stencil */}
      <div
        className="poster-font"
        style={{
          fontSize: 'clamp(44px,5.5vw,68px)',
          color: 'var(--film-cream)',
          lineHeight: 0.9,
          textShadow: '0 0 40px rgba(196,124,46,0.1)',
          letterSpacing: '0.02em',
          textAlign: 'right',
        }}
      >
        {isSpecial
          ? stat.value
          : `${count}${stat.value.replace(/[0-9]/g, '')}`}
      </div>
    </div>
  );
});
ManifestLine.displayName = 'ManifestLine';

export const StatsBar = memo(() => {
  const { ref, vis } = useInView(0.12);
  return (
    <section
      ref={ref}
      aria-label="Statistics"
      style={{
        background: 'var(--film-black)',
        padding: '64px clamp(20px,5vw,80px)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
      }}
    >
      {/* Docket header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            className="mono-font"
            style={{ fontSize: 9, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            SPICYDEVS PRODUCTION — FIELD MANIFEST
          </div>
        </div>
        <div
          className="mono-font"
          style={{ fontSize: 8, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.12em' }}
        >
          REV. 2 / OPEN SOURCE
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: 'linear-gradient(90deg,rgba(196,124,46,0.35),rgba(196,124,46,0.05))',
          marginBottom: 4,
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.5s ease 0.1s',
        }}
      />

      {/* Line items */}
      <div
        style={{
          maxWidth: 840,
          margin: '0 auto',
        }}
      >
        {STATS.map((s, i) => (
          <ManifestLine key={s.label} stat={s} index={i} vis={vis} />
        ))}
      </div>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';

// ── THE EXPOSURE SHEET ────────────────────────────────────────────
// Animation exposure sheet / dope sheet layout.
// Clickable rows expand to show detail. Looks like a film production spreadsheet.

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Drag-Drop Editor':       <MousePointer2 size={14} />,
  'Instant API URL':        <Zap size={14} />,
  'Multiple Sources':       <Globe size={14} />,
  'Live Ratings':           <RefreshCw size={14} />,
  'Movies, TV & Anime':     <Film size={14} />,
  'Any Export Format':      <ImageIcon size={14} />,
  'Textless Posters':       <Shield size={14} />,
  'Plex & Jellyfin Ready':  <Layers size={14} />,
};

export const FeaturesSection = memo(() => {
  const { ref, vis } = useInView(0.05);
  const [activeRow, setActiveRow] = useState<number | null>(0); // first row open by default

  return (
    <section
      id="features"
      ref={ref}
      aria-label="Features"
      style={{
        background: 'var(--film-dark)',
        padding: '72px 0 0',
        borderTop: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {/* Sheet header */}
      <div
        style={{
          padding: '0 clamp(20px,5vw,64px)',
          marginBottom: 28,
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <AmberTag style={{ marginBottom: 12 }}>Feature Sheet</AmberTag>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(40px,6vw,80px)',
              color: 'var(--film-cream)',
              lineHeight: 0.9, letterSpacing: '0.02em', marginTop: 10,
            }}
          >
            EXPOSURE
            <br />
            <span style={{ color: 'var(--film-amber)' }}>SHEET</span>
          </h2>
          <span
            className="mono-font"
            style={{ fontSize: 8, color: 'rgba(122,117,110,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase', paddingBottom: 8 }}
          >
            Posterium v2.0 · {FEATURES.length} Scenes · Production Ready
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 100px 90px',
          padding: '8px clamp(20px,5vw,64px)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.015)',
          gap: '0 16px',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.5s ease 0.15s',
        }}
      >
        {['SC.', 'ACTION / FEATURE', 'MODULE', 'STATUS'].map((col, i) => (
          <span
            key={col}
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'rgba(122,117,110,0.45)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textAlign: i === 3 ? 'right' : 'left',
            }}
          >
            {col}
          </span>
        ))}
      </div>

      {/* Feature rows */}
      {FEATURES.map((f, i) => {
        const isOpen = activeRow === i;
        return (
          <div
            key={f.title}
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.035)',
              opacity: vis ? 1 : 0,
              transition: `opacity 0.5s ease ${0.2 + i * 0.045}s`,
            }}
          >
            {/* Row header — always visible */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setActiveRow(isOpen ? null : i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveRow(isOpen ? null : i); }}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 100px 90px',
                padding: '14px clamp(20px,5vw,64px)',
                gap: '0 16px',
                alignItems: 'center',
                cursor: 'pointer',
                background: isOpen ? 'rgba(196,124,46,0.04)' : 'transparent',
                transition: 'background 0.2s ease',
              }}
              // Hover effect via onMouseEnter/Leave instead of CSS class (inline-style-only approach)
              onMouseEnter={e => {
                if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.018)';
              }}
              onMouseLeave={e => {
                if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {/* Scene number + expand icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className="mono-font"
                  style={{ fontSize: 9, color: 'rgba(196,124,46,0.38)', letterSpacing: '0.08em', flexShrink: 0 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Feature name + icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.4)',
                    transition: 'color 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span
                  className="syne-font"
                  style={{
                    fontSize: 13, fontWeight: 700,
                    color: isOpen ? 'var(--film-cream)' : 'rgba(240,230,204,0.75)',
                    letterSpacing: '0.01em',
                    transition: 'color 0.2s',
                  }}
                >
                  {f.title}
                </span>
                <span
                  style={{
                    color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.3)',
                    transition: 'color 0.2s',
                  }}
                >
                  {FEATURE_ICONS[f.title] ?? <Zap size={14} />}
                </span>
              </div>

              {/* Module tag */}
              <span
                className="mono-font"
                style={{
                  fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.35)',
                  transition: 'color 0.2s',
                }}
              >
                {f.tag}
              </span>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <span
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#36A240',
                    boxShadow: '0 0 5px rgba(54,162,64,0.5)',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="mono-font"
                  style={{ fontSize: 8, color: '#36A240', letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  LIVE
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div
                style={{
                  padding: '0 clamp(20px,5vw,64px) 20px',
                  paddingLeft: `calc(clamp(20px,5vw,64px) + 48px + 16px + 13px + 10px)`, // aligns with title text
                  animation: 'fade-up 0.3s ease both',
                  borderTop: '1px solid rgba(196,124,46,0.06)',
                  marginTop: -1,
                }}
              >
                <p
                  className="body-font"
                  style={{
                    fontSize: 12, color: 'var(--film-silver)',
                    lineHeight: 1.75, maxWidth: 680, marginTop: 14,
                  }}
                >
                  {f.desc}
                </p>
                {/* Inline API hint */}
                <div
                  style={{
                    marginTop: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(196,124,46,0.05)',
                    border: '1px solid rgba(196,124,46,0.12)',
                    borderRadius: 3, padding: '4px 10px',
                  }}
                >
                  <span
                    className="mono-font"
                    style={{ fontSize: 9, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.1em' }}
                  >
                    SIZE
                  </span>
                  <span
                    className="mono-font"
                    style={{ fontSize: 9, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.06em' }}
                  >
                    {f.size.toUpperCase()} — included in free tier
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Sheet footer */}
      <div
        style={{
          padding: '14px clamp(20px,5vw,64px)',
          background: 'rgba(255,255,255,0.012)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}
      >
        <span
          className="mono-font"
          style={{ fontSize: 8, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
        >
          END OF SHEET — {FEATURES.length} ENTRIES
        </span>
        <span
          className="mono-font"
          style={{ fontSize: 8, color: 'rgba(122,117,110,0.25)', letterSpacing: '0.1em' }}
        >
          © SPICYDEVS · OPEN SOURCE · MIT LICENSE
        </span>
      </div>
    </section>
  );
});
FeaturesSection.displayName = 'FeaturesSection';

// ── DISTRIBUTION CIRCUIT ──────────────────────────────────────────
// Full-width alternating horizontal rows — not a card grid.
// Each use case gets an entire row with a large index number, description, and inline code.

export const UseCasesSection = memo(() => {
  const { ref, vis } = useInView(0.05);

  return (
    <section
      id="use-cases"
      ref={ref}
      aria-label="Distribution Circuit"
      style={{ background: 'var(--film-black)', borderTop: '1px solid rgba(196,124,46,0.06)' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '72px clamp(20px,5vw,64px) 48px',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <AmberTag style={{ marginBottom: 12 }}>Distribution</AmberTag>
        <h2
          className="poster-font"
          style={{
            fontSize: 'clamp(40px,6vw,80px)',
            color: 'var(--film-cream)',
            lineHeight: 0.9, letterSpacing: '0.02em', marginTop: 10,
          }}
        >
          WHERE IT<br />
          <span style={{ color: 'var(--film-amber)' }}>RUNS</span>
        </h2>
      </div>

      {/* Full-width rows */}
      {USE_CASES.map((uc, i) => (
        <div
          key={uc.title}
          style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(100px,14vw,180px) 1fr auto',
            alignItems: 'center',
            gap: '0 clamp(20px,3vw,48px)',
            padding: '28px clamp(20px,5vw,64px)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
            position: 'relative',
            overflow: 'hidden',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(12px)',
            transition: `opacity 0.55s ease ${i * 0.08}s, transform 0.55s ease ${i * 0.08}s`,
          }}
        >
          {/* Ghost index number */}
          <div
            aria-hidden="true"
            className="poster-font"
            style={{
              position: 'absolute',
              left: 'clamp(0px,-2vw,-20px)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 'clamp(80px,12vw,160px)',
              color: 'rgba(196,124,46,0.035)',
              lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </div>

          {/* Icon + index */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1, marginBottom: 6 }}>
              {uc.icon}
            </div>
            <span
              className="mono-font"
              style={{ fontSize: 9, color: 'rgba(196,124,46,0.38)', letterSpacing: '0.1em' }}
            >
              {String(i + 1).padStart(2, '0')}/{String(USE_CASES.length).padStart(2, '0')}
            </span>
          </div>

          {/* Description + code snippet */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3
              className="syne-font"
              style={{
                fontSize: 'clamp(14px,1.8vw,18px)',
                fontWeight: 700, color: 'var(--film-cream)',
                letterSpacing: '0.01em', marginBottom: 6,
              }}
            >
              {uc.title}
            </h3>
            <p
              className="body-font"
              style={{ fontSize: 12, color: 'var(--film-silver)', lineHeight: 1.65, marginBottom: 10 }}
            >
              {uc.desc}
            </p>
            {uc.codeSnippet && (
              <code
                className="mono-font"
                style={{
                  display: 'inline-block',
                  fontSize: 9,
                  color: 'rgba(196,124,46,0.6)',
                  background: 'rgba(196,124,46,0.05)',
                  border: '1px solid rgba(196,124,46,0.1)',
                  borderRadius: 3,
                  padding: '3px 8px',
                  letterSpacing: '0.04em',
                }}
              >
                {uc.codeSnippet}
              </code>
            )}
          </div>

          {/* Tags — right-aligned */}
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              alignItems: 'flex-end', position: 'relative', zIndex: 1,
              flexShrink: 0,
            }}
          >
            {uc.tags.map(t => (
              <span
                key={t}
                className="syne-font"
                style={{
                  fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(110,104,96,0.5)',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '2px 6px', borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Footer row */}
      <div
        style={{
          padding: '14px clamp(20px,5vw,64px)',
          borderTop: '1px solid rgba(196,124,46,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
        }}
      >
        <span
          className="mono-font"
          style={{ fontSize: 8, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
        >
          {USE_CASES.length} DISTRIBUTION NODES · NO AUTH REQUIRED
        </span>
        <AmberDivider width={80} opacity={0.2} />
      </div>
    </section>
  );
});
UseCasesSection.displayName = 'UseCasesSection';

// ── THE SLATE ─────────────────────────────────────────────────────
// Film production slate / clapperboard aesthetic.
// Diagonal stripe header, large typography, minimal CTA.

export const CTASection = memo(() => {
  const { ref, vis } = useInView(0.15);

  return (
    <section
      ref={ref}
      aria-label="Call to Action"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Clapperboard stripe header */}
      <div
        aria-hidden="true"
        style={{
          height: 52,
          display: 'flex',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: '1 0 0',
              background: i % 2 === 0 ? 'var(--film-cream)' : 'var(--film-black)',
              transform: 'skewX(-14deg)',
              marginLeft: i === 0 ? -20 : 0,
            }}
          />
        ))}
      </div>

      {/* Slate metadata row */}
      <div
        style={{
          padding: '12px clamp(20px,5vw,64px)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        {[
          ['PROD',  'POSTERIUM'],
          ['DIR',   'SPICYDEVS'],
          ['SCENE', 'CTA'],
          ['TAKE',  '1'],
          ['ROLL',  '01'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              className="mono-font"
              style={{ fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              {k}
            </span>
            <span
              className="syne-font"
              style={{ fontSize: 10, fontWeight: 700, color: 'var(--film-silver)', letterSpacing: '0.06em' }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Main CTA content */}
      <div
        style={{
          padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,64px)',
          maxWidth: 900,
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.85s ease 0.15s, transform 0.85s ease 0.15s',
        }}
      >
        <h2
          className="poster-font"
          style={{
            fontSize: 'clamp(60px,13vw,160px)',
            color: 'var(--film-cream)',
            lineHeight: 0.86,
            letterSpacing: '0.01em',
            marginBottom: 36,
          }}
        >
          READY<br />
          <span
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px var(--film-amber)',
            }}
          >
            TO BUILD?
          </span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
          <div style={{ height: 1, width: 'clamp(40px,8vw,100px)', background: 'rgba(196,124,46,0.35)' }} />
          <span
            className="syne-font"
            style={{
              fontSize: 12, color: 'var(--film-silver)',
              padding: '0 18px', lineHeight: 1.65, maxWidth: 480,
            }}
          >
            No account. No rate limits. Drag, position, copy your URL.
            Posterium is free infrastructure for your media setup.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--film-amber)', color: '#070706',
              fontWeight: 700, fontSize: 12, letterSpacing: '0.1em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '13px 30px', borderRadius: 5,
            }}
          >
            Open Free Builder <ArrowRight size={13} />
          </Link>
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            className="syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              color: 'var(--film-cream)', fontWeight: 600, fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '13px 26px', borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.025)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.38)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
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
                fontSize: 8, fontWeight: 700,
                color: 'rgba(196,124,46,0.5)',
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14,
              }}
            >
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {group.links.map(link =>
                link.internal ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    style={{ fontSize: 11, color: 'var(--film-silver)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }}
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
                    style={{ fontSize: 11, color: 'var(--film-silver)', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.2s' }}
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

      <div
        style={{
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 22, height: 22, borderRadius: 4,
              background: 'linear-gradient(135deg,var(--film-amber),#D4A245)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Film size={10} color="#070706" strokeWidth={2.5} />
          </div>
          <span className="syne-font" style={{ fontSize: 10, color: 'var(--film-silver)' }}>
            <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Posterium</strong>{' '}
            — by{' '}
            <a href="https://spicydevs.xyz" target="_blank" rel="noreferrer"
              style={{ color: 'var(--film-amber)', textDecoration: 'none' }}>
              SpicyDevs
            </a>
          </span>
        </div>
        <span
          className="syne-font"
          style={{ fontSize: 9, color: 'rgba(110,104,96,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
          Open source · No account · Free forever
        </span>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';