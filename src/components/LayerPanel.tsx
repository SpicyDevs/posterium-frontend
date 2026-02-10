// src/components/LayerPanel.tsx

import React, { useState, useEffect } from 'react';
import { PosterConfig, RatingType, ALL_BADGES, MediaType } from '../types';
import { Eye, EyeOff, Search, Loader2, Film, Monitor, CheckSquare, Ghost } from 'lucide-react'; // Removed unused icons
import { BADGE_ICONS, TMDB_API_KEY } from '../constants';
import { DEFAULT_API_BASE } from '../utils';
import { useEditor } from '../context/EditorContext';

type BadgeIconKey = keyof typeof BADGE_ICONS;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  baseUrl: string;
  onReset: () => void;
}

interface SearchResult { 
    id: number | string; 
    title?: string; 
    name?: string; 
    poster_path: string; 
    release_date?: string; 
    first_air_date?: string; 
    media_type: 'movie' | 'tv' | 'anime'; 
}

const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect, baseUrl, onReset }) => {
  const { setBatchSelection, ratingsData, setRatingsData } = useEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState<'tmdb' | 'mal'>('tmdb');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setErrorMsg] = useState('');
  
  const apiKey = config.keys?.tmdb && config.keys.tmdb.length > 0 ? config.keys.tmdb : TMDB_API_KEY;

  // Search Logic
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) { setResults([]); return; }
      setIsSearching(true); setErrorMsg('');
      try {
          const res = await fetch(`${DEFAULT_API_BASE}/search?q=${encodeURIComponent(searchQuery)}&source=${searchSource}`);
          const data = await res.json();
          if (data.results) setResults(data.results.filter((i: SearchResult) => i.poster_path && ['movie', 'tv', 'anime'].includes(i.media_type)));
      } catch (e) { setErrorMsg("API Error"); } finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey, searchSource]);

  // Handle Media Selection
  const handleSelectMedia = async (item: SearchResult) => {
      setIsSearching(true);
      try {
          // Fetch Ratings first to get external IDs
          const res = await fetch(`${DEFAULT_API_BASE}/ratings/${item.media_type}/${item.id}`);
          if (res.ok) {
              const data = await res.json();
              
              // Resolve IMDb ID (prioritize this as it enables OMDB/MDBList ratings)
              const imdbId = data.ids?.imdb;
              
              // Default to 'poster' endpoint because we are using unique IDs (tt or MAL/TMDB specific)
              let newType: MediaType = 'poster';
              let newId = item.id.toString();
              let malId: string | undefined = undefined;

              if (imdbId) {
                  newId = imdbId; // Use IMDb ID (tt...)
              } else {
                  // Fallback for items without IMDb ID
                  if (item.media_type === 'anime') {
                      newType = 'anime'; // Keep anime type if no IMDb, so backend knows to use Jikan
                      malId = item.id.toString();
                  } else {
                      // Movie/TV without IMDb ID -> use TMDB ID
                      // newType is already 'poster' which works with TMDB IDs too if 'tt' is missing
                  }
              }

              // Store MAL ID for display if it's an anime
              if (item.media_type === 'anime') {
                  malId = item.id.toString();
              }

              setRatingsData({ 
                  ...data.ratings, 
                  externalIds: data.ids, 
                  title: data.meta?.title, 
                  year: data.meta?.year 
              });

              setConfig(prev => ({ 
                  ...prev, 
                  tmdbId: newId, 
                  mediaType: newType,
                  malId: malId 
              }));
          } else {
              // Fallback if ratings fetch fails
              setConfig(prev => ({ ...prev, tmdbId: item.id.toString(), mediaType: item.media_type }));
          }
      } catch (e) {
          console.error("Selection Error", e);
      } finally {
          setIsSearching(false);
          setSearchQuery(''); 
          setResults([]);
      }
  };

  const updateConfig = (key: keyof PosterConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  const toggleVisibility = (e: React.MouseEvent, id: RatingType) => {
    e.stopPropagation();
    const currentRatings = [...config.ratings];
    if (currentRatings.includes(id)) {
        setConfig({ ...config, ratings: currentRatings.filter(r => r !== id) });
    } else {
        setConfig({ ...config, ratings: [...currentRatings, id] });
    }
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          const allVisibleIds = ALL_BADGES.filter(b => config.ratings.includes(b.id)).map(b => b.id);
          setBatchSelection(allVisibleIds);
      } else {
          setBatchSelection([]);
      }
  };

  const allVisibleSelected = config.ratings.length > 0 && config.ratings.every(r => selectedIds.has(r));
  const getIconKey = (id: string): BadgeIconKey => {
      if (id === 'rt') return 'rt_fresh';
      if (id === 'rt_popcorn') return 'popcorn_fresh';
      if (id === 'meta') return 'meta'; 
      return id as BadgeIconKey;
  }

  // Determine Is Anime
  const isAnime = config.mediaType === 'anime' || !!config.malId || !!ratingsData.externalIds?.mal;

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-[#0f0f11]">
          
          {/* SEARCH BAR */}
          <div className="space-y-1">
              <div className="flex gap-1 mb-1">
                  <button onClick={() => setSearchSource('tmdb')} className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${searchSource === 'tmdb' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}>TMDB</button>
                  <button onClick={() => setSearchSource('mal')} className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${searchSource === 'mal' ? 'bg-pink-600 border-pink-500 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}>MAL (Anime)</button>
              </div>
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400" size={14} />
                  <input type="text" placeholder={`Search ${searchSource === 'mal' ? 'Anime' : 'Movie/TV'}...`} className="w-full bg-[#18181b] border border-white/10 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={12} />}
              </div>
          </div>

          {/* SEARCH RESULTS DROPDOWN */}
          {(results.length > 0) && (
              <div className="absolute left-3 right-3 top-[5rem] bg-[#18181b] border border-white/10 rounded-md shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {results.map(item => {
                      const title = item.title || item.name;
                      const date = item.release_date || item.first_air_date;
                      const year = date ? date.split('-')[0] : '';
                      return (
                        <button key={item.id} onClick={() => handleSelectMedia(item)} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                            <img src={item.poster_path} alt="" className="w-8 h-12 object-cover rounded bg-zinc-800" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-zinc-200 truncate">{title}</div>
                                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    {item.media_type === 'anime' ? <Ghost size={10}/> : item.media_type === 'movie' ? <Film size={10}/> : <Monitor size={10}/>}
                                    <span>{year}</span>
                                </div>
                            </div>
                        </button>
                      );
                  })}
              </div>
          )}

          {/* MEDIA ID / SOURCE INPUT */}
          <div className="space-y-2 pt-2">
             <div className="flex gap-2">
                 <div className="flex-1">
                     <div className="flex justify-between items-baseline mb-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Media ID / Source</label>
                        {/* TITLE DISPLAY */}
                        {ratingsData.title && (
                            <span className="text-[9px] font-bold text-indigo-300 truncate max-w-[150px]" title={ratingsData.title}>
                                {ratingsData.title} <span className="text-zinc-500 font-normal">({ratingsData.year})</span>
                            </span>
                        )}
                     </div>
                     <div className="flex bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                         <div className="flex-1 relative flex items-center">
                             <input type="text" value={config.tmdbId} onChange={(e) => updateConfig('tmdbId', e.target.value)} className="w-full bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none font-mono" placeholder="ID (e.g. tt...)" />
                             {config.malId && (
                                 <span className="absolute right-2 text-[9px] text-zinc-500 font-mono pointer-events-none bg-zinc-900/90 px-1">(MAL: {config.malId})</span>
                             )}
                         </div>
                         <div className="w-px bg-zinc-700"></div>
                         <select value={config.source} onChange={(e) => updateConfig('source', e.target.value)} className="w-24 bg-zinc-800 px-2 text-[10px] text-zinc-300 outline-none cursor-pointer hover:text-white transition-colors">
                             <option value="tmdb">TMDB</option>
                             <option value="fanart">Fanart</option>
                             <option value="metahub">Metahub</option>
                             {isAnime && <option value="mal">MyAnimeList</option>}
                         </select>
                     </div>
                 </div>
             </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#0c0c0e]">
        <div className="flex items-center justify-between px-2 mb-2 mt-1 pb-2 border-b border-white/5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layers</h3>
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">Select All</span>
                <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${allVisibleSelected ? 'bg-indigo-600 border-indigo-500' : 'border-zinc-600 bg-zinc-800'}`} onClick={(e) => { e.preventDefault(); handleSelectAll(!allVisibleSelected); }}>
                    {allVisibleSelected && <CheckSquare size={10} className="text-white" />}
                </div>
            </label>
        </div>
        
        {ALL_BADGES.map((badge) => {
          if (badge.id === 'mal' && !isAnime) return null;
          const isActive = config.ratings.includes(badge.id);
          const isSelected = selectedIds.has(badge.id);
          const ratingValue = ratingsData[badge.id as keyof typeof ratingsData];
          const iconKey = getIconKey(badge.id);
          const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id]; 

          return (
            <div key={badge.id} onClick={(e) => { if (!isActive) return; onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey); }} className={`group flex items-center gap-3 px-2 py-2 rounded-md transition-all border ${isSelected ? 'bg-indigo-900/20 border-indigo-500/30' : 'border-transparent hover:bg-white/5'} ${!isActive ? 'opacity-40 grayscale' : 'cursor-pointer'}`}>
              <div className="flex items-center justify-center p-1" onClick={(e) => { e.stopPropagation(); if(isActive) onSelect(badge.id, true); }}>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-500'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                  </div>
              </div>
              <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded shadow-sm border border-white/5">
                  {badge.id === 'age' ? <span className="text-[8px] font-bold border rounded px-0.5 border-zinc-500 text-zinc-400">PG</span> : (iconData ? <svg viewBox={iconData?.vb} className="w-4 h-4" style={{ color: isActive ? iconData?.color : '#71717a' }} dangerouslySetInnerHTML={{ __html: iconData?.body }} /> : <span className="text-[8px] font-bold text-zinc-500">{badge.label.substring(0, 2)}</span>)}
              </div>
              <div className="flex-1 min-w-0 flex justify-between items-center pr-1">
                  <div className="flex flex-col">
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{badge.label}</span>
                      {isActive && ratingValue && <span className="text-[9px] text-zinc-500 font-mono">{ratingValue as string}</span>}
                  </div>
                  <button onClick={(e) => toggleVisibility(e, badge.id)} className={`p-1.5 rounded hover:bg-white/10 transition-all active:scale-90 ${isActive ? 'text-zinc-400 hover:text-white' : 'text-zinc-600'}`} aria-label={isActive ? "Hide Layer" : "Show Layer"}>{isActive ? <Eye size={13} /> : <EyeOff size={13} />}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;