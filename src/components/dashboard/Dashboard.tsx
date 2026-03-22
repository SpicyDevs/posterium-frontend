// src/components/dashboard/Dashboard.tsx
import React from 'react';
import './dashboard.css';
import { GLOBAL_CSS } from '@/lib/dashboard/styles';
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

// Skeleton shimmer for poster card loading states — kept from original
const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// ─────────────────────────────────────────────────────────────────────
// ContentSection — content-visibility:auto for below-fold sections
// ─────────────────────────────────────────────────────────────────────
const ContentSection: React.FC<{ children: React.ReactNode; intrinsicH?: number }> = ({
  children,
  intrinsicH = 600,
}) => (
  <div
    style={{
      contentVisibility: 'auto',
      containIntrinsicSize: `0 ${intrinsicH}px`,
    } as React.CSSProperties}
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
      {/* Inject dashboard-specific styles */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + SHIMMER_CSS }} />

      <a
        href="#main-content"
        style={{
          position: 'absolute', left: -9999, top: 8, zIndex: 9999,
          background: 'var(--film-amber)', color: '#070706',
          padding: '8px 14px', borderRadius: 4,
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 11, textDecoration: 'none', letterSpacing: '0.06em',
        }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.left = '8px'; }}
        onBlur={(e)  => { (e.currentTarget as HTMLElement).style.left = '-9999px'; }}
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

          <ContentSection intrinsicH={2400}>
            <FilmReelSection />
          </ContentSection>

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          <ContentSection intrinsicH={320}>
            <StatsBar />
          </ContentSection>

          <ContentSection intrinsicH={640}>
            <CombinedSection />
          </ContentSection>

          <ContentSection intrinsicH={700}>
            <ComparisonSection />
          </ContentSection>

          <ContentSection intrinsicH={480}>
            <CTASection />
          </ContentSection>
        </main>

        <ContentSection intrinsicH={360}>
          <FooterSection />
        </ContentSection>
      </div>
    </>
  );
};

export default Dashboard;