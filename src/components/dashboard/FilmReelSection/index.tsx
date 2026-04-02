import { memo, useEffect, useState } from 'react';
import DesktopReel from './DesktopReel';
import MobileReel from './MobileReel';

const FilmReelSection = memo(() => {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 769px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <section id="reel" aria-label="Film Reel Showcase">
      {isDesktop === null ? (
        <>
          <div className="desktop-reel-section">
            <DesktopReel />
          </div>
          <div className="mobile-reel-section">
            <MobileReel />
          </div>
        </>
      ) : isDesktop ? (
        <DesktopReel />
      ) : (
        <MobileReel />
      )}
    </section>
  );
});
FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;
