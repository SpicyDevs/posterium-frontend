// src/components/dashboard/sections/ComparisonSection.tsx
import { memo } from 'react';
import { useInView } from '@/lib/dashboard/hooks/index';
import { SprocketStrip } from '../primitives';
import { SectionHeader } from '@/components/dashboard/components/SectionHeader';

interface Row {
  feature: string;
  sub?: string;
  ours: string;
  theirs: string;
  ourStatus: 'win' | 'neutral';
  theirStatus: 'loss' | 'partial';
}

const toRow = ([feature, sub, ours, theirs, ourStatus, theirStatus]: readonly [
  string,
  string,
  string,
  string,
  Row['ourStatus'],
  Row['theirStatus'],
]): Row => ({
  feature,
  sub,
  ours,
  theirs,
  ourStatus,
  theirStatus,
});

const ROWS: Row[] = (
  [
    ['Price', 'Cost to generate posters', 'Free forever', 'Paid tiers or credits', 'win', 'loss'],
    [
      'Account required',
      'Do you need to register?',
      'No account, ever',
      'Registration required',
      'win',
      'loss',
    ],
    ['Rate limits', 'API call caps', 'Unlimited', 'Daily / monthly cap', 'win', 'loss'],
    [
      'Source code',
      'Can you inspect or fork it?',
      'MIT — fully open source',
      'Proprietary / closed',
      'win',
      'loss',
    ],
    [
      'Export formats',
      'Supported output types',
      'SVG · PNG · JPG · WebP',
      'PNG only',
      'win',
      'loss',
    ],
    [
      'Rating sources',
      'Supported scoring platforms',
      'IMDb · RT · Meta · TMDB · Letterboxd · MAL · AniList · more',
      '1–3 sources',
      'win',
      'partial',
    ],
    [
      'Delivery model',
      'How the poster reaches you',
      'Single URL — works in any img tag',
      'File download or API key call',
      'win',
      'partial',
    ],
    [
      'Score freshness',
      'Are ratings live or cached?',
      'Real-time — fetched on request',
      'Cached — hours to days old',
      'win',
      'partial',
    ],
    [
      'Textless posters',
      'Strip title text from artwork',
      'Supported via ?textless=1',
      'Not available',
      'win',
      'loss',
    ],
    [
      'Self-hosting',
      'Run on your own infra',
      'Yes — Docker / Node.js',
      'Not supported',
      'win',
      'loss',
    ],
    [
      'Visual editor',
      'No-code badge positioning',
      'Drag-and-drop with live preview',
      'None or basic form',
      'win',
      'partial',
    ],
    [
      'Anime support',
      'MAL / AniList IDs',
      'MAL and AniList badge sources',
      'Movies/TV only',
      'win',
      'loss',
    ],
  ] as const
).map(toRow);

const WIN_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5.5" stroke="rgba(196,124,46,0.5)" strokeWidth="0.8" />
    <path
      d="M3.5 6l2 2 3-3"
      stroke="#C47C2E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const LOSS_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="5.5" stroke="rgba(180,150,80,0.3)" strokeWidth="0.8" />
    <path d="M3.5 6h5" stroke="rgba(180,150,80,0.5)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const CompRow = memo<{ row: Row; index: number; vis: boolean }>(({ row, index, vis }) => {
  const delay = `${index * 0.04}s`;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        borderBottom: '1px solid rgba(255,255,255,0.032)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateX(0)' : 'translateX(-12px)',
        transition: `opacity 0.45s ease ${delay}, transform 0.45s ease ${delay}`,
      }}
    >
      <div style={{ padding: 'clamp(12px,2vw,18px) clamp(16px,3vw,28px)' }}>
        <div
          className="syne-font"
          style={{
            fontSize: 'clamp(10px,1.3vw,12px)',
            fontWeight: 700,
            color: 'var(--film-cream)',
            marginBottom: row.sub ? 3 : 0,
          }}
        >
          {row.feature}
        </div>
        {row.sub && (
          <div
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(122,117,110,0.4)',
              letterSpacing: '0.08em',
              lineHeight: 1.4,
            }}
          >
            {row.sub}
          </div>
        )}
      </div>
      <div style={{ background: 'rgba(196,124,46,0.08)' }} aria-hidden="true" />
      <div
        style={{
          padding: 'clamp(12px,2vw,18px) clamp(16px,3vw,28px)',
          background: 'rgba(196,124,46,0.025)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <span style={{ marginTop: 2, flexShrink: 0 }}>{WIN_ICON}</span>
        <span
          className="body-font"
          style={{
            fontSize: 'clamp(10px,1.2vw,11px)',
            color: 'rgba(196,124,46,0.85)',
            lineHeight: 1.5,
          }}
        >
          {row.ours}
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)' }} aria-hidden="true" />
      <div
        style={{
          padding: 'clamp(12px,2vw,18px) clamp(16px,3vw,28px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <span style={{ marginTop: 2, flexShrink: 0 }}>
          {row.theirStatus === 'loss' ? LOSS_ICON : PARTIAL_ICON}
        </span>
        <span
          className="body-font"
          style={{
            fontSize: 'clamp(10px,1.2vw,11px)',
            color:
              row.theirStatus === 'partial' ? 'rgba(180,150,80,0.55)' : 'rgba(122,117,110,0.45)',
            lineHeight: 1.5,
          }}
        >
          {row.theirs}
        </span>
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
      style={{ background: 'var(--film-black)', borderTop: '1px solid rgba(196,124,46,0.07)' }}
    >
      <div style={{ opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <SectionHeader
          tag="Why Posterium"
          title={
            <>
              THE SPEC
              <br />
              <span style={{ color: 'var(--film-amber)' }}>SHEET</span>
            </>
          }
          description="Every feature, side by side. No marketing copy — just what each tool actually does."
          padding="clamp(48px,6vw,80px) clamp(20px,5vw,64px) 0"
        />
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid rgba(196,124,46,0.06)',
        }}
      >
        <SprocketStrip count={48} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
          borderBottom: '2px solid rgba(196,124,46,0.14)',
          background: 'rgba(14,13,11,0.8)',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.5s ease 0.1s',
        }}
      >
        <div style={{ padding: '10px clamp(16px,3vw,28px)' }}>
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(122,117,110,0.35)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Feature
          </span>
        </div>
        <div style={{ background: 'rgba(196,124,46,0.08)' }} aria-hidden="true" />
        <div
          style={{
            padding: '10px clamp(16px,3vw,28px)',
            background: 'rgba(196,124,46,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--film-amber)',
              boxShadow: '0 0 6px rgba(196,124,46,0.6)',
              flexShrink: 0,
            }}
          />
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'var(--film-amber)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Posterium
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)' }} aria-hidden="true" />
        <div
          style={{
            padding: '10px clamp(16px,3vw,28px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(122,117,110,0.4)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Others
          </span>
        </div>
      </div>
      <div>
        {ROWS.map((row, i) => (
          <CompRow key={row.feature} row={row} index={i} vis={vis} />
        ))}
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid rgba(196,124,46,0.06)',
        }}
      >
        <SprocketStrip count={48} />
      </div>
      <div
        style={{
          padding: '12px clamp(20px,5vw,64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.6s ease 0.5s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { icon: WIN_ICON, label: 'Supported', color: 'rgba(196,124,46,0.6)' },
            { icon: PARTIAL_ICON, label: 'Partial / limited', color: 'rgba(180,150,80,0.5)' },
            { icon: LOSS_ICON, label: 'Not available', color: 'rgba(122,117,110,0.4)' },
          ].map(({ icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {icon}
              <span className="mono-font" style={{ fontSize: 7, color, letterSpacing: '0.1em' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <span
          className="mono-font"
          style={{ fontSize: 7, color: 'rgba(122,117,110,0.25)', letterSpacing: '0.1em' }}
        >
          {ROWS.length} comparisons · api.spicydevs.xyz
        </span>
      </div>
    </section>
  );
});
ComparisonSection.displayName = 'ComparisonSection';
