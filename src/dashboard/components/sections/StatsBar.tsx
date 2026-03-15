// src/dashboard/components/sections/StatsBar.tsx
// Performance: PANEL_ACCENTS and STATS are module-level constants (no recreate).
// Per-panel inline styles that depend only on index are pre-computed once.
import { memo } from 'react';
import { STATS } from '../../constants';
import { useInView, useCounter } from '../../hooks';

// Stable module-level constants — not recreated per render
const PANEL_ACCENTS = [
  { border: 'rgba(196,124,46,0.25)', glow: 'rgba(196,124,46,0.06)' },
  { border: 'rgba(168,32,24,0.22)',  glow: 'rgba(168,32,24,0.05)'  },
  { border: 'rgba(60,100,200,0.2)',  glow: 'rgba(60,100,200,0.05)' },
  { border: 'rgba(54,162,64,0.22)',  glow: 'rgba(54,162,64,0.05)'  },
];

// Derive the bright border string once per accent, not per render
const BORDER_BRIGHT = PANEL_ACCENTS.map(({ border }) =>
  border.replace(/0\.\d+\)$/, (m) => {
    const n = parseFloat(m);
    return `${Math.min(n * 3, 0.9)})`;
  })
);

const StatPanel = memo<{ stat: (typeof STATS)[0]; index: number; vis: boolean }>(
  ({ stat, index, vis }) => {
    const numeric = parseInt(stat.value.replace(/\D/g, ''), 10) || 0;
    const isSpecial = stat.value === '∞' || stat.value === '0';
    const count = useCounter(numeric, 1600, vis);
    const accent = PANEL_ACCENTS[index];
    const suffix = stat.value.replace(/[0-9]/g, '');

    return (
      <div
        style={{
          position: 'relative',
          padding: 'clamp(24px,3.5vw,40px) clamp(20px,3vw,36px)',
          borderRight: index < STATS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          background: vis ? accent.glow : 'transparent',
          transition: `background 0.8s ease ${index * 0.15}s`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          minHeight: 'clamp(140px,18vw,200px)',
        }}
      >
        {/* Animated top border */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: vis
              ? `linear-gradient(90deg, transparent, ${BORDER_BRIGHT[index]}, transparent)`
              : 'transparent',
            transition: `background 0.6s ease ${index * 0.12}s`,
          }}
        />

        {/* Index row */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
          }}
        >
          <span className="mono-font" style={{ fontSize: 8, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.14em' }}>
            {String(index + 1).padStart(2, '0')}/{String(STATS.length).padStart(2, '0')}
          </span>
          {stat.unit && (
            <span className="mono-font" style={{ fontSize: 7, color: 'rgba(122,117,110,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {stat.unit}
            </span>
          )}
        </div>

        {/* Number */}
        <div
          className="poster-font"
          style={{
            fontSize: 'clamp(56px,8vw,96px)', lineHeight: 0.88,
            color: 'var(--film-cream)', letterSpacing: '0.01em',
            textShadow: vis ? `0 0 60px ${accent.glow}` : 'none',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.92)',
            transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${0.12 + index * 0.12}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${0.12 + index * 0.12}s`,
          }}
        >
          {isSpecial ? stat.value : `${count}${suffix}`}
        </div>

        {/* Label */}
        <div
          style={{
            opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(10px)',
            transition: `opacity 0.55s ease ${0.25 + index * 0.1}s, transform 0.55s ease ${0.25 + index * 0.1}s`,
          }}
        >
          <div className="syne-font" style={{ fontSize: 'clamp(11px,1.4vw,14px)', fontWeight: 700, color: 'var(--film-cream)', letterSpacing: '0.02em', marginBottom: 4 }}>
            {stat.label}
          </div>
          <div className="body-font" style={{ fontSize: 10, color: 'rgba(110,104,96,0.6)', lineHeight: 1.4 }}>
            {stat.sub}
          </div>
        </div>
      </div>
    );
  }
);
StatPanel.displayName = 'StatPanel';

export const StatsBar = memo(() => {
  const { ref, vis } = useInView(0.1);

  return (
    <section
      ref={ref}
      aria-label="Statistics"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        borderBottom: '1px solid rgba(196,124,46,0.07)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px clamp(20px,5vw,80px)',
          borderBottom: '1px solid rgba(255,255,255,0.035)',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
          opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease',
        }}
      >
        <span className="mono-font" style={{ fontSize: 8, color: 'rgba(196,124,46,0.38)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          SPICYDEVS / POSTERIUM — FIELD NUMBERS
        </span>
        <span className="mono-font" style={{ fontSize: 7, color: 'rgba(122,117,110,0.28)', letterSpacing: '0.12em' }}>
          REV.2 · OPEN SOURCE · MIT
        </span>
      </div>

      {/* 4-panel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {STATS.map((s, i) => (
          <StatPanel key={s.label} stat={s} index={i} vis={vis} />
        ))}
      </div>

      <style>{`
        @media (max-width: 700px) { .stats-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 420px) { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';