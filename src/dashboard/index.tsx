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
import FilmReelSection    from './components/FilmReelSection/index';
import BadgeAtlas         from './components/BadgeAtlas';
import PosterShowcase     from './components/PosterShowcase';
import { MarqueeTicker }  from './components/primitives';
import {
  StatsBar,
  FeaturesSection,
  UseCasesSection,
  CTASection,
  FooterSection,
} from './components/sections/index';

const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

const Dashboard: React.FC = () => {
  // Inject Google Fonts once — idempotent HMR guard
  useEffect(() => {
    const FONT_ID = 'posterium-gf';
    if (document.getElementById(FONT_ID)) return;

    const preconn = document.createElement('link');
    preconn.rel  = 'preconnect';
    preconn.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconn);

    const preconn2 = document.createElement('link');
    preconn2.rel         = 'preconnect';
    preconn2.href        = 'https://fonts.gstatic.com';
    preconn2.crossOrigin = 'anonymous';
    document.head.appendChild(preconn2);

    const link  = document.createElement('link');
    link.id     = FONT_ID;
    link.rel    = 'stylesheet';
    link.href   =
      'https://fonts.googleapis.com/css2?family=Bebas+Neue' +
      '&family=Syne:wght@400;600;700;800' +
      '&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300' +
      '&family=JetBrains+Mono:wght@400;500' +
      '&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + SHIMMER_CSS }} />

      {/* Film grain overlay */}
      <div className="grain-layer" aria-hidden="true" />

      {/* CRT scan lines */}
      <div className="scan-layer" aria-hidden="true" />

      {/* Skip-to-main */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', left: -9999, top: 8, zIndex: 9999,
          background: 'var(--film-amber)', color: '#070706',
          padding: '8px 14px', borderRadius: 4,
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
          textDecoration: 'none', letterSpacing: '0.06em',
        }}
        onFocus={e  => { (e.currentTarget as HTMLElement).style.left = '8px'; }}
        onBlur={e   => { (e.currentTarget as HTMLElement).style.left = '-9999px'; }}
      >
        Skip to main content
      </a>

      {/*
        !! CRITICAL !!
        No overflowX: hidden here — it would clip MobileReel's touch-scroll container.
        Horizontal overflow is clipped per-section where needed (HeroSection, etc).
        overflow-x: clip on the <html> element in global CSS handles page-level bleed.
      */}
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <Nav />

        <main id="main-content">
          {/* 1 — Hero */}
          <HeroSection />

          {/* Ticker separator */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={30} />

          {/* 2 — The Reel: horizontal parallax (desktop) / swipe (mobile) */}
          <FilmReelSection />

          {/* 3 — Badge Atlas: real API output 3×2 grid */}
          <BadgeAtlas />

          {/* Ticker separator */}
          <MarqueeTicker items={MARQUEE_TITLES} speed={22} />

          {/* 4 — The Manifest: animated stat docket */}
          <StatsBar />

          {/* 5 — Exposure Sheet: expandable feature rows */}
          <FeaturesSection />

          {/* 6 — The Print Room: accurate API poster output showcase */}
          <PosterShowcase />

          {/* 7 — Distribution Circuit: use-case rows */}
          <UseCasesSection />

          {/* 8 — The Slate: clapperboard CTA */}
          <CTASection />
        </main>

        <FooterSection />
      </div>
    </>
  );
};

export default Dashboard;