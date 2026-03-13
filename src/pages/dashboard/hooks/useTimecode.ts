// hooks/useTimecode.ts
import { useState, useEffect } from 'react';

const fmt = (d: Date) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');

/** Live HH:MM:SS timecode, updates every second. */
export const useTimecode = () => {
  const [tc, setTc] = useState(() => fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTc(fmt(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return tc;
};