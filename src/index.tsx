// src/index.tsx
// Dashboard is the primary route — imported synchronously so there is no
// Suspense fallback flash on first paint. Builder is secondary (code-split)
// and gets a structural skeleton that matches its two-sidebar layout.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider, Route, useRouter } from './Router';
import DynamicSEO from './DynamicSEO';
import NotFound from './NotFound';
import './index.css';

// ── Primary route: synchronous import — no fallback needed ────────
import Dashboard from './dashboard';

// ── Secondary route: lazy — show structural skeleton ─────────────
const Builder = React.lazy(() => import('./builder'));

// ── BuilderSkeleton ────────────────────────────────────────────────
// Matches the builder's two-sidebar + canvas layout so there is no
// layout shift when the real component mounts.
const SHIMMER = `
  @keyframes _sk_shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  ._sk {
    background: linear-gradient(110deg,#0f0f0d 25%,#1a1812 50%,#0f0f0d 75%);
    background-size: 200% 100%;
    animation: _sk_shimmer 1.5s linear infinite;
    border-radius: 4px;
  }
`;

const BuilderSkeleton: React.FC = () => (
  <>
    <style>{SHIMMER}</style>
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh', background: '#07070c', overflow: 'hidden',
      }}
    >
      {/* Nav bar */}
      <div
        style={{
          height: 52, flexShrink: 0,
          background: '#0b0b10',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12,
        }}
      >
        <div className="_sk" style={{ width: 120, height: 20 }} />
        <div style={{ flex: 1 }} />
        <div className="_sk" style={{ width: 72, height: 28 }} />
        <div className="_sk" style={{ width: 72, height: 28 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div
          style={{
            width: 300, flexShrink: 0,
            background: '#0b0b10',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          <div className="_sk" style={{ width: '100%', height: 36 }} />
          <div className="_sk" style={{ width: '70%', height: 12 }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="_sk" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="_sk" style={{ width: '80%', height: 10 }} />
                <div className="_sk" style={{ width: '55%', height: 8 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'auto' }}>
            <div className="_sk" style={{ width: '100%', height: 40 }} />
          </div>
        </div>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            background: '#090909',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Checkerboard pattern */}
          <div
            style={{
              position: 'absolute', inset: 0, opacity: 0.03,
              backgroundImage:
                'linear-gradient(45deg,#fff 25%,transparent 25%),' +
                'linear-gradient(-45deg,#fff 25%,transparent 25%),' +
                'linear-gradient(45deg,transparent 75%,#fff 75%),' +
                'linear-gradient(-45deg,transparent 75%,#fff 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0,0 10px,10px -10px,-10px 0',
            }}
          />
          {/* Poster skeleton */}
          <div
            className="_sk"
            style={{ width: 320, height: 480, borderRadius: 6, position: 'relative', zIndex: 1 }}
          />
        </div>

        {/* Right sidebar */}
        <div
          style={{
            width: 280, flexShrink: 0,
            background: '#0b0b10',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <div className="_sk" style={{ width: '60%', height: 12 }} />
          <div className="_sk" style={{ width: '100%', height: 32 }} />
          <div className="_sk" style={{ width: '100%', height: 32 }} />
          <div className="_sk" style={{ width: '60%', height: 12, marginTop: 8 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="_sk" style={{ width: '40%', height: 10 }} />
              <div className="_sk" style={{ width: '35%', height: 28 }} />
            </div>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="_sk" style={{ width: '100%', height: 36 }} />
            <div className="_sk" style={{ width: '100%', height: 36 }} />
          </div>
        </div>
      </div>
    </div>
  </>
);

// ── Route wrapper ────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  const { path } = useRouter();
  const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  const isKnown = ['/', '/build'].includes(normalizedPath);

  return (
    <>
      <Route path="/" exact>
        <Dashboard />
      </Route>
      <Route path="/build" exact>
        <Builder />
      </Route>
      {!isKnown && <NotFound />}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider>
        <DynamicSEO />
        <React.Suspense fallback={<BuilderSkeleton />}>
          <AppRoutes />
        </React.Suspense>
      </RouterProvider>
    </HelmetProvider>
  </React.StrictMode>
);