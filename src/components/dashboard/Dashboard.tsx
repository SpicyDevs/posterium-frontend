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
// ContentSection — content-visibility:auto for below-fold sections
// ─────────────────────────────────────────────────────────────────────
const ContentSection: React.FC<{ children: React.ReactNode; intrinsicH?: number }> = ({
  children,
  intrinsicH = 600,
}) => (
  <div
    style={
      {
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${intrinsicH}px`,
      } as React.CSSProperties
    }
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  return (
    <>
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
