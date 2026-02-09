import React, { useState, useEffect } from 'react';
import { PosterConfig, RatingType, ALL_BADGES } from '../types';
import { Eye, EyeOff, Search, Loader2, Film, Monitor } from 'lucide-react';
import { BADGE_ICONS, TMDB_API_KEY } from '../constants';
import { DEFAULT_API_BASE } from '../utils';

// Helper Type for badge keys
type BadgeIconKey = keyof typeof BADGE_ICONS;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

interface SearchResult {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  media_type: 'movie' | 'tv';
}

interface RatingsData {
  title?: string; // Fetched Title
  imdb?: string;
  rt?: string;
  rt_popcorn?: string;
  letterboxd?: string;
  meta?: string;
  tmdb?: string;
  age?: string;
  runtime?: string;
}

const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchedData, setFetchedData] = useState<RatingsData>({});

  const apiKey = config.keys?.tmdb || TMDB_API_KEY; // Use provided key or hardcoded fallback

  // 1. Debounced Search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
          setResults([]);
          return;
      }
      
      setIsSearching(true);
      setErrorMsg('');
      try {
          const response = await fetch(
              `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`
          );
          const data = await response.json();
          if (data.results) {
              setResults(data.results.filter((i: any) => i.poster_path && (i.media_type === 'movie' || i.media_type === 'tv')));
          }
      } catch (e) {
          setErrorMsg("Failed to fetch results. Check network or API Key.");
      } finally {
          setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey]);

  // 2. Metadata Fetching (Live Data)
  useEffect(() => {
      const fetchMetadata = async () => {
          if (!config.tmdbId) return;
          try {
              // Fetch using the Worker API format
              const res = await fetch(`${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.json`);
              if (res.ok) {
                  const data = await res.json();
                  if (data) {
                      setFetchedData({ ...data.ratings, title: data.raw?.tmdb?.title || data.raw?.tmdb?.name });
                  }
              }
          } catch (e) {
              console.error("Metadata fetch failed", e);
          }
      };
      fetchMetadata();
  }, [config.tmdbId, config.mediaType]);

  const handleSelectMedia = (item: SearchResult) => {
      setConfig(prev => ({
          ...prev,
          tmdbId: item.id.toString(),
          mediaType: item.media_type
      }));
      setSearchQuery('');
      setResults([]);
  };

  const updateConfig = (key: keyof PosterConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  const toggleVisibility = (e: React.MouseEvent, id: RatingType) => {
    e.stopPropagation();
    const current = new Set(config.ratings);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    
    // Maintain standard sort order
    const sorted = ALL_BADGES.map(b => b.id).filter(id => current.has(id));
    setConfig({ ...config, ratings: sorted });
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          const visible = ALL_BADGES.map(b => b.id).filter(id => config.ratings.includes(id));
          visible.forEach(id => onSelect(id, true));
      } else {
          onSelect('imdb', false); // Hack to clear, essentially calling with a single (irrelevant) ID without multi
          // Actually onSelect logic clears if multi=false. We need a proper clear.
          // Since onSelect handles toggling, we should probably iterate or check logic.
          // A simpler way given Props:
          // The parent should probably expose a bulk select, but based on props:
          // We can't clear all easily without iterating.
          // Let's assume the user wants to select all visible.
          // To clear, we can try passing an ID that isn't selected with multi=false?
          // No, let's just loop visible and if selected, deselect.
          const currentSelected = new Set(selectedIds);
          currentSelected.forEach(id => onSelect(id, true)); // Toggle them off
      }
  };

  const allVisibleSelected = config.ratings.length > 0 && config.ratings.every(r => selectedIds.has(r));

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Search Header */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20">
          <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
              <input 
                  type="text" 
                  placeholder="Search Movie/TV..." 
                  className="w-full bg-[#18181b] border border-white/5 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={12} />}
          </div>
          
          {/* Results Dropdown */}
          {(results.length > 0 || errorMsg) && (
              <div className="absolute left-3 right-3 top-12 bg-[#18181b] border border-white/10 rounded-md shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {errorMsg && <div className="p-3 text-[10px] text-red-400">{errorMsg}</div>}
                  {results.map(item => (
                      <button 
                          key={item.id}
                          onClick={() => handleSelectMedia(item)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-white/5 text-left border-b border-white/5 last:border-0 transition-all active:bg-white/10"
                      >
                          <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-8 h-12 object-cover rounded bg-zinc-800" />
                          <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-zinc-200 truncate">{item.title || (item as any).name}</div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                  {item.media_type === 'movie' ? <Film size={10}/> : <Monitor size={10}/>}
                                  <span>{item.release_date?.split('-')[0] || (item as any).first_air_date?.split('-')[0]}</span>
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
          )}

          {/* Media Source Controls (Moved from PropertyPanel) */}
          <div className="space-y-2 pt-1">
             <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/5">
                 <button onClick={() => updateConfig('mediaType', 'movie')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95 ${config.mediaType === 'movie' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Film size={12}/> Movie</button>
                 <button onClick={() => updateConfig('mediaType', 'tv')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all active:scale-95 ${config.mediaType === 'tv' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Monitor size={12}/> TV Show</button>
             </div>
             
             {/* Title Display & Source Select */}
             <div className="flex gap-2">
                 <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 flex flex-col justify-center">
                     <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Active Media</span>
                     <div className="text-xs text-white font-medium truncate" title={fetchedData.title || config.tmdbId}>
                         {fetchedData.title || `ID: ${config.tmdbId}`}
                     </div>
                 </div>
                 <div className="w-24">
                     <select value={config.source} onChange={(e) => updateConfig('source', e.target.value)} className="w-full h-full bg-zinc-900 border border-zinc-700 rounded px-2 text-[10px] text-zinc-300 outline-none cursor-pointer">
                         <option value="tmdb">TMDB</option>
                         <option value="fanart">Fanart</option>
                     </select>
                 </div>
             </div>
          </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        
        <div className="flex items-center justify-between px-2 mb-2 mt-1">
            <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Active Layers</h3>
            <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] text-zinc-500">Select All</span>
                <input 
                    type="checkbox" 
                    checked={allVisibleSelected} 
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 w-3 h-3 focus:ring-0 cursor-pointer"
                />
            </label>
        </div>
        
        {ALL_BADGES.map((badge) => {
          const isActive = config.ratings.includes(badge.id);
          const isSelected = selectedIds.has(badge.id);
          const ratingValue = fetchedData[badge.id as keyof RatingsData];
          
          // Icon Mapping
          const iconKeyMap: Record<string, BadgeIconKey> = {
            imdb: "imdb",
            rt: "rt_fresh",
            rt_popcorn: "popcorn_fresh",
            meta: "meta",
            tmdb: "tmdb",
            letterboxd: "letterboxd",
            runtime: "runtime",
            age: "imdb" // fallback visual
          };
          const iconKey = iconKeyMap[badge.id] ?? "imdb";
          const iconData = BADGE_ICONS[iconKey];

          return (
            <div 
              key={badge.id}
              onClick={(e) => {
                  if (!isActive) return; // Prevent selection if hidden
                  onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey);
              }}
              className={`
                group flex items-center gap-3 px-2 py-2 rounded-md transition-all border border-transparent select-none
                ${isSelected ? 'bg-indigo-500/10 border-indigo-500/20' : isActive ? 'hover:bg-white/5 hover:border-white/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              `}
            >
              {/* Checkbox for Selection (Mobile/Desktop) */}
              <div 
                className="flex items-center justify-center p-1"
                onClick={(e) => e.stopPropagation()} // Stop row click
              >
                  <input 
                    type="checkbox" 
                    disabled={!isActive}
                    checked={isSelected}
                    onChange={() => onSelect(badge.id, true)} // Always additive
                    className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 w-3.5 h-3.5 focus:ring-0 cursor-pointer disabled:opacity-50"
                  />
              </div>

              {/* Visibility Toggle */}
              <button 
                onClick={(e) => toggleVisibility(e, badge.id)}
                className={`p-1 rounded hover:bg-white/10 transition-all active:scale-90 ${isActive ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600'}`}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              {/* Thumbnail */}
              <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded shadow-sm border border-white/5">
                  {badge.id === 'age' ? (
                      <span className="text-[8px] font-bold border rounded px-0.5 border-zinc-500 text-zinc-400">PG</span>
                  ) : (
                      <svg viewBox={iconData?.vb} className="w-4 h-4" style={{ color: isActive ? iconData?.color : '#71717a' }} dangerouslySetInnerHTML={{ __html: iconData?.body }} />
                  )}
              </div>

              {/* Label & Value */}
              <div className="flex-1 min-w-0 flex justify-between items-center pr-2">
                  <div className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{badge.label}</div>
                  {isActive && ratingValue && <div className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 rounded">{ratingValue}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;