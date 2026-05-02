// src/components/builder/panels/BadgesPanelSimple.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import { useEditor } from '../context/EditorContext';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 14 };

const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit = '', onChange }) => (
  <div style={ROW}>
    <label style={LABEL}>
      {label}
      <span style={{ marginLeft: 6, color: 'var(--film-amber)', fontVariantNumeric: 'tabular-nums' }}>
        {unit === '%' ? `${Math.round(value * 100)}%` : `${value}${unit}`}
      </span>
    </label>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <div style={{ ...ROW, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <label style={{ ...LABEL, marginBottom: 0 }}>{label}</label>
    <button role="switch" aria-checked={checked} onClick={onChange}
      style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition-fast)', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left var(--transition-spring)' }} />
    </button>
  </div>
);

const BadgesPanelSimple: React.FC<PanelProps> = ({ config, setConfig }) => {
  const { setBuilderMode } = useEditor();
  const s = (f: string) => (v: any) => setConfig((p: any) => ({ ...p, [f]: v }));

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <Slider label="Blur" value={config.blur} min={0} max={30} step={1} unit="px" onChange={s('blur')} />
      <Slider label="Opacity" value={config.alpha} min={0} max={1} step={0.02} unit="%" onChange={s('alpha')} />
      <Slider label="Radius" value={config.radius} min={0} max={40} step={1} unit="px" onChange={s('radius')} />
      <Slider label="Shadow" value={config.shadow} min={0} max={40} step={1} unit="px" onChange={s('shadow')} />
      <Slider label="Scale" value={config.scale ?? 1.0} min={0.5} max={2.0} step={0.05} unit="%" onChange={(v) => setConfig((p) => ({ ...p, scale: v }))} />
      <Toggle label="Show Icons" checked={config.icon !== false} onChange={() => s('icon')(config.icon !== false ? false : true)} />
      <Toggle label="Show Text" checked={config.showText !== false} onChange={() => s('showText')(config.showText !== false ? false : true)} />
      <div style={ROW}>
        <label style={LABEL}>Theme</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['glass', 'solid'] as const).map((t) => (
            <button key={t} onClick={() => s('theme')(t)} aria-pressed={config.theme === t}
              style={{ flex: 1, minHeight: 36, background: config.theme === t ? 'rgba(196,124,46,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${config.theme === t ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 'var(--radius-xs)', color: config.theme === t ? 'var(--film-amber)' : 'var(--film-text-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Syne, sans-serif', transition: 'all var(--transition-fast)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 'var(--space-4)' }}>
        <button onClick={() => setBuilderMode('advanced')}
          style={{ width: '100%', minHeight: 36, background: 'rgba(196,124,46,0.08)', border: '1px dashed rgba(196,124,46,0.3)', borderRadius: 'var(--radius-xs)', color: 'var(--film-amber)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          More options in Advanced Mode
        </button>
      </div>
    </div>
  );
};

export default BadgesPanelSimple;
