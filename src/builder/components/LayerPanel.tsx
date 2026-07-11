// src/components/builder/components/LayerPanel.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Switch } from '@headlessui/react';
import {
  Check,
  Film,
  Layers,
  Tv,
  Clapperboard,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import type { PosterConfig, RatingType } from '../types';
import { ALL_BADGES, DEFAULT_CONFIG } from '../types';
import { DEFAULT_API_BASE } from '../utils/constants';
import { useEditor } from '../EditorContext';
import SidebarLayout from './SidebarLayout';
import PanelTabs from './PanelTabs';
import BadgeRow from './ui/BadgeRow';
import LogoLayerRow from './ui/LogoLayerRow';
import TitleLayerRow from './ui/TitleLayerRow';
import SourceTabContent from './ui/SourceTabContent';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  panelMode?: 'source' | 'layers';
  hideTabs?: boolean;
  detailLevel?: 'simple' | 'advanced';
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

const BADGES_PREF_STORAGE_KEY = 'posterium_badges_toggle_pref_v1';
const TEXTLESS_PREF_STORAGE_KEY = 'posterium_textless_toggle_pref_v1';

const writeBadgesPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(BADGES_PREF_STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
};

const writeTextlessPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(TEXTLESS_PREF_STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
};

// ── Main LayerPanel component ─────────────────────────────────────────────────
const LayerPanel: React.FC<Props> = ({
  config,
  setConfig,
  selectedIds,
  onSelect,
  panelMode,
  hideTabs = false,
  detailLevel = 'simple',
}) => {
  const {
    setBatchSelection,
    activeTab,
    setActiveTab,
    selectedLogo,
    handleLogoSelection,
    setLiveRatings,
    setLiveTitle,
    setLiveYear,
    fallbackEnabled,
    setFallbackEnabled,
  } = useEditor();

  const isAdvanced = detailLevel === 'advanced';

  const [localMode, setLocalMode] = useState<'source' | 'layers'>(panelMode ?? 'source');
  const [inactiveOrder, setInactiveOrder] = useState<RatingType[]>([]);

  useEffect(() => {
    if (panelMode) {
      setLocalMode(panelMode);
      return;
    }
    if (activeTab === 'source' || activeTab === 'layers')
      setLocalMode(activeTab);
  }, [activeTab, panelMode]);

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
  const savedActiveBadgesRef = useRef<RatingType[]>([]);
  const badgesVisible = config.ratings.length > 0;
  const titleBadgeEnabled = config.ratings.includes('title');

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
        if (data.meta?.year) merged.year = String(data.meta.year).replace(/\.0+$/, '');
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
        setLiveTitle(merged.title ?? '');
        setLiveYear(merged.year ?? '');
        if (data.ids?.imdb && data.ids.imdb !== config.imdbId) {
          setConfig((prev) => ({ ...prev, imdbId: data.ids.imdb }));
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
      }
    })();
    return () => ctrl.abort();
  }, [
    config.tmdbId,
    config.imdbId,
    config.mediaType,
    config.source,
    setLiveRatings,
    setLiveTitle,
    setLiveYear,
    setConfig,
  ]);

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

  const disableBadges = useCallback(
    ({ persistPreference = true }: { persistPreference?: boolean } = {}) => {
      if (persistPreference) writeBadgesPreference(false);
      setConfig((prev) => {
        if (prev.ratings.length > 0) {
          savedActiveBadgesRef.current = [...prev.ratings];
        }
        return { ...prev, ratings: [] };
      });
      setBatchSelection([]);
    },
    [setConfig, setBatchSelection]
  );

  const enableBadges = useCallback(() => {
    writeBadgesPreference(true);
    setConfig((prev) => {
      if (prev.ratings.length > 0) return prev;
      const restored = savedActiveBadgesRef.current.filter((id) =>
        ALL_BADGES.some((badge) => badge.id === id)
      );
      return { ...prev, ratings: restored.length > 0 ? restored : DEFAULT_CONFIG.ratings };
    });
  }, [setConfig]);

  useEffect(() => {
    writeTextlessPreference(config.textless);
  }, [config.textless]);

  const handleToggleVisibility = useCallback(
    (id: RatingType, visible: boolean) => {
      if (visible) {
        setConfig((prev) => {
          if (prev.ratings.includes(id)) return prev;
          if (id !== 'title' && id !== 'year') return { ...prev, ratings: [id, ...prev.ratings] };
          const nextItems = { ...prev.items, [id]: { ...(prev.items[id] ?? {}) } };
          const titleItem = nextItems[id];
          if (titleItem) {
            delete titleItem.x;
            delete titleItem.y;
          }
          return { ...prev, ratings: [id, ...prev.ratings], items: nextItems };
        });
        setInactiveOrder((prev) => prev.filter((x) => x !== id));
        onSelect(id, false);
        setActiveTab('selection');
      } else {
        setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
        setInactiveOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
      }
    },
    [onSelect, setActiveTab, setConfig]
  );

  const allVisible = config.ratings.filter((id) => id !== 'title' && id !== 'year').length === ALL_BADGES.filter((b) => b.id !== 'title' && b.id !== 'year').length;
  const handleToggleAll = useCallback(() => {
    const badgeOnly = ALL_BADGES.filter((b) => b.id !== 'title' && b.id !== 'year');
    if (allVisible) {
      setConfig((prev) => {
        const prevBadges = prev.ratings.filter((id) => id !== 'title' && id !== 'year');
        setInactiveOrder((io) => [...[...prevBadges].reverse(), ...io]);
        return { ...prev, ratings: prev.ratings.filter((id) => id === 'title' || id === 'year') };
      });
    } else {
      setConfig((prev) => {
        const missing = badgeOnly.filter((b) => !prev.ratings.includes(b.id)).map((b) => b.id);
        return { ...prev, ratings: [...missing, ...prev.ratings] };
      });
      setInactiveOrder([]);
    }
  }, [allVisible, setConfig]);

  const allVisibleSelected =
    config.ratings.length > 0 && config.ratings.filter((r) => r !== 'title' && r !== 'year').every((r) => selectedIds.has(r));

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setBatchSelection(
        checked ? ALL_BADGES.filter((b) => b.id !== 'title' && b.id !== 'year' && config.ratings.includes(b.id)).map((b) => b.id) : []
      );
    },
    [setBatchSelection, config.ratings]
  );

  const activeBadges = [...config.ratings]
    .filter((id) => id !== 'title' && id !== 'year' && ALL_BADGES.some((b) => b.id === id))
    .map((id, idx) => ({
      kind: 'badge' as const,
      id,
      label: ALL_BADGES.find((b) => b.id === id)?.label ?? id.toUpperCase(),
      z: 100 + idx,
    }));
  const titleActive = config.ratings.includes('title');
  const activeLayers = [
    ...activeBadges,
    ...(config.logo
      ? [
          {
            kind: 'logo' as const,
            id: 'logo',
            label: 'Logo',
            z: config.logoZ ?? 90,
          },
        ]
      : []),
  ].sort((a, b) => b.z - a.z);

  const inactiveBadges = ALL_BADGES.filter((b) => b.id !== 'title' && b.id !== 'year' && !config.ratings.includes(b.id)).sort((a, b) => {
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
        const ordered = activeLayers.map((l) => l.id);
        const [removed] = ordered.splice(result.source.index, 1);
        ordered.splice(result.destination.index, 0, removed);
        const logoIndex = ordered.indexOf('logo');
        const badgeTopToBottom = ordered.filter((id): id is RatingType => id !== 'logo');
        setConfig((prev) => ({
          ...prev,
          ratings: [...badgeTopToBottom].reverse(),
          logoZ: logoIndex === -1 ? prev.logoZ : 100 + (ordered.length - logoIndex - 1),
        }));
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
    [activeLayers, inactiveBadges, fallbackEnabled, setConfig]
  );

  const getIconKey = (id: string): string =>
    id === 'rt' ? 'rt_fresh' : id === 'rt_popcorn' ? 'popcorn_fresh' : id;

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
  const logoSourceOptions = [
    { id: 'auto', label: 'Auto' },
    { id: 'fanart', label: 'Fanart' },
    { id: 'tmdb', label: 'TMDB' },
    { id: 'metahub', label: 'Hub' },
  ];

  return (
    <SidebarLayout
      side="left"
      bodyClassName="px-2 pt-2 pb-8"
      header={
        hideTabs ? null : (
          <PanelTabs
            ariaLabel="Builder content panels"
            activeId={localMode}
            onChange={(id) => setActiveTab(id)}
            tabs={[
              { id: 'source', label: 'Source', icon: <Film size={11} strokeWidth={2} /> },
              { id: 'layers', label: 'Layers', icon: <Layers size={11} strokeWidth={2} /> },
            ]}
          />
        )
      }
    >
      {/* ── Source Tab ──────────────────────────────────────────────────────── */}
      {localMode === 'source' && (
        <SourceTabContent
          config={config}
          setConfig={setConfig}
          updateConfig={updateConfig}
          fetchedData={fetchedData}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          results={results}
          isSearching={isSearching}
          handleSelectMedia={handleSelectMedia}
          isAdvanced={isAdvanced}
          sourceOptions={sourceOptions}
          logoSourceOptions={logoSourceOptions}
          ptypeOptions={ptypeOptions}
          MediaIcon={MediaIcon}
          titleBadgeEnabled={titleBadgeEnabled}
          badgesVisible={badgesVisible}
          handleLogoSelection={handleLogoSelection}
          setActiveTab={setActiveTab}
          enableBadges={enableBadges}
          disableBadges={disableBadges}
        />
      )}

      {/* ── Layers Tab ──────────────────────────────────────────────────────── */}
      {localMode === 'layers' && (
        <div className="px-1">
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
              {titleActive && (
                <div className="space-y-0.5 mb-1">
                  <TitleLayerRow
                    isActive={true}
                    isSelected={selectedIds.has('title')}
                    onSelect={(multi) => onSelect('title', multi)}
                    onEnable={() => {
                      setConfig((prev) => ({
                        ...prev,
                        ratings: prev.ratings.includes('title')
                          ? prev.ratings
                          : [...prev.ratings, 'title'],
                      }));
                    }}
                    onDisable={() => {
                      setConfig((prev) => ({
                        ...prev,
                        ratings: prev.ratings.filter((r) => r !== 'title'),
                      }));
                    }}
                  />
                </div>
              )}
              {activeLayers.length > 0 ? (
                <Droppable droppableId="active">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-0.5"
                    >
                      {activeLayers.map((layer, idx) => (
                        <Draggable
                          key={layer.id}
                          draggableId={layer.id === 'logo' ? 'logo' : layer.id}
                          index={idx}
                        >
                          {(prov, snap) =>
                            layer.kind === 'logo'
                              ? <LogoLayerRow
                                  isActive={true}
                                  selectedLogo={selectedLogo}
                                  logoEnabled={config.logo}
                                  onEnable={() => { updateConfig('logo', true); handleLogoSelection(false); setActiveTab('selection'); }}
                                  onDisable={() => updateConfig('logo', false)}
                                  onSelect={(multi) => handleLogoSelection(multi)}
                                  provided={prov}
                                  isDraggingItem={snap.isDragging}
                                />
                              : <BadgeRow
                                  badge={{ id: layer.id as RatingType, label: layer.label }}
                                  isActive={true}
                                  isSelected={selectedIds.has(layer.id as RatingType)}
                                  ratingVal={fetchedData[layer.id as RatingType]}
                                  iconKey={getIconKey(layer.id)}
                                  fallbackEnabled={fallbackEnabled}
                                  onSelect={onSelect}
                                  handleToggleVisibility={handleToggleVisibility}
                                  provided={prov}
                                  isDraggingItem={snap.isDragging}
                                />
                          }
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
                              {(prov, snap) => (
                                <BadgeRow
                                  badge={badge}
                                  isActive={false}
                                  isSelected={selectedIds.has(badge.id)}
                                  ratingVal={fetchedData[badge.id]}
                                  iconKey={getIconKey(badge.id)}
                                  fallbackEnabled={fallbackEnabled}
                                  onSelect={onSelect}
                                  handleToggleVisibility={handleToggleVisibility}
                                  provided={prov}
                                  isDraggingItem={snap.isDragging}
                                />
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ) : (
                    <div className="space-y-0.5">
                      {inactiveBadges.map((badge) => (
                        <React.Fragment key={badge.id}>
                          <BadgeRow
                            badge={badge}
                            isActive={false}
                            isSelected={selectedIds.has(badge.id)}
                            ratingVal={fetchedData[badge.id]}
                            iconKey={getIconKey(badge.id)}
                            fallbackEnabled={fallbackEnabled}
                            onSelect={onSelect}
                            handleToggleVisibility={handleToggleVisibility}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </>
              )}
              {!config.logo && (
                <div className={clsx(inactiveBadges.length > 0 ? 'mt-2' : 'mt-5')}>
                  <LogoLayerRow
                            isActive={false}
                            selectedLogo={selectedLogo}
                            logoEnabled={config.logo}
                            onEnable={() => { updateConfig('logo', true); handleLogoSelection(false); setActiveTab('selection'); }}
                            onDisable={() => updateConfig('logo', false)}
                            onSelect={(multi) => handleLogoSelection(multi)}
                          />
                </div>
              )}
            </DragDropContext>
          </>
        </div>
      )}
    </SidebarLayout>
  );
};

export default LayerPanel;
