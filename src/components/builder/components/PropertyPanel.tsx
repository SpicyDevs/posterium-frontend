// src/components/builder/components/PropertyPanel.tsx
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Switch } from '@headlessui/react';
import type { PosterConfig, RatingType, PresetType, BadgeConfig } from '../types';
import { ALL_BADGES, CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_CONFIG } from '../types';
import {
  Layers,
  Layout,
  Palette,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Rows2,
  Columns2,
  Type,
  Hash,
  Sliders,
  ImagePlay,
  Check,
} from 'lucide-react';
import ColorPicker from './ColorPicker';
import clsx from 'clsx';
import SidebarLayout from './SidebarLayout';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  selectedLogo?: boolean;
  selectedMinimalElements?: Set<string>;
  viewMode?: 'global' | 'selection';
  mode?: 'badges' | 'logo' | 'selection';
}

const SECTION_STORAGE_KEY = 'posterium_section_states_v2';
const INACTIVE_OPTION_HOVER_CLASSES =
  'bg-[rgba(255,255,255,0.03)] text-[var(--film-text-label)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(196,124,46,0.24)] hover:text-[var(--film-cream)]';
const BADGE_DISPLAY_NAMES: Record<string, string> = {
  imdb: 'IMDb',
  rt: 'Rotten Tomatoes',
  rt_popcorn: 'Audience Score',
  tmdb: 'TMDB',
  letterboxd: 'Letterboxd',
  meta: 'Metacritic',
  mal: 'MyAnimeList',
  anilist: 'AniList',
  age: 'Age Rating',
  runtime: 'Runtime',
  year: 'Year',
  title: 'Title',
};

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

// ── Section ──────────────────────────────────────────────────────────────────
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
            <span style={{ color: 'var(--film-text-dim)', opacity: 1, lineHeight: 0 }}>{icon}</span>
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
      {open && <div className="px-3 pb-1 space-y-3.5">{children}</div>}
      <div
        className="mt-5 mx-3"
        style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      />
    </div>
  );
};

// ── SliderRow ─────────────────────────────────────────────────────────────────
const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  onReset?: () => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}> = ({ label, value, onChange, onReset, min, max, step = 1, unit = '', formatValue }) => {
  const [localValue, setLocalValue] = useState(value);
  const [inputText, setInputText] = useState(() => (formatValue ? formatValue(value) : `${value}`));
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

  const commitInput = useCallback(
    (text: string) => {
      const raw = text.replace(unit, '').replace(/[^0-9.\-]/g, '');
      const n = parseFloat(raw);
      if (!isNaN(n)) {
        const clamped = Math.max(min, Math.min(max, n));
        setLocalValue(clamped);
        setInputText(formatValue ? formatValue(clamped) : `${clamped}`);
        onChange(clamped);
      } else {
        setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
      }
    },
    [min, max, onChange, unit, formatValue, localValue]
  );

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setLocalValue(val);
      if (!isFocused.current) {
        setInputText(formatValue ? formatValue(val) : `${val}`);
      }
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
    },
    [onChange, formatValue]
  );

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
      <div className="flex items-center justify-between gap-2">
        <span
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
        >
          {label}
        </span>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[9px] mono-font transition-colors"
            style={{ color: 'var(--film-text-dim)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => {
            isFocused.current = true;
          }}
          onBlur={() => {
            isFocused.current = false;
            commitInput(inputText);
          }}
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(196,124,46,0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isFocused.current)
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
          }}
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

// ── ToggleRow ─────────────────────────────────────────────────────────────────
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
        style={{ fontSize: small ? 10 : 11, color: 'var(--film-text-label)' }}
      >
        {label}
      </p>
      {sub && (
        <p className="body-font mt-0.5" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
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

// ── SegmentedRow — compact button group ───────────────────────────────────────
const SegmentedRow: React.FC<{
  label: string;
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="space-y-1.5">
    <span
      className="body-font"
      style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
    >
      {label}
    </span>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={clsx(
            'h-7 rounded-md text-[10px] font-medium transition-all border syne-font',
            value === opt.id
              ? 'bg-[rgba(196,124,46,0.15)] text-[var(--film-pale)] border-[rgba(196,124,46,0.3)]'
              : INACTIVE_OPTION_HOVER_CLASSES
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// ── TextInputRow ──────────────────────────────────────────────────────────────
const TextInputRow: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}> = ({ label, value, placeholder, onChange, onClear }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
        >
          {label}
        </span>
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="mono-font transition-colors"
            style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full focus:outline-none body-font hover:border-[rgba(196,124,46,0.28)]"
        style={{
          height: 28,
          paddingInline: 8,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(196,124,46,0.4)' : 'rgba(255,255,255,0.1)'}`,
          fontSize: 11,
          color: 'var(--film-pale)',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
};

const SelectBox = memo(
  ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { id: string; label: string }[];
  }) => (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          className="w-full flex items-center justify-between gap-1 h-9 px-2.5 rounded-lg text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] syne-font"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--film-pale)',
          }}
        >
          <span className="truncate">{options.find((o) => o.id === value)?.label ?? value}</span>
          <ChevronDown size={10} style={{ color: 'var(--film-text-dim)', flexShrink: 0 }} />
        </ListboxButton>
        <ListboxOptions
          transition
          className="absolute z-50 mt-1 w-full py-1 rounded-xl shadow-2xl shadow-black/50 text-[11px] overflow-auto max-h-52 focus:outline-none transition duration-75 ease-in data-[closed]:scale-95 data-[closed]:opacity-0"
          style={{
            background: 'var(--film-mid)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.id}
              value={opt.id}
              className={({ active, selected }) =>
                clsx(
                  'flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors syne-font',
                  active && 'bg-[rgba(196,124,46,0.1)]',
                  !active && selected && 'text-[var(--film-pale)]',
                  !active && !selected && 'text-[var(--film-text-label)]'
                )
              }
            >
              {({ selected }) => (
                <>
                  <span className="flex-1 truncate">{opt.label}</span>
                  {selected && (
                    <Check size={10} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
);
SelectBox.displayName = 'SelectBox';

// ── ColorRow — label + optional reset button above a ColorPicker ──────────────
const ColorRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset?: () => void;
  showOpacity?: boolean;
  opacity?: number;
  onOpacityChange?: (v: number) => void;
}> = ({ label, value, onChange, onReset, showOpacity, opacity, onOpacityChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span
        className="body-font"
        style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
      >
        {label}
      </span>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mono-font transition-colors"
          style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
          }}
        >
          Reset
        </button>
      )}
    </div>
    <ColorPicker
      value={value}
      onChange={onChange}
      showOpacity={showOpacity}
      opacity={opacity}
      onOpacityChange={onOpacityChange}
    />
  </div>
);

// ── Alignment grid ─────────────────────────────────────────────────────────────
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
            ? 'shadow-[0_0_8px_rgba(196,124,46,0.4)] border border-[rgba(196,124,46,0.3)]'
            : 'border border-white/[0.06] hover:bg-white/[0.08] hover:border-[rgba(196,124,46,0.24)]'
        )}
        style={{
          background: value === pos.id ? '#C47C2E' : 'rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full mx-auto"
          style={{ background: value === pos.id ? 'white' : 'rgba(180,168,148,0.68)' }}
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

const makeDefaultMinimalRating = (provider: RatingType = 'imdb', x = 342, y = 688) => ({
  provider,
  enabled: true,
  x,
  y,
  size: 26,
  color: '#facc15',
  opacity: 1,
  iconMode: 'star' as const,
  symbol: '★',
  bgEnabled: false,
  bgColor: '#000000',
  bgOpacity: 0,
  borderW: 0,
  borderColor: '#ffffff',
  borderOpacity: 0.7,
  radius: 0,
  paddingX: 0,
  paddingY: 0,
  shadowEnabled: false,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000',
});

const placeMinimalRatings = (
  ratings: NonNullable<PosterConfig['minimalRatings']>,
  preset: PosterConfig['preset'],
  layout: PosterConfig['layout']
) => {
  const activePreset = preset === 'custom' ? 'bc' : preset;
  const activeLayout = layout === 'custom' ? 'row' : layout;
  const gap = 14;
  const chipW = 120;
  const chipH = 34;
  const total = ratings.length;
  if (total === 0) return ratings;
  const groupW = activeLayout === 'row' ? total * chipW + (total - 1) * gap : chipW;
  const groupH = activeLayout === 'col' ? total * chipH + (total - 1) * gap : chipH;
  let startX = 0;
  let startY = 0;
  if (activePreset.includes('l')) startX = 20;
  else if (activePreset.includes('r')) startX = CANVAS_WIDTH - groupW - 20;
  else startX = Math.round((CANVAS_WIDTH - groupW) / 2);
  if (activePreset.includes('t')) startY = 20;
  else if (activePreset.includes('b')) startY = CANVAS_HEIGHT - groupH - 26;
  else startY = Math.round((CANVAS_HEIGHT - groupH) / 2);
  return ratings.map((item, index) => ({
    ...item,
    x: Math.round(startX + (activeLayout === 'row' ? index * (chipW + gap) : 0)),
    y: Math.round(startY + (activeLayout === 'col' ? index * (chipH + gap) : 0)),
  }));
};

// ── Main component ─────────────────────────────────────────────────────────────
const PropertyPanel: React.FC<Props> = ({
  config,
  setConfig,
  selectedIds,
  selectedLogo = false,
  selectedMinimalElements = new Set<string>(),
  viewMode,
  mode,
}) => {
  const badgesEnabled = config.ratings.length > 0;
  const logoSettingsRef = useRef<HTMLDivElement | null>(null);

  const updateConfig = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setConfig((prev) => {
      if (key === 'layout' || key === 'preset') {
        if ((prev.uiPreset ?? 'b') === 'm') {
          const nextPreset = (key === 'preset' ? value : prev.preset) as PosterConfig['preset'];
          const nextLayout = (key === 'layout' ? value : prev.layout) as PosterConfig['layout'];
          const placed = placeMinimalRatings(
            [...(prev.minimalRatings ?? [makeDefaultMinimalRating()])].slice(0, 3),
            nextPreset,
            nextLayout
          );
          return { ...prev, [key]: value, minimalRatings: placed };
        }
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

  const updateTitleDefaults = (updates: Partial<BadgeConfig>) =>
    setConfig((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        title: {
          ...(prev.items.title ?? {}),
          ...updates,
        },
      },
    }));

  const clearTitleDefaultProp = (prop: keyof BadgeConfig) =>
    setConfig((prev) => {
      const nextTitle = { ...(prev.items.title ?? {}) };
      delete nextTitle[prop];
      return {
        ...prev,
        items: {
          ...prev.items,
          title: nextTitle,
        },
      };
    });

  // Returns the shared value across all selected badges, or null if mixed.
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

  const panelMode = mode ?? (viewMode === 'selection' ? 'selection' : 'badges');
  const showGlobal = panelMode !== 'selection';
  const showBadgeSettings = panelMode === 'badges';
  const showLogoSettings = panelMode === 'badges';
  const showTitleDefaults = showBadgeSettings && config.ratings.includes('title');
  const logoSectionTitle = 'Logo Overlay';
  const LOGO_BASE_W = 320;
  const LOGO_BASE_H = 84;
  const LOGO_ASPECT = LOGO_BASE_W / LOGO_BASE_H;
  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        logoSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };
    window.addEventListener('builder-scroll-logo-settings', handler);
    return () => window.removeEventListener('builder-scroll-logo-settings', handler);
  }, []);

  // ── Global view ───────────────────────────────────────────────────────────────
  if (showGlobal)
    return (
      <SidebarLayout side="right" bodyClassName="pb-24">
        {showBadgeSettings && (
          <Section title="Layout" icon={<Layout size={10} />} sectionId="global-layout">
            <div className="flex items-start gap-4">
              <div>
                <p
                  className="body-font mb-2"
                  style={{ fontSize: 10, color: 'var(--film-text-label)', fontWeight: 500 }}
                >
                  Position preset
                </p>
                <AlignmentGrid value={config.preset} onChange={(v) => updateConfig('preset', v)} />
              </div>
              <div className="flex-1">
                <p
                  className="body-font mb-2"
                  style={{ fontSize: 10, color: 'var(--film-text-label)', fontWeight: 500 }}
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
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors border syne-font',
                        config.layout === opt.id
                          ? 'bg-[rgba(196,124,46,0.1)] text-[var(--film-pale)] border-[rgba(196,124,46,0.22)]'
                          : INACTIVE_OPTION_HOVER_CLASSES
                      )}
                    >
                      <span
                        style={{
                          color:
                            config.layout === opt.id
                              ? 'var(--film-amber)'
                              : 'var(--film-text-label)',
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
        )}

        {showBadgeSettings && badgesEnabled && (
          <>
            <Section
              title="Badge Appearance"
              icon={<Palette size={10} />}
              sectionId="global-badge-appearance"
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
              <SegmentedRow
                label="Icon Style"
                options={[
                  { id: '1', label: 'Default' },
                  { id: '2', label: 'Alt' },
                  { id: '3', label: 'Mono' },
                ]}
                value={String(config.iconType ?? 1)}
                onChange={(v) => updateConfig('iconType', Math.max(1, Math.min(3, Number(v) || 1)))}
              />
            </Section>

            <Section
              title="Badge Shape"
              icon={<Sliders size={10} />}
              sectionId="global-badge-shape"
            >
              <SliderRow
                label="Scale"
                value={config.scale ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                formatValue={(v) => `${v.toFixed(2)}×`}
                onChange={(v) => updateConfig('scale', v)}
                onReset={config.scale !== 1 ? () => updateConfig('scale', 1.0) : undefined}
              />
              <SliderRow
                label="Glass Blur"
                value={config.blur}
                min={0}
                max={20}
                unit="px"
                onChange={(v) => updateConfig('blur', v)}
                onReset={config.blur !== 0 ? () => updateConfig('blur', 0) : undefined}
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
                onReset={
                  resolveShadow(config.shadow as number | boolean, 6) !== 6
                    ? () => updateConfig('shadow', 6)
                    : undefined
                }
              />
              <SliderRow
                label="Shadow X"
                value={config.shadowX ?? 0}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('shadowX', Math.round(v))}
              />
              <SliderRow
                label="Shadow Y"
                value={config.shadowY ?? 2}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('shadowY', Math.round(v))}
              />
              <ColorRow
                label="Shadow Color"
                value={config.shadowColor ?? '#000000'}
                onChange={(v) => updateConfig('shadowColor', v)}
              />
              <SliderRow
                label="Shadow Opacity"
                value={config.shadowOpacity ?? 0.35}
                min={0}
                max={1}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => updateConfig('shadowOpacity', Number(v.toFixed(2)))}
              />
            </Section>

            <Section title="Badge Colors" sectionId="global-badge-colors">
              <ColorRow
                label="Background"
                value={config.bg ?? '#000000'}
                onChange={(v) => updateConfig('bg', v)}
                onReset={config.bg ? () => clearGlobalColor('bg') : undefined}
                showOpacity
                opacity={config.alpha}
                onOpacityChange={(v) => updateConfig('alpha', v)}
              />
              <ColorRow
                label="Text & Icon Color"
                value={config.txt ?? '#ffffff'}
                onChange={(v) => updateConfig('txt', v)}
                onReset={config.txt ? () => clearGlobalColor('txt') : undefined}
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
                <ColorRow
                  label="Border Color"
                  value={config.borderC ?? '#ffffff'}
                  onChange={(v) => updateConfig('borderC', v)}
                />
              )}
            </Section>

            <Section
              title="Score"
              icon={<Hash size={10} />}
              defaultOpen={false}
              sectionId="global-score"
            >
              <ToggleRow
                label="Normalize to /10"
                sub="Convert all scores to a 0–10 scale"
                checked={config.normalize ?? false}
                onChange={(v) => updateConfig('normalize', v)}
              />
              <ToggleRow
                label="Show Denominator"
                sub="Append /10 to ratings"
                checked={(config.outOf ?? 0) > 0}
                onChange={(v) => updateConfig('outOf', v ? 10 : undefined)}
              />
            </Section>

            <Section
              title="Labels"
              icon={<Type size={10} />}
              defaultOpen={false}
              sectionId="global-labels"
            >
              {/* Show/Hide Labels toggle */}
              <button
                type="button"
                onClick={() => updateConfig('labelPos', config.labelPos ? undefined : 'below')}
                className="w-full h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 syne-font mb-1"
                style={{
                  background: config.labelPos ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.02)',
                  color: config.labelPos ? 'var(--film-pale)' : 'var(--film-text-dim)',
                  border: config.labelPos
                    ? '1px solid rgba(196,124,46,0.22)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.35)';
                  (e.currentTarget as HTMLElement).style.background = config.labelPos
                    ? 'rgba(196,124,46,0.15)'
                    : 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = config.labelPos
                    ? 'rgba(196,124,46,0.22)'
                    : 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.background = config.labelPos
                    ? 'rgba(196,124,46,0.1)'
                    : 'rgba(255,255,255,0.02)';
                }}
              >
                {config.labelPos ? (
                  <Eye size={11} style={{ color: 'var(--film-amber)' }} />
                ) : (
                  <EyeOff size={11} style={{ color: 'var(--film-text-dim)' }} />
                )}
                {config.labelPos ? 'Labels Visible' : 'Labels Hidden'}
              </button>
              <SegmentedRow
                label="Label Position"
                options={[
                  { id: 'above', label: 'Above' },
                  { id: 'below', label: 'Below' },
                  { id: 'left', label: 'Left' },
                  { id: 'right', label: 'Right' },
                  { id: 'none', label: 'Hide' },
                ]}
                value={config.labelPos ?? 'none'}
                onChange={(v) =>
                  updateConfig(
                    'labelPos',
                    (v === 'none' ? undefined : (v as PosterConfig['labelPos'])) as PosterConfig['labelPos']
                  )
                }
              />
              <TextInputRow
                label="Label Text"
                value={config.labelText ?? ''}
                placeholder="Default (provider name)"
                onChange={(v) => updateConfig('labelText', v || undefined)}
                onClear={() => updateConfig('labelText', undefined)}
              />
              <SliderRow
                label="Label Size"
                value={config.labelSize ?? 11}
                min={6}
                max={32}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('labelSize', v)}
              />
              <ColorRow
                label="Label Color"
                value={config.labelColor ?? '#ffffff'}
                onChange={(v) => updateConfig('labelColor', v)}
                onReset={
                  config.labelColor ? () => updateConfig('labelColor', undefined) : undefined
                }
              />
            </Section>
          </>
        )}

        {showTitleDefaults && (
          <Section title="Title Layer" icon={<Type size={10} />} sectionId="global-title-layer">
            <SliderRow
              label="Container Width"
              value={Math.max(120, config.items.title?.textBoxWidth ?? CANVAS_WIDTH)}
              min={120}
              max={CANVAS_WIDTH}
              step={1}
              unit="px"
              onChange={(v) => updateTitleDefaults({ textBoxWidth: Math.round(v) })}
              onReset={() =>
                updateTitleDefaults({
                  textBoxWidth: DEFAULT_CONFIG.items.title?.textBoxWidth ?? CANVAS_WIDTH,
                })
              }
            />
            <SliderRow
              label="Container Height"
              value={Math.max(32, config.items.title?.textBoxHeight ?? 76)}
              min={32}
              max={240}
              step={1}
              unit="px"
              onChange={(v) => updateTitleDefaults({ textBoxHeight: Math.round(v) })}
              onReset={() =>
                updateTitleDefaults({
                  textBoxHeight: DEFAULT_CONFIG.items.title?.textBoxHeight ?? 76,
                })
              }
            />
            <SegmentedRow
              label="Text Align"
              options={[
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Right' },
              ]}
              value={config.items.title?.textAlign ?? 'left'}
              onChange={(v) => updateTitleDefaults({ textAlign: v as BadgeConfig['textAlign'] })}
            />
            <SliderRow
              label="Ellipsis Cutoff"
              value={Math.max(0, Math.round(config.items.title?.textMaxChars ?? 0))}
              min={0}
              max={300}
              step={1}
              unit="ch"
              formatValue={(v) => (v <= 0 ? 'Full' : `${Math.round(v)} ch`)}
              onChange={(v) => updateTitleDefaults({ textMaxChars: Math.round(v) })}
              onReset={() => clearTitleDefaultProp('textMaxChars')}
            />
            <SliderRow
              label="Wrap Lines"
              value={Math.max(0, Math.round(config.items.title?.textMaxLines ?? 0))}
              min={0}
              max={8}
              step={1}
              formatValue={(v) => (v <= 0 ? 'Full' : `${Math.round(v)} lines`)}
              onChange={(v) => updateTitleDefaults({ textMaxLines: Math.round(v) })}
              onReset={() => clearTitleDefaultProp('textMaxLines')}
            />
          </Section>
        )}

        {showLogoSettings && config.logo && (
          <div ref={logoSettingsRef}>
            <Section
              title={logoSectionTitle}
              icon={<ImagePlay size={10} />}
              sectionId="global-logo-overlay"
            >
            <SliderRow
              label="Size"
              value={config.logoW}
              min={100}
              max={490}
              unit="px"
              onChange={(newW) => {
                const w = Math.round(newW);
                const h = Math.round(w / LOGO_ASPECT);
                setConfig((prev) => ({ ...prev, logoW: w, logoH: h }));
              }}
            />
            <SliderRow
              label="Opacity"
              value={config.logoOpacity}
              min={0}
              max={1}
              step={0.05}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => updateConfig('logoOpacity', v)}
            />
            <SliderRow
              label="Drop Shadow"
              value={config.logoShadow}
              min={0}
              max={30}
              onChange={(v) => updateConfig('logoShadow', v)}
            />
            <ToggleRow
              label="Background"
              sub="Add a styled panel behind the logo"
              checked={config.logoBgEnabled}
              onChange={(v) => updateConfig('logoBgEnabled', v)}
            />
            <SliderRow
              label="Border Width"
              value={config.logoBgBorderW}
              min={0}
              max={10}
              unit="px"
              onChange={(v) => updateConfig('logoBgBorderW', v)}
            />
            {config.logoBgBorderW > 0 && (
              <ColorRow
                label="Border Color"
                value={config.logoBgBorderC ?? '#ffffff'}
                onChange={(v) => updateConfig('logoBgBorderC', v)}
              />
            )}
            {config.logoBgEnabled && (
              <>
                <ColorRow
                  label="Background Color"
                  value={config.logoBgColor ?? '#000000'}
                  onChange={(v) => updateConfig('logoBgColor', v)}
                  showOpacity
                  opacity={config.logoBgOpacity}
                  onOpacityChange={(v) => updateConfig('logoBgOpacity', v)}
                />
                <SliderRow
                  label="Padding"
                  value={config.logoBgPadding}
                  min={0}
                  max={48}
                  unit="px"
                  onChange={(v) => updateConfig('logoBgPadding', v)}
                />
                <SliderRow
                  label="Corner Radius"
                  value={config.logoBgRadius}
                  min={0}
                  max={40}
                  unit="px"
                  onChange={(v) => updateConfig('logoBgRadius', v)}
                />
                <SliderRow
                  label="Background Shadow"
                  value={config.logoBgShadow}
                  min={0}
                  max={30}
                  onChange={(v) => updateConfig('logoBgShadow', v)}
                />
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      logoBgEnabled: true,
                      logoBgColor: prev.bg ?? '#000000',
                      logoBgOpacity: prev.alpha,
                      logoBgRadius: prev.radius,
                      logoBgPadding: 10,
                      logoBgBorderW: prev.borderW ?? 0,
                      logoBgBorderC: prev.borderC ?? '#ffffff',
                      logoBgShadow: resolveShadow(prev.shadow, 6),
                    }))
                  }
                  className="w-full h-8 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer syne-font"
                  style={{
                    border: '1px solid rgba(196,124,46,0.16)',
                    background: 'rgba(196,124,46,0.08)',
                    color: 'var(--film-pale)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Apply Badge Style to Logo Background
                </button>
              </>
            )}
            <p
              className="body-font leading-relaxed"
              style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
            >
              Drag the logo on the canvas to reposition it.
            </p>
            </Section>
          </div>
        )}
      </SidebarLayout>
    );

  // ── No-selection placeholder ──────────────────────────────────────────────
  if (
    panelMode === 'selection' &&
    selectedIds.size === 0 &&
    !selectedLogo &&
    selectedMinimalElements.size === 0
  )
    return (
      <SidebarLayout side="right">
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Layers
              size={18}
              strokeWidth={1.5}
              style={{ color: 'var(--film-text-dim)', opacity: 0.7 }}
            />
          </div>
          <div>
            <p
              className="syne-font font-semibold"
              style={{ fontSize: 12, color: 'var(--film-text-dim)' }}
            >
              Nothing selected
            </p>
            <p className="body-font mt-1" style={{ fontSize: 11, color: 'var(--film-text-dim)' }}>
              Click a layer on the canvas to edit
            </p>
          </div>
        </div>
      </SidebarLayout>
    );

  // ── Per-badge / selection view ─────────────────────────────────────────────

  const selectionCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;
  const isAgeSelected = selectedIds.has('age');
  const isOnlyTitleSelected = selectedIds.size === 1 && selectedIds.has('title');
  const isOnlyYearSelected = selectedIds.size === 1 && selectedIds.has('year');
  const isTitleOrYearOnlySelection = isOnlyTitleSelected || isOnlyYearSelected;
  const multi = selectionCount > 1;
  const selectedBadgeLabel = (() => {
    if (selectedLogo && selectedIds.size === 0 && selectedMinimalElements.size === 0) return 'Logo Overlay';
    if (selectedMinimalElements.size > 0 && selectedIds.size === 0 && !selectedLogo) {
      if (selectedMinimalElements.size > 1) return 'Minimal Selection';
      const only = Array.from(selectedMinimalElements)[0];
      if (only === 'minimal-title') return 'Title';
      if (only === 'minimal-year') return 'Year';
      if (only === 'minimal-duration') return 'Duration';
      if (only === 'minimal-logo') return 'Logo Overlay';
      if (only.startsWith('minimal-rating-')) return `Rating Slot ${Number(only.split('-').at(-1) ?? 0) + 1}`;
    }
    const first = Array.from(selectedIds)[0];
    if (!first) return 'Selection';
    return BADGE_DISPLAY_NAMES[first] ?? first.toUpperCase();
  })();

  // Resolve common values across the selection (null = mixed)
  const commonBlur = getCommonValue('blur', config.blur) ?? config.blur;
  const commonAlpha = getCommonValue('alpha', config.alpha) ?? config.alpha;
  const commonRadius = getCommonValue('radius', config.radius) ?? config.radius;
  const commonShadow = resolveShadow(
    (getCommonValue('shadow', 6) as number | boolean | null) ?? 6,
    6
  );
  const commonShadowX = (getCommonValue('shadowX', config.shadowX ?? 0) ?? config.shadowX ?? 0) as number;
  const commonShadowY = (getCommonValue('shadowY', config.shadowY ?? 2) ?? config.shadowY ?? 2) as number;
  const commonShadowOpacity = (getCommonValue('shadowOpacity', config.shadowOpacity ?? 0.35) ??
    config.shadowOpacity ??
    0.35) as number;
  const commonShadowColor = (() => {
    const v = getCommonValue('shadowColor', config.shadowColor ?? '#000000');
    return (v === null ? (config.shadowColor ?? '#000000') : v) as string;
  })();
  const commonScale = (getCommonValue('scale', config.scale ?? 1.0) ??
    config.scale ??
    1.0) as number;
  const commonBorderW = (getCommonValue('borderW', config.borderW ?? 0) ??
    config.borderW ??
    0) as number;
  const commonShowText = (getCommonValue('showText', config.showText ?? true) ??
    config.showText ??
    true) as boolean;
  const commonNorm = (getCommonValue('normalize', config.normalize ?? false) ??
    config.normalize ??
    false) as boolean;
  const commonOutOf = (getCommonValue('outOf', config.outOf ?? 0) ?? config.outOf ?? 0) as number;
  const commonIconType = (getCommonValue('iconType', config.iconType ?? 1) ??
    config.iconType ??
    1) as number;
  const commonLabelPos = getCommonValue('labelPos', config.labelPos ?? 'below') as string | null;
  const commonLabelTxt = getCommonValue('labelText', config.labelText ?? '') as string | null;
  const commonLabelSz = (getCommonValue('labelSize', config.labelSize ?? 11) ??
    config.labelSize ??
    11) as number;

  const commonBg = (() => {
    const v = getCommonValue('bg', config.bg ?? '#000000');
    return (v === null ? (config.bg ?? '#000000') : v) as string;
  })();
  const commonTxt = (() => {
    const v = getCommonValue('txt', config.txt ?? '#ffffff');
    return (v === null ? (config.txt ?? '#ffffff') : v) as string;
  })();
  const commonLabelColor = (() => {
    const v = getCommonValue('labelColor', config.labelColor ?? '#ffffff');
    return (v === null ? (config.labelColor ?? '#ffffff') : v) as string;
  })();
  const commonBorderC = (() => {
    const v = getCommonValue('borderC', config.borderC ?? '#ffffff');
    return (v === null ? (config.borderC ?? '#ffffff') : v) as string;
  })();
  const minimalTitleSelected = selectedMinimalElements.has('minimal-title');
  const minimalYearSelected = selectedMinimalElements.has('minimal-year');
  const minimalDurationSelected = selectedMinimalElements.has('minimal-duration');
  const commonTextSize = (getCommonValue('textSize', isOnlyYearSelected ? 42 : 36) ??
    (isOnlyYearSelected ? 42 : 36)) as number;
  const commonTextWeight = (getCommonValue('textWeight', 700) ?? 700) as number;
  const commonTextLetterSpacing = (getCommonValue('textLetterSpacing', 0) ?? 0) as number;
  const commonTextLineHeight = (getCommonValue('textLineHeight', 1.1) ?? 1.1) as number;
  const commonTextAlign = (getCommonValue('textAlign', 'left') ?? 'left') as
    | 'left'
    | 'center'
    | 'right';
  const commonTextBoxWidth = (getCommonValue(
    'textBoxWidth',
    DEFAULT_CONFIG.items.title?.textBoxWidth ?? CANVAS_WIDTH
  ) ??
    DEFAULT_CONFIG.items.title?.textBoxWidth ??
    CANVAS_WIDTH) as number;
  const commonTextBoxHeight = (getCommonValue(
    'textBoxHeight',
    DEFAULT_CONFIG.items.title?.textBoxHeight ?? 76
  ) ??
    DEFAULT_CONFIG.items.title?.textBoxHeight ??
    76) as number;
  const commonTextMaxChars = (getCommonValue('textMaxChars', 0) ?? 0) as number;
  const commonTextShadowEnabled = (getCommonValue('textShadowEnabled', false) ?? false) as boolean;
  const commonTextShadowX = (getCommonValue('textShadowX', 0) ?? 0) as number;
  const commonTextShadowY = (getCommonValue('textShadowY', 2) ?? 2) as number;
  const commonTextShadowBlur = (getCommonValue('textShadowBlur', 8) ?? 8) as number;
  const commonTextShadowColor = (getCommonValue('textShadowColor', '#000000') ?? '#000000') as string;

  return (
    <SidebarLayout side="right" bodyClassName="pb-24">
      {/* Selection header */}
      <div
        className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl"
        style={{
          background: 'rgba(196,124,46,0.05)',
          border: '1px solid rgba(196,124,46,0.14)',
        }}
      >
        <p className="syne-font font-semibold" style={{ fontSize: 11, color: 'var(--film-pale)' }}>
          {multi ? `${selectionCount} items selected` : selectedBadgeLabel}
        </p>
        <p className="body-font mt-0.5" style={{ fontSize: 9, color: 'rgba(212,162,69,0.45)' }}>
          {multi ? 'Changes apply to all selected layers' : 'Layer-specific configuration'}
        </p>
      </div>

      {selectedMinimalElements.size > 0 && (
        <>
          {(minimalTitleSelected || minimalYearSelected || minimalDurationSelected) && (
            <Section title="Selected Text" sectionId="selection-minimal-text">
              {minimalTitleSelected && (
                <>
                  <SliderRow
                    label="Title Size"
                    value={config.minimalTextSize}
                    min={14}
                    max={120}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTextSize', Math.round(v))}
                  />
                  <ColorRow
                    label="Title Color"
                    value={config.minimalTitleColor ?? '#f5f5f5'}
                    onChange={(v) => updateConfig('minimalTitleColor', v)}
                    showOpacity
                    opacity={config.minimalTitleOpacity ?? 1}
                    onOpacityChange={(v) => updateConfig('minimalTitleOpacity', Number(v.toFixed(2)))}
                  />
                </>
              )}
              {(minimalYearSelected || minimalDurationSelected) && (
                <>
                  <SliderRow
                    label="Meta Size"
                    value={config.minimalMetaSize ?? 50}
                    min={18}
                    max={80}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalMetaSize', Math.round(v))}
                  />
                  <ColorRow
                    label="Meta Color"
                    value={config.minimalMetaColor ?? '#d6dde3'}
                    onChange={(v) => updateConfig('minimalMetaColor', v)}
                    showOpacity
                    opacity={config.minimalMetaOpacity ?? 0.92}
                    onOpacityChange={(v) => updateConfig('minimalMetaOpacity', Number(v.toFixed(2)))}
                  />
                </>
              )}
            </Section>
          )}
        </>
      )}

      {selectedIds.size > 0 && (
        <>
      {isTitleOrYearOnlySelection && (
        <Section title="Typography" icon={<Type size={10} />} sectionId="badge-typography">
          {isOnlyTitleSelected && (
            <SliderRow
              label="Font Size"
              value={commonTextSize}
              min={10}
              max={120}
              step={1}
              unit="px"
              onChange={(v) => updateSelectedBadges({ textSize: Math.round(v) })}
              onReset={() => updateSelectedBadges({ textSize: 36 })}
            />
          )}
          {isOnlyTitleSelected && (
            <SliderRow
              label="Container Width"
              value={Math.max(120, Math.round(commonTextBoxWidth))}
              min={120}
              max={CANVAS_WIDTH}
              step={1}
              unit="px"
              onChange={(v) => updateSelectedBadges({ textBoxWidth: Math.round(v) })}
              onReset={() =>
                updateSelectedBadges({
                  textBoxWidth: DEFAULT_CONFIG.items.title?.textBoxWidth ?? CANVAS_WIDTH,
                })
              }
            />
          )}
          {isOnlyTitleSelected && (
            <SliderRow
              label="Container Height"
              value={Math.max(32, Math.round(commonTextBoxHeight))}
              min={32}
              max={240}
              step={1}
              unit="px"
              onChange={(v) => updateSelectedBadges({ textBoxHeight: Math.round(v) })}
              onReset={() =>
                updateSelectedBadges({
                  textBoxHeight: DEFAULT_CONFIG.items.title?.textBoxHeight ?? 76,
                })
              }
            />
          )}
          <SliderRow
            label="Font Weight"
            value={commonTextWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => updateSelectedBadges({ textWeight: Math.round(v) })}
            onReset={() => updateSelectedBadges({ textWeight: 700 })}
          />
          <SliderRow
            label="Line Height"
            value={commonTextLineHeight}
            min={0.8}
            max={2}
            step={0.02}
            onChange={(v) => updateSelectedBadges({ textLineHeight: Number(v.toFixed(2)) })}
            onReset={() => updateSelectedBadges({ textLineHeight: 1.1 })}
          />
          <SliderRow
            label="Letter Spacing"
            value={commonTextLetterSpacing}
            min={-2}
            max={8}
            step={0.1}
            unit="px"
            onChange={(v) => updateSelectedBadges({ textLetterSpacing: Number(v.toFixed(1)) })}
            onReset={() => updateSelectedBadges({ textLetterSpacing: isOnlyTitleSelected ? 0.2 : 0 })}
          />
          <SegmentedRow
            label="Text Align"
            options={[
              { id: 'left', label: 'Left' },
              { id: 'center', label: 'Center' },
              { id: 'right', label: 'Right' },
            ]}
            value={commonTextAlign}
            onChange={(v) => updateSelectedBadges({ textAlign: v as BadgeConfig['textAlign'] })}
          />
          {isOnlyTitleSelected && (
            <SliderRow
              label="Ellipsis Cutoff"
              value={commonTextMaxChars}
              min={0}
              max={300}
              step={1}
              unit="ch"
              formatValue={(v) => (v <= 0 ? 'Full' : `${Math.round(v)} ch`)}
              onChange={(v) => updateSelectedBadges({ textMaxChars: Math.round(v) })}
              onReset={() => updateSelectedBadges({ textMaxChars: 0 })}
            />
          )}
          {isOnlyTitleSelected && (
            <SliderRow
              label="Wrap Lines"
              value={Math.max(0, Math.round(getCommonValue('textMaxLines', 0) ?? 0))}
              min={0}
              max={8}
              step={1}
              formatValue={(v) => (v <= 0 ? 'Full' : `${Math.round(v)} lines`)}
              onChange={(v) => updateSelectedBadges({ textMaxLines: Math.round(v) })}
              onReset={() => updateSelectedBadges({ textMaxLines: 0 })}
            />
          )}
          <ToggleRow
            label="Text Shadow"
            checked={commonTextShadowEnabled}
            onChange={(v) => updateSelectedBadges({ textShadowEnabled: v })}
          />
          {commonTextShadowEnabled && (
            <>
              <SliderRow
                label="Shadow X"
                value={commonTextShadowX}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateSelectedBadges({ textShadowX: Math.round(v) })}
              />
              <SliderRow
                label="Shadow Y"
                value={commonTextShadowY}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateSelectedBadges({ textShadowY: Math.round(v) })}
              />
              <SliderRow
                label="Shadow Blur"
                value={commonTextShadowBlur}
                min={0}
                max={40}
                step={1}
                unit="px"
                onChange={(v) => updateSelectedBadges({ textShadowBlur: Math.round(v) })}
              />
              <ColorRow
                label="Shadow Color"
                value={commonTextShadowColor}
                onChange={(v) => updateSelectedBadges({ textShadowColor: v })}
              />
            </>
          )}
        </Section>
      )}
      {/* Transform ── scale */}
      {!isOnlyTitleSelected && (
      <Section title="Transform" sectionId="badge-transform">
        <SliderRow
          label={isOnlyYearSelected ? 'Layer Width' : 'Scale'}
          value={commonScale}
          min={0.5}
          max={2.0}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => updateSelectedBadges({ scale: v })}
          onReset={commonScale !== 1.0 ? () => updateSelectedBadges({ scale: 1.0 }) : undefined}
        />
      </Section>
      )}

      {/* Shape ── blur, radius, shadow, border */}
      <Section title={isTitleOrYearOnlySelection ? 'Container' : 'Shape'} sectionId="badge-shape">
        <SliderRow
          label="Glass Blur"
          value={commonBlur}
          min={0}
          max={20}
          unit="px"
          onChange={(v) => updateSelectedBadges({ blur: v })}
          onReset={commonBlur !== 0 ? () => updateSelectedBadges({ blur: 0 }) : undefined}
        />
        <SliderRow
          label="Corner Radius"
          value={commonRadius}
          min={0}
          max={30}
          unit="px"
          onChange={(v) => updateSelectedBadges({ radius: v })}
        />
        <SliderRow
          label="Drop Shadow"
          value={commonShadow}
          min={0}
          max={30}
          onChange={(v) => updateSelectedBadges({ shadow: v })}
          onReset={commonShadow !== 6 ? () => updateSelectedBadges({ shadow: 6 }) : undefined}
        />
        <SliderRow
          label="Shadow X"
          value={commonShadowX}
          min={-20}
          max={20}
          step={1}
          unit="px"
          onChange={(v) => updateSelectedBadges({ shadowX: Math.round(v) })}
        />
        <SliderRow
          label="Shadow Y"
          value={commonShadowY}
          min={-20}
          max={20}
          step={1}
          unit="px"
          onChange={(v) => updateSelectedBadges({ shadowY: Math.round(v) })}
        />
        <ColorRow
          label="Shadow Color"
          value={commonShadowColor}
          onChange={(v) => updateSelectedBadges({ shadowColor: v })}
        />
        <SliderRow
          label="Shadow Opacity"
          value={commonShadowOpacity}
          min={0}
          max={1}
          step={0.01}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => updateSelectedBadges({ shadowOpacity: Number(v.toFixed(2)) })}
        />
        <SliderRow
          label="Border Width"
          value={commonBorderW}
          min={0}
          max={10}
          unit="px"
          onChange={(v) => updateSelectedBadges({ borderW: v })}
        />
        {commonBorderW > 0 && (
          <ColorRow
            label="Border Color"
            value={commonBorderC}
            onChange={(v) => updateSelectedBadges({ borderC: v })}
            onReset={() => clearSelectedBadgeProp('borderC')}
          />
        )}
      </Section>

      {/* Colors ── fill + text */}
      <Section title={isTitleOrYearOnlySelection ? 'Text & Colors' : 'Colors'} sectionId="badge-colors">
        <ColorRow
          label="Background"
          value={commonBg}
          onChange={(v) => updateSelectedBadges({ bg: v })}
          onReset={() => clearSelectedBadgeProp('bg')}
          showOpacity
          opacity={commonAlpha}
          onOpacityChange={(v) => updateSelectedBadges({ alpha: v })}
        />
        <ColorRow
          label={isTitleOrYearOnlySelection ? 'Text Color' : 'Text & Icon Color'}
          value={commonTxt}
          onChange={(v) => updateSelectedBadges({ txt: v })}
          onReset={() => clearSelectedBadgeProp('txt')}
        />
      </Section>

      {/* Visibility ── icons, text, icon variant */}
      {!isTitleOrYearOnlySelection && (
      <Section title="Visibility" icon={<Eye size={10} />} sectionId="badge-visibility">
        {!isAgeSelected && (
          <ToggleRow
            label="Show Icon"
            checked={
              ((getCommonValue('icon', config.icon ?? true) as boolean | null) ??
                config.icon ??
                true) as boolean
            }
            onChange={(v) => updateSelectedBadges({ icon: v })}
          />
        )}
        <ToggleRow
          label="Show Rating Text"
          sub="Hide number, show icon only"
          checked={commonShowText !== false}
          onChange={(v) => updateSelectedBadges({ showText: v })}
        />
        <SegmentedRow
          label="Icon Style"
          options={[
            { id: '1', label: 'Default' },
            { id: '2', label: 'Alt' },
            { id: '3', label: 'Mono' },
          ]}
          value={String(Math.max(1, Math.min(3, commonIconType)))}
          onChange={(v) => updateSelectedBadges({ iconType: Math.max(1, Math.min(3, Number(v) || 1)) })}
        />
      </Section>
      )}

      {/* Score ── normalize + denominator */}
      {!isTitleOrYearOnlySelection && (
      <Section title="Score" icon={<Hash size={10} />} defaultOpen={false} sectionId="badge-score">
        <ToggleRow
          label="Normalize to /10"
          sub="Convert score to a 0–10 scale"
          checked={commonNorm}
          onChange={(v) => updateSelectedBadges({ normalize: v })}
        />
        <ToggleRow
          label="Show Denominator"
          sub="Append /10 to ratings"
          checked={(commonOutOf ?? 0) > 0}
          onChange={(v) => updateSelectedBadges({ outOf: v ? 10 : undefined })}
        />
      </Section>
      )}

      {/* Labels ── position, custom text, size, color */}
      {!isTitleOrYearOnlySelection && (
      <Section
        title="Labels"
        icon={<Type size={10} />}
        defaultOpen={false}
        sectionId="badge-labels"
      >
        <SegmentedRow
          label="Label Position"
          options={[
            { id: 'above', label: 'Above' },
            { id: 'below', label: 'Below' },
            { id: 'left', label: 'Left' },
            { id: 'right', label: 'Right' },
            { id: 'none', label: 'Hide' },
          ]}
          value={commonLabelPos ?? config.labelPos ?? 'none'}
          onChange={(v) =>
            updateSelectedBadges({
              labelPos: (v === 'none' ? undefined : (v as BadgeConfig['labelPos'])) as
                | BadgeConfig['labelPos']
                | undefined,
            })
          }
        />
        <TextInputRow
          label="Label Text"
          value={commonLabelTxt ?? ''}
          placeholder={multi ? '(mixed)' : 'Default (provider name)'}
          onChange={(v) => updateSelectedBadges({ labelText: v || undefined })}
          onClear={() => clearSelectedBadgeProp('labelText')}
        />
        <SliderRow
          label="Label Size"
          value={commonLabelSz}
          min={6}
          max={32}
          step={1}
          unit="px"
          onChange={(v) => updateSelectedBadges({ labelSize: v })}
        />
        <ColorRow
          label="Label Color"
          value={commonLabelColor}
          onChange={(v) => updateSelectedBadges({ labelColor: v })}
          onReset={() => clearSelectedBadgeProp('labelColor')}
        />
      </Section>
      )}
      </>
      )}

      {selectedLogo && config.logo && (
        <Section title="Logo Overlay" icon={<ImagePlay size={10} />} sectionId="selection-logo-overlay">
          <SliderRow
            label="Size"
            value={config.logoW}
            min={100}
            max={490}
            unit="px"
            onChange={(newW) => {
              const w = Math.round(newW);
              const h = Math.round(w / LOGO_ASPECT);
              setConfig((prev) => ({ ...prev, logoW: w, logoH: h }));
            }}
          />
          <SliderRow
            label="Opacity"
            value={config.logoOpacity}
            min={0}
            max={1}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateConfig('logoOpacity', v)}
          />
          <SliderRow
            label="Drop Shadow"
            value={config.logoShadow}
            min={0}
            max={30}
            onChange={(v) => updateConfig('logoShadow', v)}
          />
          <ToggleRow
            label="Background"
            sub="Add a styled panel behind the logo"
            checked={config.logoBgEnabled}
            onChange={(v) => updateConfig('logoBgEnabled', v)}
          />
          <SliderRow
            label="Border Width"
            value={config.logoBgBorderW}
            min={0}
            max={10}
            unit="px"
            onChange={(v) => updateConfig('logoBgBorderW', Math.round(v))}
          />
          {config.logoBgBorderW > 0 && (
            <ColorRow
              label="Border Color"
              value={config.logoBgBorderC ?? '#ffffff'}
              onChange={(v) => updateConfig('logoBgBorderC', v)}
            />
          )}
          {config.logoBgEnabled && (
            <>
              <ColorRow
                label="Background Color"
                value={config.logoBgColor ?? '#000000'}
                showOpacity
                opacity={config.logoBgOpacity}
                onChange={(v) => updateConfig('logoBgColor', v)}
                onOpacityChange={(v) => updateConfig('logoBgOpacity', Number(v.toFixed(2)))}
              />
              <SliderRow
                label="Padding"
                value={config.logoBgPadding}
                min={0}
                max={48}
                unit="px"
                onChange={(v) => updateConfig('logoBgPadding', v)}
              />
              <SliderRow
                label="Corner Radius"
                value={config.logoBgRadius}
                min={0}
                max={40}
                unit="px"
                onChange={(v) => updateConfig('logoBgRadius', v)}
              />
              <SliderRow
                label="Background Shadow"
                value={config.logoBgShadow}
                min={0}
                max={30}
                onChange={(v) => updateConfig('logoBgShadow', v)}
              />
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    logoBgEnabled: true,
                    logoBgColor: prev.bg ?? '#000000',
                    logoBgOpacity: prev.alpha,
                    logoBgRadius: prev.radius,
                    logoBgPadding: 10,
                    logoBgBorderW: prev.borderW ?? 0,
                    logoBgBorderC: prev.borderC ?? '#ffffff',
                    logoBgShadow: resolveShadow(prev.shadow, 6),
                  }))
                }
                className="w-full h-8 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer syne-font"
                style={{
                  border: '1px solid rgba(196,124,46,0.16)',
                  background: 'rgba(196,124,46,0.08)',
                  color: 'var(--film-pale)',
                  letterSpacing: '0.04em',
                }}
              >
                Apply Badge Style to Logo Background
              </button>
            </>
          )}
        </Section>
      )}

      {/* Reset */}
      {(selectedIds.size > 0 || selectedLogo) && (
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() =>
            setConfig((prev) => {
              const ni = { ...prev.items };
              selectedIds.forEach((id) => delete ni[id]);
              if (!selectedLogo) return { ...prev, items: ni };
              return {
                ...prev,
                items: ni,
                logoX: DEFAULT_CONFIG.logoX,
                logoY: DEFAULT_CONFIG.logoY,
                logoW: DEFAULT_CONFIG.logoW,
                logoH: DEFAULT_CONFIG.logoH,
                logoOpacity: DEFAULT_CONFIG.logoOpacity,
                logoZ: DEFAULT_CONFIG.logoZ,
                logoShadow: DEFAULT_CONFIG.logoShadow,
                logoBgEnabled: DEFAULT_CONFIG.logoBgEnabled,
                logoBgColor: DEFAULT_CONFIG.logoBgColor,
                logoBgOpacity: DEFAULT_CONFIG.logoBgOpacity,
                logoBgRadius: DEFAULT_CONFIG.logoBgRadius,
                logoBgPadding: DEFAULT_CONFIG.logoBgPadding,
                logoBgBorderW: DEFAULT_CONFIG.logoBgBorderW,
                logoBgBorderC: DEFAULT_CONFIG.logoBgBorderC,
                logoBgShadow: DEFAULT_CONFIG.logoBgShadow,
              };
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
          <RotateCcw size={11} /> Reset selected to defaults
        </button>
      </div>
      )}
    </SidebarLayout>
  );
};

export default memo(PropertyPanel);
