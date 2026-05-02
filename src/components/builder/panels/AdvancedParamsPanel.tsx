// src/components/builder/panels/AdvancedParamsPanel.tsx
import React from 'react';
import { Info } from 'lucide-react';
import type { PanelProps } from '../components/AdvancedPanelArea';

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
  outline: 'none', fontFamily: 'inherit',
};

interface InfoRowProps { label: string; tip: string; children: React.ReactNode; }
const InfoRow: React.FC<InfoRowProps> = ({ label, tip, children }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div style={ROW}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <label style={{ ...LABEL, marginBottom: 0 }}>{label}</label>
        <span style={{ position: 'relative' }}>
          <button onClick={() => setShow((v) => !v)} aria-label={`Info about ${label}`}
            style={{ background: 'none', border: 'none', color: 'var(--film-text-ghost)', cursor: 'pointer', display: 'flex', padding: 2 }}>
            <Info size={11} />
          </button>
          {show && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, width: 200, background: 'var(--film-mid)', border: '1px solid rgba(196,124,46,0.25)', borderRadius: 'var(--radius-sm)', padding: 8, fontSize: 10, color: 'var(--film-text-label)', lineHeight: 1.5, zIndex: 100 }}>
              {tip}
            </div>
          )}
        </span>
      </div>
      {children}
    </div>
  );
};

const AdvancedParamsPanel: React.FC<PanelProps> = ({ config, setConfig }) => (
  <div style={{ padding: 'var(--space-4)' }}>
    <InfoRow label="Decimal Places" tip="How many decimal places to show in score values. 0 = whole numbers only.">
      <select value={config.decimalPlaces ?? 0}
        onChange={(e) => setConfig((p) => ({ ...p, decimalPlaces: Number(e.target.value) as 0 | 1 | 2 }))}
        style={{ ...INPUT, cursor: 'pointer' }}>
        <option value={0}>0 (e.g. 8)</option>
        <option value={1}>1 (e.g. 8.4)</option>
        <option value={2}>2 (e.g. 8.42)</option>
      </select>
    </InfoRow>

    <InfoRow label="Force Decimal" tip="Always show decimal separator even for whole numbers (e.g. 8 → 8.0).">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--film-text-dim)', fontSize: 11 }}>
          {config.forceDecimal ? 'On' : 'Off'}
        </span>
        <button role="switch" aria-checked={config.forceDecimal ?? false}
          onClick={() => setConfig((p) => ({ ...p, forceDecimal: !p.forceDecimal }))}
          style={{ width: 36, height: 20, borderRadius: 10, background: config.forceDecimal ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)' }}>
          <span style={{ position: 'absolute', top: 2, left: config.forceDecimal ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-spring)' }} />
        </button>
      </div>
    </InfoRow>

    <InfoRow label="MAL ID Override" tip="Override the auto-resolved MyAnimeList ID for this title. Useful when auto-detection fails.">
      <input type="text" placeholder="e.g. 16498"
        defaultValue={config.malIdOverride ?? ''}
        style={INPUT}
        onBlur={(e) => setConfig((p) => ({ ...p, malIdOverride: e.target.value.trim() || undefined }))} />
    </InfoRow>

    <InfoRow label="Font Override" tip="Override the badge text font. Use a system-safe font name (e.g. 'Georgia', 'Arial').">
      <input type="text" placeholder="e.g. Georgia"
        defaultValue={config.fontOverride ?? ''}
        style={INPUT}
        onBlur={(e) => setConfig((p) => ({ ...p, fontOverride: e.target.value.trim() || undefined }))} />
    </InfoRow>

    <InfoRow label="Icon Position" tip="Position of the rating icon relative to the score text.">
      <select value={config.iconPosition ?? 'left'}
        onChange={(e) => setConfig((p) => ({ ...p, iconPosition: e.target.value as any }))}
        style={{ ...INPUT, cursor: 'pointer' }}>
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="above">Above</option>
        <option value="below">Below</option>
      </select>
    </InfoRow>

    <InfoRow label="Label Inside" tip="Render the label text inside the badge background instead of outside.">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--film-text-dim)', fontSize: 11 }}>
          {config.labelInside ? 'Inside' : 'Outside (default)'}
        </span>
        <button role="switch" aria-checked={config.labelInside ?? false}
          onClick={() => setConfig((p) => ({ ...p, labelInside: !p.labelInside }))}
          style={{ width: 36, height: 20, borderRadius: 10, background: config.labelInside ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)' }}>
          <span style={{ position: 'absolute', top: 2, left: config.labelInside ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-spring)' }} />
        </button>
      </div>
    </InfoRow>
  </div>
);

export default AdvancedParamsPanel;
