// src/builder/components/LayerPanel.tsx
//
// Key fixes vs previous version:
//   • TMDB poster thumbnail: now fetches the .json endpoint which reliably
//     returns `poster.selected` (a full HTTPS URL). The old /ratings/ endpoint
//     was not returning poster data, so the thumbnail stayed blank.
//   • Logo controls: X/Y numeric sliders removed — dragging on canvas is the
//     intended workflow. Only Y-axis slider is kept for fine-tuning vertical
//     position; X is controlled by the auto-centre toggle + canvas drag.
//   • Mobile: larger touch targets, tighter padding, reduced info density.

import React, { useState, useEffect, Fragment, memo, useCallback } from 'react';
import {
  Combobox,
  Listbox, ListboxButton, ListboxOptions, ListboxOption,
  Switch, Transition,
} from '@headlessui/react';
import {
  Check, Search, Loader2, GripVertical,
  Film, Layers, Tv, Clapperboard,
  Eye, EyeOff, ChevronDown, ImagePlay,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DraggableProvided } from '@hello-pangea/dnd';
import clsx from 'clsx';
import type { PosterConfig, RatingType, LogoSourceType } from '../types';
import { ALL_BADGES, CANVAS_WIDTH } from '../types';
import { BADGE_ICONS } from '../constants';
import { DEFAULT_API_BASE } from '../utils';
import { useEditor } from '../context/EditorContext';
import SidebarLayout from './SidebarLayout';

type BadgeIconKey = keyof typeof BADGE_ICONS;

interface Props {
  config:     PosterConfig;
  setConfig:  React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect:   (id: RatingType, multi: boolean) => void;
}

interface SearchResult {
  id:              number;
  title?:          string;
  name?:           string;
  poster_path:     string;
  release_date?:   string;
  first_air_date?: string;
  media_type:      'movie' | 'tv';
}

// ─── Tiny select ──────────────────────────────────────────────────────────────
const SelectBox = memo(({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative">
      <ListboxButton className="w-full flex items-center justify-between gap-1 h-9 px-2.5 rounded-lg bg-[#111113] border border-white/8 text-[11px] text-zinc-300 font-medium hover:border-white/18 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]">
        <span className="truncate">{options.find((o) => o.id === value)?.label ?? value}</span>
        <ChevronDown size={11} className="text-zinc-500 shrink-0" />
      </ListboxButton>
      <Transition as={Fragment} leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
        <ListboxOptions className="absolute z-50 mt-1 w-full py-1 rounded-xl bg-[#1c1c1f] border border-white/10 shadow-2xl shadow-black/50 text-[11px] overflow-auto max-h-52 focus:outline-none">
          {options.map((opt) => (
            <ListboxOption
              key={opt.id}
              value={opt.id}
              className={({ active, selected }) =>
                clsx('flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors',
                  active && 'bg-[#C47C2E]/15 text-[#F0E6CC]',
                  !active && selected && 'text-[#E8D8A8]',
                  !active && !selected && 'text-zinc-300')
              }
            >
              {({ selected }) => (
                <>
                  <span className="flex-1 truncate">{opt.label}</span>
                  {selected && <Check size={11} className="text-[#D4A245] shrink-0" />}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Transition>
    </div>
  </Listbox>
));
SelectBox.displayName = 'SelectBox';

// ─── Inline slider (compact) ──────────────────────────────────────────────────
const InlineSlider: React.FC<{
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
  formatValue?: (v: number) => string;
}> = ({ label, value, onChange, min, max, step = 1, unit = '', formatValue }) => {
  const display = formatValue ? formatValue(value) : `${value}${unit}`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
        <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );
};

// ─── Logo size presets ────────────────────────────────────────────────────────
const LOGO_SIZES = [
  { key: 'sm', label: 'S',  w: 220, h: 58  },
  { key: 'md', label: 'M',  w: 320, h: 84  },
  { key: 'lg', label: 'L',  w: 400, h: 105 },
  { key: 'xl', label: 'XL', w: 460, h: 121 },
] as const;

function getLogoSizeKey(w: number, h: number) {
  for (const s of LOGO_SIZES) { if (s.w === w && s.h === h) return s.key; }
  return 'custom';
}

const LOGO_SOURCES: { id: LogoSourceType; label: string }[] = [
  { id: null,      label: 'Auto'   },
  { id: 'fanart',  label: 'Fanart' },
  { id: 'tmdb',    label: 'TMDB'   },
  { id: 'metahub', label: 'Hub'    },
];

// ─── Logo panel (collapsed when logo is disabled) ─────────────────────────────
const LogoPanel: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}> = ({ config, setConfig }) => {
  const [showCustomSize, setShowCustomSize] = useState(false);
  const update = useCallback(
    <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig],
  );

  const currentSizeKey = getLogoSizeKey(config.logoW, config.logoH);

  return (
    <div className="space-y-4 pt-1">

      {/* Source */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Source</p>
        <div className="grid grid-cols-4 gap-1">
          {LOGO_SOURCES.map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => update('logoSource', opt.id as PosterConfig['logoSource'])}
              className={clsx(
                'h-9 rounded-lg text-[11px] font-medium transition-all active:scale-95',
                (config.logoSource ?? null) === opt.id
                  ? 'bg-[#C47C2E]/15 text-[#E8D8A8] ring-1 ring-[#C47C2E]/30'
                  : 'bg-[#111113] text-zinc-400 hover:text-zinc-200 border border-white/6 hover:border-white/15',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-700">Falls back automatically if the selected source has no logo</p>
      </div>

      {/* Size presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Size</p>
          <button
            type="button"
            onClick={() => setShowCustomSize((v) => !v)}
            className="text-[9px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showCustomSize || currentSizeKey === 'custom' ? 'Presets' : 'Custom'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {LOGO_SIZES.map((sz) => (
            <button
              key={sz.key}
              type="button"
              onClick={() => { setConfig((p) => ({ ...p, logoW: sz.w, logoH: sz.h })); setShowCustomSize(false); }}
              className={clsx(
                'flex flex-col items-center justify-center h-12 rounded-lg transition-all active:scale-95 border',
                currentSizeKey === sz.key && !showCustomSize
                  ? 'bg-[#C47C2E]/15 text-[#E8D8A8] border-[#C47C2E]/30 ring-1 ring-[#C47C2E]/20'
                  : 'bg-[#111113] text-zinc-400 hover:text-zinc-200 border-white/6 hover:border-white/15',
              )}
            >
              <span className="text-[12px] font-bold leading-tight">{sz.label}</span>
              <span className="text-[8px] opacity-50 leading-tight">{sz.w}px</span>
            </button>
          ))}
        </div>
        {(showCustomSize || currentSizeKey === 'custom') && (
          <div className="space-y-3 pt-2 pl-2 border-l-2 border-white/5">
            <InlineSlider label="Width"  value={config.logoW} min={50} max={490} unit="px"
              onChange={(v) => setConfig((p) => ({ ...p, logoW: Math.round(v) }))} />
            <InlineSlider label="Height" value={config.logoH} min={20} max={200} unit="px"
              onChange={(v) => update('logoH', Math.round(v))} />
          </div>
        )}
      </div>

      {/* Position — only Y (vertical); X via canvas drag + auto-centre toggle */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Position</p>
        <InlineSlider
          label="Vertical position"
          value={config.logoY}
          min={0} max={748} unit="px"
          onChange={(v) => update('logoY', Math.round(v))}
        />
        {/* Auto-centre X */}
        <div className="flex items-center justify-between gap-3 px-0.5">
          <div>
            <p className="text-[10px] text-zinc-400 font-medium">Auto-centre horizontally</p>
            <p className="text-[9px] text-zinc-600">Centre at {Math.round((CANVAS_WIDTH - config.logoW) / 2)} px</p>
          </div>
          <Switch
            checked={config.logoX === null}
            onChange={(v) => update('logoX', v ? null : Math.round((CANVAS_WIDTH - config.logoW) / 2))}
            className={clsx(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
              config.logoX === null ? 'bg-[#C47C2E]' : 'bg-zinc-700',
            )}
          >
            <span className={clsx(
              'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
              config.logoX === null ? 'translate-x-[18px]' : 'translate-x-[3px]',
            )} />
          </Switch>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Appearance</p>
        <InlineSlider label="Opacity" value={config.logoOpacity} min={0} max={1} step={0.05}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update('logoOpacity', v)} />
        <InlineSlider label="Drop Shadow" value={config.logoShadow} min={0} max={30}
          onChange={(v) => update('logoShadow', v)} />
      </div>

      {/* Drag hint */}
      <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <span className="text-amber-400/50 mt-px shrink-0 text-[11px]">⟠</span>
        <p className="text-[9px] text-zinc-600 leading-relaxed">
          Drag the logo directly on the canvas to reposition. Snap guides appear near the centre.
        </p>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { setBatchSelection, activeTab, setActiveTab, setLiveRatings } = useEditor();
  const [localMode,     setLocalMode]     = useState<'source' | 'layers'>('source');
  const [inactiveOrder, setInactiveOrder] = useState<RatingType[]>([]);

  useEffect(() => {
    if (activeTab === 'source' || activeTab === 'layers') setLocalMode(activeTab);
  }, [activeTab]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [results,     setResults]     = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) { setResults([]); return; }
      setIsSearching(true);
      try {
        const res  = await fetch(`https://api.spicydevs.xyz/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.results)
          setResults(data.results.filter((i: SearchResult) =>
            i.poster_path && ['movie', 'tv'].includes(i.media_type),
          ));
      } catch { /* ignore */ } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Meta / ratings fetch ────────────────────────────────────────────────────
  // Uses the .json endpoint because it reliably returns `poster.selected`
  // (the full upstream poster URL), which the /ratings/ endpoint does not.
  const [fetchedData, setFetchedData] = useState<Record<string, string>>({});
  const [posterUrl,   setPosterUrl]   = useState('');

  useEffect(() => {
    if (!config.tmdbId) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        // .json gives us metadata + ratings + the poster URL in one call
        const res = await fetch(
          `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.json?source=${config.source}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = await res.json();

        const merged: Record<string, string> = {};
        if (data.meta?.title) merged.title = data.meta.title;
        if (data.meta?.year)  merged.year  = String(data.meta.year);
        if (data.ratings)     Object.assign(merged, data.ratings);
        setFetchedData(merged);

        // Share live ratings with context so canvas badges show real values
        setLiveRatings(data.ratings || {});

        // Poster thumbnail for the source card
        const posterPath =
          data.poster?.selected ||   // .json format
          data.meta?.poster     ||   // ratings format
          '';
        if (posterPath) setPosterUrl(posterPath);

      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    })();

    return () => ctrl.abort();
  }, [config.tmdbId, config.mediaType, config.source, setLiveRatings]);

  // ── Search result selection ─────────────────────────────────────────────────
  const handleSelectMedia = useCallback((item: SearchResult | null) => {
    if (!item) return;
    setFetchedData({
      title: item.title || item.name || '',
      year:  (item.release_date || item.first_air_date)?.split('-')[0] || '',
    });
    setPosterUrl(item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : '');
    setConfig((prev) => ({
      ...prev,
      tmdbId:    item.id.toString(),
      mediaType: item.media_type as PosterConfig['mediaType'],
    }));
    setSearchQuery('');
    setResults([]);
  }, [setConfig]);

  const updateConfig = useCallback(
    <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig],
  );

  // ── Visibility toggles ──────────────────────────────────────────────────────
  const handleToggleVisibility = useCallback((id: RatingType, visible: boolean) => {
    if (visible) {
      setConfig((prev) => prev.ratings.includes(id) ? prev : { ...prev, ratings: [id, ...prev.ratings] });
      setInactiveOrder((prev) => prev.filter((x) => x !== id));
    } else {
      setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
      setInactiveOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
    }
  }, [setConfig]);

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

  const allVisibleSelected = config.ratings.length > 0 && config.ratings.every((r) => selectedIds.has(r));
  const handleSelectAll = useCallback((checked: boolean) => {
    setBatchSelection(checked ? ALL_BADGES.filter((b) => config.ratings.includes(b.id)).map((b) => b.id) : []);
  }, [setBatchSelection, config.ratings]);

  // ── DnD ─────────────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const rev = [...config.ratings].reverse();
    const [removed] = rev.splice(result.source.index, 1);
    rev.splice(result.destination.index, 0, removed);
    setConfig((prev) => ({ ...prev, ratings: rev.reverse() }));
  }, [config.ratings, setConfig]);

  // ── Derived lists ────────────────────────────────────────────────────────────
  const activeBadges = [...config.ratings]
    .reverse()
    .map((id) => ALL_BADGES.find((b) => b.id === id))
    .filter((b): b is { id: RatingType; label: string } => !!b);

  const inactiveBadges = ALL_BADGES.filter((b) => !config.ratings.includes(b.id)).sort((a, b) => {
    const ia = inactiveOrder.indexOf(a.id), ib = inactiveOrder.indexOf(b.id);
    if (ia === -1 && ib === -1) return ALL_BADGES.indexOf(a) - ALL_BADGES.indexOf(b);
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });

  const getIconKey = (id: string): BadgeIconKey =>
    id === 'rt' ? 'rt_fresh' : id === 'rt_popcorn' ? 'popcorn_fresh' : (id as BadgeIconKey);

  const MediaIcon = config.mediaType === 'tv' ? Tv : config.mediaType === 'anime' ? Clapperboard : Film;

  // ── Source options ──────────────────────────────────────────────────────────
  const sourceOptions = [
    { id: 'tmdb',    label: 'TMDB'       },
    { id: 'fanart',  label: 'Fanart.tv'  },
    { id: 'metahub', label: 'Metahub'    },
    { id: 'imdb',    label: 'IMDb'       },
    ...(config.mediaType === 'anime'
      ? [{ id: 'mal', label: 'MyAnimeList' }, { id: 'anilist', label: 'AniList' }]
      : []),
  ];
  const ptypeOptions = [
    { id: 'auto',   label: 'Auto (Default)' },
    { id: 'top1',   label: 'Top 1'           },
    { id: 'top2',   label: 'Top 2'           },
    { id: 'top3',   label: 'Top 3'           },
    ...(config.source === 'tmdb'   ? [{ id: 'best',   label: 'Best (Bayesian)' }] : []),
    ...(config.source === 'fanart' ? [{ id: 'latest', label: 'Latest' }, { id: 'oldest', label: 'Oldest' }] : []),
    { id: 'random', label: 'Random' },
  ];

  // ── Badge row ────────────────────────────────────────────────────────────────
  const renderBadgeRow = (
    badge:         { id: RatingType; label: string },
    isActive:      boolean,
    provided?:     DraggableProvided,
    isDraggingItem?: boolean,
  ) => {
    const isSel      = selectedIds.has(badge.id);
    const ratingVal  = fetchedData[badge.id];
    const iconKey    = getIconKey(badge.id);
    const iconData   = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id];
    const iconColor  = isActive ? (iconData?.color ?? '#a1a1aa') : '#4a4a52';

    return (
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        style={provided?.draggableProps.style}
        onClick={(e) => { if (isActive) onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey); }}
        className={clsx(
          'flex items-center gap-2 px-2 py-2 rounded-lg transition-all select-none',
          isSel
            ? 'bg-[#C47C2E]/12 ring-1 ring-[#C47C2E]/30'
            : isActive
              ? 'hover:bg-white/4 cursor-pointer'
              : 'opacity-50',
          isDraggingItem && 'shadow-2xl bg-[#1c1c1f] ring-1 ring-white/10 rotate-[0.5deg]',
        )}
      >
        {/* Drag grip */}
        {isActive ? (
          <div
            {...provided?.dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing p-0.5 outline-none transition-colors shrink-0"
          >
            <GripVertical size={13} />
          </div>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Checkbox */}
        <div
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); if (isActive) onSelect(badge.id, true); }}
        >
          <div className={clsx(
            'w-4 h-4 rounded border flex items-center justify-center transition-all',
            isSel ? 'bg-[#C47C2E] border-[#D4A245]' : 'bg-[#111113] border-zinc-600 hover:border-zinc-400',
          )}>
            {isSel && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
          </div>
        </div>

        {/* Icon */}
        <div className="w-7 h-7 shrink-0 rounded-md bg-[#111113] border border-white/6 flex items-center justify-center">
          {badge.id === 'age' ? (
            <span className="text-[8px] font-bold" style={{ color: iconColor }}>PG</span>
          ) : iconData ? (
            <svg viewBox={iconData.vb} className="w-3.5 h-3.5" style={{ color: iconColor }}
              dangerouslySetInnerHTML={{ __html: iconData.body }} />
          ) : (
            <span className="text-[8px] font-bold text-zinc-500">{badge.label.slice(0, 2)}</span>
          )}
        </div>

        {/* Label + value */}
        <div className="flex-1 min-w-0">
          <span className={clsx(
            'block text-[11px] font-medium truncate',
            isSel ? 'text-[#F0E6CC]' : isActive ? 'text-zinc-200' : 'text-zinc-400',
          )}>
            {badge.label}
          </span>
          {isActive && ratingVal && (
            <span className="text-[9px] font-mono text-zinc-600">{ratingVal}</span>
          )}
        </div>

        {/* Eye toggle */}
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <button
            onClick={() => handleToggleVisibility(badge.id, !isActive)}
            className={clsx(
              'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
              isActive ? 'text-zinc-400 hover:text-zinc-100 hover:bg-white/8' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
            )}
            title={isActive ? 'Hide badge' : 'Show badge'}
          >
            {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SidebarLayout
      bodyClassName="px-2 pt-2 pb-8"
      header={
        <div className="flex bg-[#111113] rounded-lg p-0.5 border border-white/6">
          {(['source', 'layers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none capitalize',
                localMode === tab
                  ? 'bg-[#1c1c1f] text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              {tab === 'source' ? <Film size={11} strokeWidth={2} /> : <Layers size={11} strokeWidth={2} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      }
    >
      {/* ═══════ SOURCE TAB ═══════ */}
      {localMode === 'source' && (
        <div className="space-y-4">

          {/* Active media card */}
          {(fetchedData.title || config.tmdbId) && (
            <div className="flex gap-3 p-2.5 rounded-xl bg-[#111113] border border-white/6">
              {/* Poster thumbnail — fixed by using .json endpoint */}
              <div className="w-12 h-[4.5rem] shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-white/6">
                {posterUrl ? (
                  <img
                    src={posterUrl.startsWith('http') ? posterUrl : `https://image.tmdb.org/t/p/w185${posterUrl}`}
                    alt={fetchedData.title || 'Poster'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={16} className="text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-[12px] font-semibold text-zinc-100 leading-tight line-clamp-2">
                  {fetchedData.title || <span className="text-zinc-500 italic">Untitled</span>}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {fetchedData.year && <span className="text-[10px] text-zinc-500 font-mono">{fetchedData.year}</span>}
                  <span className={clsx(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide',
                    config.mediaType === 'tv'    ? 'bg-blue-500/15 text-blue-400'
                    : config.mediaType === 'anime' ? 'bg-purple-500/15 text-purple-400'
                    :                               'bg-amber-500/15 text-amber-400',
                  )}>
                    <MediaIcon size={9} />
                    {config.mediaType}
                  </span>
                </div>
                {(fetchedData.imdb || fetchedData.rt || fetchedData.tmdb) && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {fetchedData.imdb && <span className="text-[9px] font-mono text-zinc-500">IMDb {fetchedData.imdb}</span>}
                    {fetchedData.rt   && <span className="text-[9px] font-mono text-zinc-500">RT {fetchedData.rt}</span>}
                    {fetchedData.tmdb && <span className="text-[9px] font-mono text-zinc-500">TMDB {fetchedData.tmdb}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="sidebar-label">Search Media</label>
            <Combobox value={null as SearchResult | null} onChange={handleSelectMedia}>
              <div className="relative">
                <div className="relative flex items-center h-9 bg-[#111113] border border-white/[0.08] rounded-lg focus-within:border-[#C47C2E]/50 transition-colors">
                  <div className="pl-3 text-zinc-500 shrink-0">
                    {isSearching ? <Loader2 size={12} className="animate-spin text-[#C47C2E]" /> : <Search size={12} />}
                  </div>
                  <Combobox.Input
                    className="flex-1 bg-transparent border-none text-[11px] text-zinc-200 placeholder-zinc-600 px-2 focus:outline-none focus:ring-0 h-full"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    displayValue={() => ''}
                    placeholder="Movie or TV show…"
                  />
                </div>
                {results.length > 0 && (
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => { setSearchQuery(''); setResults([]); }}
                  >
                    <Combobox.Options className="absolute top-full mt-1 z-50 w-full bg-[#1c1c1f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 max-h-64 overflow-y-auto custom-scrollbar py-1.5 focus:outline-none">
                      {results.map((item) => (
                        <Combobox.Option
                          key={item.id}
                          value={item}
                          className={({ active }) =>
                            clsx('flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors', active && 'bg-[#C47C2E]/12')
                          }
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt=""
                            className="w-8 h-11 object-cover rounded-md bg-zinc-800 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-zinc-200 truncate">{item.title || item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-zinc-500">
                                {(item.release_date || item.first_air_date)?.split('-')[0]}
                              </span>
                              <span className={clsx(
                                'text-[9px] px-1 py-px rounded font-semibold uppercase',
                                item.media_type === 'tv' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400',
                              )}>
                                {item.media_type}
                              </span>
                            </div>
                          </div>
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Transition>
                )}
              </div>
            </Combobox>
          </div>

          {/* Media type + ID */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <label className="sidebar-label">Media Type</label>
              <SelectBox
                value={config.mediaType}
                onChange={(v) => updateConfig('mediaType', v as PosterConfig['mediaType'])}
                options={[
                  { id: 'movie', label: '🎬 Movie' },
                  { id: 'tv',    label: '📺 TV Series' },
                  { id: 'anime', label: '🎌 Anime' },
                ]}
              />
            </div>
            <div className="w-24">
              <label className="sidebar-label">ID</label>
              <input
                type="text"
                value={config.tmdbId}
                onChange={(e) => updateConfig('tmdbId', e.target.value)}
                className="w-full h-9 px-2 rounded-lg bg-[#111113] border border-white/[0.08] text-[11px] font-mono text-zinc-300 text-center focus:outline-none focus-visible:border-[#C47C2E]/50 transition-colors"
              />
            </div>
          </div>

          {/* Source + poster type */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="sidebar-label">Poster Source</label>
              <SelectBox
                value={config.source}
                onChange={(v) => updateConfig('source', v as PosterConfig['source'])}
                options={sourceOptions}
              />
            </div>
            {['fanart', 'tmdb', 'imdb'].includes(config.source) && (
              <div>
                <label className="sidebar-label">Poster Type</label>
                <SelectBox
                  value={config.ptype || 'auto'}
                  onChange={(v) => updateConfig('ptype', v)}
                  options={ptypeOptions}
                />
              </div>
            )}
          </div>

          {/* Textless toggle */}
          <div className={clsx(
            'flex items-center justify-between px-3 py-3 rounded-xl bg-[#111113] border border-white/6 transition-opacity',
            ['metahub', 'imdb'].includes(config.source) && 'opacity-50 pointer-events-none',
          )}>
            <div>
              <p className="text-[11px] font-medium text-zinc-300">Textless Poster</p>
              <p className="text-[9px] text-zinc-500 mt-0.5">Remove title text from image</p>
            </div>
            <Switch
              checked={['metahub', 'imdb'].includes(config.source) ? false : config.textless}
              onChange={(v) => updateConfig('textless', v)}
              disabled={['metahub', 'imdb'].includes(config.source)}
              className={clsx(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
                config.textless && !['metahub', 'imdb'].includes(config.source) ? 'bg-[#C47C2E]' : 'bg-zinc-700',
              )}
            >
              <span className={clsx(
                'inline-block w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm',
                config.textless && !['metahub', 'imdb'].includes(config.source) ? 'translate-x-[18px]' : 'translate-x-[3px]',
              )} />
            </Switch>
          </div>

          <div className="border-t border-white/[0.06] pt-1" />

          {/* ── LOGO OVERLAY ── */}
          <div className="rounded-xl border border-white/6 overflow-hidden">
            {/* Toggle header */}
            <div className="flex items-center justify-between px-3 py-3 bg-[#111113]">
              <div className="flex items-center gap-2.5">
                <div className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  config.logo ? 'bg-[#C47C2E]/20 text-[#D4A245]' : 'bg-white/4 text-zinc-600',
                )}>
                  <ImagePlay size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-200 leading-tight">Logo Overlay</p>
                  <p className="text-[9px] text-zinc-600">
                    {config.logo
                      ? `${config.logoSource ?? 'Auto'} · ${config.logoW}×${config.logoH}`
                      : 'Transparent title art overlay'}
                  </p>
                </div>
              </div>
              <Switch
                checked={config.logo}
                onChange={(v) => updateConfig('logo', v)}
                className={clsx(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
                  config.logo ? 'bg-[#C47C2E]' : 'bg-zinc-700',
                )}
              >
                <span className={clsx(
                  'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
                  config.logo ? 'translate-x-[18px]' : 'translate-x-[3px]',
                )} />
              </Switch>
            </div>

            {/* Expanded customisation */}
            {config.logo && (
              <div className="px-3 pb-4 bg-[#0f0f11] border-t border-white/[0.05]">
                <LogoPanel config={config} setConfig={setConfig} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ LAYERS TAB ═══════ */}
      {localMode === 'layers' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="sidebar-label mb-0">Badges</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAll}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                title={allVisible ? 'Hide all' : 'Show all'}
              >
                {allVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                {allVisible ? 'Hide all' : 'Show all'}
              </button>
              <div className="w-px h-3 bg-white/10" />
              <button
                onClick={() => handleSelectAll(!allVisibleSelected)}
                className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <div className={clsx(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center transition-all',
                  allVisibleSelected ? 'bg-[#C47C2E] border-[#D4A245]' : 'border-zinc-600',
                )}>
                  {allVisibleSelected && <Check size={9} className="text-white" />}
                </div>
                Select all
              </button>
            </div>
          </div>

          {/* Active badges */}
          {activeBadges.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
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
            </DragDropContext>
          ) : (
            <div className="flex flex-col items-center py-10 text-zinc-600 gap-2">
              <EyeOff size={22} strokeWidth={1.5} />
              <p className="text-[11px] text-zinc-500">No active badges</p>
              <p className="text-[9px] text-zinc-700">Enable some from the list below</p>
            </div>
          )}

          {/* Inactive badges */}
          {inactiveBadges.length > 0 && (
            <>
              <div className="mt-5 mb-2 px-1">
                <span className="sidebar-label mb-0">Available</span>
              </div>
              <div className="space-y-0.5">
                {inactiveBadges.map((badge) => (
                  <React.Fragment key={badge.id}>{renderBadgeRow(badge, false)}</React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </SidebarLayout>
  );
};

export default LayerPanel;