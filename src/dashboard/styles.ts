// src/dashboard/styles.ts
//
// GLOBAL_CSS and SHIMMER_CSS have been moved to dashboard.css (static file).
// Only the CRT intro animation stays here because it is injected client-side
// only on first visit (localStorage check) via a useEffect in dashboard/index.tsx.
// Including it in the static CSS file would add ~4 KB of keyframes to every page
// load and cause an SSR/hydration mismatch for the page-level filter class.

export const CRT_CSS = `
  /* ── [A] Page colour filter ── */
  .crt-page {
    animation: crt-colorize 7s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  @keyframes crt-colorize {
    0%    { filter: grayscale(1) brightness(0) contrast(1.4); }
    6.5%  { filter: grayscale(1) brightness(4.5) contrast(3.0); }
    10%   { filter: grayscale(1) brightness(0.2) contrast(1.6); }
    16%   { filter: grayscale(1) brightness(2.2) contrast(2.0); }
    22%   { filter: grayscale(1) contrast(1.10) brightness(0.85); }
    59%   { filter: grayscale(1) contrast(1.10) brightness(0.85); }
    62%   { filter: grayscale(0) brightness(1.7) contrast(1.8) saturate(4.0) hue-rotate(12deg); }
    64%   { filter: grayscale(1) brightness(0.72) contrast(1.15); }
    67%   { filter: grayscale(0) brightness(1.45) contrast(1.5) saturate(3.2); }
    69%   { filter: grayscale(1) brightness(0.80) contrast(1.08); }
    72%   { filter: grayscale(0) brightness(1.28) contrast(1.35) saturate(2.4); }
    74%   { filter: grayscale(0.38) brightness(0.94) contrast(1.04); }
    78%   { filter: grayscale(0) brightness(1.16) contrast(1.20) saturate(1.8); }
    86%   { filter: grayscale(0) brightness(1.06) saturate(1.24); }
    93%   { filter: grayscale(0) saturate(1.06); }
    100%  { filter: grayscale(0); }
  }

  /* ── [B] Static noise layer ── */
  .crt-noise {
    position: fixed; inset: 0; z-index: 99998; pointer-events: none;
    animation: crt-noise-fade 7s linear forwards;
  }
  @keyframes crt-noise-fade {
    0%    { opacity: 0; }
    5%    { opacity: 0.72; }
    20%   { opacity: 0.55; }
    55%   { opacity: 0.48; }
    60%   { opacity: 0.82; }
    63%   { opacity: 0.28; }
    66%   { opacity: 0.76; }
    69%   { opacity: 0.24; }
    72%   { opacity: 0.58; }
    77%   { opacity: 0.10; }
    85%   { opacity: 0; }
    100%  { opacity: 0; }
  }

  /* ── [C] Brightness / scanline overlay ── */
  .crt-overlay {
    position: fixed; inset: 0; z-index: 99997; pointer-events: none;
    background: repeating-linear-gradient(
      180deg,
      rgba(0,0,0,0)   0px, rgba(0,0,0,0)   2px,
      rgba(0,0,0,0.28) 2px, rgba(0,0,0,0.28) 4px
    );
    animation: crt-overlay-anim 7.5s linear forwards;
    mix-blend-mode: multiply;
  }
  @keyframes crt-overlay-anim {
    0%    { opacity: 1; background-color: #000; }
    6.5%  { opacity: 1; background-color: rgba(255,255,255,0.9); }
    10%   { opacity: 1; background-color: rgba(0,0,0,0.8); }
    16%   { opacity: 1; background-color: rgba(255,255,255,0.6); }
    22%   { opacity: 1; background-color: rgba(0,0,0,0.55); }
    35%   { opacity: 0.85; background-color: rgba(0,0,0,0.45); }
    55%   { opacity: 0.80; background-color: rgba(0,0,0,0.40); }
    60%   { opacity: 1;    background-color: rgba(255,255,255,0.4); }
    63%   { opacity: 0.75; background-color: rgba(0,0,0,0.38); }
    66%   { opacity: 0.95; background-color: rgba(255,255,255,0.35); }
    69%   { opacity: 0.72; background-color: rgba(0,0,0,0.35); }
    72%   { opacity: 0.88; background-color: rgba(255,255,255,0.2); }
    78%   { opacity: 0.55; background-color: transparent; }
    88%   { opacity: 0.20; background-color: transparent; }
    96%   { opacity: 0;    background-color: transparent; }
    100%  { opacity: 0;    background-color: transparent; }
  }

  @keyframes turbulence-shift {
    0%   { filter: url(#crt-static) brightness(1.0); }
    25%  { filter: url(#crt-static) brightness(1.4); }
    50%  { filter: url(#crt-static) brightness(0.7); }
    75%  { filter: url(#crt-static) brightness(1.2); }
    100% { filter: url(#crt-static) brightness(0.9); }
  }
`;
