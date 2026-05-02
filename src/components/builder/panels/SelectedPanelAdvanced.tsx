// src/components/builder/panels/SelectedPanelAdvanced.tsx
import React from 'react';
import { MousePointer2Off } from 'lucide-react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import { useEditor } from '../context/EditorContext';

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--film-text-dim)',
  fontFamily: 'Syne, sans-serif', display: 'block', marginBottom: 6,
};
const ROW: React.CSSProperties = { marginBottom: 14 };

const SelectedPanelAdvanced: React.FC<PanelProps> = ({ config, setConfig }) => {
  const { selectedIds, clearSelection } = useEditor();

  if (selectedIds.size === 0) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center' }}>
        <MousePointer2Off size={24} style={{ opacity: 0.3 }} />
        <p style={{ color: 'var(--film-text-ghost)', fontSize: 12, lineHeight: 1.5 }}>
          Click a badge on the canvas to select it.
        </p>
      </div>
    );
  }

  const selArr = Array.from(selectedIds);

  const getCommon = (field: string): any => {
    const vals = selArr.map((sid) => (config.items[sid] as any)?.[field]);
    return vals.every((v) => v === vals[0]) ? vals[0] : undefined;
  };

  const update = (field: string, val: any) =>
    setConfig((p) => {
      const newItems = { ...p.items };
      selArr.forEach((sid) => { newItems[sid] = { ...(newItems[sid] ?? {}), [field]: val }; });
      return { ...p, items: newItems };
    });

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <span style={{ color: 'var(--film-text-label)', fontSize: 12 }}>
          {selArr.length === 1 ? selArr[0].replace('_', ' ') : `${selArr.length} badges`}
        </span>
        <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: 'var(--film-text-ghost)', cursor: 'pointer', fontSize: 10, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Deselect
        </button>
      </div>

      {['scale', 'alpha', 'blur'].map((field) => {
        const val = getCommon(field) ?? (field === 'scale' ? (config.scale ?? 1) : field === 'alpha' ? config.alpha : config.blur);
        const isScale = field === 'scale', isAlpha = field === 'alpha';
        return (
          <div key={field} style={ROW}>
            <label style={LABEL}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
              <span style={{ marginLeft: 6, color: 'var(--film-amber)' }}>
                {isScale ? `${(val * 100).toFixed(0)}%` : isAlpha ? `${Math.round(val * 100)}%` : `${val}px`}
              </span>
            </label>
            <input type="range"
              min={isScale ? 0.3 : isAlpha ? 0 : 0}
              max={isScale ? 3.0 : isAlpha ? 1 : 30}
              step={isScale ? 0.05 : isAlpha ? 0.02 : 1}
              value={val}
              onChange={(e) => update(field, Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--film-amber)' }} />
          </div>
        );
      })}

      <button onClick={() => setConfig((p) => { const items = { ...p.items }; selArr.forEach((sid) => delete items[sid]); return { ...p, items }; })}
        style={{ width: '100%', marginTop: 8, padding: '8px 0', background: 'rgba(255,50,50,0.06)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 'var(--radius-xs)', color: 'rgba(255,120,120,0.8)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
        Reset to Global Defaults
      </button>
    </div>
  );
};

export default SelectedPanelAdvanced;
