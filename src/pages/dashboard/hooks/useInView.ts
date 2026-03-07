import { useRef, useState, useEffect } from 'react';

type Callback = (isVisible: boolean) => void;

// Singleton observers mapped by threshold
const observers = new Map<number, IntersectionObserver>();
// WeakMap to store callbacks for each element, avoiding memory leaks
const callbacks = new WeakMap<Element, Callback>();

const getObserver = (threshold: number) => {
  if (!observers.has(threshold)) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target);
            if (cb) {
              cb(true);
              observer.unobserve(entry.target);
              callbacks.delete(entry.target);
            }
          }
        });
      },
      { threshold }
    );
    observers.set(threshold, observer);
  }
  return observers.get(threshold)!;
};

export const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = getObserver(threshold);
    
    callbacks.set(el, setInView);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, [threshold]);

  return { ref, inView };
};