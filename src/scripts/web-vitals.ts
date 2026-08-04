type MetricKey = 'lcp' | 'cls' | 'inp';

interface ShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

(() => {
  if ('performance' in window === false || 'PerformanceObserver' in window === false) return;
  try {
    const vitals: Partial<Record<MetricKey, number>> = {};
    const report = (metrics: Partial<Record<MetricKey, number>>) => {
      const data = { url: location.pathname, ...metrics };
      try {
        navigator.sendBeacon?.('https://api.posterium.xyz/vitals', JSON.stringify(data));
      } catch {
        // ignore: beacon is best-effort
      }
    };
    const obsLCP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) {
        vitals.lcp = entries[entries.length - 1].startTime;
        report(vitals);
      }
    });
    obsLCP.observe({ type: 'largest-contentful-paint', buffered: true } as PerformanceObserverInit);
    const obsCLS = new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries() as unknown as ShiftEntry[]) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
      vitals.cls = cls;
      report(vitals);
    });
    obsCLS.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);
    const obsINP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        vitals.inp = last.duration;
        report(vitals);
      }
    });
    obsINP.observe({ type: 'first-input', buffered: true } as PerformanceObserverInit);
    if ('EventTiming' in PerformanceObserver.supportedEntryTypes) {
      try {
        const obs = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const e of entries) {
            if (e.duration > 0) {
              vitals.inp = Math.max(vitals.inp || 0, e.duration);
              report(vitals);
            }
          }
        });
        obs.observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore: observer API availability varies
  }
})();

export {};
