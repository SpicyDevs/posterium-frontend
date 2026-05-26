// src/components/dashboard/Dashboard.tsx
import React from 'react';
import './dashboard.css';
import { MARQUEE_TITLES } from '@/lib/dashboard/constants';
import Nav from './Nav';
import HeroSection from './HeroSection';
import FilmReelSection from './FilmReelSection/index';
import { MarqueeTicker } from './primitives';
import { StatsBar } from './sections/StatsBar';
import { CombinedSection } from './sections/CombinedSection';
import { ComparisonSection } from './sections/ComparisonSection';
import { CTASection } from './sections/CTASection';
import { FooterSection } from './sections/FooterSection';

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

          <ContentSection intrinsicH={260}>
            <StatsBar />
          </ContentSection>

          <ContentSection intrinsicH={1200}>
            <CombinedSection />
          </ContentSection>

          <ContentSection intrinsicH={900}>
            <ComparisonSection />
          </ContentSection>

          <ContentSection intrinsicH={380}>
            <CTASection />
          </ContentSection>
        </main>
        <ContentSection intrinsicH={260}>
          <FooterSection />
        </ContentSection>
      </div>
    </>
  );
};
export default Dashboard;
