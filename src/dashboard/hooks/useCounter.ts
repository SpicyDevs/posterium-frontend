// hooks/useCounter.ts
import { useState, useEffect } from 'react';

/** Eased numeric counter from 0 → target, triggered by `trigger` flag. */
export const useCounter = (target: number, duration = 1600, trigger = true) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration, trigger]);
  return val;
};