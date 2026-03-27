// src/components/builder/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { PosterConfig, ApiKeys } from './types';
import { DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import { EditorProvider } from './context/EditorContext';
import { usePosterHistory } from './hooks/usePosterHistory';
import StudioLayout from './layout/StudioLayout';

const STORAGE_KEY = 'posterium_config_v2';

// ── Cookie helpers ─────────────────────────────────────────────────────────────
const COOKIE_KEY = 'posterium_apikeys_v1';

const saveKeysToCookie = (keys: ApiKeys) => {
  try {
    const val = encodeURIComponent(JSON.stringify(keys));
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${val}; expires=${exp}; path=/; SameSite=Strict`;
  } catch { /* ignore */ }
};

const loadKeysFromCookie = (): ApiKeys => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    if (!match) return {};
    return JSON.parse(decodeURIComponent(match[1])) || {};
  } catch { return {}; }
};

// ── Root app ───────────────────────────────────────────────────────────────────
const BuilderApp: React.FC = () => {
  const { state: config, setState: setConfig, undo, redo, canUndo, canRedo } =
    usePosterHistory(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const cfg   = saved ? (JSON.parse(saved) as PosterConfig) : DEFAULT_CONFIG;
        const cookieKeys = loadKeysFromCookie();
        if (cookieKeys && Object.keys(cookieKeys).some(k => cookieKeys[k as keyof ApiKeys])) {
          return { ...cfg, keys: { ...cookieKeys, ...cfg.keys } };
        }
        return cfg;
      } catch {
        return DEFAULT_CONFIG;
      }
    });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  // Persist config to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Persist API keys to cookie
  useEffect(() => {
    if (config.keys) {
      const hasAnyKey = Object.values(config.keys).some(v => v && v.trim());
      if (hasAnyKey) saveKeysToCookie(config.keys);
    }
  }, [config.keys]);

  const handleLoadConfig = useCallback((url: string) => {
    setConfig(parseUrlToConfig(url));
    try { setBaseUrl(new URL(url).origin); } catch { /* keep current */ }
  }, [setConfig]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    window.dispatchEvent(new CustomEvent('reset-canvas-view'));
  }, [setConfig]);

  return (
    <EditorProvider>
      <StudioLayout
        config={config}
        setConfig={setConfig}
        handleReset={handleReset}
        baseUrl={baseUrl}
        handleLoadConfig={handleLoadConfig}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </EditorProvider>
  );
};

export default BuilderApp;
