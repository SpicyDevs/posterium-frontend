// src/components/dashboard/sections/StatsBar.tsx
import { memo } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';

const STATS = [
  { val: '∞',    label: 'Free API calls',      sub: 'No rate limits' },
  { val: '12',   label: 'Rating sources',       sub: 'IMDb · RT · Meta & more' },
  { val: '0',    label: 'Auth required',         sub: 'Just a URL' },
  { val: '4',    label: 'Export formats',        sub: 'SVG · WebP · PNG · JPG' },
  { val: '<400ms', label: 'Edge response',       sub: 'Cloudflare global' },
  { val: 'MIT',  label: 'License',               sub: 'Open source' },
] as const;

export const StatsBar = memo(() => {
  const { ref, vis } = useInView(0.1);

  return (
    <section
      ref={ref}
      aria-label="Key stats"
      style={{
        background: 'var(--film-dark)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        borderBottom: '1px solid rgba(196,124,46,0.07)',
        padding: 'clamp(28px,4vw,48px) clamp(20px,5vw,64px)',
      }}
    >
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 0,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {STATS.map(({ val, label, sub }, i) => (
          <div
            key={label}
            style={{
              padding: 'clamp(12px,2vw,20px) clamp(10px,1.6vw,18px)',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(196,124,46,0.07)' : 'none',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(14px)',
              transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`,
            }}
          >
            <div
              className="poster-font"
              style={{
                fontSize: 'clamp(28px,3.5vw,42px)',
                color: 'var(--film-amber)',
                lineHeight: 0.9,
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              {val}
            </div>
            <div
              className="syne-font"
              style={{ fontSize: 'clamp(10px,1vw,12px)', fontWeight: 700, color: 'var(--film-cream)', marginBottom: 3 }}
            >
              {label}
            </div>
            <div
              className="mono-font"
              style={{ fontSize: 9, color: 'rgba(196,185,165,0.38)', letterSpacing: '0.08em' }}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';
