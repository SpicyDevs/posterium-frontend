// src/dashboard/index.tsx
// ═══════════════════════════════════════════════════════════════════
// POSTERIUM - Cinematic Dashboard
// ═══════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { GLOBAL_CSS } from './styles';
import { MARQUEE_TITLES } from './constants';

import Nav from './components/Nav';
import HeroSection from './components/HeroSection';
import FilmReelSection from './components/FilmReelSection/index';
import BadgeAtlas from './components/BadgeAtlas';
import { MarqueeTicker } from './components/primitives';
import {
  StatsBar,
  CombinedSection,
  CTASection,
  FooterSection,
} from './components/sections/index';

const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// ── First-visit B&W → color flicker ─────────────────────────────
// Applied via CSS animation on the root wrapper. Only runs once;
// localStorage prevents repeat on reload.
const COLORIZE_CSS = `
  .intro-colorize {
    animation: intro-colorize 5.2s ease-out forwards;
  }
  @keyframes intro-colorize {
    /* Hold grayscale for ~60% of duration */
    0%    { filter: grayscale(1) contrast(1.06) brightness(0.88); }
    57%   { filter: grayscale(1) contrast(1.06) brightness(0.88); }

    /* Static burst 1 */
    58%   { filter: grayscale(0) contrast(1.18) brightness(1.12) saturate(1.3); }
    59%   { filter: grayscale(1) contrast(0.92) brightness(0.82); }

    /* Static burst 2 */
    61%   { filter: grayscale(0) contrast(1.1) brightness(1.06); }
    62.5% { filter: grayscale(0.85) contrast(0.96); }

    /* Static burst 3 */
    64%   { filter: grayscale(0) brightness(1.08); }
    65.5% { filter: grayscale(0.5) contrast(1.02); }

    /* Decay to full color */
    68%   { filter: grayscale(0) brightness(1.04); }
    72%   { filter: grayscale(0.18); }
    76%   { filter: grayscale(0); }
    100%  { filter: grayscale(0); }
  }
`;

const Dashboard: React.FC = () => {
  // Determine first-visit state once - never re-compute
  const [isFirstVisit] = useState<boolean>(() => {
    try {
      const KEY = 'posterium-visited-v2';
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, '1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Inject Google Fonts once - idempotent HMR guard
  useEffect(() => {
    const FONT_ID = 'posterium-gf';
    if (document.getElementById(FONT_ID)) return;

    const preconn = document.createElement('link');
    preconn.rel = 'preconnect';
    preconn.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconn);

    const preconn2 = document.createElement('link');
    preconn2.rel = 'preconnect';
    preconn2.href = 'https://fonts.gstatic.com';
    preconn2.crossOrigin = 'anonymous';
    document.head.appendChild(preconn2);

    const link = document.createElement('link');
    link.id = FONT_ID;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Bebas+Neue' +
      '&family=Syne:wght@400;600;700;800' +
      '&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300' +
      '&family=JetBrains+Mono:wght@400;500' +
      '&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: GLOBAL_CSS + SHIMMER_CSS + COLORIZE_CSS,
        }}
      />

      {/* Film grain overlay */}
      <div className="grain-layer" aria-hidden="true" />

      {/* CRT scan lines */}
      <div className="scan-layer" aria-hidden="true" />

      {/* Skip-to-main */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: -9999,
          top: 8,
          zIndex: 9999,
          background: 'var(--film-amber)',
          color: '#070706',
          padding: '8px 14px',
          borderRadius: 4,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: 11,
          textDecoration: 'none',
          letterSpacing: '0.06em',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLElement).style.left = '8px';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.left = '-9999px';
        }}
      >
        Skip to main content
      </a>

      {/*
        CRITICAL: No overflowX: hidden here - clips MobileReel touch-scroll.
        overflow-x: clip on <html> in global CSS handles page-level bleed.
      */}
      <div
        // Apply B&W intro only on first visit
        className={isFirstVisit ? 'intro-colorize' : undefined}
        style={{
          minHeight: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <Nav />

        <main id="main-content">
          {/* 1 - Hero: left text + right poster grid */}
          <HeroSection />

          {/* Ticker */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          {/* 2 - The Reel: collage parallax */}
          <FilmReelSection />

          {/* 3 - Contact Sheet: 4×3 badge showcase */}
          <BadgeAtlas />

          {/* Ticker */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          {/* 4 - Stats docket */}
          <StatsBar />

          {/* 5 - Combined: Features + Integrations */}
          <CombinedSection />

          {/* 6 - Slate CTA */}
          <CTASection />
        </main>

        <FooterSection />
      </div>
    </>
  );
};

export default Dashboard;