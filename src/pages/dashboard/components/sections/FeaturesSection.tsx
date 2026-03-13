// components/sections/FeaturesSection.tsx
// "THE EXPOSURE SHEET" — animation dope-sheet layout.
// Expandable table rows: scene number, feature, module, status.
import React, { memo, useState } from 'react';
import {
  MousePointer2, Zap, Globe, RefreshCw,
  Film, Image as ImageIcon, Shield, Layers,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { FEATURES } from '../../constants';
import { useInView } from '../../hooks';
import { AmberTag } from '../primitives';

const ICONS: Record<string, React.ReactNode> = {
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
  const [activeRow, setActiveRow] = useState<number | null>(0);

  return (
    <section
      id="features"
      ref={ref}
      aria-label="Features"
      style={{
        background: 'var(--film-dark)',
        paddingTop: 'clamp(56px,7vw,80px)',
        borderTop: '1px solid rgba(196,124,46,0.06)',
      }}
    >
      {/* Sheet header */}
      <div style={{
        padding: '0 clamp(20px,5vw,64px)',
        marginBottom: 28,
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        <AmberTag style={{ marginBottom: 12 }}>Feature Sheet</AmberTag>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px,6vw,80px)',
            color: 'var(--film-cream)', lineHeight: 0.9,
            letterSpacing: '0.02em', marginTop: 10,
          }}>
            EXPOSURE<br />
            <span style={{ color: 'var(--film-amber)' }}>SHEET</span>
          </h2>
          <span className="mono-font" style={{
            fontSize: 8, color: 'rgba(122,117,110,0.35)',
            letterSpacing: '0.14em', textTransform: 'uppercase', paddingBottom: 8,
          }}>
            Posterium v2.0 · {FEATURES.length} Scenes · Production Ready
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 100px 90px',
        padding: '8px clamp(20px,5vw,64px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255,255,255,0.015)',
        gap: '0 16px',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.5s ease 0.15s',
      }}>
        {['SC.', 'ACTION / FEATURE', 'MODULE', 'STATUS'].map((col, i) => (
          <span key={col} className="mono-font" style={{
            fontSize: 8, color: 'rgba(122,117,110,0.45)',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            textAlign: i === 3 ? 'right' : 'left',
          }}>
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
            <div
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setActiveRow(isOpen ? null : i)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setActiveRow(isOpen ? null : i);
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 100px 90px',
                padding: '14px clamp(20px,5vw,64px)',
                gap: '0 16px',
                alignItems: 'center',
                cursor: 'pointer',
                background: isOpen ? 'rgba(196,124,46,0.04)' : 'transparent',
                transition: 'background 0.2s ease',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.018)';
              }}
              onMouseLeave={e => {
                if (!isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span className="mono-font" style={{
                fontSize: 9, color: 'rgba(196,124,46,0.38)', letterSpacing: '0.08em',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.4)',
                  transition: 'color 0.2s', flexShrink: 0,
                }}>
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span className="syne-font" style={{
                  fontSize: 13, fontWeight: 700,
                  color: isOpen ? 'var(--film-cream)' : 'rgba(240,230,204,0.75)',
                  letterSpacing: '0.01em', transition: 'color 0.2s',
                }}>
                  {f.title}
                </span>
                <span style={{
                  color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.3)',
                  transition: 'color 0.2s',
                }}>
                  {ICONS[f.title] ?? <Zap size={14} />}
                </span>
              </div>

              <span className="mono-font" style={{
                fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: isOpen ? 'var(--film-amber)' : 'rgba(122,117,110,0.35)',
                transition: 'color 0.2s',
              }}>
                {f.tag}
              </span>

              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', gap: 5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#36A240',
                  boxShadow: '0 0 5px rgba(54,162,64,0.5)', flexShrink: 0,
                }} />
                <span className="mono-font" style={{
                  fontSize: 8, color: '#36A240', letterSpacing: '0.14em',
                }}>
                  LIVE
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{
                padding: '0 clamp(20px,5vw,64px) 20px',
                paddingLeft: `calc(clamp(20px,5vw,64px) + 48px + 16px + 13px + 10px)`,
                animation: 'fade-up 0.3s ease both',
                borderTop: '1px solid rgba(196,124,46,0.06)',
                marginTop: -1,
              }}>
                <p className="body-font" style={{
                  fontSize: 12, color: 'var(--film-silver)',
                  lineHeight: 1.75, maxWidth: 680, marginTop: 14,
                }}>
                  {f.desc}
                </p>
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(196,124,46,0.05)',
                  border: '1px solid rgba(196,124,46,0.12)',
                  borderRadius: 3, padding: '4px 10px',
                }}>
                  <span className="mono-font" style={{
                    fontSize: 9, color: 'rgba(196,124,46,0.55)', letterSpacing: '0.1em',
                  }}>
                    SIZE
                  </span>
                  <span className="mono-font" style={{
                    fontSize: 9, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.06em',
                  }}>
                    {f.size.toUpperCase()} — included in free tier
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Sheet footer */}
      <div style={{
        padding: '14px clamp(20px,5vw,64px)',
        background: 'rgba(255,255,255,0.012)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
      }}>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.3)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          END OF SHEET — {FEATURES.length} ENTRIES
        </span>
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(122,117,110,0.25)', letterSpacing: '0.1em',
        }}>
          © SPICYDEVS · OPEN SOURCE · MIT LICENSE
        </span>
      </div>
    </section>
  );
});
FeaturesSection.displayName = 'FeaturesSection';