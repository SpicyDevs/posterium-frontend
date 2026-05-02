// src/components/builder/panels/SourcePanelAdvanced.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import type { SourceType } from '../types';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const INPUT: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xs)',
  color: 'var(--film-cream)', fontSize: 12, padding: '7px 10px',
  outline: 'none', fontFamily: 'inherit',
};
const ROW: React.CSSProperties = { marginBottom: 16 };

const SOURCES: { value: SourceType; label: string }[] = [
  { value: 'tmdb', label: 'TMDB' },
  { value: 'fanart', label: 'Fanart.tv' },
  { value: 'metahub', label: 'MetaHub' },
  { value: 'mal', label: 'MyAnimeList' },
  { value: 'anilist', label: 'AniList' },
  { value: 'imdb', label: 'IMDb' },
];

const SourcePanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => (
  <div style={{ padding: 'var(--space-4)' }}>
    <div style={ROW}>
      <label style={LABEL}>IMDb ID</label>
      <input
        type="text"
        placeholder="tt9419884"
        defaultValue={config.imdbId}
        style={INPUT}
        onBlur={(e) => {
          const v = e.target.value.trim();
          setConfig((p) => ({ ...p, imdbId: v || undefined, tmdbId: v ? '' : p.tmdbId }));
        }}
      />
    </div>
    <div style={ROW}>
      <label style={LABEL}>TMDB ID</label>
      <input
        type="text"
        placeholder="123456"
        defaultValue={config.tmdbId}
        style={INPUT}
        onBlur={(e) => {
          const v = e.target.value.trim();
          setConfig((p) => ({ ...p, tmdbId: v, imdbId: v ? undefined : p.imdbId }));
        }}
      />
    </div>
    <div style={ROW}>
      <label style={LABEL}>Media Type</label>
      <select
        value={config.mediaType}
        onChange={(e) => setConfig((p) => ({ ...p, mediaType: e.target.value as any }))}
        style={{ ...INPUT, cursor: 'pointer' }}
      >
        <option value="movie">Movie</option>
        <option value="tv">TV Show</option>
        <option value="anime">Anime</option>
      </select>
    </div>
    <div style={ROW}>
      <label style={LABEL}>Poster Source</label>
      <select
        value={config.source}
        onChange={(e) => setConfig((p) => ({ ...p, source: e.target.value as SourceType }))}
        style={{ ...INPUT, cursor: 'pointer' }}
      >
        {SOURCES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
    <div style={ROW}>
      <label style={LABEL}>Poster Type (ptype)</label>
      <input
        type="text"
        placeholder="auto"
        defaultValue={config.ptype}
        style={INPUT}
        onBlur={(e) => setConfig((p) => ({ ...p, ptype: e.target.value.trim() || 'auto' }))}
      />
    </div>
    <div style={{ ...ROW, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>
      <label style={{ ...LABEL, marginBottom: 12 }}>API Keys (stored locally)</label>
      {(['tmdb', 'fanart', 'omdb', 'mdblist'] as const).map((key) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <label style={{ ...LABEL, fontSize: 9 }}>{key.toUpperCase()}</label>
          <input
            type="password"
            placeholder={`${key} API key`}
            defaultValue={config.keys?.[key] ?? ''}
            style={{ ...INPUT, fontSize: 11 }}
            onBlur={(e) =>
              setConfig((p) => ({
                ...p,
                keys: { ...p.keys, [key]: e.target.value.trim() || undefined },
              }))
            }
          />
        </div>
      ))}
    </div>
  </div>
);

export default SourcePanelAdvanced;
