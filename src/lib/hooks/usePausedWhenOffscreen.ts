// src/lib/hooks/usePausedWhenOffscreen.ts
import { useState, useEffect, useRef } from 'react';

export function usePausedWhenOffscreen<T extends HTMLElement>() {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: 0.1
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
