import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider, Route, useRouter } from './Router';
import DynamicSEO from './DynamicSEO';
import NotFound from './NotFound'; // <-- Add this
import './index.css';

const Dashboard = React.lazy(() => import('./dashboard'));
const Builder = React.lazy(() => import('./builder'));

const Loader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      background: '#070706',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: 'linear-gradient(140deg, #C47C2E, #D4A245)',
        boxShadow: '0 0 24px rgba(196,124,46,0.35)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }}
    />
    <style>{`@keyframes pulse{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1)}}`}</style>
  </div>
);

// Create a small wrapper to check if the route is known
const AppRoutes = () => {
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
      {!isKnown && <NotFound />} {/* Catch-all fallback */}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider>
        <DynamicSEO />
        <React.Suspense fallback={<Loader />}>
          <AppRoutes /> {/* Replaced the standalone routes with the wrapper */}
        </React.Suspense>
      </RouterProvider>
    </HelmetProvider>
  </React.StrictMode>
);
