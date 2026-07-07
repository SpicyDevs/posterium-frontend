import React, { useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import type { ApiKeys, PosterConfig } from '../../types';

const ApiKeysPanel: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}> = ({ config, setConfig }) => {
  const [showTmdb, setShowTmdb] = useState(false);
  const [showFanart, setShowFanart] = useState(false);

  const updateKeys = useCallback(
    (key: keyof ApiKeys, value: string) =>
      setConfig((prev) => ({ ...prev, keys: { ...prev.keys, [key]: value } })),
    [setConfig]
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 32,
    paddingLeft: 10,
    paddingRight: 32,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: 'var(--film-pale)',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="space-y-3">
      <p
        className="body-font leading-relaxed"
        style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
      >
        Override the default API keys used to fetch ratings and posters. Stored in a browser cookie.
      </p>

      {[
        { key: 'tmdb' as const, label: 'TMDB Key', show: showTmdb, setShow: setShowTmdb },
        {
          key: 'fanart' as const,
          label: 'Fanart.tv Key',
          show: showFanart,
          setShow: setShowFanart,
        },
      ].map(({ key, label, show, setShow }) => (
        <div key={key} className="space-y-1.5">
          <p
            className="body-font"
            style={{ fontSize: 10, color: 'var(--film-text-dim)', fontWeight: 500 }}
          >
            {label}
          </p>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={config.keys?.[key] ?? ''}
              onChange={(e) => updateKeys(key, e.target.value)}
              placeholder={`Override default ${key === 'tmdb' ? 'TMDB' : 'Fanart.tv'} key`}
              style={inputStyle}
              className="focus:outline-none"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--film-text-dim)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
              }}
            >
              <Eye size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApiKeysPanel;
