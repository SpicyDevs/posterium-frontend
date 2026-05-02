// src/components/builder/panels/BadgesPanelAdvanced.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  outline: 'none', fontFamily: 'inherit',
};

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
const Collapsible: React.FC<CollapsibleProps> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', color: 'var(--film-text-label)', cursor: 'pointer',
          padding: '8px 0', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
        }}
      >
        {title}
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </div>
  );
};

const BadgesPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => {
  const s = (field: string) => (val: any) =>
    setConfig((p: any) => ({ ...p, [field]: val }));

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      {/* Basic controls */}
      <Collapsible title="Shape" defaultOpen>
        <div style={ROW}>
          <label style={LABEL}>Blur<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.blur}px</span></label>
          <input type="range" min={0} max={30} step={1} value={config.blur}
            onChange={(e) => s('blur')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
        <div style={ROW}>
          <label style={LABEL}>Opacity<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{Math.round(config.alpha * 100)}%</span></label>
          <input type="range" min={0} max={1} step={0.02} value={config.alpha}
            onChange={(e) => s('alpha')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
        <div style={ROW}>
          <label style={LABEL}>Radius<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.radius}px</span></label>
          <input type="range" min={0} max={40} step={1} value={config.radius}
            onChange={(e) => s('radius')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
      </Collapsible>

      <Collapsible title="Shadow">
        <div style={ROW}>
          <label style={LABEL}>Size<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.shadow}px</span></label>
          <input type="range" min={0} max={40} step={1} value={config.shadow}
            onChange={(e) => s('shadow')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={LABEL}>X Offset</label>
            <input type="number" min={-40} max={40} value={config.shadowX ?? 0}
              onChange={(e) => s('shadowX')(Number(e.target.value))}
              style={{ ...INPUT, padding: '5px 8px' }} />
          </div>
          <div>
            <label style={LABEL}>Y Offset</label>
            <input type="number" min={-40} max={40} value={config.shadowY ?? 0}
              onChange={(e) => s('shadowY')(Number(e.target.value))}
              style={{ ...INPUT, padding: '5px 8px' }} />
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Border">
        <div style={ROW}>
          <label style={LABEL}>Width<span style={{ color: 'var(--film-amber)', marginLeft: 6 }}>{config.borderW ?? 0}px</span></label>
          <input type="range" min={0} max={8} step={0.5} value={config.borderW ?? 0}
            onChange={(e) => s('borderW')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
        <div style={ROW}>
          <label style={LABEL}>Colour</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={config.borderC ?? '#ffffff'}
              onChange={(e) => s('borderC')(e.target.value)}
              style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            <input type="text" value={config.borderC ?? '#ffffff'}
              onChange={(e) => s('borderC')(e.target.value)}
              style={{ ...INPUT, flex: 1 }} />
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Labels">
        <div style={ROW}>
          <label style={LABEL}>Position</label>
          <select value={config.labelPos ?? 'below'}
            onChange={(e) => s('labelPos')(e.target.value)}
            style={{ ...INPUT, cursor: 'pointer' }}>
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div style={ROW}>
          <label style={LABEL}>Size</label>
          <input type="range" min={6} max={32} step={1} value={config.labelSize ?? 11}
            onChange={(e) => s('labelSize')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
        </div>
      </Collapsible>

      <Collapsible title="Icon & Text">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { field: 'icon', label: 'Show Icons', val: config.icon !== false },
            { field: 'showText', label: 'Show Text', val: config.showText !== false },
          ].map(({ field, label, val }) => (
            <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...LABEL, marginBottom: 0 }}>{label}</label>
              <button role="switch" aria-checked={val}
                onClick={() => s(field)(!val)}
                style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: val ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background var(--transition-fast)',
                }}>
                <span style={{
                  position: 'absolute', top: 2, left: val ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left var(--transition-spring)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
};

export default BadgesPanelAdvanced;
