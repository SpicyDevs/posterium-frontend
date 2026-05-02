// src/components/builder/panels/PosterPanelAdvanced.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 16 };

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, checked, onChange }) => (
  <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <label style={{ ...LABEL, marginBottom: 0 }}>{label}</label>
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background var(--transition-fast)', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left var(--transition-spring)',
      }} />
    </button>
  </div>
);

const PosterPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => (
  <div style={{ padding: 'var(--space-4)' }}>
    <ToggleRow
      label="Textless Poster"
      checked={config.textless}
      onChange={() => setConfig((p) => ({ ...p, textless: !p.textless }))}
    />
    <ToggleRow
      label="Grayscale"
      checked={config.grayscale}
      onChange={() => setConfig((p) => ({ ...p, grayscale: !p.grayscale }))}
    />
    <ToggleRow
      label="No Embed"
      checked={config.noEmbed ?? false}
      onChange={() => setConfig((p) => ({ ...p, noEmbed: !p.noEmbed }))}
    />
    <div style={ROW}>
      <label style={LABEL}>
        Blur
        <span style={{ marginLeft: 6, color: 'var(--film-amber)', fontVariantNumeric: 'tabular-nums' }}>
          {config.posterBlur}px
        </span>
      </label>
      <input
        type="range" min={0} max={30} step={1}
        value={config.posterBlur}
        onChange={(e) => setConfig((p) => ({ ...p, posterBlur: Number(e.target.value) }))}
        style={{ width: '100%', accentColor: 'var(--film-amber)' }}
      />
    </div>
  </div>
);

export default PosterPanelAdvanced;
