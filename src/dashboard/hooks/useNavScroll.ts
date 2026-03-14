// hooks/useNavScroll.ts
import { useState, useEffect } from 'react';

/** Returns true once the page has scrolled past `threshold` pixels. */
export const useNavScroll = (threshold = 40) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);
  return scrolled;
};
