import { memo } from 'react';
import DesktopReel from './DesktopReel';
import MobileReel from './MobileReel';

const FilmReelSection = memo(() => (
  <section id="reel" aria-label="Film Reel Showcase">
    <div className="desktop-reel-section"><DesktopReel /></div>
    <div className="mobile-reel-section"><MobileReel /></div>
  </section>
));
FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;
