// src/components/dashboard/Dashboard.tsx
import React from 'react';
import './dashboard.css';
import { MARQUEE_TITLES } from '@/lib/dashboard/constants';
import Nav from './Nav';
import HeroSection from './HeroSection';
import FilmReelSection from './FilmReelSection/index';
import { MarqueeTicker } from './primitives';
import {
  StatsBar,
  CombinedSection,
  CTASection,
  FooterSection,
  ComparisonSection,
} from './sections/index';



// ─────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  return (
    <>
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
          <HeroSection />

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          <FilmReelSection />

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          <StatsBar />

          <CombinedSection />

          <ComparisonSection />

          <CTASection />
        </main>

        <FooterSection />
      </div>
    </>
  );
};
export default Dashboard;
