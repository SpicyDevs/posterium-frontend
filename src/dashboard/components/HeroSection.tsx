// src/pages/dashboard/components/HeroSection.tsx
// FIX: film-flicker removed from the section element — it caused a jarring
// full-section opacity pulse. The flicker now lives on a thin overlay div only,
// at much lower opacity so it reads as ambiance, not bug.
import { memo } from 'react';
import { Link } from '../../Router';
import { ArrowRight } from 'lucide-react';
import { API, REEL_ITEMS } from '../constants';
import { FilmEdge, AmberDivider } from './primitives';
import { QuickBuilder } from './QuickBuilder';

// 7-poster fan — wider spread, more visual mass
const HERO_POSTER_LAYOUT = [
  { h: 98,  w: 65,  rot: -5.5, z: 1, delay: 0.9,  anim: 'float-a', opacity: 0.55 },
  { h: 132, w: 88,  rot: -3.2, z: 2, delay: 0.72, anim: 'float-b', opacity: 0.72 },
  { h: 174, w: 116, rot: -1.5, z: 3, delay: 0.58, anim: 'float-c', opacity: 0.88 },
  { h: 210, w: 140, rot:  0.0, z: 6, delay: 0.44, anim: 'float-a', opacity: 1.0  },
  { h: 174, w: 116, rot:  1.4, z: 3, delay: 0.58, anim: 'float-c', opacity: 0.88 },
  { h: 132, w: 88,  rot:  3.0, z: 2, delay: 0.72, anim: 'float-b', opacity: 0.72 },
  { h: 98,  w: 65,  rot:  5.2, z: 1, delay: 0.9,  anim: 'float-a', opacity: 0.55 },
];


const HeroSection = memo(() => {
  const previewPosters = REEL_ITEMS.slice(0, 7);

  return (
    <section
      aria-label="Hero"
      style={{
        minHeight: '100dvh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 88,
        paddingBottom: 64,
        background: 'var(--film-black)',
        // FIX: flicker removed from section — was too aggressive and read as a bug.
        // Flicker now lives only on the .hero-flicker-overlay below.
      }}
    >
      {/* Side perforations */}
      <FilmEdge side="left" />
      <FilmEdge side="right" />

      {/* Subtle flicker overlay — far lower opacity, reads as ambiance not bug */}
      <div
        aria-hidden="true"
        className="hero-flicker-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          background: 'rgba(7,7,6,0)',
          animation: 'hero-flicker-subtle 22s ease-in-out infinite',
        }}
      />

      {/* Radial amber glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 72% 55% at 50% 42%, rgba(196,124,46,0.048) 0%, transparent 72%)',
        }}
      />

      {/* Dot grid — very subtle */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.22,
          backgroundImage: 'radial-gradient(rgba(196,124,46,0.12) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      {/* Horizontal rule lines — film letterbox feel */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 88, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(196,124,46,0.08) 20%, rgba(196,124,46,0.08) 80%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 920, width: '100%',
        padding: '0 clamp(20px, 5vw, 56px)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Eyebrow badge */}
        <div
          className="h-a1"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(196,124,46,0.28)',
            background: 'rgba(196,124,46,0.055)',
            borderRadius: 3, padding: '5px 14px', margin: 16,
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--film-amber)', display: 'block',
            animation: 'amber-pulse 2.2s ease-in-out infinite', flexShrink: 0,
          }} />
          <span className="syne-font" style={{
            color: 'var(--film-amber)', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',

          }}>
            Free &amp; Open Source — No Account Required
          </span>
        </div>

        {/* Title */}
        <h1 className="h-a2 poster-font" style={{
          fontSize: 'clamp(68px, 13.5vw, 176px)',
          lineHeight: 0.88, color: 'var(--film-cream)',
          letterSpacing: '0.03em', marginBottom: 6,
        }}>
          POSTER
          <span style={{ color: 'transparent', WebkitTextStroke: '2px var(--film-amber)' }}>
            IUM
          </span>
        </h1>

        {/* Amber rule */}
        <div className="h-a3" style={{ margin: '14px 0 22px' }}>
          <AmberDivider width={178} opacity={0.55} />
        </div>

        {/* Sub */}
        <p className="h-a3 syne-font" style={{
          fontSize: 'clamp(13px, 2.2vw, 18px)', color: 'var(--film-silver)',
          fontWeight: 400, maxWidth: 600, lineHeight: 1.68, marginBottom: 10,
        }}>
          Generate movie &amp; TV posters with glassmorphism rating badges from{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>IMDb</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Rotten Tomatoes</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>, and more —
          all from a single URL.
        </p>

          <QuickBuilder />
        {/* CTAs */}
        <div className="h-a4" style={{
          display: 'flex', gap: 10, flexWrap: 'wrap',
          justifyContent: 'center', marginBottom: 60,
        }}>
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--film-amber)', color: '#070706',
              fontWeight: 700, fontSize: 12, letterSpacing: '0.09em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '12px 26px', borderRadius: 5,
            }}
          >
            Open Free Builder <ArrowRight size={13} />
          </Link>
        </div>

        {/* 7-poster floating fan */}
        <div
          className="h-a5"
          style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            gap: 'clamp(4px, 1vw, 12px)', width: '100%', maxWidth: 760,
          }}
        >
          {previewPosters.map((p, i) => {
            const layout = HERO_POSTER_LAYOUT[i];
            const isCenter = i === 3;
            return (
              <div
                key={p.id}
                style={{
                  width: layout.w, height: layout.h,
                  borderRadius: 5, overflow: 'hidden',
                  border: isCenter
                    ? '2px solid rgba(196,124,46,0.52)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isCenter
                    ? '0 32px 80px rgba(0,0,0,0.88), 0 0 44px rgba(196,124,46,0.14)'
                    : '0 14px 40px rgba(0,0,0,0.7)',
                  transform: `rotate(${layout.rot}deg)`,
                  flexShrink: 0,
                  position: 'relative',
                  opacity: layout.opacity,
                  animation: `${layout.anim} ${3.8 + i * 0.42}s ease-in-out ${layout.delay}s infinite`,
                  zIndex: layout.z,
                }}
              >
                <img
                  src={`${API}/${p.type}/${p.id}.svg?source=tmdb`}
                    alt={
    isCenter
      ? `${p.title} movie poster with IMDb and Rotten Tomatoes rating badges — Posterium`
      : `${p.title} movie poster`
  }
                  loading={isCenter ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Vignette on side posters */}
                {!isCenter && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to center, transparent 50%, rgba(7,7,6,0.25) 100%)',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Poster count badge */}
        <div className="h-a5" style={{ marginTop: 14 }}>
          <span className="mono-font" style={{
            fontSize: 8, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.16em',
          }}>
            {REEL_ITEMS.length} TITLES IN THE REEL · SCROLL TO BROWSE
          </span>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
export default HeroSection;