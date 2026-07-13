// src/components/shared/primitives.tsx
// Shared cinematic UI primitives used by both the Dashboard and Builder.
// Dashboard imports re-export these; Builder can import directly.
import React, { memo, useMemo } from 'react';

// ─── Sprocket holes ───────────────────────────────────────────────────────────
const HOLE_BASE: React.CSSProperties = {
  background: 'var(--film-black)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: 2,
  flexShrink: 0,
};

const MAX_HOLES = 64;
const HOLE_SIZES = Array.from({ length: MAX_HOLES }, (_, i) => ({
  w: i % 7 === 3 ? 23 : 20,
  h: i % 11 === 5 ? 15 : 13,
}));

interface SprocketStripProps {
  count?: number;
  vertical?: boolean;
  className?: string;
}
export const SprocketStrip = memo<SprocketStripProps>(
  ({ count = 30, vertical = false, className }) => {
    const holes = HOLE_SIZES.slice(0, Math.min(count, MAX_HOLES));
    const wrapStyle: React.CSSProperties = useMemo(
      () => ({
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: 'center',
        gap: vertical ? 10 : 18,
        padding: vertical ? '9px 5px' : '5px 9px',
        userSelect: 'none',
      }),
      [vertical]
    );
    return (
      <div aria-hidden="true" style={wrapStyle} className={className}>
        {holes.map(({ w, h }, key) => (
          <div
            key={key}
            style={{ ...HOLE_BASE, width: vertical ? h : w, height: vertical ? w : h }}
          />
        ))}
      </div>
    );
  }
);
SprocketStrip.displayName = 'SprocketStrip';

// ─── Amber tag ────────────────────────────────────────────────────────────────
const AMBER_TAG_BASE: React.CSSProperties = {
  background: 'rgba(196,124,46,0.1)',
  border: '1px solid rgba(196,124,46,0.28)',
  color: 'var(--film-amber)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  padding: '3px 9px',
  borderRadius: 2,
  display: 'inline-block',
};
export const AmberTag = memo<{ children: React.ReactNode; style?: React.CSSProperties }>(
  ({ children, style }) => (
    <span className="syne-font" style={style ? { ...AMBER_TAG_BASE, ...style } : AMBER_TAG_BASE}>
      {children}
    </span>
  )
);
AmberTag.displayName = 'AmberTag';

// ─── Film corner accents (used in hero, builder header, etc.) ─────────────────
type Corner = 'tl' | 'tr' | 'bl' | 'br';
const CORNER_STYLE = (c: Corner): React.CSSProperties => ({
  position: 'absolute',
  top: c.startsWith('t') ? 8 : 'auto',
  bottom: c.startsWith('b') ? 8 : 'auto',
  left: c.endsWith('l') ? 8 : 'auto',
  right: c.endsWith('r') ? 8 : 'auto',
  width: 10,
  height: 10,
  borderTop: c.startsWith('t') ? '1.5px solid rgba(196,124,46,0.4)' : 'none',
  borderBottom: c.startsWith('b') ? '1.5px solid rgba(196,124,46,0.4)' : 'none',
  borderLeft: c.endsWith('l') ? '1.5px solid rgba(196,124,46,0.4)' : 'none',
  borderRight: c.endsWith('r') ? '1.5px solid rgba(196,124,46,0.4)' : 'none',
  pointerEvents: 'none',
});
const CORNERS: Corner[] = ['tl', 'tr', 'bl', 'br'];

export const FilmCorners = memo<{ className?: string }>(({ className }) => (
  <>
    {CORNERS.map((c) => (
      <div key={c} aria-hidden="true" className={className} style={CORNER_STYLE(c)} />
    ))}
  </>
));
FilmCorners.displayName = 'FilmCorners';
