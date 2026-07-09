// src/components/dashboard/sections/ComparisonSection.tsx
import { memo } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';
import { SectionHeader } from '@/modules/homepage/SectionHeader';

type Status = 'win' | 'partial' | 'loss';

interface Row {
  feature: string;
  sub?: string;
  ours: string;
  theirs: string;
  ourStatus: Status;
  theirStatus: Status;
  isOurDrawback?: boolean;
}

const ROWS: Row[] = [
  { feature: 'Rating Sources', sub: 'Supported platforms', ours: '12 live sources - IMDb, RT, Meta, Letterboxd, MAL & more', theirs: '1-3 basic sources', ourStatus: 'win', theirStatus: 'partial' },
  { feature: 'Score Freshness', sub: 'When ratings update', ours: 'Live on every request', theirs: 'Cached or manual refresh', ourStatus: 'win', theirStatus: 'loss' },
  { feature: 'Delivery', sub: 'How posters are served', ours: 'Edge URL - auto-updates everywhere', theirs: 'Static downloads (scores get stale)', ourStatus: 'win', theirStatus: 'loss' },
  { feature: 'Visual Editor', sub: 'Customizing layouts', ours: 'Drag-and-drop with live preview', theirs: 'Forms or code-only', ourStatus: 'win', theirStatus: 'partial' },
  { feature: 'Textless & Logos', sub: 'Clean artwork', ours: 'Auto-fetch textless + inject vector logos', theirs: 'Requires Photoshop or static upload', ourStatus: 'win', theirStatus: 'loss' },
  { feature: 'Fallback Sources', sub: 'When TMDB fails', ours: 'Cascade: Fanart → Metahub → IMDb', theirs: 'Poster breaks or shows blank', ourStatus: 'win', theirStatus: 'loss' },
  { feature: 'Export Formats', sub: 'Vector and raster', ours: 'SVG, WebP, PNG, JPG', theirs: 'PNG/JPG only', ourStatus: 'win', theirStatus: 'partial' },
  { feature: 'Pricing', sub: 'Cost to generate', ours: '100% free, MIT open source', theirs: 'Paid tiers or credit limits', ourStatus: 'win', theirStatus: 'loss' },
  { feature: 'Auth Required', sub: 'Registration', ours: 'None - just a URL', theirs: 'Mandatory sign-up', ourStatus: 'win', theirStatus: 'loss' },
  // Honest Posterium limitations
  { feature: 'Generation Speed', sub: 'First request latency', ours: '80-400 ms on cold edge start', theirs: 'Instant (pre-rendered cache)', ourStatus: 'partial', theirStatus: 'win', isOurDrawback: true },
  { feature: 'Custom Artwork', sub: 'Upload your own image', ours: 'Not supported - URL-based only', theirs: 'Some support custom uploads', ourStatus: 'loss', theirStatus: 'partial', isOurDrawback: true },
  { feature: 'Offline / Local', sub: 'Network dependency', ours: 'Requires internet connection', theirs: 'Local library support varies', ourStatus: 'loss', theirStatus: 'partial', isOurDrawback: true },
];

const WIN_ICON = (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0px 0px 3px rgba(196,124,46,0.5))', flexShrink: 0 }}>
    <circle cx="6" cy="6" r="5.5" stroke="rgba(196,124,46,0.7)" strokeWidth="1" fill="rgba(196,124,46,0.12)" />
    <path d="M3.5 6l2 2 3-3" stroke="#E0A458" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const LOSS_ICON = (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="6" cy="6" r="5.5" stroke="rgba(122,117,110,0.25)" strokeWidth="0.8" />
    <path d="M4 4l4 4M8 4l-4 4" stroke="rgba(122,117,110,0.4)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const PARTIAL_ICON = (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="6" cy="6" r="5.5" stroke="rgba(180,150,80,0.38)" strokeWidth="0.8" />
    <path d="M3.5 6h5" stroke="rgba(180,150,80,0.55)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

function getIcon(s: Status) {
  if (s === 'win') return WIN_ICON;
  if (s === 'partial') return PARTIAL_ICON;
  return LOSS_ICON;
}

function getTextColor(s: Status) {
  if (s === 'win') return 'rgba(196,124,46,0.9)';
  if (s === 'partial') return 'rgba(180,150,80,0.65)';
  return 'rgba(122,117,110,0.55)';
}

const CompRow = memo<{ row: Row; index: number; vis: boolean; isLast: boolean; isFirstDrawback: boolean }>(
  ({ row, index, vis, isLast, isFirstDrawback }) => {
    const delay = `${index * 0.025}s`;

    return (
      <>
        {isFirstDrawback && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div colSpan={5 as any} style={{ padding: '8px clamp(14px,2.5vw,28px)' }}>
              <span className="mono-font" style={{ fontSize: 7, color: 'rgba(122,117,110,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Where we fall short
              </span>
            </div>
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr',
            borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.035)',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(8px)',
            transition: `opacity 0.45s ease ${delay}, transform 0.45s ease ${delay}`,
            background: row.isOurDrawback ? 'rgba(255,255,255,0.008)' : 'transparent',
          }}
        >
          {/* Feature label */}
          <div style={{ padding: 'clamp(12px,2vw,18px) clamp(14px,2.5vw,28px)' }}>
            <div className="syne-font" style={{ fontSize: 'clamp(11px,1.3vw,13px)', fontWeight: 700, color: 'rgba(230,220,198,0.9)', marginBottom: row.sub ? 3 : 0, letterSpacing: '0.02em' }}>
              {row.feature}
            </div>
            {row.sub && (
              <div className="mono-font" style={{ fontSize: 'clamp(8px,0.9vw,9px)', color: 'rgba(122,117,110,0.45)', letterSpacing: '0.06em' }}>
                {row.sub}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(196,124,46,0.08)' }} aria-hidden="true" />

          {/* Posterium */}
          <div style={{
            padding: 'clamp(12px,2vw,18px) clamp(14px,2.5vw,28px)',
            background: row.ourStatus === 'win' ? 'rgba(196,124,46,0.025)' : 'transparent',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ marginTop: 2 }}>{getIcon(row.ourStatus)}</span>
            <span className="body-font" style={{ fontSize: 'clamp(11px,1.2vw,12px)', color: getTextColor(row.ourStatus), lineHeight: 1.45 }}>
              {row.ours}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.025)' }} aria-hidden="true" />

          {/* Others */}
          <div style={{ padding: 'clamp(12px,2vw,18px) clamp(14px,2.5vw,28px)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ marginTop: 2 }}>{getIcon(row.theirStatus)}</span>
            <span className="body-font" style={{ fontSize: 'clamp(11px,1.2vw,12px)', color: getTextColor(row.theirStatus), lineHeight: 1.45 }}>
              {row.theirs}
            </span>
          </div>
        </div>
      </>
    );
  }
);
CompRow.displayName = 'CompRow';

const firstDrawbackIdx = ROWS.findIndex((r) => r.isOurDrawback);

export const ComparisonSection = memo(() => {
  const { ref, vis } = useInView(0.04);

  return (
    <section
      id="comparison"
      ref={ref}
      aria-label="Feature Comparison"
      style={{ background: 'var(--film-black)', borderTop: '1px solid rgba(196,124,46,0.07)', paddingBottom: 'clamp(48px,6vw,80px)' }}
    >
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <SectionHeader
          tag="Head-to-head"
          title={<>THE SPEC<br /><span style={{ color: 'var(--film-amber)' }}>SHEET</span></>}
          description="We lay it all out. The wins, the trade-offs, the stuff we just don't do yet."
          padding="clamp(48px,6vw,80px) clamp(20px,5vw,64px) clamp(24px,3vw,36px)"
        />
      </div>

      <div style={{ padding: '0 clamp(16px,4vw,64px)', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(14,13,11,0.7) 0%, rgba(10,9,8,0.9) 100%)',
          border: '1px solid rgba(196,124,46,0.12)',
          borderRadius: 16,
          boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}>
          {/* Sticky column headers */}
          <div style={{
            position: 'sticky', top: 52, zIndex: 10,
            display: 'grid', gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr',
            borderBottom: '1px solid rgba(196,124,46,0.22)',
            background: 'rgba(10,9,8,0.96)', backdropFilter: 'blur(20px)',
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
          }}>
            <div style={{ padding: '13px clamp(14px,2.5vw,28px)' }}>
              <span className="mono-font" style={{ fontSize: 9, color: 'rgba(200,190,170,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Feature
              </span>
            </div>
            <div style={{ background: 'rgba(196,124,46,0.18)' }} aria-hidden="true" />
            <div style={{ padding: '13px clamp(14px,2.5vw,28px)', background: 'rgba(196,124,46,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--film-amber)', boxShadow: '0 0 8px rgba(196,124,46,0.7)', flexShrink: 0 }} />
              <span className="syne-font" style={{ fontSize: 11, color: 'var(--film-amber)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>Posterium</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
            <div style={{ padding: '13px clamp(14px,2.5vw,28px)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(122,117,110,0.28)', flexShrink: 0 }} />
              <span className="syne-font" style={{ fontSize: 11, color: 'rgba(122,117,110,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Others</span>
            </div>
          </div>

          {/* Rows */}
          <div style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' }}>
            {ROWS.map((row, i) => (
              <CompRow
                key={row.feature}
                row={row}
                index={i}
                vis={vis}
                isLast={i === ROWS.length - 1}
                isFirstDrawback={i === firstDrawbackIdx}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        padding: '18px clamp(16px,4vw,64px) 0',
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.6s ease 0.5s',
      }}>
        {[
          { icon: WIN_ICON, label: 'Supported', color: 'rgba(196,124,46,0.65)' },
          { icon: PARTIAL_ICON, label: 'Partial', color: 'rgba(180,150,80,0.5)' },
          { icon: LOSS_ICON, label: 'Not available', color: 'rgba(122,117,110,0.4)' },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {icon}
            <span className="mono-font" style={{ fontSize: 9, color, letterSpacing: '0.08em' }}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
});
ComparisonSection.displayName = 'ComparisonSection';
