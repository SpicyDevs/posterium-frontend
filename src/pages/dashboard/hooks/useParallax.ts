import { useEffect, useRef } from 'react';

export const useParallax = <T extends HTMLElement = HTMLDivElement>(speed: number = 0.25) => {
  const ref = useRef<T>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (ref.current) {
            // translateZ(0) forces GPU acceleration for smoother rendering
            ref.current.style.transform = `translateY(${window.scrollY * speed}px) translateZ(0)`;
          }
          rafRef.current = 0;
        });
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return ref;
};