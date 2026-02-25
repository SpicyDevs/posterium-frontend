// src/components/PropertyPanel.tsx
import React from 'react';
import { Disclosure, Switch, Transition } from '@headlessui/react'; // <--- Headless UI
import { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
import {
  Layers,
  Layout,
  Smartphone,
  Palette,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  viewMode?: 'global' | 'selection';
}

// Collapsible Section using Headless UI Disclosure

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title,
  children,
  defaultOpen = true,
}) => (
  <Disclosure defaultOpen={defaultOpen}>
    {({ open }) => (
      <div className="border-b border-white/5 last:border-0 p-2">
        {/* CHANGED: Added outline-none, focus:outline-none, and focus:ring-0 to suppress the flash */}
        <Disclosure.Button className="group flex w-full justify-between items-center px-3 py-2.5 rounded-md transition-all hover:bg-white/5 outline-none focus:outline-none focus-visible:outline-none focus:ring-0">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            {title}
          </h3>
          <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </Disclosure.Button>
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Disclosure.Panel className="px-3 pb-3 pt-2 space-y-4">{children}</Disclosure.Panel>
        </Transition>
      </div>
    )}
  </Disclosure>
);;

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs text-zinc-400 font-medium">{label}</label>
    </div>
    {children}
  </div>
);

// Helper for Boolean Toggles
const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <Switch.Group>
    <div className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-white/5 cursor-pointer hover:border-white/10 transition-all">
      <Switch.Label className="text-xs text-zinc-300">{label}</Switch.Label>
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${checked ? 'bg-indigo-600' : 'bg-zinc-700'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900`}
      >
        <span
          className={`${checked ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  </Switch.Group>
);

const InputRange: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}> = ({ value, onChange, min, max, step = 1, unit = '' }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer hover:accent-indigo-400"
    />
    <span className="text-xs font-mono text-zinc-500 w-10 text-right tabular-nums">
      {value}
      {unit}
    </span>
  </div>
);

const AlignmentGrid: React.FC<{ value: PresetType; onChange: (v: PresetType) => void }> = ({
  value,
  onChange,
}) => {
  const positions: PresetType[] = ['tl', 'tc', 'tr', 'lc', 'cc', 'rc', 'bl', 'bc', 'br'];
  return (
    <div className="grid grid-cols-3 gap-1.5 w-24">
      {positions.map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={clsx(
            'w-6 h-6 rounded-sm border transition-all active:scale-90',
            value === pos
              ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
              : 'bg-zinc-800/50 border-white/5 hover:border-white/20 hover:bg-zinc-700'
          )}
          title={`Align ${pos.toUpperCase()}`}
        >
          <div
            className={clsx(
              'w-1 h-1 bg-current rounded-full mx-auto opacity-50',
              value === pos ? 'text-white' : 'text-zinc-500'
            )}
          />
        </button>
      ))}
    </div>
  );
};

const PropertyPanel: React.FC<Props> = ({ config, setConfig, selectedIds, viewMode }) => {
  const { toggleViewOption, viewOptions } = useEditor();

  const updateConfig = (key: keyof PosterConfig, value: any) => {
    setConfig((prev) => {
      if (key === 'layout' || key === 'preset') {
        const newItems = { ...prev.items };
        (Object.keys(newItems) as RatingType[]).forEach((k) => {
          if (newItems[k]) {
            const { x, y, ...rest } = newItems[k]!;
            newItems[k] = rest;
          }
        });
        return { ...prev, [key]: value, items: newItems };
      }
      return { ...prev, [key]: value };
    });
  };

  const updateKeys = (key: keyof ApiKeys, value: string) =>
    setConfig((prev) => ({ ...prev, keys: { ...prev.keys, [key]: value } }));

  const updateSelectedBadges = (updates: Partial<BadgeConfig>) => {
    setConfig((prev) => {
      const newItems = { ...prev.items };
      selectedIds.forEach((id) => {
        newItems[id] = { ...newItems[id], ...updates };
      });
      return { ...prev, items: newItems };
    });
  };

  const getCommonValue = <K extends keyof BadgeConfig>(prop: K, def: any): any => {
    const values = Array.from(selectedIds).map(
      (id) => config.items[id]?.[prop] ?? config[prop as keyof PosterConfig] ?? def
    );
    return values.every((v) => v === values[0]) ? values[0] : null;
  };

  const showGlobal = viewMode ? viewMode === 'global' : selectedIds.size === 0;

  if (showGlobal) {
    return (
      <div className="flex flex-col pb-20">
        <Section title="Layout & Alignment">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="text-[10px] text-zinc-500 mb-2 font-medium">Preset</div>
              <AlignmentGrid value={config.preset} onChange={(v) => updateConfig('preset', v)} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 mb-2 font-medium">Flow</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => updateConfig('layout', 'col')}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded border text-xs transition-colors active:scale-95',
                    config.layout === 'col'
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                      : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                  )}
                >
                  <Layout size={12} className="rotate-90" /> Column
                </button>
                <button
                  onClick={() => updateConfig('layout', 'row')}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded border text-xs transition-colors active:scale-95',
                    config.layout === 'row'
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                      : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                  )}
                >
                  <Layout size={12} /> Row
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Global Appearance">
          <ControlRow label="Poster Blur">
            <InputRange
              value={config.posterBlur}
              min={0}
              max={20}
              onChange={(v) => updateConfig('posterBlur', v)}
            />
          </ControlRow>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <ToggleRow
              label="Grayscale"
              checked={config.grayscale}
              onChange={(v) => updateConfig('grayscale', v)}
            />
            {/* <ToggleRow */}
            {/*   label="Shadows" */}
            {/*   checked={config.shadow} */}
            {/*   onChange={(v) => updateConfig('shadow', v)} */}
            {/* /> */}
          </div>
        </Section>

        <Section title="Badge Defaults">
          <div className="space-y-4">
            <ControlRow label="Shadow Intensity">
              <InputRange
                value={typeof config.shadow === 'boolean' ? (config.shadow ? 6 : 0) : config.shadow}
                min={0}
                max={30}
                onChange={(v) => updateConfig('shadow', v)}
              />
            </ControlRow>
            <ControlRow label="Glass Blur">
              <InputRange
                value={config.blur}
                min={0}
                max={20}
                onChange={(v) => updateConfig('blur', v)}
              />
            </ControlRow>
            <ControlRow label="Opacity">
              <InputRange
                value={config.alpha}
                min={0}
                max={1}
                step={0.1}
                onChange={(v) => updateConfig('alpha', v)}
              />
            </ControlRow>
            <ControlRow label="Radius">
              <InputRange
                value={config.radius}
                min={0}
                max={30}
                onChange={(v) => updateConfig('radius', v)}
              />
            </ControlRow>
          </div>
        </Section>

        <Section title="View Options" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleViewOption('showSafeArea')}
              className={clsx(
                'flex items-center justify-center gap-2 py-2 rounded border text-xs transition-all active:scale-95',
                viewOptions.showSafeArea
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Smartphone size={14} /> Safe Area
            </button>
            <button
              onClick={() => toggleViewOption('showGrid')}
              className={clsx(
                'flex items-center justify-center gap-2 py-2 rounded border text-xs transition-all active:scale-95',
                viewOptions.showGrid
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Layout size={14} /> Grid Lines
            </button>
          </div>
        </Section>

        <Section title="Advanced Settings" defaultOpen={false}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-500">
              <Settings size={12} />
              <span className="text-[10px] uppercase tracking-wider">Custom API Keys</span>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={config.keys?.tmdb || ''}
                onChange={(e) => updateKeys('tmdb', e.target.value)}
                placeholder="TMDB Key (Overrides Default)"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 outline-none transition-colors"
              />
              <input
                type="password"
                value={config.keys?.fanart || ''}
                onChange={(e) => updateKeys('fanart', e.target.value)}
                placeholder="Fanart.tv Key"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>
        </Section>
      </div>
    );
  }

  if (selectedIds.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3 p-8 text-center bg-transparent">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
          <Layers size={20} className="opacity-40" />
        </div>
        <p className="text-xs max-w-[150px]">
          Select a badge on the canvas to edit its specific properties.
        </p>
      </div>
    );
  }

  const mixedVal = (val: any, def: any) => (val === null ? '' : (val ?? def));
  const isAgeSelected = selectedIds.has('age');

  return (
    <div className="flex flex-col pb-20">
      <Section title="Transform">
        <ControlRow label="Scale">
          <InputRange
            value={getCommonValue('scale', 1.0) ?? 1.0}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={(v) => updateSelectedBadges({ scale: v })}
          />
        </ControlRow>
      </Section>

      <Section title="Fill & Stroke">
        <div className="space-y-4">
          <ControlRow label="Background">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  type="color"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  onChange={(e) => updateSelectedBadges({ bg: e.target.value })}
                />
                <div className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded flex items-center px-2 text-xs text-zinc-400 group-hover:border-zinc-500 transition-colors">
                  <div
                    className="w-5 h-5 rounded border border-white/10 mr-2 shadow-sm"
                    style={{ background: mixedVal(getCommonValue('bg', '#000000'), '#000') }}
                  ></div>
                  <span className="font-mono">
                    {mixedVal(getCommonValue('bg', 'Default'), 'Mixed')}
                  </span>
                </div>
              </div>
            </div>
          </ControlRow>

          <ControlRow label="Border Width">
            <InputRange
              value={getCommonValue('borderW', 0) ?? 0}
              min={0}
              max={10}
              onChange={(v) => updateSelectedBadges({ borderW: v })}
            />
          </ControlRow>
          <ControlRow label="Border Color">
            <div className="relative w-full group">
              <input
                type="color"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                onChange={(e) => updateSelectedBadges({ borderC: e.target.value })}
              />
              <div className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded flex items-center px-2 text-xs text-zinc-400 group-hover:border-zinc-500 transition-colors">
                <div
                  className="w-5 h-5 rounded border border-white/10 mr-2 shadow-sm"
                  style={{ background: mixedVal(getCommonValue('borderC', '#ffffff'), '#fff') }}
                ></div>
                <span className="font-mono">
                  {mixedVal(getCommonValue('borderC', '#ffffff'), 'Mixed')}
                </span>
              </div>
            </div>
          </ControlRow>
        </div>
      </Section>

<Section title="Visibility">
        <div className="space-y-4"> {/* CHANGED: space-y-2 to space-y-4 for slider spacing */}
          {!isAgeSelected && (
            <ToggleRow
              label="Show Icon"
              checked={getCommonValue('icon', true) ?? true}
              onChange={(v) => updateSelectedBadges({ icon: v })}
            />
          )}
          {/* CHANGED: Replaced ToggleRow with ControlRow & InputRange */}
          <ControlRow label="Drop Shadow">
            <InputRange
              value={(() => {
                const val = getCommonValue('shadow', 6);
                return typeof val === 'boolean' ? (val ? 6 : 0) : (val ?? 6);
              })()}
              min={0}
              max={30}
              onChange={(v) => updateSelectedBadges({ shadow: v })}
            />
          </ControlRow>
        </div>
      </Section>

      <div className="p-5">
        <button
          onClick={() =>
            setConfig((prev) => {
              const newItems = { ...prev.items };
              selectedIds.forEach((id) => delete newItems[id]);
              return { ...prev, items: newItems };
            })
          }
          className="w-full py-2.5 border border-red-500/20 text-red-400 bg-red-500/5 rounded text-xs font-medium hover:bg-red-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Palette size={14} /> Reset Overrides to Global
        </button>
      </div>
    </div>
  );
};

export default PropertyPanel;
