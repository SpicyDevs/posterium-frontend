// src/components/LayerPanel.tsx
import React, { useState, useEffect, Fragment } from 'react';
import {
  Combobox,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Switch,
  Transition,
} from '@headlessui/react';
import { Check, ChevronsUpDown, Search, Loader2, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import { PosterConfig, RatingType, ALL_BADGES } from '../types';
import { BADGE_ICONS } from '../constants';
import { DEFAULT_API_BASE } from '../utils';
import { useEditor } from '../context/EditorContext';
import SidebarLayout from './SidebarLayout'; // <--- Added shared layout import

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

interface RatingsData {
  title?: string;
  imdb?: string;
  rt?: string;
  rt_popcorn?: string;
  letterboxd?: string;
  meta?: string;
  tmdb?: string;
  age?: string;
  runtime?: string;
  mal?: string;
  anilist?: string;
}

const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { setBatchSelection } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchedData, setFetchedData] = useState<RatingsData>({});

  // -- SEARCH LOGIC --
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://api.spicydevs.xyz/search?q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data.results)
          setResults(
            data.results.filter(
              (i: SearchResult) => i.poster_path && ['movie', 'tv'].includes(i.media_type)
            )
          );
      } catch (e) {
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!config.tmdbId) return;
      try {
        const res = await fetch(`${DEFAULT_API_BASE}/ratings/${config.mediaType}/${config.tmdbId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            // Grab title from new meta object
            setFetchedData({ ...data.ratings, title: data.meta?.title });

            // Automatically update ID input to IMDb ID if it exists
            if (data.ids?.imdb && data.ids.imdb !== config.tmdbId) {
              setConfig((prev) => ({ ...prev, tmdbId: data.ids.imdb }));
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    };
    fetchMeta();
  }, [config.tmdbId, config.mediaType]);

  const handleSelectMedia = (item: SearchResult | null) => {
    if (!item) return;

    setFetchedData({ title: item.title || item.name });

    setConfig((prev) => ({
      ...prev,
      tmdbId: item.id.toString(),
      mediaType: item.media_type as any,
    }));
    setSearchQuery('');
  };

  const updateConfig = (key: keyof PosterConfig, value: any) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const handleToggleVisibility = (id: RatingType, isVisible: boolean) => {
    const currentRatings = [...config.ratings];
    if (isVisible) {
      // Add if not present
      if (!currentRatings.includes(id)) setConfig({ ...config, ratings: [...currentRatings, id] });
    } else {
      // Remove
      setConfig({ ...config, ratings: currentRatings.filter((r) => r !== id) });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allVisibleIds = ALL_BADGES.filter((b) => config.ratings.includes(b.id)).map(
        (b) => b.id
      );
      setBatchSelection(allVisibleIds);
    } else {
      setBatchSelection([]);
    }
  };

  const allVisibleSelected =
    config.ratings.length > 0 && config.ratings.every((r) => selectedIds.has(r));
  const getIconKey = (id: string): BadgeIconKey => {
    if (id === 'rt') return 'rt_fresh';
    if (id === 'rt_popcorn') return 'popcorn_fresh';
    if (id === 'meta') return 'meta';
    return id as BadgeIconKey;
  };

  // Helper for Listbox
  const SelectBox = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { id: string; label: string }[];
  }) => (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-zinc-800 py-1.5 pl-3 pr-8 text-left border border-zinc-700 hover:border-zinc-500 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 sm:text-xs">
          <span className="block truncate text-zinc-300">
            {options.find((o) => o.id === value)?.label}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown className="h-3 w-3 text-zinc-400" aria-hidden="true" />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#18181b] py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none z-50 border border-white/10">
            {options.map((opt) => (
              <ListboxOption
                key={opt.id}
                value={opt.id}
                className={({ active }: { active: boolean }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-4 ${active ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-300'}`
                }
              >
                {({ selected }: { selected: boolean }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      {opt.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-400">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );

  return (
    <SidebarLayout
      bodyClassName="p-2 space-y-1"
      header={
        <>
          {/* Headless Combobox Search */}
          <Combobox value={null as SearchResult | null} onChange={handleSelectMedia}>
            <div className="relative">
              <div className="relative w-full cursor-default overflow-hidden rounded-md border border-white/10 bg-[#18181b] text-left focus-within:border-indigo-500/50">
                <Combobox.Input
                  className="w-full border-none py-2 pl-9 pr-3 text-xs leading-5 text-zinc-200 bg-transparent focus:ring-0"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  displayValue={(item: SearchResult) => item?.title || ''}
                  placeholder="Search Movie/TV..."
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {isSearching ? (
                    <Loader2 className="animate-spin text-indigo-500" size={14} />
                  ) : (
                    <Search className="text-zinc-500" size={14} />
                  )}
                </div>
              </div>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setSearchQuery('')}
              >
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#18181b] py-1 text-xs shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 border border-white/10 custom-scrollbar">
                  {results.length === 0 && searchQuery !== '' && !isSearching ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-zinc-500">
                      Nothing found.
                    </div>
                  ) : (
                    results.map((item) => (
                      <Combobox.Option
                        key={item.id}
                        value={item}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-4 flex items-center gap-3 ${active ? 'bg-indigo-500/20 text-white' : 'text-zinc-300'}`
                        }
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt=""
                          className="w-8 h-10 object-cover rounded bg-zinc-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate font-medium">
                            {item.title || item.name}
                          </span>
                          <span className="block truncate text-[10px] text-zinc-500">
                            {(item.release_date || item.first_air_date)?.split('-')[0]} •{' '}
                            {item.media_type.toUpperCase()}
                          </span>
                        </div>
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">
                Active Media Title
              </label>
              <div
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 truncate"
                title={fetchedData.title || 'Loading...'}
              >
                {fetchedData.title || <span className="italic text-zinc-500">Loading...</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                  Media Type
                </label>
                <SelectBox
                  value={config.mediaType}
                  onChange={(v) => updateConfig('mediaType', v)}
                  options={[
                    { id: 'movie', label: 'Movie' },
                    { id: 'tv', label: 'TV' },
                    { id: 'anime', label: 'Anime' },
                  ]}
                />
              </div>
              <div className="w-24 space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                  ID
                </label>
                <input
                  type="text"
                  value={config.tmdbId}
                  onChange={(e) => updateConfig('tmdbId', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                Source API
              </label>
              <SelectBox
                value={config.source}
                onChange={(v) => updateConfig('source', v)}
                options={[
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
                ]}
              />
            </div>

            {/* PType Selector */}
            {['fanart', 'tmdb', 'imdb'].includes(config.source) && (
              <div className="space-y-1 pt-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                  Poster Type
                </label>
                <SelectBox
                  value={config.ptype || 'auto'}
                  onChange={(v) => updateConfig('ptype', v)}
                  options={[
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
                  ]}
                />
              </div>
            )}

            {/* Headless Switch */}
            <Switch.Group>
              <div
                className={clsx(
                  'flex items-center justify-between rounded bg-zinc-900/50 border border-zinc-800 p-2',
                  ['metahub', 'imdb'].includes(config.source) && 'opacity-50 pointer-events-none'
                )}
              >
                <Switch.Label className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                  Textless Poster
                </Switch.Label>
                <Switch
                  checked={['metahub', 'imdb'].includes(config.source) ? false : config.textless}
                  onChange={(checked) => updateConfig('textless', checked)}
                  disabled={['metahub', 'imdb'].includes(config.source)}
                  className={`${config.textless && !['metahub', 'imdb'].includes(config.source) ? 'bg-indigo-600' : 'bg-zinc-700'} relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900`}
                >
                  <span
                    className={`${config.textless && !['metahub', 'imdb'].includes(config.source) ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </Switch.Group>
          </div>
        </>
      }
    >
      <div className="flex items-center justify-between px-2 mb-2 mt-1 pb-2 border-b border-white/5">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layers</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleSelectAll(!allVisibleSelected);
          }}
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group"
        >
          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">Select All</span>
          <div
            className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${allVisibleSelected ? 'bg-indigo-600 border-indigo-500' : 'border-zinc-600 bg-zinc-800'}`}
          >
            {allVisibleSelected && <CheckSquare size={10} className="text-white" />}
          </div>
        </button>
      </div>

      {ALL_BADGES.map((badge) => {
        const isActive = config.ratings.includes(badge.id);
        const isSelected = selectedIds.has(badge.id);
        const ratingValue = fetchedData[badge.id as keyof RatingsData];
        const iconKey = getIconKey(badge.id);
        const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id];

        return (
          <div
            key={badge.id}
            onClick={(e) => {
              if (!isActive) return;
              onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey);
            }}
            className={clsx(
              'group flex items-center gap-3 px-2 py-2 rounded-md transition-all border',
              isSelected
                ? 'bg-indigo-900/20 border-indigo-500/30'
                : 'border-transparent hover:bg-white/5',
              !isActive ? 'opacity-40 grayscale' : 'cursor-pointer'
            )}
          >
            <div
              className="flex items-center justify-center p-1"
              onClick={(e) => {
                e.stopPropagation();
                if (isActive) onSelect(badge.id, true);
              }}
            >
              <div
                className={clsx(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center transition-all',
                  isSelected
                    ? 'bg-indigo-500 border-indigo-400'
                    : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-500'
                )}
              >
                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
              </div>
            </div>
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded shadow-sm border border-white/5">
              {badge.id === 'age' ? (
                <span className="text-[8px] font-bold border rounded px-0.5 border-zinc-500 text-zinc-400">
                  PG
                </span>
              ) : iconData ? (
                <svg
                  viewBox={iconData?.vb}
                  className="w-4 h-4"
                  style={{ color: isActive ? iconData?.color : '#71717a' }}
                  dangerouslySetInnerHTML={{ __html: iconData?.body }}
                />
              ) : (
                <span className="text-[8px] font-bold text-zinc-500">
                  {badge.label.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex justify-between items-center pr-1">
              <div className="flex flex-col">
                <span
                  className={clsx(
                    'text-xs font-medium truncate',
                    isSelected ? 'text-indigo-200' : 'text-zinc-300'
                  )}
                >
                  {badge.label}
                </span>
                {isActive && ratingValue && (
                  <span className="text-[9px] text-zinc-500 font-mono">{ratingValue}</span>
                )}
              </div>

              {/* --- CHANGED: Replaced Eye Icon Button with Switch --- */}
              <Switch
                checked={isActive}
                onChange={(val) => handleToggleVisibility(badge.id, val)}
                onClick={(e: React.MouseEvent) => e.stopPropagation()} // Important: Stop row selection
                className={clsx(
                  isActive ? 'bg-indigo-600' : 'bg-zinc-700',
                  'relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500'
                )}
              >
                <span
                  className={clsx(
                    isActive ? 'translate-x-3.5' : 'translate-x-0.5',
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform'
                  )}
                />
              </Switch>
              {/* --------------------------------------------------- */}
            </div>
          </div>
        );
      })}
    </SidebarLayout>
  );
};

export default LayerPanel;
