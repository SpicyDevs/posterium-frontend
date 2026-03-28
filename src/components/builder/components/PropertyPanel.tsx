// src/components/builder/components/PropertyPanel.tsx
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import type { PosterConfig, RatingType, PresetType, BadgeConfig } from '../types';
import {
  Layers,
  Layout,
  Smartphone,
  Palette,
  ChevronDown,
  ChevronRight,
  Eye,
  RotateCcw,
  Rows2,
  Columns2,
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

const SECTION_STORAGE_KEY = 'posterium_section_states_v2';

const readSectionStates = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(SECTION_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeSectionState = (id: string, open: boolean) => {
  try {
    const s = readSectionStates();
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify({ ...s, [id]: open }));
  } catch {}
};

// ── Section — flat, no borders, just a micro-label + space ──────────────────
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
    setOpen((v) => {
      const next = !v;
      if (sectionId) writeSectionState(sectionId, next);
      return next;
    });
  }, [sectionId]);

  return (
    <div className="pt-5 first:pt-3">
      {/* Section header — micro-label only, no box */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 mb-3 focus:outline-none group"
      >
        <span
          className="flex items-center gap-1.5 syne-font uppercase tracking-widest"
          style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
        >
          {icon && (
            <span style={{ color: 'var(--film-text-dim)', opacity: 0.8, lineHeight: 0 }}>
              {icon}
            </span>
          )}
          {title}
        </span>
        <span
          style={{
            color: 'var(--film-text-dim)',
            opacity: open ? 0.6 : 0.3,
            transition: 'opacity 0.15s',
            lineHeight: 0,
          }}
        >
          {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-1 space-y-3.5">
          {children}
        </div>
      )}

      {/* Hairline separator after section */}
      <div
        className="mt-5 mx-3"
        style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      />
    </div>
  );
};

// ── SliderRow — label above, then [number input] [slider] inline ─────────────
const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}> = ({ label, value, onChange, min, max, step = 1, unit = '', formatValue }) => {
  // High-performance decoupled local state
  const [localValue, setLocalValue] = useState(value);
  const [inputText, setInputText] = useState(() =>
    formatValue ? formatValue(value) : `${value}`
  );
  const lastUpdate = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    setLocalValue(value);
    if (!isFocused.current) {
      setInputText(formatValue ? formatValue(value) : `${value}`);
    }
  }, [value, formatValue]);

  const commitInput = useCallback((text: string) => {
    // Strip unit and non-numeric chars (except dot and minus)
    const raw = text.replace(unit, '').replace(/[^0-9.\-]/g, '');
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      const clamped = Math.max(min, Math.min(max, n));
      setLocalValue(clamped);
      setInputText(formatValue ? formatValue(clamped) : `${clamped}`);
      onChange(clamped);
    } else {
      // Restore current value
      setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
    }
  }, [min, max, onChange, unit, formatValue, localValue]);

  const handleRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalValue(val);
    if (!isFocused.current) {
      setInputText(formatValue ? formatValue(val) : `${val}`);
    }
    // Throttle parent updates to ~30fps
    const now = Date.now();
    if (now - lastUpdate.current > 33) {
      onChange(val);
      lastUpdate.current = now;
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(val);
        lastUpdate.current = Date.now();
      }, 33);
    }
  }, [onChange, formatValue]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitInput(inputText);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newVal = Math.max(min, Math.min(max, localValue + step));
      setLocalValue(newVal);
      setInputText(formatValue ? formatValue(newVal) : `${newVal}`);
      onChange(newVal);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newVal = Math.max(min, Math.min(max, localValue - step));
      setLocalValue(newVal);
      setInputText(formatValue ? formatValue(newVal) : `${newVal}`);
      onChange(newVal);
    }
  };

  return (
    <div className="space-y-1.5">
      <span
        className="body-font"
        style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => { isFocused.current = true; }}
          onBlur={() => { isFocused.current = false; commitInput(inputText); }}
          onKeyDown={handleInputKeyDown}
          className="mono-font tabular-nums focus:outline-none shrink-0"
          style={{
            width: 48,
            height: 22,
            paddingInline: 5,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            color: 'var(--film-pale)',
            textAlign: 'center',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(196,124,46,0.4)'; }}
          onMouseLeave={(e) => { if (!isFocused.current) (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleRangeChange}
          className="flex-1 min-w-0"
        />
      </div>
    </div>
  );
};
// ── ToggleRow ────────────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
}> = ({ label, sub, checked, onChange, small }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p
        className="body-font font-medium"
        style={{
          fontSize: small ? 10 : 11,
          color: 'var(--film-text-label)',
        }}
      >
        {label}
      </p>
      {sub && (
        <p
          className="body-font mt-0.5"
          style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
        >
          {sub}
        </p>
      )}
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
        checked ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
      )}
    >
      <span
        className={clsx(
          'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </Switch>
  </div>
);

// ── Alignment grid ────────────────────────────────────────────────────────────
const GRID_POSITIONS: { id: PresetType; label: string }[] = [
  { id: 'tl', label: 'Top left' },
  { id: 'tc', label: 'Top centre' },
  { id: 'tr', label: 'Top right' },
  { id: 'lc', label: 'Middle left' },
  { id: 'cc', label: 'Centre' },
  { id: 'rc', label: 'Middle right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'bc', label: 'Bottom centre' },
  { id: 'br', label: 'Bottom right' },
];

const AlignmentGrid: React.FC<{ value: PresetType; onChange: (v: PresetType) => void }> = ({
  value,
  onChange,
}) => (
  <div className="grid grid-cols-3 gap-1 w-[5.5rem]">
    {GRID_POSITIONS.map((pos) => (
      <button
        key={pos.id}
        type="button"
        onClick={() => onChange(pos.id)}
        title={pos.label}
        className={clsx(
          'w-full aspect-square rounded transition-all active:scale-90',
          value === pos.id
            ? 'bg-[#C47C2E] shadow-[0_0_8px_rgba(196,124,46,0.4)]'
            : 'hover:bg-white/[0.07] border border-white/[0.06]'
        )}
        style={{
          background: value === pos.id ? '#C47C2E' : 'rgba(255,255,255,0.03)',
        }}
      >
        <div
          className={clsx('w-1.5 h-1.5 rounded-full mx-auto')}
          style={{
            background: value === pos.id ? 'white' : 'rgba(140,130,112,0.4)',
          }}
        />
      </button>
    ))}
  </div>
);

function resolveShadow(v: number | boolean | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  if (typeof v === 'boolean') return v ? 6 : 0;
  return v;
}

const PropertyPanel: React.FC<Props> = ({ config, setConfig, selectedIds, viewMode }) => {
  const { toggleViewOption, viewOptions } = useEditor();

  const updateConfig = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setConfig((prev) => {
      if (key === 'layout' || key === 'preset') {
        const newItems = { ...prev.items };
        (Object.keys(newItems) as RatingType[]).forEach((k) => {
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
    setConfig((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  const updateSelectedBadges = (updates: Partial<BadgeConfig>) =>
    setConfig((prev) => {
      const newItems = { ...prev.items };
      selectedIds.forEach((id) => {
        newItems[id] = { ...newItems[id], ...updates };
      });
      return { ...prev, items: newItems };
    });

  const clearSelectedBadgeProp = (prop: keyof BadgeConfig) =>
    setConfig((prev) => {
      const newItems = { ...prev.items };
      selectedIds.forEach((id) => {
        if (newItems[id]) {
          const copy = { ...newItems[id] };
          delete copy[prop];
          newItems[id] = copy;
        }
      });
      return { ...prev, items: newItems };
    });

  const getCommonValue = <K extends keyof BadgeConfig>(
    prop: K,
    def: BadgeConfig[K]
  ): BadgeConfig[K] | null => {
    const vals = Array.from(selectedIds).map(
      (id) =>
        config.items[id]?.[prop] ?? (config[prop as keyof PosterConfig] as BadgeConfig[K]) ?? def
    );
    return vals.length > 0 && vals.every((v) => v === vals[0]) ? vals[0] : null;
  };

  const showGlobal = viewMode ? viewMode === 'global' : selectedIds.size === 0;

  // ── Global view ────────────────────────────────────────────────────────────
  if (showGlobal)
    return (
      <div className="pb-24">
        <Section title="Layout" icon={<Layout size={10} />} sectionId="global-layout">
          <div className="flex items-start gap-4">
            <div>
              <p
                className="body-font mb-2"
                style={{ fontSize: 10, color: 'var(--film-text-ghost)', fontWeight: 500 }}
              >
                Position preset
              </p>
              <AlignmentGrid value={config.preset} onChange={(v) => updateConfig('preset', v)} />
            </div>
            <div className="flex-1">
              <p
                className="body-font mb-2"
                style={{ fontSize: 10, color: 'var(--film-text-ghost)', fontWeight: 500 }}
              >
                Flow direction
              </p>
              <div className="space-y-1.5">
                {[
                  { id: 'col' as const, label: 'Column', icon: <Rows2 size={12} /> },
                  { id: 'row' as const, label: 'Row', icon: <Columns2 size={12} /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig('layout', opt.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors syne-font"
                    style={{
                      background:
                        config.layout === opt.id
                          ? 'rgba(196,124,46,0.1)'
                          : 'rgba(255,255,255,0.02)',
                      color:
                        config.layout === opt.id
                          ? 'var(--film-pale)'
                          : 'var(--film-text-dim)',
                      border:
                        config.layout === opt.id
                          ? '1px solid rgba(196,124,46,0.22)'
                          : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span
                      style={{
                        color:
                          config.layout === opt.id
                            ? 'var(--film-amber)'
                            : 'var(--film-text-ghost)',
                        lineHeight: 0,
                      }}
                    >
                      {opt.icon}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Poster" icon={<Layers size={10} />} sectionId="global-poster">
          <SliderRow
            label="Background Blur"
            value={config.posterBlur}
            min={0}
            max={20}
            unit="px"
            onChange={(v) => updateConfig('posterBlur', v)}
          />
          <ToggleRow
            label="Grayscale"
            sub="Desaturate the poster image"
            checked={config.grayscale}
            onChange={(v) => updateConfig('grayscale', v)}
          />
        </Section>

        <Section
          title="Badge Defaults"
          icon={<Palette size={10} />}
          sectionId="global-badge-defaults"
        >
          <ToggleRow
            label="Show Icons"
            checked={config.icon ?? true}
            onChange={(v) => updateConfig('icon', v)}
          />
          <ToggleRow
            label="Show Rating Text"
            sub="Hide to show icons only"
            checked={config.showText !== false}
            onChange={(v) => updateConfig('showText', v)}
          />
          <SliderRow
            label="Glass Blur"
            value={config.blur}
            min={0}
            max={20}
            unit="px"
            onChange={(v) => updateConfig('blur', v)}
          />
          <SliderRow
            label="Corner Radius"
            value={config.radius}
            min={0}
            max={30}
            unit="px"
            onChange={(v) => updateConfig('radius', v)}
          />
          <SliderRow
            label="Drop Shadow"
            value={resolveShadow(config.shadow as number | boolean, 6)}
            min={0}
            max={30}
            onChange={(v) => updateConfig('shadow', v)}
          />
          <SliderRow
            label="Border Width"
            value={config.borderW ?? 0}
            min={0}
            max={10}
            unit="px"
            onChange={(v) => updateConfig('borderW', v)}
          />
          {(config.borderW ?? 0) > 0 && (
            <ColorPicker
              label="Border Color"
              value={config.borderC ?? '#ffffff'}
              onChange={(v) => updateConfig('borderC', v)}
            />
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="body-font" style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}>
                Badge Background
              </span>
              {config.bg && (
                <button
                  onClick={() => clearGlobalColor('bg')}
                  className="mono-font transition-colors"
                  style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-ghost)'; }}
                >
                  Reset
                </button>
              )}
            </div>
            <ColorPicker
              value={config.bg ?? '#000000'}
              onChange={(v) => updateConfig('bg', v)}
              showOpacity
              opacity={config.alpha}
              onOpacityChange={(v) => updateConfig('alpha', v)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="body-font" style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}>
                Badge Text Color
              </span>
              {config.txt && (
                <button
                  onClick={() => clearGlobalColor('txt')}
                  className="mono-font transition-colors"
                  style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-ghost)'; }}
                >
                  Reset
                </button>
              )}
            </div>
            <ColorPicker value={config.txt ?? '#ffffff'} onChange={(v) => updateConfig('txt', v)} />
          </div>
        </Section>

        <Section
          title="Canvas Overlays"
          icon={<Smartphone size={10} />}
          defaultOpen={false}
          sectionId="global-overlays"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'showSafeArea' as const, label: 'Safe Area' },
              { key: 'showGrid' as const, label: 'Grid Lines' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleViewOption(key)}
                className="h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 syne-font"
                style={{
                  background: viewOptions[key]
                    ? 'rgba(196,124,46,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  color: viewOptions[key] ? 'var(--film-pale)' : 'var(--film-text-dim)',
                  border: viewOptions[key]
                    ? '1px solid rgba(196,124,46,0.22)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Eye
                  size={10}
                  style={{ color: viewOptions[key] ? 'var(--film-amber)' : 'var(--film-text-ghost)' }}
                />
                {label}
              </button>
            ))}
          </div>
          <p
            className="body-font leading-relaxed"
            style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
          >
            Canvas-only guides — not visible in exported images.
          </p>
        </Section>
      </div>
    );

  // ── No-selection placeholder ──────────────────────────────────────────────
  if (selectedIds.size === 0)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Layers size={18} strokeWidth={1.5} style={{ color: 'var(--film-text-ghost)', opacity: 0.4 }} />
        </div>
        <div>
          <p
            className="syne-font font-semibold"
            style={{ fontSize: 12, color: 'var(--film-text-dim)' }}
          >
            No badge selected
          </p>
          <p
            className="body-font mt-1"
            style={{ fontSize: 11, color: 'var(--film-text-ghost)' }}
          >
            Click a badge on the canvas to edit
          </p>
        </div>
      </div>
    );

  // ── Per-badge / selection view ─────────────────────────────────────────────
  const isAgeSelected = selectedIds.has('age');
  const multi = selectedIds.size > 1;

  const commonBlur = getCommonValue('blur', config.blur) ?? config.blur;
  const commonAlpha = getCommonValue('alpha', config.alpha) ?? config.alpha;
  const commonRadius = getCommonValue('radius', config.radius) ?? config.radius;
  const commonShadow = resolveShadow(
    (getCommonValue('shadow', 6) as number | boolean | null) ?? 6,
    6
  );
  const commonScale = (getCommonValue('scale', 1.0) ?? 1.0) as number;
  const commonBorderW = (getCommonValue('borderW', 0) ?? 0) as number;
  const commonShowText = (getCommonValue('showText', true) as boolean | null) ?? true;

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
      {/* Selection header — kept as amber-tinted card, matches dashboard style */}
      <div
        className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl"
        style={{
          background: 'rgba(196,124,46,0.05)',
          border: '1px solid rgba(196,124,46,0.14)',
        }}
      >
        <p
          className="syne-font font-semibold"
          style={{ fontSize: 11, color: 'var(--film-pale)' }}
        >
          {multi ? `${selectedIds.size} badges selected` : Array.from(selectedIds)[0]}
        </p>
        <p
          className="body-font mt-0.5"
          style={{ fontSize: 9, color: 'rgba(212,162,69,0.45)' }}
        >
          {multi
            ? 'Changes apply to all selected badges'
            : 'Per-badge overrides inherit global defaults'}
        </p>
      </div>

      <Section title="Transform" sectionId="badge-transform">
        <SliderRow
          label="Scale"
          value={commonScale}
          min={0.5}
          max={2.0}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => updateSelectedBadges({ scale: v })}
        />
      </Section>

      <Section title="Glass & Shape" sectionId="badge-glass">
        <SliderRow
          label="Blur"
          value={commonBlur}
          min={0}
          max={20}
          unit="px"
          onChange={(v) => updateSelectedBadges({ blur: v })}
        />
        <SliderRow
          label="Radius"
          value={commonRadius}
          min={0}
          max={30}
          unit="px"
          onChange={(v) => updateSelectedBadges({ radius: v })}
        />
      </Section>

      <Section title="Fill & Stroke" sectionId="badge-fill">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="body-font" style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}>
              Background
            </span>
            <button
              onClick={() => clearSelectedBadgeProp('bg')}
              className="mono-font transition-colors"
              style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-ghost)'; }}
            >
              Reset
            </button>
          </div>
          <ColorPicker
            value={commonBg}
            onChange={(v) => updateSelectedBadges({ bg: v })}
            showOpacity
            opacity={commonAlpha}
            onOpacityChange={(v) => updateSelectedBadges({ alpha: v })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="body-font" style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}>
              Text / Icon Color
            </span>
            <button
              onClick={() => clearSelectedBadgeProp('txt')}
              className="mono-font transition-colors"
              style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-ghost)'; }}
            >
              Reset
            </button>
          </div>
          <ColorPicker value={commonTxt} onChange={(v) => updateSelectedBadges({ txt: v })} />
        </div>

        <SliderRow
          label="Border Width"
          value={commonBorderW}
          min={0}
          max={10}
          unit="px"
          onChange={(v) => updateSelectedBadges({ borderW: v })}
        />
        {commonBorderW > 0 && (
          <ColorPicker
            label="Border Color"
            value={(() => {
              const v = getCommonValue('borderC', '#ffffff');
              return (v === null ? '#ffffff' : v) as string;
            })()}
            onChange={(v) => updateSelectedBadges({ borderC: v })}
          />
        )}
      </Section>

      <Section title="Visibility" icon={<Eye size={10} />} sectionId="badge-visibility">
        {!isAgeSelected && (
          <ToggleRow
            label="Show Icon"
            checked={(getCommonValue('icon', true) as boolean) ?? true}
            onChange={(v) => updateSelectedBadges({ icon: v })}
          />
        )}
        <ToggleRow
          label="Show Rating Text"
          sub="Hide number, show icon only"
          checked={commonShowText !== false}
          onChange={(v) => updateSelectedBadges({ showText: v })}
        />
        <SliderRow
          label="Drop Shadow"
          value={commonShadow}
          min={0}
          max={30}
          onChange={(v) => updateSelectedBadges({ shadow: v })}
        />
      </Section>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() =>
            setConfig((prev) => {
              const ni = { ...prev.items };
              selectedIds.forEach((id) => delete ni[id]);
              return { ...prev, items: ni };
            })
          }
          className="w-full h-8 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer syne-font"
          style={{
            border: '1px solid rgba(248,113,113,0.12)',
            background: 'rgba(248,113,113,0.04)',
            color: 'rgba(248,113,113,0.6)',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.85)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.04)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.6)';
          }}
        >
          <RotateCcw size={11} /> Reset to global defaults
        </button>
      </div>
    </div>
  );
};

export default memo(PropertyPanel);
