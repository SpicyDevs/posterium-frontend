import type { ReactNode } from 'react';

export function StepTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="poster-font"
      style={{
        fontSize: 32,
        fontWeight: 400,
        color: 'var(--film-cream)',
        margin: 0,
        lineHeight: 1.1,
      }}
    >
      {children}
    </h1>
  );
}

export function StepSubtitle({ children }: { children: ReactNode }) {
  return (
    <p
      className="body-font"
      style={{
        fontSize: 13,
        color: 'var(--film-text-dim)',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 1.5,
      }}
    >
      {children}
    </p>
  );
}
