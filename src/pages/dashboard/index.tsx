// src/pages/dashboard/index.tsx
// ═══════════════════════════════════════════════════════════════════
// POSTERIUM — Cinematic Dashboard
// Aesthetic: Film Archive / Cinematheque
// ═══════════════════════════════════════════════════════════════════
import React, { useEffect } from 'react';
import { GLOBAL_CSS } from './styles';
import { MARQUEE_TITLES } from './constants';

import Nav                from './components/Nav';
import HeroSection        from './components/HeroSection';
import FilmReelSection    from './components/FilmReelSection';
import { MarqueeTicker }  from './components/primitives';
import {
  StatsBar,
  FeaturesSection,
  APISection,
  UseCasesSection,
  CTASection,
  FooterSection,
} from './components/sections';

// ── Shimmer keyframe — injected once, used by PosterFrame skeleton ─
const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

const Dashboard: React.FC = () => {
  // Inject Google Fonts once — idempotent guard prevents duplicates on HMR
  useEffect(() => {
    const FONT_ID = 'posterium-gf';
    if (document.getElementById(FONT_ID)) return;

    // Preconnect for faster font load
    const preconn = document.createElement('link');
    preconn.rel   = 'preconnect';
    preconn.href  = 'https://fonts.googleapis.com';
    document.head.appendChild(preconn);

    const preconn2 = document.createElement('link');
    preconn2.rel        = 'preconnect';
    preconn2.href       = 'https://fonts.gstatic.com';
    preconn2.crossOrigin = 'anonymous';
    document.head.appendChild(preconn2);

    const link   = document.createElement('link');
    link.id      = FONT_ID;
    link.rel     = 'stylesheet';
    link.href    =
      'https://fonts.googleapis.com/css2?family=Bebas+Neue' +
      '&family=Syne:wght@400;600;700;800' +
      '&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300' +
      '&family=JetBrains+Mono:wght@400;500' +
      '&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      {/* Global styles + shimmer */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + SHIMMER_CSS }} />

      {/* Film grain overlay */}
      <div className="grain-layer" aria-hidden="true" />

      {/* CRT scan lines */}
      <div className="scan-layer" aria-hidden="true" />

      {/* Accessibility: skip to main content */}
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
        onFocus={e  => { (e.currentTarget as HTMLElement).style.left = '8px'; }}
        onBlur={e   => { (e.currentTarget as HTMLElement).style.left = '-9999px'; }}
      >
        Skip to main content
      </a>

      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
          overflowX: 'hidden',
        }}
      >
        <Nav />

        <main id="main-content">
          <HeroSection />

          {/* Ticker between hero and reel */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={30} />

          <FilmReelSection />

          <StatsBar />

          {/* Ticker between stats and features */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={22} />

          <FeaturesSection />
          <APISection />
          <UseCasesSection />
          <CTASection />
        </main>

        <FooterSection />
      </div>
    </>
  );
};

export default Dashboard;