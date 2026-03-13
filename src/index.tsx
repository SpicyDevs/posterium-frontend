// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider, Route } from './Router';
import DynamicSEO from './DynamicSEO';
import './index.css';

const Dashboard = React.lazy(() => import('./dashboard'));
const Builder   = React.lazy(() => import('./builder'));

// Amber-branded loader — matches dashboard palette, visible on direct /build navigations
const Loader: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100dvh', background: '#070706',
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 6,
      background: 'linear-gradient(140deg, #C47C2E, #D4A245)',
      boxShadow: '0 0 24px rgba(196,124,46,0.35)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
    <style>{`@keyframes pulse{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}`}</style>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider>
        <DynamicSEO />
        <React.Suspense fallback={<Loader />}>
          <Route path="/" exact><Dashboard /></Route>
          <Route path="/build" exact><Builder /></Route>
        </React.Suspense>
      </RouterProvider>
    </HelmetProvider>
  </React.StrictMode>
);