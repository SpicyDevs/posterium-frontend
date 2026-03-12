// src/pages/dashboard/styles.ts
// Global CSS injected via <style> tag on mount.
// Additions: .atlas-cell, range input reset, distribution row, darkroom panel.

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --film-black:   #070706;
    --film-dark:    #0E0D0B;
    --film-mid:     #181612;
    --film-char:    #222018;
    --film-amber:   #C47C2E;
    --film-gold:    #D4A245;
    --film-pale:    #E8D8A8;
    --film-cream:   #F0E6CC;
    --film-white:   #FAF6EC;
    --film-silver:  #6E6860;
    --film-dust:    #453F37;
    --film-red:     #A82018;
    --film-border:  rgba(196,124,46,0.16);
    --film-glow:    rgba(196,124,46,0.07);
  }

  * { box-sizing: border-box; }

  .poster-font { font-family: 'Bebas Neue', cursive; letter-spacing: 0.04em; }
  .syne-font   { font-family: 'Syne', sans-serif; }
  .body-font   { font-family: 'DM Sans', sans-serif; }
  .mono-font   { font-family: 'JetBrains Mono', monospace; }

  /* ── Film grain ── */
  .grain-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    opacity: 0.032;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23g)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 186px 186px;
    animation: grain-anim 0.14s steps(1) infinite;
  }
  @keyframes grain-anim {
    0%   { transform: translate(0,0); }
    14%  { transform: translate(-3%,-4%); }
    28%  { transform: translate(4%,2%); }
    42%  { transform: translate(-2%,5%); }
    57%  { transform: translate(5%,-3%); }
    71%  { transform: translate(-4%,3%); }
    85%  { transform: translate(2%,-5%); }
  }

  /* ── Scan line ── */
  .scan-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 9998;
    background: repeating-linear-gradient(
      180deg,
      transparent 0px, transparent 3px,
      rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 4px
    );
  }

  /* ── Film flicker ── */
  @keyframes film-flicker {
    0%,98%,100% { opacity: 1; }
    98.5% { opacity: 0.88; }
    99%   { opacity: 0.96; }
    99.5% { opacity: 0.83; }
  }

  /* ── Reel spin ── */
  @keyframes reel-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Float variants ── */
  @keyframes float-a {
    0%,100% { transform: translateY(0px)   rotate(-1.2deg); }
    50%     { transform: translateY(-16px) rotate(0.8deg); }
  }
  @keyframes float-b {
    0%,100% { transform: translateY(-6px)  rotate(0.5deg); }
    50%     { transform: translateY(12px)  rotate(-0.7deg); }
  }
  @keyframes float-c {
    0%,100% { transform: translateY(4px)   rotate(-0.3deg); }
    50%     { transform: translateY(-10px) rotate(0.4deg); }
  }

  /* ── Marquee ── */
  @keyframes marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── Hero reveal ── */
  @keyframes hero-reveal {
    from { opacity: 0; transform: translateY(36px) skewY(0.8deg); }
    to   { opacity: 1; transform: translateY(0) skewY(0deg); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .h-a1 { animation: hero-reveal 1s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
  .h-a2 { animation: hero-reveal 1s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
  .h-a3 { animation: fade-up    0.9s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
  .h-a4 { animation: fade-up    0.9s cubic-bezier(0.16,1,0.3,1) 0.52s both; }
  .h-a5 { animation: fade-up    0.9s cubic-bezier(0.16,1,0.3,1) 0.68s both; }

  /* ── Amber pulse ── */
  @keyframes amber-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(196,124,46,0.4); }
    50%     { box-shadow: 0 0 0 8px rgba(196,124,46,0); }
  }

  /* ── Shimmer (PosterFrame skeleton + BadgeAtlas skeleton) ── */
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }

  /* ── Poster hover ── */
  .film-frame-wrap {
    position: relative; flex-shrink: 0; cursor: pointer;
    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1),
                z-index 0s linear 0.45s;
  }
  .film-frame-wrap:hover {
    transform: scale(1.06) translateY(-10px);
    z-index: 10;
    transition: transform 0.45s cubic-bezier(0.16,1,0.3,1), z-index 0s;
  }
  .film-frame-wrap .poster-detail-overlay {
    position: absolute; inset: 0; opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  .film-frame-wrap:hover .poster-detail-overlay { opacity: 1; }
  .film-frame-wrap::after {
    content: '';
    position: absolute; inset: 0; border-radius: 4px;
    background: repeating-linear-gradient(
      0deg, transparent 0px, transparent 3px,
      rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
    );
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .film-frame-wrap:hover::after { opacity: 1; }

  /* ── Atlas cell ── */
  .atlas-cell {
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
    background: #151310;
  }

  /* ── Feature card (legacy, kept for any stragglers) ── */
  .feat-card {
    background: var(--film-mid);
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 6px;
    transition: border-color 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease;
    position: relative; overflow: hidden;
  }
  .feat-card:hover {
    border-color: rgba(196,124,46,0.22);
    transform: translateY(-5px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,124,46,0.08);
  }

  /* ── Glow CTA ── */
  .glow-cta {
    box-shadow: 0 0 28px rgba(196,124,46,0.22), 0 4px 18px rgba(0,0,0,0.45);
    transition: box-shadow 0.3s ease, transform 0.25s ease, background 0.2s ease;
  }
  .glow-cta:hover {
    box-shadow: 0 0 48px rgba(196,124,46,0.42), 0 8px 30px rgba(0,0,0,0.55);
    transform: translateY(-2px);
  }
  .glow-cta:active { transform: translateY(0); }

  /* ── Code block ── */
  .code-block {
    background: #090806;
    border: 1px solid rgba(196,124,46,0.14);
    border-radius: 10px;
    overflow: hidden;
  }

  /* ── Custom range input reset ── */
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    height: 100%;
    margin: 0;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--film-amber);
    border: 1.5px solid rgba(7,7,6,0.8);
    margin-top: -5px;
    cursor: pointer;
  }
  input[type='range']::-moz-range-thumb {
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--film-amber);
    border: 1.5px solid rgba(7,7,6,0.8);
    cursor: pointer;
  }

  /* ── Custom select reset ── */
  select option { background: #0E0D0B; color: #F0E6CC; }

  /* ── Mobile swipe reel ── */
  .mobile-swipe {
    overflow-x: auto; scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
    display: flex; gap: 20px;
    padding: 28px 24px;
  }
  .mobile-swipe::-webkit-scrollbar { display: none; }
  .mobile-swipe > * { scroll-snap-align: start; }

  /* ── Use case card (legacy) ── */
  .uc-card {
    background: var(--film-mid);
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 8px; padding: 28px 22px;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    position: relative; overflow: hidden;
  }
  .uc-card:hover {
    border-color: var(--film-border);
    transform: translateY(-4px) rotate(0deg);
    box-shadow: 0 18px 44px rgba(0,0,0,0.5);
  }

  /* ── Amber divider ── */
  .amber-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(196,124,46,0.35), transparent);
  }

  /* ── Tooltip tag ── */
  .film-tag {
    background: rgba(196,124,46,0.1);
    border: 1px solid rgba(196,124,46,0.28);
    color: var(--film-amber); font-size: 9px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 2px;
    font-family: 'Syne', sans-serif;
    display: inline-block;
  }

  /* ── Rotated label ── */
  .rotated-label {
    transform: rotate(-90deg); transform-origin: center;
    font-family: 'Syne', sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(196,124,46,0.45);
    white-space: nowrap; user-select: none;
  }

  /* ── Custom scrollbar ── */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: var(--film-black); }
  ::-webkit-scrollbar-thumb { background: rgba(196,124,46,0.25); border-radius: 99px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .film-perforation { display: none !important; }
  }
  @media (max-width: 768px) {
    .nav-links-desktop { display: none !important; }
    .nav-mobile-toggle { display: flex !important; }
    .desktop-reel-section { display: none !important; }
    .mobile-reel-section  { display: block !important; }
  }
  @media (min-width: 769px) {
    .nav-mobile-toggle  { display: none !important; }
    .desktop-reel-section { display: block !important; }
    .mobile-reel-section  { display: none !important; }
  }

  /* LiveAPIDemo: stack vertically on narrow screens */
  @media (max-width: 720px) {
    #api > div[style*='gridTemplateColumns'] {
      grid-template-columns: 1fr !important;
    }
  }

  /* BadgeAtlas: 2 columns on mobile */
  @media (max-width: 600px) {
    #atlas > div[style*='gridTemplateColumns: repeat(3'] {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  /* Distribution circuit: simplify on small screens */
  @media (max-width: 640px) {
    #use-cases > div[style*='gridTemplateColumns'] {
      grid-template-columns: 64px 1fr !important;
    }
    #use-cases > div[style*='gridTemplateColumns'] > div:last-child {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;