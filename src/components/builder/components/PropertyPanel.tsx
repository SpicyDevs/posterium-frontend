// src/components/builder/components/PropertyPanel.tsx
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import type { PosterConfig, RatingType, PresetType, BadgeConfig, LogoSourceType } from '../types';
import { ALL_BADGES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
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
} from 'lucide-react';
import ColorPicker from './ColorPicker';
import clsx from 'clsx';
import SidebarLayout from './SidebarLayout';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  selectedLogo?: boolean;
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
  x,
  y,
  size: 24,
  color: '#facc15',
  opacity: 1,
  iconMode: 'star' as const,
  symbol: '★',
  bgEnabled: false,
  bgColor: '#000000',
  bgOpacity: 0.25,
  borderW: 0,
  borderColor: '#ffffff',
  borderOpacity: 0.7,
  radius: 10,
  paddingX: 10,
  paddingY: 6,
  shadowEnabled: true,
  shadowX: 0,
  shadowY: 2,
  shadowBlur: 6,
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
  const chipW = 150;
  const chipH = 44;
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
  viewMode,
  mode,
}) => {
  const isMinimalPreset = (config.uiPreset ?? 'b') === 'm';
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

  const updateMinimalRating = (
    index: number,
    updates: Partial<NonNullable<PosterConfig['minimalRatings']>[number]>
  ) => {
    setConfig((prev) => {
      const list = [...(prev.minimalRatings ?? [makeDefaultMinimalRating()])].slice(0, 3);
      if (!list[index]) return prev;
      list[index] = { ...list[index], ...updates };
      return { ...prev, minimalRatings: list };
    });
  };

  const addMinimalRating = () => {
    setConfig((prev) => {
      const list = [...(prev.minimalRatings ?? [makeDefaultMinimalRating()])].slice(0, 3);
      if (list.length >= 3) return prev;
      const used = new Set(list.map((r) => r.provider));
      const nextProvider = (ALL_BADGES.find((b) => !used.has(b.id))?.id ?? 'rt') as RatingType;
      const next = [...list, makeDefaultMinimalRating(nextProvider, 342, 688)];
      const placed = placeMinimalRatings(next, prev.preset, prev.layout);
      return { ...prev, minimalRatings: placed };
    });
    setMinimalRatingEditorIndex((v) => Math.min(v + 1, 2));
  };

  const removeMinimalRating = (index: number) => {
    setConfig((prev) => {
      const list = [...(prev.minimalRatings ?? [makeDefaultMinimalRating()])].slice(0, 3);
      if (list.length <= 1 || !list[index]) return prev;
      list.splice(index, 1);
      const placed = placeMinimalRatings(list, prev.preset, prev.layout);
      return { ...prev, minimalRatings: placed };
    });
    setMinimalRatingEditorIndex((v) =>
      Math.max(0, Math.min(v, Math.max(0, minimalRatings.length - 2)))
    );
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
  const logoSectionTitle = 'Logo Overlay';
  const minimalRatings = (config.minimalRatings ?? [makeDefaultMinimalRating()]).slice(0, 3);
  const [minimalRatingEditorIndex, setMinimalRatingEditorIndex] = useState(0);
  const selectedMinimalRating = minimalRatings[Math.min(minimalRatingEditorIndex, minimalRatings.length - 1)];
  const LOGO_BASE_W = 320;
  const LOGO_BASE_H = 84;
  const LOGO_ASPECT = LOGO_BASE_W / LOGO_BASE_H;
  const LOGO_SOURCES: { id: LogoSourceType; label: string }[] = [
    { id: null, label: 'Auto' },
    { id: 'fanart', label: 'Fanart' },
    { id: 'tmdb', label: 'TMDB' },
    { id: 'metahub', label: 'Hub' },
  ];

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

        {showBadgeSettings && !isMinimalPreset && badgesEnabled && (
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
              <ToggleRow
                label="Alt Icon Variant"
                sub="Use secondary icon style where available"
                checked={(config.iconType ?? 1) > 1}
                onChange={(v) => updateConfig('iconType', v ? 2 : 1)}
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

        {showLogoSettings && isMinimalPreset && (
          <>
            <Section title="Title" icon={<Type size={10} />} sectionId="global-minimal-title">
              <ToggleRow
                label="Show Title"
                checked={config.minimalTitleEnabled ?? true}
                onChange={(v) => updateConfig('minimalTitleEnabled', v)}
              />
              <SliderRow
                label="Font Size"
                value={config.minimalTextSize}
                min={14}
                max={120}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('minimalTextSize', Math.round(v))}
              />
              <SliderRow
                label="Box Width"
                value={config.minimalTitleWidth ?? 420}
                min={120}
                max={480}
                step={2}
                unit="px"
                onChange={(v) => updateConfig('minimalTitleWidth', Math.round(v))}
              />
              <SliderRow
                label="Weight"
                value={config.minimalTitleWeight ?? 700}
                min={300}
                max={900}
                step={100}
                onChange={(v) => updateConfig('minimalTitleWeight', Math.round(v))}
              />
              <SliderRow
                label="Line Height"
                value={config.minimalTitleLineHeight ?? 1.08}
                min={0.8}
                max={1.8}
                step={0.02}
                onChange={(v) => updateConfig('minimalTitleLineHeight', Number(v.toFixed(2)))}
              />
              <SliderRow
                label="Letter Spacing"
                value={config.minimalTitleLetterSpacing ?? 0.4}
                min={-2}
                max={8}
                step={0.1}
                unit="px"
                onChange={(v) => updateConfig('minimalTitleLetterSpacing', Number(v.toFixed(1)))}
              />
              <SegmentedRow
                label="Align"
                options={[
                  { id: 'left', label: 'Left' },
                  { id: 'center', label: 'Center' },
                  { id: 'right', label: 'Right' },
                ]}
                value={config.minimalTitleAlign ?? 'left'}
                onChange={(v) => updateConfig('minimalTitleAlign', v as PosterConfig['minimalTitleAlign'])}
              />
              <ColorRow
                label="Text Color"
                value={config.minimalTitleColor ?? '#f5f5f5'}
                onChange={(v) => updateConfig('minimalTitleColor', v)}
                showOpacity
                opacity={config.minimalTitleOpacity ?? 0.95}
                onOpacityChange={(v) => updateConfig('minimalTitleOpacity', Number(v.toFixed(2)))}
              />
              <ToggleRow
                label="Shadow"
                checked={config.minimalTitleShadowEnabled ?? true}
                onChange={(v) => updateConfig('minimalTitleShadowEnabled', v)}
              />
              {(config.minimalTitleShadowEnabled ?? true) && (
                <>
                  <SliderRow
                    label="Shadow X"
                    value={config.minimalTitleShadowX ?? 0}
                    min={-20}
                    max={20}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitleShadowX', Math.round(v))}
                  />
                  <SliderRow
                    label="Shadow Y"
                    value={config.minimalTitleShadowY ?? 2}
                    min={-20}
                    max={20}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitleShadowY', Math.round(v))}
                  />
                  <SliderRow
                    label="Shadow Blur"
                    value={config.minimalTitleShadowBlur ?? 8}
                    min={0}
                    max={40}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitleShadowBlur', Math.round(v))}
                  />
                  <ColorRow
                    label="Shadow Color"
                    value={config.minimalTitleShadowColor ?? '#000000'}
                    onChange={(v) => updateConfig('minimalTitleShadowColor', v)}
                  />
                </>
              )}
              <ToggleRow
                label="Background"
                checked={config.minimalTitleBgEnabled ?? true}
                onChange={(v) => updateConfig('minimalTitleBgEnabled', v)}
              />
              {(config.minimalTitleBgEnabled ?? true) && (
                <>
                  <ColorRow
                    label="Background Color"
                    value={config.minimalTitleBgColor ?? '#000000'}
                    onChange={(v) => updateConfig('minimalTitleBgColor', v)}
                    showOpacity
                    opacity={config.minimalTitleBgOpacity ?? 0.24}
                    onOpacityChange={(v) => updateConfig('minimalTitleBgOpacity', Number(v.toFixed(2)))}
                  />
                  <SliderRow
                    label="Padding X"
                    value={config.minimalTitlePaddingX ?? 10}
                    min={0}
                    max={40}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitlePaddingX', Math.round(v))}
                  />
                  <SliderRow
                    label="Padding Y"
                    value={config.minimalTitlePaddingY ?? 8}
                    min={0}
                    max={40}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitlePaddingY', Math.round(v))}
                  />
                  <SliderRow
                    label="Radius"
                    value={config.minimalTitleRadius ?? 8}
                    min={0}
                    max={40}
                    step={1}
                    unit="px"
                    onChange={(v) => updateConfig('minimalTitleRadius', Math.round(v))}
                  />
                </>
              )}
              <SliderRow
                label="Border Width"
                value={config.minimalTitleBorderW ?? 0}
                min={0}
                max={10}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('minimalTitleBorderW', Math.round(v))}
              />
              {(config.minimalTitleBorderW ?? 0) > 0 && (
                <>
                  <ColorRow
                    label="Border Color"
                    value={config.minimalTitleBorderColor ?? '#d4a245'}
                    onChange={(v) => updateConfig('minimalTitleBorderColor', v)}
                    showOpacity
                    opacity={config.minimalTitleBorderOpacity ?? 0.6}
                    onOpacityChange={(v) =>
                      updateConfig('minimalTitleBorderOpacity', Number(v.toFixed(2)))
                    }
                  />
                </>
              )}
              <div className="flex items-center justify-between text-[10px] body-font text-[var(--film-text-dim)]">
                <span>Position (drag on canvas)</span>
                <span>
                  {Math.round(config.minimalTextX)}, {Math.round(config.minimalTextY)}
                </span>
              </div>
            </Section>

            <Section title="Minimal Ratings" icon={<Hash size={10} />} sectionId="global-minimal-ratings">
              <div className="flex items-center justify-between">
                <p className="body-font text-[11px]" style={{ color: 'var(--film-text-label)' }}>
                  Up to 3 draggable ratings
                </p>
                <button
                  type="button"
                  onClick={addMinimalRating}
                  disabled={minimalRatings.length >= 3}
                  className="px-2.5 h-7 rounded-md text-[10px] syne-font border"
                  style={{
                    color: minimalRatings.length >= 3 ? 'var(--film-text-dim)' : 'var(--film-pale)',
                    borderColor:
                      minimalRatings.length >= 3
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(196,124,46,0.25)',
                    background:
                      minimalRatings.length >= 3 ? 'rgba(255,255,255,0.02)' : 'rgba(196,124,46,0.08)',
                  }}
                >
                  Add Rating
                </button>
              </div>
              <SegmentedRow
                label="Edit Slot"
                options={minimalRatings.map((r, idx) => ({
                  id: String(idx),
                  label: `${idx + 1}: ${BADGE_DISPLAY_NAMES[r.provider] ?? r.provider}`,
                }))}
                value={String(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1))}
                onChange={(v) => setMinimalRatingEditorIndex(parseInt(v, 10) || 0)}
              />
              {selectedMinimalRating && (
                <>
                  <div className="space-y-1.5">
                    <span
                      className="body-font"
                      style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
                    >
                      Provider
                    </span>
                    <select
                      value={selectedMinimalRating.provider}
                      onChange={(e) =>
                        updateMinimalRating(
                          Math.min(minimalRatingEditorIndex, minimalRatings.length - 1),
                          { provider: e.target.value as RatingType }
                        )
                      }
                      className="w-full h-8 rounded-lg px-2 text-[11px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[var(--film-cream)]"
                    >
                      {ALL_BADGES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SegmentedRow
                    label="Icon Style"
                    options={[
                      { id: 'star', label: 'Star' },
                      { id: 'original', label: 'Original' },
                      { id: 'flat', label: 'Flat' },
                      { id: 'symbol', label: 'Symbol' },
                    ]}
                    value={selectedMinimalRating.iconMode}
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        iconMode: v as 'star' | 'original' | 'flat' | 'symbol',
                      })
                    }
                  />
                  {selectedMinimalRating.iconMode === 'symbol' && (
                    <TextInputRow
                      label="Symbol"
                      value={selectedMinimalRating.symbol}
                      placeholder="★"
                      onChange={(v) =>
                        updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                          symbol: v || '★',
                        })
                      }
                    />
                  )}
                  <SliderRow
                    label="Size"
                    value={selectedMinimalRating.size}
                    min={12}
                    max={54}
                    step={1}
                    unit="px"
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        size: Math.round(v),
                      })
                    }
                  />
                  <ColorRow
                    label="Color"
                    value={selectedMinimalRating.color}
                    showOpacity
                    opacity={selectedMinimalRating.opacity}
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        color: v,
                      })
                    }
                    onOpacityChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        opacity: Number(v.toFixed(2)),
                      })
                    }
                  />
                  <ToggleRow
                    label="Background"
                    checked={selectedMinimalRating.bgEnabled}
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        bgEnabled: v,
                      })
                    }
                  />
                  {selectedMinimalRating.bgEnabled && (
                    <ColorRow
                      label="Background Color"
                      value={selectedMinimalRating.bgColor}
                      showOpacity
                      opacity={selectedMinimalRating.bgOpacity}
                      onChange={(v) =>
                        updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                          bgColor: v,
                        })
                      }
                      onOpacityChange={(v) =>
                        updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                          bgOpacity: Number(v.toFixed(2)),
                        })
                      }
                    />
                  )}
                  <SliderRow
                    label="Border Width"
                    value={selectedMinimalRating.borderW}
                    min={0}
                    max={8}
                    step={1}
                    unit="px"
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        borderW: Math.round(v),
                      })
                    }
                  />
                  {selectedMinimalRating.borderW > 0 && (
                    <ColorRow
                      label="Border Color"
                      value={selectedMinimalRating.borderColor}
                      showOpacity
                      opacity={selectedMinimalRating.borderOpacity}
                      onChange={(v) =>
                        updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                          borderColor: v,
                        })
                      }
                      onOpacityChange={(v) =>
                        updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                          borderOpacity: Number(v.toFixed(2)),
                        })
                      }
                    />
                  )}
                  <SliderRow
                    label="Radius"
                    value={selectedMinimalRating.radius}
                    min={0}
                    max={24}
                    step={1}
                    unit="px"
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        radius: Math.round(v),
                      })
                    }
                  />
                  <ToggleRow
                    label="Shadow"
                    checked={selectedMinimalRating.shadowEnabled}
                    onChange={(v) =>
                      updateMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1), {
                        shadowEnabled: v,
                      })
                    }
                  />
                  <div className="flex items-center justify-between text-[10px] body-font text-[var(--film-text-dim)]">
                    <span>Position (drag on canvas)</span>
                    <span>
                      {Math.round(selectedMinimalRating.x)}, {Math.round(selectedMinimalRating.y)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeMinimalRating(Math.min(minimalRatingEditorIndex, minimalRatings.length - 1))
                    }
                    disabled={minimalRatings.length <= 1}
                    className="w-full h-8 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] syne-font"
                    style={{
                      border: '1px solid rgba(248,113,113,0.12)',
                      background: 'rgba(248,113,113,0.04)',
                      color:
                        minimalRatings.length <= 1
                          ? 'rgba(248,113,113,0.35)'
                          : 'rgba(248,113,113,0.75)',
                    }}
                  >
                    Remove This Rating
                  </button>
                </>
              )}
            </Section>
          </>
        )}

        {showLogoSettings && config.logo && (
          <div ref={logoSettingsRef}>
            <Section
              title={logoSectionTitle}
              icon={<ImagePlay size={10} />}
              sectionId="global-logo-overlay"
            >
            <SegmentedRow
              label="Source"
              options={LOGO_SOURCES.map((opt) => ({
                id: String(opt.id ?? 'auto'),
                label: opt.label,
              }))}
              value={String(config.logoSource ?? 'auto')}
              onChange={(v) =>
                updateConfig(
                  'logoSource',
                  (v === 'auto' ? null : (v as LogoSourceType)) as PosterConfig['logoSource']
                )
              }
            />
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
                {!isMinimalPreset && (
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
                )}
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
  if (panelMode === 'selection' && selectedIds.size === 0 && !selectedLogo)
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
              Click a badge or logo on the canvas to edit
            </p>
          </div>
        </div>
      </SidebarLayout>
    );

  // ── Per-badge / selection view ─────────────────────────────────────────────

  const selectionCount = selectedIds.size + (selectedLogo ? 1 : 0);
  const isAgeSelected = selectedIds.has('age');
  const multi = selectionCount > 1;
  const selectedBadgeLabel = (() => {
    if (selectedLogo && selectedIds.size === 0) return 'Logo Overlay';
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
          {multi
            ? 'Changes apply to all selected badges'
            : 'Per-badge overrides · inherits global defaults'}
        </p>
      </div>

      {selectedIds.size > 0 && (
        <>
      {/* Transform ── scale */}
      <Section title="Transform" sectionId="badge-transform">
        <SliderRow
          label="Scale"
          value={commonScale}
          min={0.5}
          max={2.0}
          step={0.05}
          formatValue={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => updateSelectedBadges({ scale: v })}
          onReset={commonScale !== 1.0 ? () => updateSelectedBadges({ scale: 1.0 }) : undefined}
        />
      </Section>

      {/* Shape ── blur, radius, shadow, border */}
      <Section title="Shape" sectionId="badge-shape">
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
      <Section title="Colors" sectionId="badge-colors">
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
          label="Text & Icon Color"
          value={commonTxt}
          onChange={(v) => updateSelectedBadges({ txt: v })}
          onReset={() => clearSelectedBadgeProp('txt')}
        />
      </Section>

      {/* Visibility ── icons, text, icon variant */}
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
        <ToggleRow
          label="Alt Icon Variant"
          sub="Use secondary icon style where available"
          checked={commonIconType > 1}
          onChange={(v) => updateSelectedBadges({ iconType: v ? 2 : 1 })}
        />
      </Section>

      {/* Score ── normalize + denominator */}
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

      {/* Labels ── position, custom text, size, color */}
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
      </>
      )}

      {selectedLogo && config.logo && (
        <Section title="Logo Overlay" icon={<ImagePlay size={10} />} sectionId="selection-logo-overlay">
          <SegmentedRow
            label="Source"
            options={LOGO_SOURCES.map((opt) => ({
              id: String(opt.id ?? 'auto'),
              label: opt.label,
            }))}
            value={String(config.logoSource ?? 'auto')}
            onChange={(v) =>
              updateConfig(
                'logoSource',
                (v === 'auto' ? null : (v as LogoSourceType)) as PosterConfig['logoSource']
              )
            }
          />
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
        </Section>
      )}

      {/* Reset */}
      {selectedIds.size > 0 && (
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
      )}
    </SidebarLayout>
  );
};

export default memo(PropertyPanel);
