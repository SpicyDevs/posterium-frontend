// src/components/dashboard/sections/ComparisonSection.tsx
import { memo, useState } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';
import { SprocketStrip } from '../primitives';
import { SectionHeader } from '@/components/dashboard/components/SectionHeader';
import { ChevronDown } from 'lucide-react';

interface Row {
  feature: string;
  sub?: string;
  ours: string;
  theirs: string;
  ourStatus: 'win' | 'neutral';
  theirStatus: 'loss' | 'partial';
  detail: string;
}

const toRow = ([feature, sub, ours, theirs, ourStatus, theirStatus, detail]: readonly [
  string,
  string,
  string,
  string,
  Row['ourStatus'],
  Row['theirStatus'],
  string,
]): Row => ({
  feature,
  sub,
  ours,
  theirs,
  ourStatus,
  theirStatus,
  detail,
});

const ROWS: Row[] = (
  [
    [
      'Rating Sources',
      'Supported platforms',
      '12 live sources (Letterboxd, RT Audience, MAL, etc.)',
      'Limited to 1–3 basic sources (IMDb/TMDB)',
      'win',
      'partial',
      'Posterium natively fetches and blends scores from 12 different platforms in real-time, including niche platforms like MyAnimeList and Letterboxd. Competitors typically only support IMDb and TMDB.'
    ],
    [
      'Delivery Engine',
      'How you embed the poster',
      'Compressed v3 Edge URL — auto-updates everywhere',
      'Static image downloads (ratings get outdated)',
      'win',
      'loss',
      "Instead of returning a static image file that gets outdated the moment a score changes, Posterium returns a dynamic URL that recalculates and renders the poster on the edge every time it's requested."
    ],
    [
      'Score Normalization',
      'Unifying different scales',
      'Live math engine (e.g., auto-converts 86% to 8.6/10)',
      'Not available; requires manual edits',
      'win',
      'loss',
      "Different platforms use different scales (e.g., 100%, 10/10, 5/5). Posterium's math engine can automatically normalize all scores to a unified denominator (like /10) for a clean, consistent look."
    ],
    [
      'Textless & Logos',
      'Clean artwork support',
      'Auto-strip text + inject clean TV/Movie logos',
      'Requires Photoshop or static uploads',
      'win',
      'loss',
      "Posterium can automatically fetch 'textless' artwork (just the background art) and overlay clean, transparent vector logos of the movie or show title in the position of your choice."
    ],
    [
      'Typography Engine',
      'Custom text rendering',
      'Full control (kerning, line-height, wrapping, flow)',
      'Basic fixed-size fonts or none at all',
      'win',
      'loss',
      "Beyond just dropping text on an image, Posterium supports advanced typographic controls including line-height, letter-spacing, font weights, custom wrapping, and text-flow alignment."
    ],
    [
      'Visual Editor',
      'Customizing layouts',
      'Drag-and-drop glassmorphism with live preview',
      'Clunky forms or code-only setups',
      'win',
      'partial',
      "Our free drag-and-drop web builder lets you visually design your poster template and instantly generates the exact API URL needed to recreate it anywhere."
    ],
    [
      'Fallback Sources',
      'When TMDB fails...',
      'Native cascade (Fanart → Metahub → IMDb)',
      'Poster breaks or shows blank',
      'win',
      'loss',
      "If a poster isn't available on TMDB, Posterium automatically cascades through Fanart.tv, Metahub, and IMDb to ensure you never get a broken image link."
    ],
    [
      'Export Formats',
      'Vector and raster support',
      'Dynamic SVG, WebP, PNG, JPG',
      'Standard PNG/JPG only',
      'win',
      'partial',
      "While others lock you into basic PNGs, Posterium can export dynamic, responsive SVGs, high-compression WebP files, and standard JPEGs."
    ],
    [
      'Infrastructure',
      'API Keys & Hosting',
      'Full BYOK (OMDB, MDBList, TMDB) + Docker self-hosting',
      'Locked to their platform and servers',
      'win',
      'loss',
      "Bring your own API keys for TMDB, OMDB, and Fanart.tv to bypass global limits, or completely self-host the entire infrastructure using our provided Docker images."
    ],
    [
      'Pricing Model',
      'Cost to generate',
      '100% Free forever (MIT Open Source)',
      'Paid tiers, subscriptions, or credit systems',
      'win',
      'loss',
      "Posterium is 100% free and open-source under the MIT license. There are no paid tiers, no watermarks, and no premium features locked behind a paywall."
    ],
    [
      'Rate Limits',
      'API request caps',
      'Unlimited (Cloudflare Edge delivery)',
      'Strict daily/monthly request limits',
      'win',
      'loss',
      "Powered by Cloudflare Workers, the edge delivery network means there are virtually no rate limits for standard usage, unlike competitors that cap you at a few hundred requests a day."
    ],
    [
      'Account Access',
      'Registration requirements',
      'No account needed, ever',
      'Mandatory sign-ups & data collection',
      'win',
      'loss',
      "No registration, no email collection, no passwords. You can start generating posters immediately without ever creating an account."
    ],
  ] as const
).map(toRow);

const WIN_ICON = (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 12 12" 
    fill="none" 
    aria-hidden="true"
    style={{ filter: 'drop-shadow(0px 0px 4px rgba(196,124,46,0.6))' }}
  >
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

const CompRow = memo<{ row: Row; index: number; vis: boolean; isLast: boolean }>(({ row, index, vis, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const delay = `${index * 0.03}s`;
  
  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className="group cursor-pointer hover:bg-white/[0.015] transition-colors duration-300"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: isLast && !isOpen ? 'none' : '1px solid rgba(255,255,255,0.04)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}, background-color 0.3s ease`,
      }}
    >
      {/* Main Grid Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr' }}>
        <div style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <div
              className="syne-font group-hover:text-white transition-colors duration-300"
              style={{
                fontSize: 'clamp(12px, 1.4vw, 14px)',
                fontWeight: 700,
                color: 'rgba(235, 225, 200, 0.95)',
                marginBottom: row.sub ? 4 : 0,
                letterSpacing: '0.02em',
              }}
            >
              {row.feature}
            </div>
            {row.sub && (
              <div
                className="mono-font"
                style={{
                  fontSize: 'clamp(9px, 1vw, 10px)',
                  color: 'rgba(122,117,110,0.6)',
                  letterSpacing: '0.06em',
                  lineHeight: 1.5,
                }}
              >
                {row.sub}
              </div>
            )}
          </div>
          <ChevronDown 
            size={16} 
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
            padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 32px)',
            background: 'rgba(196,124,46,0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ marginTop: 2, flexShrink: 0 }}>{WIN_ICON}</span>
          <span
            className="body-font group-hover:text-[#E0A458] transition-colors duration-300"
            style={{
              fontSize: 'clamp(12px, 1.3vw, 13px)',
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
            padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 32px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ marginTop: 2, flexShrink: 0 }}>
            {row.theirStatus === 'loss' ? LOSS_ICON : PARTIAL_ICON}
          </span>
          <span
            className="body-font"
            style={{
              fontSize: 'clamp(12px, 1.3vw, 13px)',
              color: row.theirStatus === 'partial' ? 'rgba(180,150,80,0.7)' : 'rgba(122,117,110,0.6)',
              lineHeight: 1.5,
            }}
          >
            {row.theirs}
          </span>
        </div>
      </div>

      {/* Expandable Detail Section */}
      <div 
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s cubic-bezier(0.16,1,0.3,1)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
          borderTop: isOpen ? '1px solid rgba(196,124,46,0.1)' : '1px solid transparent',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 
            padding: '16px clamp(16px, 3vw, 32px)',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s'
          }}>
            <p 
              className="body-font" 
              style={{ 
                fontSize: 'clamp(12px, 1.3vw, 14px)', 
                color: 'rgba(224, 210, 180, 0.75)', 
                lineHeight: 1.6,
                maxWidth: '850px'
              }}
            >
              <strong style={{ color: 'rgba(196,124,46,0.9)' }}>Detail: </strong>
              {row.detail}
            </p>
          </div>
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
        paddingBottom: 'clamp(64px, 8vw, 120px)'
      }}
    >
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <SectionHeader
          tag="Head-to-head"
          title={
            <>
              THE SPEC
              <br />
              <span style={{ color: 'var(--film-amber)' }}>SHEET</span>
            </>
          }
          description="Every feature, side by side. No marketing fluff — just the technical realities of what the API actually supports. Click any row to learn more."
          padding="clamp(48px,6vw,80px) clamp(20px,5vw,64px) clamp(32px, 4vw, 48px)"
        />
      </div>
      
      <div style={{ padding: '0 clamp(16px, 4vw, 64px)', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Glassmorphism Card Container */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(14, 13, 11, 0.7) 0%, rgba(10, 9, 8, 0.9) 100%)',
            border: '1px solid rgba(196,124,46,0.15)',
            borderRadius: '20px',
            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
            // Notice: overflow: hidden is intentionally removed here so position: sticky works
          }}
        >
          {/* Sticky Header Row */}
          <div
            style={{
              position: 'sticky',
              top: 55, // Sits just underneath the main Navbar
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: '1.5fr 1px 1.2fr 1px 1.1fr',
              borderBottom: '1px solid rgba(196,124,46,0.3)',
              background: 'rgba(10, 9, 8, 0.95)',
              backdropFilter: 'blur(20px)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: '0 8px 16px -8px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '16px clamp(16px, 3vw, 32px)' }}>
              <span
                className="mono-font"
                style={{
                  fontSize: 10,
                  color: 'rgba(235, 225, 200, 0.6)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Feature Comparison
              </span>
            </div>
            <div style={{ background: 'rgba(196,124,46,0.2)' }} aria-hidden="true" />
            
            {/* Posterium Header with Glow */}
            <div
              style={{
                padding: '16px clamp(16px, 3vw, 32px)',
                background: 'linear-gradient(180deg, rgba(196,124,46,0.15) 0%, rgba(196,124,46,0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--film-amber)',
                  boxShadow: '0 0 10px rgba(196,124,46,0.8), 0 0 20px rgba(196,124,46,0.4)',
                  flexShrink: 0,
                }}
              />
              <span
                className="syne-font"
                style={{
                  fontSize: 13,
                  color: 'var(--film-amber)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  textShadow: '0 0 12px rgba(196,124,46,0.3)',
                }}
              >
                Posterium
              </span>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
            
            <div
              style={{
                padding: '16px clamp(16px, 3vw, 32px)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(122,117,110,0.3)',
                  flexShrink: 0,
                }}
              />
              <span
                className="syne-font"
                style={{
                  fontSize: 12,
                  color: 'rgba(122,117,110,0.6)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Others
              </span>
            </div>
          </div>
          
          {/* Table Rows */}
          <div style={{ 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            overflow: 'hidden' // Apply hidden here to clip the last row cleanly
          }}>
            {ROWS.map((row, i) => (
              <CompRow key={row.feature} row={row} index={i} vis={vis} isLast={i === ROWS.length - 1} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend Footer */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px clamp(16px, 4vw, 64px) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: WIN_ICON, label: 'Supported natively', color: 'rgba(196,124,46,0.8)' },
            { icon: PARTIAL_ICON, label: 'Partial / limited', color: 'rgba(180,150,80,0.6)' },
            { icon: LOSS_ICON, label: 'Not available', color: 'rgba(122,117,110,0.5)' },
          ].map(({ icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {icon}
              <span className="mono-font" style={{ fontSize: 10, color, letterSpacing: '0.08em' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <span
          className="mono-font"
          style={{ fontSize: 10, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.1em' }}
        >
          api.posterium.xyz/v3
        </span>
      </div>
    </section>
  );
});
ComparisonSection.displayName = 'ComparisonSection';