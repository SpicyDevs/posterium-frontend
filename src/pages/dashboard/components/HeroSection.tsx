// src/pages/dashboard/components/HeroSection.tsx
import { memo } from 'react';
import { Link } from '../../../Router';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { API, REEL_ITEMS } from '../constants';
import { FilmEdge, AmberDivider } from './primitives';

// Hero poster fan — 5 posters, centre one is largest
// Heights, widths, rotations are slightly non-uniform intentionally
const HERO_POSTER_LAYOUT = [
  { h: 116, w: 78,  rot: -3.5, z: 1, delay: 0.85, anim: 'float-a' },
  { h: 158, w: 105, rot: -1.8, z: 2, delay: 0.68, anim: 'float-b' },
  { h: 208, w: 139, rot:  0.0, z: 5, delay: 0.52, anim: 'float-c' },
  { h: 154, w: 103, rot:  1.6, z: 2, delay: 0.68, anim: 'float-b' },
  { h: 118, w: 79,  rot:  3.2, z: 1, delay: 0.85, anim: 'float-a' },
];

const HeroSection = memo(() => {
  const previewPosters = REEL_ITEMS.slice(0, 5);

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
        paddingTop: 80,
        paddingBottom: 64,
        background: 'var(--film-black)',
        animation: 'film-flicker 18s ease-in-out infinite',
      }}
    >
      {/* Side perforations */}
      <FilmEdge side="left" />
      <FilmEdge side="right" />

      {/* Radial amber glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 68% 52% at 50% 44%, rgba(196,124,46,0.045) 0%, transparent 72%)',
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.28,
          backgroundImage:
            'radial-gradient(rgba(196,124,46,0.13) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 880,
          width: '100%',
          padding: '0 clamp(20px, 5vw, 56px)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Eyebrow badge */}
        <div
          className="h-a1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(196,124,46,0.28)',
            background: 'rgba(196,124,46,0.055)',
            borderRadius: 3,
            padding: '5px 13px',
            marginBottom: 26,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--film-amber)',
              display: 'block',
              animation: 'amber-pulse 2.2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            className="syne-font"
            style={{
              color: 'var(--film-amber)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Free &amp; Open Source — No Account Required
          </span>
        </div>

        {/* Title */}
        <h1
          className="h-a2 poster-font"
          style={{
            fontSize: 'clamp(68px, 13.5vw, 176px)',
            lineHeight: 0.88,
            color: 'var(--film-cream)',
            letterSpacing: '0.03em',
            marginBottom: 6,
          }}
        >
          POSTER
          <span
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px var(--film-amber)',
            }}
          >
            IUM
          </span>
        </h1>

        {/* Amber rule */}
        <div className="h-a3" style={{ margin: '14px 0 22px' }}>
          <AmberDivider width={178} opacity={0.55} />
        </div>

        {/* Sub */}
        <p
          className="h-a3 syne-font"
          style={{
            fontSize: 'clamp(13px, 2.2vw, 18px)',
            color: 'var(--film-silver)',
            fontWeight: 400,
            maxWidth: 600,
            lineHeight: 1.68,
            marginBottom: 10,
          }}
        >
          Generate custom movie &amp; TV posters with glassmorphism rating badges from{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>IMDb</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Rotten Tomatoes</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>TMDB</strong>, and more —
          all from a single API URL.
        </p>

        <p
          className="h-a4 body-font"
          style={{
            fontSize: 12,
            color: 'rgba(110,104,96,0.85)',
            marginBottom: 38,
            letterSpacing: '0.01em',
          }}
        >
          Perfect for Plex · Jellyfin · Discord Bots · Notion · And anything with an image field.
        </p>

        {/* CTAs */}
        <div
          className="h-a4"
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 56,
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
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '12px 26px',
              borderRadius: 5,
            }}
          >
            Open Free Builder
            <ArrowRight size={13} />
          </Link>
          <a
            href="#reel"
            className="syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              color: 'var(--film-cream)',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.025)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(196,124,46,0.38)';
              (e.currentTarget as HTMLElement).style.background =
                'rgba(196,124,46,0.055)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.025)';
            }}
          >
            Watch the Reel
            <ChevronDown size={13} />
          </a>
        </div>

        {/* Floating poster fan */}
        <div
          className="h-a5"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 'clamp(5px, 1.2vw, 14px)',
            width: '100%',
            maxWidth: 660,
          }}
        >
          {previewPosters.map((p, i) => {
            const layout = HERO_POSTER_LAYOUT[i];
            const isCenter = i === 2;
            return (
              <div
                key={p.id}
                style={{
                  width: layout.w,
                  height: layout.h,
                  borderRadius: 5,
                  overflow: 'hidden',
                  border: isCenter
                    ? '2px solid rgba(196,124,46,0.48)'
                    : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: isCenter
                    ? '0 30px 80px rgba(0,0,0,0.82), 0 0 38px rgba(196,124,46,0.12)'
                    : '0 16px 44px rgba(0,0,0,0.72)',
                  transform: `rotate(${layout.rot}deg)`,
                  flexShrink: 0,
                  position: 'relative',
                  animation: `${layout.anim} ${3.8 + i * 0.42}s ease-in-out ${layout.delay}s infinite`,
                  zIndex: layout.z,
                }}
              >
                <img
                  src={`${API}/${p.type}/${p.id}.svg?source=tmdb`}
                  alt={p.title}
                  loading={isCenter ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          opacity: 0.38,
          animation: 'fade-up 2s ease-in-out 1.8s both',
        }}
      >
        <span
          className="syne-font"
          style={{
            fontSize: 8,
            letterSpacing: '0.22em',
            color: 'var(--film-silver)',
            textTransform: 'uppercase',
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 34,
            background:
              'linear-gradient(to bottom, var(--film-amber), transparent)',
            animation: 'fade-up 1.4s ease-in-out infinite alternate',
          }}
        />
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';
export default HeroSection;