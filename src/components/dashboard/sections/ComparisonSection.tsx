// src/components/dashboard/sections/ComparisonSection.tsx
// Shorter, less verbose. Includes drawbacks. Vertically condensed.

import { memo, useState } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';
import { SectionHeader } from '@/components/dashboard/components/SectionHeader';
import { ChevronDown } from 'lucide-react';

interface Row {
  feature: string;
  ours: string;
  theirs: string;
  ourStatus: 'win' | 'neutral';
  theirStatus: 'loss' | 'partial';
}

const toRow = ([feature, ours, theirs, ourStatus, theirStatus]: readonly [
  string,
  string,
  string,
  Row['ourStatus'],
  Row['theirStatus'],
]): Row => ({
  feature,
  ours,
  theirs,
  ourStatus,
  theirStatus,
});

const ROWS: Row[] = (
  [
    ['Rating Sources', '12 live sources', '1–3 basic sources', 'win', 'loss'],
    ['Delivery', 'Dynamic edge URL', 'Static files (outdated)', 'win', 'loss'],
    ['Textless & Logos', 'Auto-strip + overlay', 'Manual edit needed', 'win', 'loss'],
    ['Typography Control', 'Full kerning & flow', 'Basic or none', 'win', 'loss'],
    ['Visual Editor', 'Drag-drop with preview', 'Forms or code-only', 'win', 'partial'],
    ['Export Formats', 'SVG, WebP, PNG, JPG', 'PNG/JPG only', 'win', 'partial'],
    ['Self-Hosting', 'Full Docker support', 'Platform locked', 'win', 'loss'],
    ['Rate Limits', 'Unlimited (Cloudflare)', 'Daily/monthly caps', 'win', 'loss'],
    ['Authentication', 'None required', 'Account needed', 'win', 'loss'],
    ['Cost', '100% free forever', 'Paid tiers', 'win', 'loss'],
    ['Browser Support', 'Modern browsers', 'Limited mobile', 'win', 'partial'],
    ['CORS', 'Fully enabled', 'Restricted', 'win', 'loss'],
  ] as const
).map(toRow);

const WIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5.5" stroke="rgba(196,124,46,0.8)" strokeWidth="1" fill="rgba(196,124,46,0.15)" />
    <path
      d="M3.5 6l2 2 3-3"
      stroke="#E0A458"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const LOSS_ICON = (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5.5" stroke="rgba(122,117,110,0.3)" strokeWidth="0.8" />
    <path
      d="M4 4l4 4M8 4l-4 4"
      stroke="rgba(122,117,110,0.45)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);
const PARTIAL_ICON = (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5.5" stroke="rgba(180,150,80,0.4)" strokeWidth="0.8" />
    <path d="M3.5 6h5" stroke="rgba(180,150,80,0.6)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const CompRow = memo<{ row: Row; index: number; vis: boolean }>(({ row, index, vis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const delay = `${index * 0.02}s`;
  
  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className="group cursor-pointer hover:bg-white/[0.015] transition-colors duration-300"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr' }}>
        <div style={{ padding: '12px clamp(16px, 3vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div
            className="syne-font group-hover:text-white transition-colors duration-300"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'rgba(235, 225, 200, 0.95)',
              letterSpacing: '0.02em',
            }}
          >
            {row.feature}
          </div>
          <ChevronDown 
            size={14} 
            color="rgba(196,124,46,0.6)" 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
              flexShrink: 0
            }} 
          />
        </div>
        
        <div style={{ background: 'rgba(196,124,46,0.1)' }} aria-hidden="true" />
        
        <div
          className="group-hover:bg-[#c47c2e]/[0.05] transition-colors duration-300"
          style={{
            padding: '12px clamp(16px, 3vw, 32px)',
            background: 'rgba(196,124,46,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ marginTop: 0, flexShrink: 0 }}>{WIN_ICON}</span>
          <span
            className="body-font group-hover:text-[#E0A458] transition-colors duration-300"
            style={{
              fontSize: '11px',
              color: 'rgba(196,124,46,0.95)',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {row.ours}
          </span>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.03)' }} aria-hidden="true" />
        
        <div
          style={{
            padding: '12px clamp(16px, 3vw, 32px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ flexShrink: 0 }}>
            {row.theirStatus === 'loss' ? LOSS_ICON : PARTIAL_ICON}
          </span>
          <span
            className="body-font"
            style={{
              fontSize: '11px',
              color: row.theirStatus === 'partial' ? 'rgba(180,150,80,0.7)' : 'rgba(122,117,110,0.6)',
              lineHeight: 1.5,
            }}
          >
            {row.theirs}
          </span>
        </div>
      </div>
    </div>
  );
});
CompRow.displayName = 'CompRow';

export const ComparisonSection = memo(() => {
  const { ref, vis } = useInView(0.04);
  return (
    <section
      id="comparison"
      ref={ref}
      aria-label="Feature Comparison"
      style={{ 
        background: 'var(--film-black)', 
        borderTop: '1px solid rgba(196,124,46,0.07)',
        paddingBottom: 'clamp(48px, 6vw, 80px)'
      }}
    >
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <SectionHeader
          tag="Comparison"
          title="How We Stack Up"
          padding="clamp(48px,6vw,80px) clamp(20px,5vw,64px) clamp(24px, 3vw, 36px)"
        />
      </div>
      
      <div style={{ padding: '0 clamp(16px, 4vw, 64px)', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(14, 13, 11, 0.7) 0%, rgba(10, 9, 8, 0.9) 100%)',
            border: '1px solid rgba(196,124,46,0.15)',
            borderRadius: '16px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr',
              borderBottom: '1px solid rgba(196,124,46,0.3)',
              background: 'rgba(10, 9, 8, 0.95)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}
          >
            <div style={{ padding: '14px clamp(16px, 3vw, 32px)' }}>
              <span
                className="mono-font"
                style={{
                  fontSize: 9,
                  color: 'rgba(235, 225, 200, 0.6)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Features
              </span>
            </div>
            <div style={{ background: 'rgba(196,124,46,0.2)' }} aria-hidden="true" />
            
            <div
              style={{
                padding: '14px clamp(16px, 3vw, 32px)',
                background: 'linear-gradient(180deg, rgba(196,124,46,0.15) 0%, rgba(196,124,46,0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--film-amber)',
                  boxShadow: '0 0 10px rgba(196,124,46,0.8)',
                  flexShrink: 0,
                }}
              />
              <span
                className="syne-font"
                style={{
                  fontSize: 12,
                  color: 'var(--film-amber)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                }}
              >
                Posterium
              </span>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
            
            <div style={{ padding: '14px clamp(16px, 3vw, 32px)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'rgba(122,117,110,0.3)',
                  flexShrink: 0,
                }}
              />
              <span
                className="syne-font"
                style={{
                  fontSize: 11,
                  color: 'rgba(122,117,110,0.6)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Others
              </span>
            </div>
          </div>
          
          {/* Table Rows */}
          <div style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', overflow: 'hidden' }}>
            {ROWS.map((row, i) => (
              <CompRow key={row.feature} row={row} index={i} vis={vis} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend Footer */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px clamp(16px, 4vw, 64px) 0',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s',
        }}
      >
        {[
          { icon: WIN_ICON, label: 'Native support', color: 'rgba(196,124,46,0.8)' },
          { icon: PARTIAL_ICON, label: 'Partial', color: 'rgba(180,150,80,0.6)' },
          { icon: LOSS_ICON, label: 'Not available', color: 'rgba(122,117,110,0.5)' },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon}
            <span className="mono-font" style={{ fontSize: 9, color, letterSpacing: '0.08em' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
});
ComparisonSection.displayName = 'ComparisonSection';
