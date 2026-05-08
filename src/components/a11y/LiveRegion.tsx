import React, { createContext, memo, useCallback, useContext, useState } from 'react';

interface LiveRegionContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export const LiveRegionProvider: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (politeness === 'assertive') {
      setAssertiveMessage('');
      window.setTimeout(() => setAssertiveMessage(message), 30);
      return;
    }

    setPoliteMessage('');
    window.setTimeout(() => setPoliteMessage(message), 30);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          border: 0,
        }}
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          border: 0,
        }}
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
});

LiveRegionProvider.displayName = 'LiveRegionProvider';

export const useLiveRegion = (): LiveRegionContextValue['announce'] => {
  const ctx = useContext(LiveRegionContext);
  return ctx?.announce ?? (() => undefined);
};
