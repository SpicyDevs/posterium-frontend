// src/components/builder/components/LayerPanel.tsx
import React, { useState, useEffect, Fragment, memo, useCallback, useRef } from 'react';
import {
  Combobox,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Switch,
  Transition,
} from '@headlessui/react';
import {
  Check,
  Search,
  Loader2,
  GripVertical,
  Film,
  Layers,
  Tv,
  Clapperboard,
  Eye,
  EyeOff,
  ChevronDown,
  ImagePlay,
  KeyRound,
  ChevronRight,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DraggableProvided } from '@hello-pangea/dnd';
import clsx from 'clsx';
import type { PosterConfig, RatingType, LogoSourceType, ApiKeys } from '../types';
import { ALL_BADGES, DEFAULT_CONFIG } from '../types';
import { BADGE_ICONS } from '../constants';
import { DEFAULT_API_BASE } from '../utils';
import { useEditor } from '../context/EditorContext';
import SidebarLayout from './SidebarLayout';

type BadgeIconKey = keyof typeof BADGE_ICONS;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

// ── SelectBox ────────────────────────────────────────────────────────────────
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
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

// ── SliderRow ────────────────────────────────────────────────────────────────
// Synced from PropertyPanel for visual/functional parity
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

// ── ToggleRow ────────────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
  disabled?: boolean;
}> = ({ label, sub, checked, onChange, small, disabled }) => (
  <div
    className={clsx(
      'flex items-center justify-between gap-3',
      disabled && 'opacity-60 pointer-events-none'
    )}
  >
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

// ── Section — flat collapsible matching PropertyPanel ─────────────────────────
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-1 mb-3 focus:outline-none group"
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
      {open && <div className="px-1 pb-1 space-y-3.5">{children}</div>}
      <div
        className="mt-5 mx-1"
        style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      />
    </div>
  );
};

const LOGO_BASE_W = 320;
const LOGO_BASE_H = 84;
const LOGO_ASPECT = LOGO_BASE_W / LOGO_BASE_H;

const LOGO_SOURCES: { id: LogoSourceType; label: string }[] = [
  { id: null, label: 'Auto' },
  { id: 'fanart', label: 'Fanart' },
  { id: 'tmdb', label: 'TMDB' },
  { id: 'metahub', label: 'Hub' },
];

const LogoPanel: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}> = ({ config, setConfig }) => {
  const update = useCallback(
    <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig]
  );

  const handleSizeChange = (newW: number) => {
    const w = Math.round(newW);
    const h = Math.round(w / LOGO_ASPECT);
    setConfig((prev) => ({ ...prev, logoW: w, logoH: h }));
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <span
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
        >
          Source
        </span>
        <div className="grid grid-cols-4 gap-1">
          {LOGO_SOURCES.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => update('logoSource', opt.id as PosterConfig['logoSource'])}
              className="h-8 rounded-lg text-[11px] font-medium transition-all active:scale-95 syne-font"
              style={{
                background:
                  (config.logoSource ?? null) === opt.id
                    ? 'rgba(196,124,46,0.12)'
                    : 'rgba(255,255,255,0.02)',
                color:
                  (config.logoSource ?? null) === opt.id
                    ? 'var(--film-pale)'
                    : 'var(--film-text-dim)',
                border:
                  (config.logoSource ?? null) === opt.id
                    ? '1px solid rgba(196,124,46,0.25)'
                    : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="body-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
          Falls back automatically if source has no logo
        </p>
      </div>

      <SliderRow
        label="Size"
        value={config.logoW}
        min={100}
        max={490}
        unit="px"
        onChange={handleSizeChange}
      />
      <SliderRow
        label="Opacity"
        value={config.logoOpacity}
        min={0}
        max={1}
        step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => update('logoOpacity', v)}
      />
      <SliderRow
        label="Drop Shadow"
        value={config.logoShadow}
        min={0}
        max={30}
        onChange={(v) => update('logoShadow', v)}
      />

      <p
        className="body-font leading-relaxed"
        style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
      >
        ⟠ Drag the logo on the canvas to reposition. Snap guides appear near the centre.
      </p>
    </div>
  );
};

// ── API Keys panel ────────────────────────────────────────────────────────────
const ApiKeysPanel: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}> = ({ config, setConfig }) => {
  const [showTmdb, setShowTmdb] = useState(false);
  const [showFanart, setShowFanart] = useState(false);

  const updateKeys = useCallback(
    (key: keyof ApiKeys, value: string) =>
      setConfig((prev) => ({ ...prev, keys: { ...prev.keys, [key]: value } })),
    [setConfig]
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 32,
    paddingLeft: 10,
    paddingRight: 32,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    color: 'var(--film-pale)',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="space-y-3">
      <p
        className="body-font leading-relaxed"
        style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
      >
        Override the default API keys used to fetch ratings and posters. Stored in a browser cookie.
      </p>

      {[
        { key: 'tmdb' as const, label: 'TMDB Key', show: showTmdb, setShow: setShowTmdb },
        {
          key: 'fanart' as const,
          label: 'Fanart.tv Key',
          show: showFanart,
          setShow: setShowFanart,
        },
      ].map(({ key, label, show, setShow }) => (
        <div key={key} className="space-y-1.5">
          <p
            className="body-font"
            style={{ fontSize: 10, color: 'var(--film-text-dim)', fontWeight: 500 }}
          >
            {label}
          </p>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={config.keys?.[key] ?? ''}
              onChange={(e) => updateKeys(key, e.target.value)}
              placeholder={`Override default ${key === 'tmdb' ? 'TMDB' : 'Fanart.tv'} key`}
              style={inputStyle}
              className="focus:outline-none"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onMouseLeave={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--film-text-dim)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
              }}
            >
              <Eye size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main LayerPanel component ─────────────────────────────────────────────────
const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const {
    setBatchSelection,
    activeTab,
    setActiveTab,
    setLiveRatings,
    fallbackEnabled,
    setFallbackEnabled,
  } = useEditor();

  const [localMode, setLocalMode] = useState<'source' | 'layers'>('source');
  const [inactiveOrder, setInactiveOrder] = useState<RatingType[]>([]);

  useEffect(() => {
    if (activeTab === 'source' || activeTab === 'layers') setLocalMode(activeTab);
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`${DEFAULT_API_BASE}/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (data.results)
          setResults(
            data.results.filter(
              (i: SearchResult) => i.poster_path && ['movie', 'tv'].includes(i.media_type)
            )
          );
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery) {
      setResults([]);
    }
  }, [searchQuery]);

  const [fetchedData, setFetchedData] = useState<Record<string, string>>({});
  const savedActiveBadgesRef = useRef<RatingType[]>(DEFAULT_CONFIG.ratings);
  const isMinimalPreset = (config.uiPreset ?? 'b') === 'm';
  const badgesEnabled = config.ratings.length > 0;

  useEffect(() => {
    if (!config.tmdbId && !config.imdbId) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const idPath = config.imdbId
          ? `/poster/${config.imdbId}`
          : `/${config.mediaType}/${config.tmdbId}`;
        const res = await fetch(`${DEFAULT_API_BASE}${idPath}.json?source=${config.source}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const merged: Record<string, string> = {};
        if (data.meta?.title) merged.title = data.meta.title;
        if (data.meta?.year) merged.year = String(data.meta.year);
        const VALID_RATING_KEYS = [
          'imdb',
          'rt',
          'rt_popcorn',
          'letterboxd',
          'meta',
          'tmdb',
          'mal',
          'anilist',
          'age',
          'runtime',
        ];
        if (data.ratings) {
          Object.entries(data.ratings).forEach(([k, v]) => {
            if (VALID_RATING_KEYS.includes(k)) merged[k] = String(v);
          });
        }
        setFetchedData(merged);
        const liveRatingsFiltered: Record<string, string> = {};
        if (data.ratings) {
          Object.entries(data.ratings).forEach(([k, v]) => {
            if (VALID_RATING_KEYS.includes(k)) liveRatingsFiltered[k] = String(v);
          });
        }
        setLiveRatings(liveRatingsFiltered);
        if (data.ids?.imdb && data.ids.imdb !== config.imdbId) {
          setConfig((prev) => ({ ...prev, imdbId: data.ids.imdb }));
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    })();
    return () => ctrl.abort();
  }, [config.tmdbId, config.imdbId, config.mediaType, config.source, setLiveRatings, setConfig]);

  useEffect(() => {
    setFallbackEnabled(config.fallbackEnabled);
  }, [config.fallbackEnabled, setFallbackEnabled]);

  const handleSelectMedia = useCallback(
    (item: SearchResult | null) => {
      if (!item) return;
      setFetchedData({
        title: item.title || item.name || '',
        year: (item.release_date || item.first_air_date)?.split('-')[0] || '',
      });
      setConfig((prev) => ({
        ...prev,
        tmdbId: item.id.toString(),
        imdbId: undefined,
        mediaType: item.media_type as PosterConfig['mediaType'],
      }));
      setSearchQuery('');
      setResults([]);
    },
    [setConfig]
  );

  const updateConfig = useCallback(
    <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig]
  );

  useEffect(() => {
    if (config.ratings.length > 0) {
      savedActiveBadgesRef.current = [...config.ratings];
    }
  }, [config.ratings]);

  const disableBadges = useCallback(() => {
    setConfig((prev) => {
      if (prev.ratings.length > 0) {
        savedActiveBadgesRef.current = [...prev.ratings];
      }
      return { ...prev, ratings: [] };
    });
    setBatchSelection([]);
  }, [setConfig, setBatchSelection]);

  const enableBadges = useCallback(() => {
    setConfig((prev) => {
      if (prev.ratings.length > 0) return prev;
      const restored = savedActiveBadgesRef.current.filter((id) =>
        ALL_BADGES.some((badge) => badge.id === id)
      );
      return { ...prev, ratings: restored.length > 0 ? restored : DEFAULT_CONFIG.ratings };
    });
  }, [setConfig]);

  useEffect(() => {
    if (isMinimalPreset && config.ratings.length > 0) {
      disableBadges();
    }
  }, [isMinimalPreset, config.ratings.length, disableBadges]);

  const handleToggleVisibility = useCallback(
    (id: RatingType, visible: boolean) => {
      if (visible) {
        setConfig((prev) =>
          prev.ratings.includes(id) ? prev : { ...prev, ratings: [id, ...prev.ratings] }
        );
        setInactiveOrder((prev) => prev.filter((x) => x !== id));
      } else {
        setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
        setInactiveOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
      }
    },
    [setConfig]
  );

  const allVisible = config.ratings.length === ALL_BADGES.length;
  const handleToggleAll = useCallback(() => {
    if (allVisible) {
      setConfig((prev) => {
        setInactiveOrder((io) => [...[...prev.ratings].reverse(), ...io]);
        return { ...prev, ratings: [] };
      });
    } else {
      setConfig((prev) => {
        const missing = ALL_BADGES.filter((b) => !prev.ratings.includes(b.id)).map((b) => b.id);
        return { ...prev, ratings: [...missing, ...prev.ratings] };
      });
      setInactiveOrder([]);
    }
  }, [allVisible, setConfig]);

  const allVisibleSelected =
    config.ratings.length > 0 && config.ratings.every((r) => selectedIds.has(r));

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setBatchSelection(
        checked ? ALL_BADGES.filter((b) => config.ratings.includes(b.id)).map((b) => b.id) : []
      );
    },
    [setBatchSelection, config.ratings]
  );

  const activeBadges = [...config.ratings]
    .filter((id) => ALL_BADGES.some((b) => b.id === id))
    .reverse()
    .map((id) => ALL_BADGES.find((b) => b.id === id))
    .filter((b): b is { id: RatingType; label: string } => !!b);

  const inactiveBadges = ALL_BADGES.filter((b) => !config.ratings.includes(b.id)).sort((a, b) => {
    const ia = inactiveOrder.indexOf(a.id),
      ib = inactiveOrder.indexOf(b.id);
    if (ia === -1 && ib === -1) return ALL_BADGES.indexOf(a) - ALL_BADGES.indexOf(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.source.droppableId === 'active' && result.destination.droppableId === 'active') {
        if (result.source.index === result.destination.index) return;
        const rev = [...config.ratings].reverse();
        const [removed] = rev.splice(result.source.index, 1);
        rev.splice(result.destination.index, 0, removed);
        setConfig((prev) => ({ ...prev, ratings: rev.reverse() }));
      } else if (
        result.source.droppableId === 'inactive' &&
        result.destination.droppableId === 'inactive' &&
        fallbackEnabled
      ) {
        if (result.source.index === result.destination.index) return;
        const nextOrder = inactiveBadges.map((b) => b.id);
        const [removed] = nextOrder.splice(result.source.index, 1);
        nextOrder.splice(result.destination.index, 0, removed);
        setInactiveOrder(nextOrder);
        setConfig((prev) => ({ ...prev, fallbackPool: nextOrder }));
      }
    },
    [config.ratings, inactiveBadges, fallbackEnabled, setConfig]
  );

  const getIconKey = (id: string): BadgeIconKey =>
    id === 'rt' ? 'rt_fresh' : id === 'rt_popcorn' ? 'popcorn_fresh' : (id as BadgeIconKey);

  const MediaIcon =
    config.mediaType === 'tv' ? Tv : config.mediaType === 'anime' ? Clapperboard : Film;

  const sourceOptions = [
    { id: 'tmdb', label: 'TMDB' },
    { id: 'fanart', label: 'Fanart.tv' },
    { id: 'metahub', label: 'Metahub' },
    { id: 'imdb', label: 'IMDb' },
    ...(config.mediaType === 'anime'
      ? [
          { id: 'mal', label: 'MyAnimeList' },
          { id: 'anilist', label: 'AniList' },
        ]
      : []),
  ];

  const ptypeOptions = [
    { id: 'auto', label: 'Auto (Default)' },
    { id: 'top1', label: 'Top 1' },
    { id: 'top2', label: 'Top 2' },
    { id: 'top3', label: 'Top 3' },
    ...(config.source === 'tmdb' ? [{ id: 'best', label: 'Best (Bayesian)' }] : []),
    ...(config.source === 'fanart'
      ? [
          { id: 'latest', label: 'Latest' },
          { id: 'oldest', label: 'Oldest' },
        ]
      : []),
    { id: 'random', label: 'Random' },
  ];

  const renderBadgeRow = (
    badge: { id: RatingType; label: string },
    isActive: boolean,
    provided?: DraggableProvided,
    isDraggingItem?: boolean
  ) => {
    const isSel = selectedIds.has(badge.id);
    const ratingVal = fetchedData[badge.id];
    const iconKey = getIconKey(badge.id);
    const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id];
    const iconColor = isActive ? (iconData?.color ?? 'var(--film-text-dim)') : 'rgba(74,74,82,0.6)';
    const inactiveOpacity = fallbackEnabled ? 'opacity-70' : 'opacity-50';

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isActive) {
        onSelect(badge.id, true);
      } else {
        handleToggleVisibility(badge.id, true);
        onSelect(badge.id, false);
      }
    };

    return (
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        onClick={(e) => {
          if (isActive) onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        className={clsx(
          'flex items-center gap-2 px-2 py-2 rounded-lg transition-all select-none',
          isSel
            ? 'bg-[rgba(196,124,46,0.08)] ring-1 ring-[rgba(196,124,46,0.2)]'
            : isActive
              ? 'hover:bg-[rgba(196,124,46,0.06)] cursor-pointer'
              : inactiveOpacity,
          isDraggingItem && 'shadow-2xl rotate-[0.5deg]'
        )}
        style={
          isDraggingItem
            ? { background: 'var(--film-mid)', ...(provided?.draggableProps.style ?? {}) }
            : (provided?.draggableProps.style ?? {})
        }
      >
        {/* Drag handle */}
        {isActive || fallbackEnabled ? (
          <div
            {...provided?.dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 outline-none transition-colors shrink-0"
            style={{ color: 'var(--film-text-dim)', cursor: 'grab' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            <GripVertical size={13} />
          </div>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Checkbox */}
        <div className="shrink-0" onClick={handleCheckboxClick}>
          <div
            className="w-4 h-4 rounded border flex items-center justify-center transition-all"
            style={{
              background: isSel ? '#C47C2E' : 'var(--film-char)',
              borderColor: isSel ? '#D4A245' : 'rgba(255,255,255,0.15)',
            }}
          >
            {isSel && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
          </div>
        </div>

        {/* Icon */}
        <div
          className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {badge.id === 'age' ? (
            <span className="mono-font" style={{ fontSize: 8, fontWeight: 700, color: iconColor }}>
              PG
            </span>
          ) : iconData ? (
            <svg
              viewBox={iconData.vb}
              className="w-3.5 h-3.5"
              style={{ color: iconColor }}
              dangerouslySetInnerHTML={{ __html: iconData.body }}
            />
          ) : (
            <span
              className="mono-font"
              style={{ fontSize: 8, fontWeight: 700, color: 'var(--film-text-dim)' }}
            >
              {badge.label.slice(0, 2)}
            </span>
          )}
        </div>

        {/* Label + rating */}
        <div className="flex-1 min-w-0">
          <span
            className="block syne-font truncate"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isSel
                ? 'var(--film-cream)'
                : isActive
                  ? 'var(--film-text-label)'
                  : 'var(--film-text-dim)',
            }}
          >
            {badge.label}
          </span>
          {isActive && ratingVal && (
            <span className="mono-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
              {ratingVal}
            </span>
          )}
        </div>

        {/* Visibility toggle */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <button
            onClick={() => handleToggleVisibility(badge.id, !isActive)}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: isActive ? 'var(--film-text-dim)' : 'rgba(110,110,120,0.7)' }}
            title={isActive ? 'Hide badge' : 'Show badge'}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = isActive
                ? 'var(--film-text-dim)'
                : 'rgba(110,110,120,0.7)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout
      side="left"
      bodyClassName="px-2 pt-2 pb-8"
      header={
        <div
          className="flex rounded-lg p-0.5"
          style={{
            background: 'var(--film-char)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {(['source', 'layers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none capitalize syne-font',
                localMode !== tab &&
                  'hover:bg-[rgba(196,124,46,0.08)] hover:text-[var(--film-text-label)]'
              )}
              style={{
                background: localMode === tab ? 'var(--film-mid)' : 'transparent',
                color: localMode === tab ? 'var(--film-cream)' : 'var(--film-text-dim)',
                boxShadow: localMode === tab ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {tab === 'source' ? (
                <Film size={11} strokeWidth={2} />
              ) : (
                <Layers size={11} strokeWidth={2} />
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      }
    >
      {/* ── Source Tab ──────────────────────────────────────────────────────── */}
      {localMode === 'source' && (
        <div className="space-y-4 px-1">
          {/* Media info card */}
          {(fetchedData.title || config.tmdbId) && (
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="syne-font font-semibold leading-tight line-clamp-2"
                    style={{ fontSize: 12, color: 'var(--film-cream)' }}
                  >
                    {fetchedData.title || (
                      <span style={{ color: 'var(--film-text-dim)', fontStyle: 'italic' }}>
                        Untitled
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {fetchedData.year && (
                      <span
                        className="mono-font"
                        style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
                      >
                        {fetchedData.year}
                      </span>
                    )}
                    <span
                      className="syne-font inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        background:
                          config.mediaType === 'tv'
                            ? 'rgba(59,130,246,0.12)'
                            : config.mediaType === 'anime'
                              ? 'rgba(168,85,247,0.12)'
                              : 'rgba(196,124,46,0.12)',
                        color:
                          config.mediaType === 'tv'
                            ? '#60a5fa'
                            : config.mediaType === 'anime'
                              ? '#c084fc'
                              : 'var(--film-amber)',
                      }}
                    >
                      <MediaIcon size={9} />
                      {config.mediaType}
                    </span>
                    {config.imdbId && (
                      <span
                        className="mono-font"
                        style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
                      >
                        {config.imdbId}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      config.mediaType === 'tv'
                        ? 'rgba(59,130,246,0.08)'
                        : config.mediaType === 'anime'
                          ? 'rgba(168,85,247,0.08)'
                          : 'rgba(196,124,46,0.08)',
                  }}
                >
                  <MediaIcon
                    size={16}
                    style={{
                      color:
                        config.mediaType === 'tv'
                          ? 'rgba(96,165,250,0.6)'
                          : config.mediaType === 'anime'
                            ? 'rgba(192,132,252,0.6)'
                            : 'rgba(196,124,46,0.6)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <p
              className="syne-font uppercase tracking-widest mb-1.5"
              style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
            >
              Search Media
            </p>
            <Combobox value={null as SearchResult | null} onChange={handleSelectMedia}>
              <div className="relative">
                <div
                  className="relative flex items-center h-9 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.contains(document.activeElement)) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onFocusCapture={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
                  }}
                  onBlurCapture={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div className="pl-3" style={{ color: 'var(--film-text-dim)', flexShrink: 0 }}>
                    {isSearching ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                        style={{ color: 'var(--film-amber)' }}
                      />
                    ) : (
                      <Search size={12} />
                    )}
                  </div>
                  <Combobox.Input
                    className="flex-1 bg-transparent border-none text-[11px] placeholder-[var(--film-text-dim)] px-2 focus:outline-none focus:ring-0 h-full syne-font"
                    style={{ color: 'var(--film-pale)' }}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    displayValue={() => ''}
                    placeholder="Movie or TV show…"
                  />
                </div>
                {results.length > 0 && (
                  <Combobox.Options
                    transition
                    className="absolute top-full mt-1 z-50 w-full custom-scrollbar py-1.5 focus:outline-none transition duration-75 ease-in data-[closed]:opacity-0 max-h-64 overflow-y-auto"
                    style={{
                      background: 'var(--film-mid)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    }}
                  >
                    {results.map((item) => (
                      <Combobox.Option
                        key={item.id}
                        value={item}
                        className={({ active }) =>
                          clsx(
                            'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                            active && 'bg-[rgba(196,124,46,0.08)]'
                          )
                        }
                      >
                        <img
                          src={item.poster_path}
                          alt=""
                          className="w-8 h-11 object-cover rounded-md shrink-0"
                          style={{ background: 'var(--film-char)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="syne-font font-medium truncate"
                            style={{ fontSize: 11, color: 'var(--film-cream)' }}
                          >
                            {item.title || item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="mono-font"
                              style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
                            >
                              {(item.release_date || item.first_air_date)?.split('-')[0]}
                            </span>
                            <span
                              className="syne-font px-1 py-px rounded"
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background:
                                  item.media_type === 'tv'
                                    ? 'rgba(59,130,246,0.12)'
                                    : 'rgba(196,124,46,0.12)',
                                color: item.media_type === 'tv' ? '#60a5fa' : 'var(--film-amber)',
                              }}
                            >
                              {item.media_type}
                            </span>
                          </div>
                        </div>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}
              </div>
            </Combobox>
          </div>

          {/* Media type + ID */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <p
                className="syne-font uppercase tracking-widest mb-1.5"
                style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
              >
                Media Type
              </p>
              <SelectBox
                value={config.mediaType}
                onChange={(v) => updateConfig('mediaType', v as PosterConfig['mediaType'])}
                options={[
                  { id: 'movie', label: '🎬 Movie' },
                  { id: 'tv', label: '📺 TV Series' },
                  { id: 'anime', label: '🎌 Anime' },
                ]}
              />
            </div>
            <div className="w-24">
              <p
                className="syne-font uppercase tracking-widest mb-1.5"
                style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
              >
                IMDb ID
              </p>
              <input
                type="text"
                value={config.imdbId || config.tmdbId}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (val.startsWith('tt')) {
                    setConfig((prev) => ({ ...prev, imdbId: val }));
                  } else {
                    setConfig((prev) => ({ ...prev, tmdbId: val, imdbId: undefined }));
                  }
                }}
                className="w-full h-9 px-2 rounded-lg mono-font text-center focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 11,
                  color: 'var(--film-pale)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.currentTarget) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  }
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              />
            </div>
          </div>

          {/* Source + ptype */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p
                className="syne-font uppercase tracking-widest mb-1.5"
                style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
              >
                Poster Source
              </p>
              <SelectBox
                value={config.source}
                onChange={(v) => updateConfig('source', v as PosterConfig['source'])}
                options={sourceOptions}
              />
            </div>
            {['fanart', 'tmdb', 'imdb'].includes(config.source) && (
              <div>
                <p
                  className="syne-font uppercase tracking-widest mb-1.5"
                  style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
                >
                  Poster Type
                </p>
                <SelectBox
                  value={config.ptype || 'auto'}
                  onChange={(v) => updateConfig('ptype', v)}
                  options={ptypeOptions}
                />
              </div>
            )}
          </div>

          {/* Textless toggle */}
          <ToggleRow
            label="Textless Poster"
            sub="Remove title text from image"
            checked={['metahub', 'imdb'].includes(config.source) ? false : config.textless}
            onChange={(v) => updateConfig('textless', v)}
            disabled={['metahub', 'imdb'].includes(config.source)}
          />

          {/* Display options */}
          <div className="pt-1 space-y-2">
            <p
              className="syne-font uppercase tracking-widest"
              style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
            >
              Display
            </p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'b' as const, label: 'Badges' },
                { id: 'm' as const, label: 'Minimal' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    updateConfig('uiPreset', opt.id);
                    if (opt.id === 'm') disableBadges();
                  }}
                  className={clsx(
                    'h-8 rounded-lg text-[11px] font-medium transition-all active:scale-95 syne-font border',
                    (config.uiPreset ?? 'b') === opt.id
                      ? 'bg-[rgba(196,124,46,0.12)] text-[var(--film-pale)] border-[rgba(196,124,46,0.25)]'
                      : 'bg-[rgba(255,255,255,0.02)] text-[var(--film-text-dim)] border-[rgba(255,255,255,0.05)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <ToggleRow
              label="Badges"
              sub={
                isMinimalPreset
                  ? 'Disabled in Minimal mode'
                  : 'Show/hide all rating badges'
              }
              checked={badgesEnabled && !isMinimalPreset}
              onChange={(v) => {
                if (isMinimalPreset) return;
                if (v) enableBadges();
                else disableBadges();
              }}
              disabled={isMinimalPreset}
            />
          </div>

          {/* Logo overlay — toggle only */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <ImagePlay
                  size={13}
                  style={{ color: config.logo ? 'var(--film-amber)' : 'var(--film-text-dim)' }}
                />
                <div>
                  <p
                    className="syne-font font-semibold"
                    style={{ fontSize: 11, color: 'var(--film-text-label)' }}
                  >
                    Logo Overlay
                  </p>
                  <p className="body-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
                    {config.logo ? 'Enabled · Configure in right sidebar' : 'Transparent title art overlay'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.logo}
                onChange={(v) => updateConfig('logo', v)}
                className={clsx(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
                  config.logo ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
                )}
              >
                <span
                  className={clsx(
                    'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                    config.logo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  )}
                />
              </Switch>
            </div>
            <div
              className="mt-5 mx-1"
              style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
              aria-hidden="true"
            />
          </div>

          {/* API Keys — Section */}
          <Section title="API Keys" icon={<KeyRound size={13} />}>
            <ApiKeysPanel config={config} setConfig={setConfig} />
          </Section>
        </div>
      )}

      {/* ── Layers Tab ──────────────────────────────────────────────────────── */}
      {localMode === 'layers' && (
        <div className="px-1">
          {(isMinimalPreset || !badgesEnabled) && (
            <div
              className="mb-4 p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <p className="syne-font" style={{ fontSize: 11, color: 'var(--film-text-label)' }}>
                {isMinimalPreset ? 'Badge layers are hidden in Minimal mode.' : 'Badges are currently disabled.'}
              </p>
              <p className="body-font mt-1" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
                Open the Source tab to switch display mode or re-enable badges.
              </p>
            </div>
          )}
          {!isMinimalPreset && badgesEnabled && (
            <>
          <div className="flex items-center justify-between mb-3">
            <span
              className="syne-font uppercase tracking-widest"
              style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
            >
              Badges
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAll}
                className="flex items-center gap-1.5 transition-colors body-font"
                style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
                }}
              >
                {allVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                {allVisible ? 'Hide all' : 'Show all'}
              </button>
              <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
              <button
                onClick={() => handleSelectAll(!allVisibleSelected)}
                className="flex items-center gap-1.5 transition-colors body-font"
                style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
                }}
              >
                <div
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all"
                  style={{
                    background: allVisibleSelected ? '#C47C2E' : 'var(--film-char)',
                    borderColor: allVisibleSelected ? '#D4A245' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {allVisibleSelected && <Check size={9} className="text-white" />}
                </div>
                Select all
              </button>
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            {activeBadges.length > 0 ? (
              <Droppable droppableId="active">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                    {activeBadges.map((badge, idx) => (
                      <Draggable key={badge.id} draggableId={badge.id} index={idx}>
                        {(prov, snap) => renderBadgeRow(badge, true, prov, snap.isDragging)}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <div className="flex flex-col items-center py-10 gap-2">
                <EyeOff
                  size={22}
                  strokeWidth={1.5}
                  style={{ color: 'var(--film-text-dim)', opacity: 0.7 }}
                />
                <p className="syne-font" style={{ fontSize: 11, color: 'var(--film-text-dim)' }}>
                  No active badges
                </p>
                <p className="body-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
                  Enable some from the list below
                </p>
              </div>
            )}

            {inactiveBadges.length > 0 && (
              <>
                <div className="mt-5 mb-2 flex items-center justify-between">
                  <span
                    className="syne-font uppercase tracking-widest"
                    style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
                  >
                    Available
                  </span>
                  {/* Fallback toggle */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="body-font"
                      style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
                    >
                      Fallback
                    </span>
                    <Switch
                      checked={fallbackEnabled}
                      onChange={(v) => {
                        setFallbackEnabled(v);
                        setConfig((prev) => ({
                          ...prev,
                          fallbackEnabled: v,
                          fallbackPool: v ? inactiveBadges.map((b) => b.id) : [],
                        }));
                      }}
                      className={clsx(
                        'relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none',
                        fallbackEnabled ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform',
                          fallbackEnabled ? 'translate-x-[13px]' : 'translate-x-[2px]'
                        )}
                      />
                    </Switch>
                  </div>
                </div>

                {fallbackEnabled ? (
                  <Droppable droppableId="inactive">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-0.5"
                      >
                        {inactiveBadges.map((badge, idx) => (
                          <Draggable key={badge.id} draggableId={`fb-${badge.id}`} index={idx}>
                            {(prov, snap) => renderBadgeRow(badge, false, prov, snap.isDragging)}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : (
                  <div className="space-y-0.5">
                    {inactiveBadges.map((badge) => (
                      <React.Fragment key={badge.id}>{renderBadgeRow(badge, false)}</React.Fragment>
                    ))}
                  </div>
                )}
              </>
            )}
          </DragDropContext>
            </>
          )}
        </div>
      )}
    </SidebarLayout>
  );
};

export default LayerPanel;
