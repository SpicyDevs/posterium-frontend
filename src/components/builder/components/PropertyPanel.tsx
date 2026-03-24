// src/components/builder/components/PropertyPanel.tsx
import React, { memo, useState, useRef, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import type { PosterConfig, RatingType, PresetType, BadgeConfig } from '../types';
import {
  Layers, Layout, Smartphone, Palette, ChevronDown, ChevronRight,
  Eye, RotateCcw, Rows2, Columns2,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import ColorPicker from './ColorPicker';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  viewMode?: 'global' | 'selection';
}

// ── Persist section open/closed state in localStorage ─────────────────────────
const SECTION_STORAGE_KEY = 'posterium_section_states_v1';

const readSectionStates = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(SECTION_STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const writeSectionState = (id: string, open: boolean) => {
  try {
    const s = readSectionStates();
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify({ ...s, [id]: open }));
  } catch {}
};

// FIX: Section with rounded hover bg + localStorage persistence
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionId?: string;
}> = ({ title, icon, children, defaultOpen = true, sectionId }) => {
  const [open, setOpen] = useState(() => {
    if (!sectionId) return defaultOpen;
    const states = readSectionStates();
    return sectionId in states ? states[sectionId] : defaultOpen;
  });

  const toggle = useCallback(() => {
    setOpen(v => {
      const next = !v;
      if (sectionId) writeSectionState(sectionId, next);
      return next;
    });
  }, [sectionId]);

  return (
    <div className="border-b border-white/[0.05] last:border-0">
      {/* FIX: rounded-lg on the button so hover bg is clipped */}
      <button
        type="button"
        onClick={toggle}
        className="w-[calc(100%-8px)] mx-1 flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.05] hover:text-zinc-400 transition-colors text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C47C2E]/50"
      >
        <span className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          {icon}{title}
        </span>
        {open
          ? <ChevronDown size={12} className="text-zinc-700 shrink-0" />
          : <ChevronRight size={12} className="text-zinc-700 shrink-0" />
        }
      </button>
      {open && <div className="px-3 pb-4 pt-1 space-y-4">{children}</div>}
    </div>
  );
};

// ── SliderRow: click-to-edit value label ──────────────────────────────────────
const SliderRow: React.FC<{
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string; formatValue?: (v: number) => string;
}> = ({ label, value, onChange, min, max, step = 1, unit = '', formatValue }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  const commit = () => {
    const n = parseFloat(draft.replace(/[^0-9.\-]/g, ''));
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  };

  return (
    <div className="space-y-1">
      <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            type="text"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-[52px] h-[22px] px-1.5 rounded-md bg-[#0d0d0f] border border-[#C47C2E]/60 text-[10px] font-mono text-zinc-200 text-center focus:outline-none shrink-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(String(value)); setEditing(true); }}
            title="Click to edit"
            className="w-[52px] h-[22px] px-1.5 rounded-md bg-[#111113] border border-white/8 hover:border-[#C47C2E]/30 text-[10px] font-mono text-zinc-500 tabular-nums text-center cursor-text transition-colors shrink-0 select-none"
          >
            {display}
          </button>
        )}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 min-w-0"
        />
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, sub, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-zinc-300">{label}</p>
      {sub && <p className="text-[9px] text-zinc-500 mt-0.5">{sub}</p>}
    </div>
    <Switch checked={checked} onChange={onChange}
      className={clsx('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
        checked ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
      )}>
      <span className={clsx('inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
      )} />
    </Switch>
  </div>
);

const GRID_POSITIONS: { id: PresetType; label: string }[] = [
  { id: 'tl', label: 'Top left'    }, { id: 'tc', label: 'Top centre'    }, { id: 'tr', label: 'Top right'    },
  { id: 'lc', label: 'Middle left' }, { id: 'cc', label: 'Centre'         }, { id: 'rc', label: 'Middle right' },
  { id: 'bl', label: 'Bottom left' }, { id: 'bc', label: 'Bottom centre'  }, { id: 'br', label: 'Bottom right' },
];

const AlignmentGrid: React.FC<{ value: PresetType; onChange: (v: PresetType) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-1 w-[5.5rem]">
    {GRID_POSITIONS.map(pos => (
      <button key={pos.id} type="button" onClick={() => onChange(pos.id)} title={pos.label}
        className={clsx('w-full aspect-square rounded transition-all active:scale-90',
          value === pos.id
            ? 'bg-[#C47C2E] shadow-[0_0_8px_rgba(196,124,46,0.5)]'
            : 'bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/[0.05]'
        )}>
        <div className={clsx('w-1.5 h-1.5 rounded-full mx-auto',
          value === pos.id ? 'bg-white' : 'bg-zinc-600'
        )} />
      </button>
    ))}
  </div>
);

// ── Helper: resolve badge shadow value ────────────────────────────────────────
function resolveShadow(v: number | boolean | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v === 'boolean') return v ? 6 : 0;
  return v;
}

const PropertyPanel: React.FC<Props> = ({ config, setConfig, selectedIds, viewMode }) => {
  const { toggleViewOption, viewOptions } = useEditor();

  const updateConfig = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setConfig(prev => {
      if (key === 'layout' || key === 'preset') {
        const newItems = { ...prev.items };
        (Object.keys(newItems) as RatingType[]).forEach(k => {
          if (newItems[k]) {
            const { x: _x, y: _y, ...rest } = newItems[k]!;
            newItems[k] = rest;
          }
        });
        return { ...prev, [key]: value, items: newItems };
      }
      return { ...prev, [key]: value };
    });
  };

  const clearGlobalColor = (key: 'bg' | 'txt') => {
    setConfig(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const updateSelectedBadges = (updates: Partial<BadgeConfig>) =>
    setConfig(prev => {
      const newItems = { ...prev.items };
      selectedIds.forEach(id => { newItems[id] = { ...newItems[id], ...updates }; });
      return { ...prev, items: newItems };
    });

  const clearSelectedBadgeProp = (prop: keyof BadgeConfig) =>
    setConfig(prev => {
      const newItems = { ...prev.items };
      selectedIds.forEach(id => {
        if (newItems[id]) {
          const copy = { ...newItems[id] };
          delete copy[prop];
          newItems[id] = copy;
        }
      });
      return { ...prev, items: newItems };
    });

  const getCommonValue = <K extends keyof BadgeConfig>(prop: K, def: BadgeConfig[K]): BadgeConfig[K] | null => {
    const vals = Array.from(selectedIds).map(id =>
      config.items[id]?.[prop] ?? (config[prop as keyof PosterConfig] as BadgeConfig[K]) ?? def
    );
    return vals.length > 0 && vals.every(v => v === vals[0]) ? vals[0] : null;
  };

  const showGlobal = viewMode ? viewMode === 'global' : selectedIds.size === 0;

  // ── Global (Canvas) view ──────────────────────────────────────────────────
  if (showGlobal) return (
    <div className="pb-24">
      <Section title="Layout" icon={<Layout size={11} />} sectionId="global-layout">
        <div className="flex items-start gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 mb-2 font-medium">Position preset</p>
            <AlignmentGrid value={config.preset} onChange={v => updateConfig('preset', v)} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-500 mb-2 font-medium">Flow direction</p>
            <div className="space-y-1.5">
              {([
                { id: 'col' as const, label: 'Column', icon: <Rows2 size={13} /> },
                { id: 'row' as const, label: 'Row',    icon: <Columns2 size={13} /> },
              ]).map(opt => (
                <button key={opt.id} type="button" onClick={() => updateConfig('layout', opt.id)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors',
                    config.layout === opt.id
                      ? 'bg-[#C47C2E]/15 text-[#E8D8A8] ring-1 ring-[#C47C2E]/30'
                      : 'bg-[#111113] text-zinc-400 hover:bg-white/5 border border-white/6'
                  )}>
                  <span className={config.layout === opt.id ? 'text-[#D4A245]' : 'text-zinc-600'}>
                    {opt.icon}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Poster" icon={<Layers size={11} />} sectionId="global-poster">
        <SliderRow label="Background Blur" value={config.posterBlur} min={0} max={20} unit="px"
          onChange={v => updateConfig('posterBlur', v)} />
        <ToggleRow label="Grayscale" sub="Desaturate the poster image"
          checked={config.grayscale} onChange={v => updateConfig('grayscale', v)} />
      </Section>

      <Section title="Badge Defaults" icon={<Palette size={11} />} sectionId="global-badge-defaults">
        <ToggleRow label="Show Icons" checked={config.icon ?? true} onChange={v => updateConfig('icon', v)} />
        <SliderRow label="Glass Blur"          value={config.blur}   min={0}  max={20} unit="px"    onChange={v => updateConfig('blur', v)} />
        <SliderRow label="Corner Radius"       value={config.radius} min={0}  max={30} unit="px"    onChange={v => updateConfig('radius', v)} />
        <SliderRow label="Drop Shadow"
          value={resolveShadow(config.shadow as number | boolean, 6)}
          min={0} max={30} onChange={v => updateConfig('shadow', v)} />
        <SliderRow label="Border Width" value={config.borderW ?? 0} min={0} max={10} unit="px"
          onChange={v => updateConfig('borderW', v)} />
        {(config.borderW ?? 0) > 0 && (
          <ColorPicker label="Border Color" value={config.borderC ?? '#ffffff'}
            onChange={v => updateConfig('borderC', v)} />
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Badge Background</span>
            {config.bg && (
              <button onClick={() => clearGlobalColor('bg')}
                className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">
                Reset
              </button>
            )}
          </div>
          <ColorPicker
            value={config.bg ?? '#000000'}
            onChange={v => updateConfig('bg', v)}
            showOpacity
            opacity={config.alpha}
            onOpacityChange={v => updateConfig('alpha', v)}
          />
          {!config.bg && (
            <p className="text-[9px] text-zinc-700">Using computed rgba(0,0,0,{config.alpha.toFixed(2)})</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Badge Text Color</span>
            {config.txt && (
              <button onClick={() => clearGlobalColor('txt')}
                className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">
                Reset
              </button>
            )}
          </div>
          <ColorPicker
            value={config.txt ?? '#ffffff'}
            onChange={v => updateConfig('txt', v)}
          />
        </div>
      </Section>

      {/* FIX: Canvas Overlays — sectionId for localStorage */}
      <Section title="Canvas Overlays" icon={<Smartphone size={11} />} defaultOpen={false} sectionId="global-overlays">
        <div className="grid grid-cols-2 gap-2">
          {([{ key: 'showSafeArea' as const, label: 'Safe Area' }, { key: 'showGrid' as const, label: 'Grid Lines' }]).map(({ key, label }) => (
            <button key={key} type="button" onClick={() => toggleViewOption(key)}
              className={clsx('h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95',
                viewOptions[key]
                  ? 'bg-[#C47C2E]/15 text-[#E8D8A8] ring-1 ring-[#C47C2E]/30'
                  : 'bg-[#111113] text-zinc-400 hover:text-zinc-200 border border-white/6 hover:border-white/12'
              )}>
              <Eye size={11} className={viewOptions[key] ? 'text-[#D4A245]' : 'text-zinc-600'} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-700 leading-relaxed">
          Overlays are canvas-only guides — they don't appear in exported images.
        </p>
      </Section>
      {/* API Keys section has moved to the left sidebar (Source tab) */}
    </div>
  );

  // ── No-selection placeholder ──────────────────────────────────────────────
  if (selectedIds.size === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#111113] border border-white/6 flex items-center justify-center">
        <Layers size={18} strokeWidth={1.5} className="opacity-40" />
      </div>
      <div>
        <p className="text-[12px] font-medium text-zinc-400">No badge selected</p>
        <p className="text-[11px] text-zinc-600 mt-1">Click a badge on the canvas to edit its properties</p>
      </div>
    </div>
  );

  // ── Per-badge / selection view ────────────────────────────────────────────
  const isAgeSelected = selectedIds.has('age');
  const multi = selectedIds.size > 1;

  const commonBlur   = getCommonValue('blur',   config.blur)   ?? config.blur;
  const commonAlpha  = getCommonValue('alpha',  config.alpha)  ?? config.alpha;
  const commonRadius = getCommonValue('radius', config.radius) ?? config.radius;
  const commonShadow = resolveShadow(getCommonValue('shadow', 6) as number | boolean | null ?? 6, 6);
  const commonScale  = (getCommonValue('scale', 1.0) ?? 1.0) as number;
  const commonBorderW = (getCommonValue('borderW', 0) ?? 0) as number;

  const commonBg = (() => {
    const v = getCommonValue('bg', config.bg ?? '#000000');
    return (v === null ? (config.bg ?? '#000000') : v) as string;
  })();

  const commonTxt = (() => {
    const v = getCommonValue('txt', config.txt ?? '#ffffff');
    return (v === null ? (config.txt ?? '#ffffff') : v) as string;
  })();

  return (
    <div className="pb-24">
      {/* Selection header */}
      <div className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[#C47C2E]/8 border border-[#C47C2E]/18 rounded-lg">
        <p className="text-[11px] text-[#E8D8A8] font-medium">
          {multi ? `${selectedIds.size} badges selected` : Array.from(selectedIds)[0]}
        </p>
        <p className="text-[9px] text-[#D4A245]/55 mt-0.5">
          {multi ? 'Changes apply to all selected badges' : 'Per-badge overrides — unset fields inherit global defaults'}
        </p>
      </div>

      <Section title="Transform" sectionId="badge-transform">
        <SliderRow label="Scale" value={commonScale} min={0.5} max={2.0} step={0.05}
          formatValue={v => `${v.toFixed(2)}×`}
          onChange={v => updateSelectedBadges({ scale: v })} />
      </Section>

      <Section title="Glass & Shape" sectionId="badge-glass">
        <SliderRow label="Blur"    value={commonBlur}   min={0} max={20}  unit="px"   onChange={v => updateSelectedBadges({ blur: v })} />
        <SliderRow label="Radius"  value={commonRadius} min={0} max={30}  unit="px"   onChange={v => updateSelectedBadges({ radius: v })} />
      </Section>

      <Section title="Fill & Stroke" sectionId="badge-fill">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Background</span>
            <button onClick={() => clearSelectedBadgeProp('bg')}
              className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">
              Reset
            </button>
          </div>
          <ColorPicker
            value={commonBg}
            onChange={v => updateSelectedBadges({ bg: v })}
            showOpacity
            opacity={commonAlpha}
            onOpacityChange={v => updateSelectedBadges({ alpha: v })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Text Color</span>
            <button onClick={() => clearSelectedBadgeProp('txt')}
              className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors">
              Reset
            </button>
          </div>
          <ColorPicker
            value={commonTxt}
            onChange={v => updateSelectedBadges({ txt: v })}
          />
        </div>

        <SliderRow label="Border Width" value={commonBorderW} min={0} max={10} unit="px"
          onChange={v => updateSelectedBadges({ borderW: v })} />
        {commonBorderW > 0 && (
          <ColorPicker label="Border Color"
            value={(() => {
              const v = getCommonValue('borderC', '#ffffff');
              return (v === null ? '#ffffff' : v) as string;
            })()}
            onChange={v => updateSelectedBadges({ borderC: v })}
          />
        )}
      </Section>

      <Section title="Visibility" sectionId="badge-visibility">
        {!isAgeSelected && (
          <ToggleRow label="Show Icon"
            checked={getCommonValue('icon', true) as boolean ?? true}
            onChange={v => updateSelectedBadges({ icon: v })} />
        )}
        <SliderRow label="Drop Shadow" value={commonShadow} min={0} max={30}
          onChange={v => updateSelectedBadges({ shadow: v })} />
      </Section>

      <div className="px-3 pt-2">
        <button type="button"
          onClick={() => setConfig(prev => {
            const ni = { ...prev.items };
            selectedIds.forEach(id => delete ni[id]);
            return { ...prev, items: ni };
          })}
          className="w-full h-8 rounded-lg border border-red-500/15 bg-red-500/5 text-[11px] font-medium text-red-400/80 hover:bg-red-500/10 hover:border-red-500/25 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={11} /> Reset to global defaults
        </button>
      </div>
    </div>
  );
};

export default memo(PropertyPanel);
