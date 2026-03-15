// src/pages/dashboard/components/primitives.tsx
import React, { memo } from 'react';

// ── SprocketStrip ─────────────────────────────────────────────────
// A row of film sprocket holes. count controls density.
// The gap and sizing are deliberately slightly inconsistent to avoid the
// "too perfect" AI look - real film sprockets have slight tolerance variance.
interface SprocketStripProps {
  count?: number;
  vertical?: boolean;
}

export const SprocketStrip = memo<SprocketStripProps>(({ count = 30, vertical = false }) => {
  // Intentional: real film stock has slight hole-to-hole pitch variation
  const holes = Array.from({ length: count }, (_, i) => ({
    key: i,
    // Every ~7th hole is very slightly wider - mimics manufacturing tolerance
    w: i % 7 === 3 ? 23 : 20,
    h: i % 11 === 5 ? 15 : 13,
  }));

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 10 : 18,
        padding: vertical ? '9px 5px' : '5px 9px',
        userSelect: 'none',
      }}
    >
      {holes.map(({ key, w, h }) => (
        <div
          key={key}
          style={{
            width: vertical ? h : w,
            height: vertical ? w : h,
            background: 'var(--film-black)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
});
SprocketStrip.displayName = 'SprocketStrip';

// ── FilmEdge ──────────────────────────────────────────────────────
// Vertical perforation strip for the sides of the hero section.
// Hidden on screens narrower than 900px via CSS class.
interface FilmEdgeProps {
  side: 'left' | 'right';
}

export const FilmEdge = memo<FilmEdgeProps>(({ side }) => (
  <div
    aria-hidden="true"
    className="film-perforation"
    style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      [side]: 0,
      width: 38,
      background: 'var(--film-dark)',
      borderRight: side === 'left' ? '1px solid rgba(255,255,255,0.05)' : 'none',
      borderLeft: side === 'right' ? '1px solid rgba(255,255,255,0.05)' : 'none',
      zIndex: 5,
      overflow: 'hidden',
    }}
  >
    <SprocketStrip count={22} vertical />
  </div>
));
FilmEdge.displayName = 'FilmEdge';

// ── AmberDivider ──────────────────────────────────────────────────
// Reusable horizontal gradient line.
export const AmberDivider = memo<{ width?: number | string; opacity?: number }>(
  ({ width = 160, opacity = 0.5 }) => (
    <div
      aria-hidden="true"
      style={{
        width,
        height: 1,
        background: 'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
        opacity,
        flexShrink: 0,
      }}
    />
  )
);
AmberDivider.displayName = 'AmberDivider';

// ── AmberTag ──────────────────────────────────────────────────────
export const AmberTag = memo<{ children: React.ReactNode; style?: React.CSSProperties }>(
  ({ children, style }) => (
    <span
      className="syne-font"
      style={{
        background: 'rgba(196,124,46,0.1)',
        border: '1px solid rgba(196,124,46,0.28)',
        color: 'var(--film-amber)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 9px',
        borderRadius: 2,
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </span>
  )
);
AmberTag.displayName = 'AmberTag';

// ── MarqueeTicker ─────────────────────────────────────────────────
// Continuous horizontal ticker between sections.
interface MarqueeTickerProps {
  items: string[];
  speed?: number; // seconds for full cycle
}

export const MarqueeTicker = memo<MarqueeTickerProps>(({ items, speed = 28 }) => {
  // Duplicate items so the scroll is seamless
  const doubled = [...items, ...items];

  return (
    <div
      aria-hidden="true"
      style={{
        overflow: 'hidden',
        background: 'var(--film-char)',
        borderTop: '1px solid rgba(196,124,46,0.12)',
        borderBottom: '1px solid rgba(196,124,46,0.12)',
        padding: '10px 0',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: 0,
          animation: `marquee-scroll ${speed}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="poster-font"
            style={{
              fontSize: 13,
              color: i % 2 === 0 ? 'var(--film-amber)' : 'rgba(122,117,110,0.5)',
              letterSpacing: '0.14em',
              paddingRight: 32,
            }}
          >
            {item}
            <span style={{ color: 'rgba(196,124,46,0.25)', marginLeft: 32 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
});
MarqueeTicker.displayName = 'MarqueeTicker';
