// components/sections/UseCasesSection.tsx
// "DISTRIBUTION CIRCUIT" — full-width alternating rows, ghost index numbers.
import { memo } from 'react';
import { USE_CASES } from '../../constants';
import { useInView } from '../../hooks';
import { AmberTag, AmberDivider } from '../primitives';

export const UseCasesSection = memo(() => {
  const { ref, vis } = useInView(0.05);

  return (
    <section
      id="use-cases"
      ref={ref}
      aria-label="Distribution Circuit"
      style={{
        background: 'var(--film-black)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: 'clamp(56px,7vw,80px) clamp(20px,5vw,64px) 40px',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        <AmberTag style={{ marginBottom: 12 }}>Distribution</AmberTag>
        <h2 className="poster-font" style={{
          fontSize: 'clamp(40px,6vw,80px)',
          color: 'var(--film-cream)', lineHeight: 0.9,
          letterSpacing: '0.02em', marginTop: 10,
        }}>
          WHERE IT<br />
          <span style={{ color: 'var(--film-amber)' }}>RUNS</span>
        </h2>
      </div>

      {/* Full-width use-case rows */}
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
          <div aria-hidden="true" className="poster-font" style={{
            position: 'absolute',
            left: 'clamp(0px,-2vw,-20px)',
            top: '50%', transform: 'translateY(-50%)',
            fontSize: 'clamp(80px,12vw,160px)',
            color: 'rgba(196,124,46,0.035)',
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            letterSpacing: '-0.02em',
          }}>
            {String(i + 1).padStart(2, '0')}
          </div>

          {/* Icon + counter */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1, marginBottom: 6,
            }}>
              {uc.icon}
            </div>
            <span className="mono-font" style={{
              fontSize: 9, color: 'rgba(196,124,46,0.38)', letterSpacing: '0.1em',
            }}>
              {String(i + 1).padStart(2, '0')}/{String(USE_CASES.length).padStart(2, '0')}
            </span>
          </div>

          {/* Description + code snippet */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 className="syne-font" style={{
              fontSize: 'clamp(14px,1.8vw,18px)', fontWeight: 700,
              color: 'var(--film-cream)', letterSpacing: '0.01em', marginBottom: 6,
            }}>
              {uc.title}
            </h3>
            <p className="body-font" style={{
              fontSize: 12, color: 'var(--film-silver)',
              lineHeight: 1.65, marginBottom: 10,
            }}>
              {uc.desc}
            </p>
            {uc.codeSnippet && (
              <code className="mono-font" style={{
                display: 'inline-block', fontSize: 9,
                color: 'rgba(196,124,46,0.6)',
                background: 'rgba(196,124,46,0.05)',
                border: '1px solid rgba(196,124,46,0.1)',
                borderRadius: 3, padding: '3px 8px', letterSpacing: '0.04em',
              }}>
                {uc.codeSnippet}
              </code>
            )}
          </div>

          {/* Tags — right-aligned */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            alignItems: 'flex-end', position: 'relative', zIndex: 1, flexShrink: 0,
          }}>
            {uc.tags.map(t => (
              <span key={t} className="syne-font" style={{
                fontSize: 8, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(110,104,96,0.5)',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '2px 6px', borderRadius: 2,
                whiteSpace: 'nowrap',
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        padding: '14px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.3)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          {USE_CASES.length} DISTRIBUTION NODES · NO AUTH REQUIRED
        </span>
        <AmberDivider width={80} opacity={0.2} />
      </div>
    </section>
  );
});
UseCasesSection.displayName = 'UseCasesSection';