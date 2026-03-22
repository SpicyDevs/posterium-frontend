// src/components/builder/components/PropertyPanel.tsx
import React, { memo, useState, useRef } from 'react';
import { Switch } from '@headlessui/react';
import type { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
import {
  Layers, Layout, Smartphone, Palette, ChevronDown, ChevronRight,
  Eye, KeyRound, RotateCcw, Rows2, Columns2,
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

const Section: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.05] last:border-0">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C47C2E]/50">
        <span className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{icon}{title}</span>
        {open ? <ChevronDown size={12} className="text-zinc-600" /> : <ChevronRight size={12} className="text-zinc-600" />}
      </button>
      {open && <div className="px-3 pb-4 pt-1 space-y-4">{children}</div>}
    </div>
  );
};

// ── SliderRow: value box on the left of the track, click-to-edit ──────────────
const SliderRow: React.FC<{
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string; formatValue?: (v: number) => string;
}> = ({ label, value, onChange, min, max, step = 1, unit = '', formatValue }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const display = formatValue ? formatValue(value) : `${value}${unit}`;

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
    // Focus handled by autoFocus
  };

  const commit = () => {
    const n = parseFloat(draft.replace(/[^0-9.\-]/g, ''));
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
    setEditing(false);
  };

  return (
    <div className="space-y-1">
      <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {/* Editable value on far left of the slider */}
        {editing ? (
          <input
            ref={inputRef}
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
            onClick={startEdit}
            title="Click to edit value"
            className="w-[52px] h-[22px] px-1.5 rounded-md bg-[#111113] border border-white/8 hover:border-[#C47C2E]/35 text-[10px] font-mono text-zinc-500 tabular-nums text-center cursor-text transition-colors shrink-0 select-none"
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
        checked ? 'bg-[#C47C2E]' : 'bg-zinc-700'
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
          value === pos.id ? 'bg-white' : 'bg-zinc-500'
        )} />
      </button>
    ))}
  </div>
);

const ApiKeyInput: React.FC<{ placeholder: string; value: string; onChange: (v: string) => void }> = ({ placeholder, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-3 pr-8 rounded-lg bg-[#111113] border border-white/[0.08] text-[11px] font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus-visible:border-[#C47C2E]/50 focus-visible:ring-1 focus-visible:ring-[#C47C2E]/30 transition-colors" />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
        <Eye size={12} />
      </button>
    </div>
  );
};

// ── Helper: resolve badge shadow value from mixed number/boolean ──────────────
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

  const updateKeys = (key: keyof ApiKeys, value: string) =>
    setConfig(prev => ({ ...prev, keys: { ...prev.keys, [key]: value } }));

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

  /** Get a common value across all selected badges, or null if they differ. */
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
      <Section title="Layout" icon={<Layout size={11} />}>
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

      <Section title="Poster" icon={<Layers size={11} />}>
        <SliderRow label="Background Blur" value={config.posterBlur} min={0} max={20} unit="px"
          onChange={v => updateConfig('posterBlur', v)} />
        <ToggleRow label="Grayscale" sub="Desaturate the poster image"
          checked={config.grayscale} onChange={v => updateConfig('grayscale', v)} />
      </Section>

      <Section title="Badge Defaults" icon={<Palette size={11} />}>
        <ToggleRow label="Show Icons" checked={config.icon ?? true} onChange={v => updateConfig('icon', v)} />
        <SliderRow label="Glass Blur"          value={config.blur}   min={0}  max={20} unit="px"    onChange={v => updateConfig('blur', v)} />
        <SliderRow label="Background Opacity"  value={config.alpha}  min={0}  max={1}  step={0.05} formatValue={v => `${Math.round(v*100)}%`} onChange={v => updateConfig('alpha', v)} />
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

        {/* ── Global background color (g_bg) ─────────────────────────────── */}
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

        {/* ── Global text color (g_txt) ────────────────────────────────────── */}
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

      <Section title="Canvas Overlays" icon={<Smartphone size={11} />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          {([{ key: 'showSafeArea' as const, label: 'Safe Area' }, { key: 'showGrid' as const, label: 'Grid Lines' }]).map(({ key, label }) => (
            <button key={key} type="button" onClick={() => toggleViewOption(key)}
              className={clsx('h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95',
                viewOptions[key]
                  ? 'bg-[#C47C2E]/15 text-[#E8D8A8] ring-1 ring-[#C47C2E]/30'
                  : 'bg-[#111113] text-zinc-400 hover:text-zinc-200 border border-white/6 hover:border-white/12'
              )}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="API Keys" icon={<KeyRound size={11} />} defaultOpen={false}>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Override the global API keys used to fetch ratings and posters.
        </p>
        <div>
          <p className="sidebar-label">TMDB Key</p>
          <ApiKeyInput placeholder="Override default TMDB key"
            value={config.keys?.tmdb ?? ''} onChange={v => updateKeys('tmdb', v)} />
        </div>
        <div>
          <p className="sidebar-label">Fanart.tv Key</p>
          <ApiKeyInput placeholder="Your Fanart.tv key"
            value={config.keys?.fanart ?? ''} onChange={v => updateKeys('fanart', v)} />
        </div>
      </Section>
    </div>
  );

  // ── No-selection placeholder ──────────────────────────────────────────────
  if (selectedIds.size === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#111113] border border-white/6 flex items-center justify-center">
        <Layers size={18} strokeWidth={1.5} className="opacity-50" />
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
      <div className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[#C47C2E]/8 border border-[#C47C2E]/20 rounded-lg">
        <p className="text-[11px] text-[#E8D8A8] font-medium">
          {multi ? `${selectedIds.size} badges selected` : Array.from(selectedIds)[0]}
        </p>
        <p className="text-[9px] text-[#D4A245]/60 mt-0.5">
          {multi ? 'Changes apply to all selected badges' : 'Per-badge overrides — unset fields inherit global defaults'}
        </p>
      </div>

      <Section title="Transform">
        <SliderRow label="Scale" value={commonScale} min={0.5} max={2.0} step={0.05}
          formatValue={v => `${v.toFixed(2)}×`}
          onChange={v => updateSelectedBadges({ scale: v })} />
      </Section>

      <Section title="Glass & Shape">
        <SliderRow label="Blur"    value={commonBlur}   min={0} max={20}  unit="px"   onChange={v => updateSelectedBadges({ blur: v })} />
        <SliderRow label="Opacity" value={commonAlpha}  min={0} max={1}   step={0.05} formatValue={v => `${Math.round(v*100)}%`} onChange={v => updateSelectedBadges({ alpha: v })} />
        <SliderRow label="Radius"  value={commonRadius} min={0} max={30}  unit="px"   onChange={v => updateSelectedBadges({ radius: v })} />
      </Section>

      <Section title="Fill & Stroke">
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

      <Section title="Visibility">
        {!isAgeSelected && (
          <ToggleRow label="Show Icon"
            checked={getCommonValue('icon', true) as boolean ?? true}
            onChange={v => updateSelectedBadges({ icon: v })} />
        )}
        <SliderRow label="Drop Shadow" value={commonShadow} min={0} max={30}
          onChange={v => updateSelectedBadges({ shadow: v })} />
      </Section>

      {/* Reset to global */}
      <div className="px-3 pt-2">
        <button type="button"
          onClick={() => setConfig(prev => {
            const ni = { ...prev.items };
            selectedIds.forEach(id => delete ni[id]);
            return { ...prev, items: ni };
          })}
          className="w-full h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={11} /> Reset to global defaults
        </button>
      </div>
    </div>
  );
};

export default memo(PropertyPanel);
