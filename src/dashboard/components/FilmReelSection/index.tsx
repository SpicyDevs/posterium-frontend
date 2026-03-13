// components/FilmReelSection/index.tsx
import { memo } from 'react';
import DesktopReel from './DesktopReel';
import MobileReel  from './MobileReel';

const FilmReelSection = memo(() => (
  <section id="reel" aria-label="Film Reel Showcase">
    {/* CSS media query (.desktop-reel-section / .mobile-reel-section) in styles.ts handles visibility */}
    <div className="desktop-reel-section"><DesktopReel /></div>
    <div className="mobile-reel-section"><MobileReel /></div>
  </section>
));

FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;