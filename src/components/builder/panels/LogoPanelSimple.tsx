// src/components/builder/panels/LogoPanelSimple.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 14 };

const LogoPanelSimple: React.FC<PanelProps> = ({ config, setConfig }) => {
  if (!config.logo) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>🎬</span>
        <p style={{ color: 'var(--film-text-ghost)', fontSize: 12, lineHeight: 1.5, maxWidth: 200 }}>
          The logo overlay is currently disabled.
        </p>
        <button
          onClick={() => setConfig((p) => ({ ...p, logo: true }))}
          style={{ padding: '8px 16px', background: 'rgba(196,124,46,0.1)', border: '1px solid rgba(196,124,46,0.3)', borderRadius: 'var(--radius-xs)', color: 'var(--film-amber)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          Enable Logo
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ ...LABEL, marginBottom: 0 }}>Logo Enabled</label>
        <button role="switch" aria-checked={config.logo}
          onClick={() => setConfig((p) => ({ ...p, logo: !p.logo }))}
          style={{ width: 36, height: 20, borderRadius: 10, background: 'var(--film-amber)', border: 'none', cursor: 'pointer', position: 'relative' }}>
          <span style={{ position: 'absolute', top: 2, left: 18, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
        </button>
      </div>

      <div style={ROW}>
        <label style={LABEL}>
          Size
          <span style={{ marginLeft: 6, color: 'var(--film-amber)' }}>{config.logoW}×{config.logoH}</span>
        </label>
        <input type="range" min={40} max={400} step={4} value={config.logoW}
          onChange={(e) => setConfig((p) => {
            const w = Number(e.target.value);
            const ratio = p.logoH / p.logoW;
            return { ...p, logoW: w, logoH: Math.round(w * ratio) };
          })}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>

      <div style={ROW}>
        <label style={LABEL}>
          Opacity
          <span style={{ marginLeft: 6, color: 'var(--film-amber)' }}>{Math.round(config.logoOpacity * 100)}%</span>
        </label>
        <input type="range" min={0} max={1} step={0.02} value={config.logoOpacity}
          onChange={(e) => setConfig((p) => ({ ...p, logoOpacity: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>

      <div style={ROW}>
        <label style={LABEL}>
          Shadow
          <span style={{ marginLeft: 6, color: 'var(--film-amber)' }}>{config.logoShadow}px</span>
        </label>
        <input type="range" min={0} max={40} step={1} value={config.logoShadow}
          onChange={(e) => setConfig((p) => ({ ...p, logoShadow: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>
    </div>
  );
};

export default LogoPanelSimple;
