// src/App.tsx
import React from 'react';
import { RouterProvider, Route } from './Router';
import Dashboard from './pages/Dashboard';
import BuilderApp from './BuilderApp';

const App: React.FC = () => (
  <RouterProvider>
    <Route path="/" exact>
      <Dashboard />
    </Route>
    <Route path="/build" exact>
      <BuilderApp />
    </Route>
  </RouterProvider>
);

export default App;