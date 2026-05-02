// src/components/builder/panels/LogoPanelAdvanced.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 14 };
const INPUT: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xs)',
  color: 'var(--film-cream)', fontSize: 12, padding: '6px 10px',
  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
};

const LogoPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => {
  if (!config.logo) {
    return (
      <div style={{
        padding: 'var(--space-8)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center',
      }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>🎬</span>
        <p style={{ color: 'var(--film-text-ghost)', fontSize: 12, lineHeight: 1.5 }}>
          Logo overlay is disabled.
        </p>
        <button
          onClick={() => setConfig((p) => ({ ...p, logo: true }))}
          style={{
            padding: '8px 16px', background: 'rgba(196,124,46,0.1)',
            border: '1px solid rgba(196,124,46,0.3)', borderRadius: 'var(--radius-xs)',
            color: 'var(--film-amber)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          Enable Logo
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {/* Disable */}
      <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ ...LABEL, marginBottom: 0 }}>Logo Enabled</label>
        <button role="switch" aria-checked={config.logo}
          onClick={() => setConfig((p) => ({ ...p, logo: !p.logo }))}
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: 'var(--film-amber)',
            border: 'none', cursor: 'pointer', position: 'relative',
          }}>
          <span style={{
            position: 'absolute', top: 2, left: 18,
            width: 16, height: 16, borderRadius: '50%', background: '#fff',
          }} />
        </button>
      </div>

      <div style={ROW}>
        <label style={LABEL}>Source</label>
        <select value={config.logoSource ?? 'fanart'}
          onChange={(e) => setConfig((p) => ({ ...p, logoSource: e.target.value as any }))}
          style={INPUT}>
          <option value="fanart">Fanart.tv</option>
          <option value="tmdb">TMDB</option>
          <option value="metahub">MetaHub</option>
        </select>
      </div>

      <div style={ROW}>
        <label style={LABEL}>Width<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.logoW}px</span></label>
        <input type="range" min={40} max={400} step={4} value={config.logoW}
          onChange={(e) => setConfig((p) => ({ ...p, logoW: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>
      <div style={ROW}>
        <label style={LABEL}>Height<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.logoH}px</span></label>
        <input type="range" min={20} max={200} step={2} value={config.logoH}
          onChange={(e) => setConfig((p) => ({ ...p, logoH: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>
      <div style={ROW}>
        <label style={LABEL}>Opacity<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{Math.round(config.logoOpacity * 100)}%</span></label>
        <input type="range" min={0} max={1} step={0.02} value={config.logoOpacity}
          onChange={(e) => setConfig((p) => ({ ...p, logoOpacity: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>
      <div style={ROW}>
        <label style={LABEL}>Shadow<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.logoShadow}px</span></label>
        <input type="range" min={0} max={40} step={1} value={config.logoShadow}
          onChange={(e) => setConfig((p) => ({ ...p, logoShadow: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
      </div>

      {/* Background panel */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
        <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ ...LABEL, marginBottom: 0 }}>Background</label>
          <button role="switch" aria-checked={config.logoBgEnabled}
            onClick={() => setConfig((p) => ({ ...p, logoBgEnabled: !p.logoBgEnabled }))}
            style={{
              width: 36, height: 20, borderRadius: 10,
              background: config.logoBgEnabled ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background var(--transition-fast)',
            }}>
            <span style={{
              position: 'absolute', top: 2, left: config.logoBgEnabled ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left var(--transition-spring)',
            }} />
          </button>
        </div>

        {config.logoBgEnabled && (
          <>
            <div style={ROW}>
              <label style={LABEL}>Padding<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.logoBgPadding}px</span></label>
              <input type="range" min={0} max={40} step={2} value={config.logoBgPadding}
                onChange={(e) => setConfig((p) => ({ ...p, logoBgPadding: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
            </div>
            <div style={ROW}>
              <label style={LABEL}>Radius<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.logoBgRadius}px</span></label>
              <input type="range" min={0} max={40} step={2} value={config.logoBgRadius}
                onChange={(e) => setConfig((p) => ({ ...p, logoBgRadius: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogoPanelAdvanced;
