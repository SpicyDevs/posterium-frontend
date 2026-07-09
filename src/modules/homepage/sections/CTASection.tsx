// src/components/dashboard/sections/CTASection.tsx
// Change: Link → <a href="/build">. No Router import.
import { memo } from 'react';
import { ArrowRight, Github, Star } from 'lucide-react';
import { useInView } from '@/lib/dashboard/hooks/index';

const STRIPE_INDICES = Array.from({ length: 28 }, (_, i) => i);

const SLATE_FIELDS = [
  ['PROD', 'POSTERIUM'],
  ['DIR', 'PROJECT TEAM'],
  ['SCENE', 'CTA'],
  ['TAKE', '1'],
  ['ROLL', '01'],
] as const;

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
      {/* Clapperboard stripe */}
      <div
        aria-hidden="true"
        style={{
          height: 52,
          display: 'flex',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {STRIPE_INDICES.map((i) => (
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

      {/* Slate metadata */}
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
        {SLATE_FIELDS.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              className="mono-font"
              style={{
                fontSize: 7,
                color: 'rgba(122,117,110,0.4)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {k}
            </span>
            <span
              className="syne-font"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--film-silver)',
                letterSpacing: '0.06em',
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>

      {/* Main copy */}
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
          <span className="sr-only">Start building custom movie posters</span>
          <span aria-hidden="true">
            START
            <br />
          </span>
          <span
            aria-hidden="true"
            style={{ color: 'transparent', WebkitTextStroke: '2px var(--film-amber)' }}
          >
            BUILDING
          </span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
          <div
            style={{
              height: 1,
              width: 'clamp(40px,8vw,100px)',
              background: 'rgba(196,124,46,0.35)',
            }}
          />
          <span
            className="syne-font"
            style={{
              fontSize: 12,
              color: 'var(--film-silver)',
              padding: '0 18px',
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            No sign-up, no rate limits, no tricks. Drag badges where you want them, copy the URL, paste it in Plex. That's the whole flow.
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="/build"
            title="Open Free Movie Poster Builder"
            aria-label="Open Free Movie Poster Builder"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
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
            Open Free Builder <ArrowRight size={13} />
          </a>
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="syne-font border-hover-amber"
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
            }}
          >
            <Github size={13} /> Star Project{' '}
            <Star size={10} color="var(--film-amber)" fill="var(--film-amber)" />
          </a>
        </div>
      </div>
    </section>
  );
});
CTASection.displayName = 'CTASection';
