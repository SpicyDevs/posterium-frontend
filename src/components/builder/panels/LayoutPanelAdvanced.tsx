// src/components/builder/panels/LayoutPanelAdvanced.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import type { PresetType } from '../types';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 16 };
const INPUT: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-xs)',
  color: 'var(--film-cream)', fontSize: 12, padding: '7px 10px',
  outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
};

// 9-position preset grid
const PRESETS: { id: PresetType; symbol: string }[] = [
  { id: 'tl', symbol: '↖' }, { id: 'tc', symbol: '↑' }, { id: 'tr', symbol: '↗' },
  { id: 'lc', symbol: '←' }, { id: 'cc', symbol: '·' }, { id: 'rc', symbol: '→' },
  { id: 'bl', symbol: '↙' }, { id: 'bc', symbol: '↓' }, { id: 'br', symbol: '↘' },
];

const LayoutPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => (
  <div style={{ padding: 'var(--space-4)' }}>
    {/* 9-position preset grid */}
    <div style={ROW}>
      <label style={LABEL}>Position Preset</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-sm)',
          padding: 8,
        }}
      >
        {PRESETS.map(({ id, symbol }) => (
          <button
            key={id}
            onClick={() => setConfig((p) => ({ ...p, preset: id, layout: 'custom' }))}
            aria-pressed={config.preset === id}
            title={id.toUpperCase()}
            style={{
              minHeight: 36,
              background: config.preset === id ? 'rgba(196,124,46,0.2)' : 'transparent',
              border: '1px solid',
              borderColor: config.preset === id ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-xs)',
              color: config.preset === id ? 'var(--film-amber)' : 'var(--film-text-dim)',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>

    {/* Flow direction */}
    <div style={ROW}>
      <label style={LABEL}>Flow Direction</label>
      <select
        value={config.layout}
        onChange={(e) => setConfig((p) => ({ ...p, layout: e.target.value as any }))}
        style={INPUT}
      >
        <option value="row">Row (Horizontal)</option>
        <option value="col">Column (Vertical)</option>
        <option value="custom">Custom (Drag)</option>
      </select>
    </div>

    {/* Scale slider */}
    <div style={ROW}>
      <label style={LABEL}>
        Scale
        <span style={{ marginLeft: 6, color: 'var(--film-amber)', fontVariantNumeric: 'tabular-nums' }}>
          {((config.scale ?? 1.0) * 100).toFixed(0)}%
        </span>
      </label>
      <input
        type="range" min={0.5} max={2.0} step={0.05}
        value={config.scale ?? 1.0}
        onChange={(e) => setConfig((p) => ({ ...p, scale: Number(e.target.value) }))}
        style={{ width: '100%', accentColor: 'var(--film-amber)' }}
      />
    </div>

    {/* Uniform width toggle */}
    <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ ...LABEL, marginBottom: 0 }}>Uniform Badge Width</label>
      <button
        role="switch"
        aria-checked={config.uniformWidth ?? false}
        onClick={() => setConfig((p) => ({ ...p, uniformWidth: !p.uniformWidth }))}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: config.uniformWidth ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background var(--transition-fast)', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: config.uniformWidth ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left var(--transition-spring)',
        }} />
      </button>
    </div>
  </div>
);

export default LayoutPanelAdvanced;
