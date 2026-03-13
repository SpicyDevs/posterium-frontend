// components/sections/StatsBar.tsx
// "THE MANIFEST" — film production docket aesthetic.
// Stats as memo line-items: large stencil number right, label+sub left.
import { memo } from 'react';
import { STATS } from '../../constants';
import { useInView, useCounter } from '../../hooks';

const ManifestLine = memo<{
  stat: typeof STATS[0];
  index: number;
  vis: boolean;
}>(({ stat, index, vis }) => {
  const numeric = parseInt(stat.value.replace(/\D/g, ''), 10) || 0;
  const isSpecial = stat.value === '∞' || stat.value === '0';
  const count = useCounter(numeric, 1400, vis);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '32px 1fr auto',
      alignItems: 'start',
      gap: '0 20px',
      padding: '22px 0',
      borderBottom: '1px solid rgba(196,124,46,0.07)',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateX(0)' : 'translateX(-18px)',
      transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
    }}>
      {/* Line number */}
      <span className="mono-font" style={{
        fontSize: 9, color: 'rgba(122,117,110,0.35)',
        letterSpacing: '0.1em', paddingTop: 4,
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Label + sub */}
      <div>
        <div className="syne-font" style={{
          fontSize: 13, fontWeight: 700, color: 'var(--film-cream)',
          letterSpacing: '0.02em', marginBottom: 4,
        }}>
          {stat.label}
        </div>
        <div className="body-font" style={{
          fontSize: 10, color: 'rgba(110,104,96,0.6)', lineHeight: 1.45,
        }}>
          {stat.sub}
        </div>
      </div>

      {/* Value — stencil display */}
      <div className="poster-font" style={{
        fontSize: 'clamp(44px,5.5vw,68px)',
        color: 'var(--film-cream)', lineHeight: 0.9,
        letterSpacing: '0.02em', textAlign: 'right',
        textShadow: '0 0 40px rgba(196,124,46,0.1)',
      }}>
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
        padding: 'clamp(56px,7vw,80px) clamp(20px,5vw,80px)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
      }}
    >
      {/* Docket header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <span className="mono-font" style={{
          fontSize: 9, color: 'rgba(196,124,46,0.4)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          SPICYDEVS PRODUCTION — FIELD MANIFEST
        </span>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.3)', letterSpacing: '0.12em',
        }}>
          REV. 2 / OPEN SOURCE
        </span>
      </div>

      <div style={{
        height: 1,
        background: 'linear-gradient(90deg,rgba(196,124,46,0.35),rgba(196,124,46,0.05))',
        marginBottom: 4,
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.5s ease 0.1s',
      }} />

      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        {STATS.map((s, i) => (
          <ManifestLine key={s.label} stat={s} index={i} vis={vis} />
        ))}
      </div>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';