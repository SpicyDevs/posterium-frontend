import React, { useState, useEffect } from 'react';
import { PosterConfig, RatingType, ALL_BADGES } from '../types';
import { Eye, EyeOff, Search, Loader2, Film, Monitor, CheckSquare } from 'lucide-react';
import { BADGE_ICONS, TMDB_API_KEY } from '../constants';
import { DEFAULT_API_BASE } from '../utils';

type BadgeIconKey = keyof typeof BADGE_ICONS;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

// ... Interfaces (SearchResult, RatingsData) unchanged ...
interface SearchResult { id: number; title: string; poster_path: string; release_date: string; media_type: 'movie' | 'tv'; }
interface RatingsData { title?: string; imdb?: string; rt?: string; rt_popcorn?: string; letterboxd?: string; meta?: string; tmdb?: string; age?: string; runtime?: string; }

const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchedData, setFetchedData] = useState<RatingsData>({});

  // Use Hardcoded Key if user hasn't provided one
  const apiKey = config.keys?.tmdb || TMDB_API_KEY;

  // 1. Search Logic
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) { setResults([]); return; }
      setIsSearching(true); setErrorMsg('');
      try {
          const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          if (data.results) setResults(data.results.filter((i: any) => i.poster_path && ['movie', 'tv'].includes(i.media_type)));
      } catch (e) { setErrorMsg("API Error"); } finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, apiKey]);

  // 2. Metadata Logic
  useEffect(() => {
      const fetchMeta = async () => {
          if (!config.tmdbId) return;
          try {
              const res = await fetch(`${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.json`);
              if (res.ok) {
                  const data = await res.json();
                  if (data) setFetchedData({ ...data.ratings, title: data.raw?.tmdb?.title || data.raw?.tmdb?.name || data.raw?.tmdb?.original_title });
              }
          } catch(e) { /* ignore */ }
      };
      fetchMeta();
  }, [config.tmdbId, config.mediaType]);

  const handleSelectMedia = (item: SearchResult) => {
      setConfig(prev => ({ ...prev, tmdbId: item.id.toString(), mediaType: item.media_type }));
      setSearchQuery(''); setResults([]);
  };

  const updateConfig = (key: keyof PosterConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  const toggleVisibility = (e: React.MouseEvent, id: RatingType) => {
    e.stopPropagation();
    const current = new Set(config.ratings);
    if (current.has(id)) current.delete(id); else current.add(id);
    const sorted = ALL_BADGES.map(b => b.id).filter(id => current.has(id));
    setConfig({ ...config, ratings: sorted });
  };

  const handleSelectAll = (checked: boolean) => {
      if (checked) {
          ALL_BADGES.filter(b => config.ratings.includes(b.id)).forEach(b => onSelect(b.id, true));
      } else {
          selectedIds.forEach(id => onSelect(id, true)); // Toggle off logic relies on parent toggling if present
      }
  };

  const allVisibleSelected = config.ratings.length > 0 && config.ratings.every(r => selectedIds.has(r));

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      
      {/* --- HEADER SECTION --- */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-[#0f0f11]">
          {/* Search Bar */}
          <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400" size={14} />
              <input 
                  type="text" 
                  placeholder="Search Movie/TV..." 
                  className="w-full bg-[#18181b] border border-white/10 rounded-md py-2 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" size={12} />}
          </div>

          {/* Results Dropdown */}
          {(results.length > 0) && (
              <div className="absolute left-3 right-3 top-12 bg-[#18181b] border border-white/10 rounded-md shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                  {results.map(item => (
                      <button key={item.id} onClick={() => handleSelectMedia(item)} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 text-left border-b border-white/5 last:border-0">
                          <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className="w-8 h-12 object-cover rounded bg-zinc-800" />
                          <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-zinc-200 truncate">{item.title || (item as any).name}</div>
                              <div className="text-[10px] text-zinc-500 flex items-center gap-1">{item.media_type === 'movie' ? <Film size={10}/> : <Monitor size={10}/>}<span>{item.release_date?.split('-')[0]}</span></div>
                          </div>
                      </button>
                  ))}
              </div>
          )}

          {/* Media Info (Moved Here) */}
          <div className="space-y-2">
             {/* 1. Disabled Title Input */}
             <div>
                 <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">Active Media Title</label>
                 <input 
                    type="text" 
                    disabled 
                    value={fetchedData.title || "Loading..."} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-400 cursor-not-allowed italic"
                 />
             </div>

             {/* 2. TMDB ID + Type Toggle */}
             <div className="flex gap-2">
                 <div className="flex-1">
                     <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">TMDB ID</label>
                     <div className="flex bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
                         <input 
                            type="text" 
                            value={config.tmdbId} 
                            onChange={(e) => updateConfig('tmdbId', e.target.value)}
                            className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none"
                         />
                         <select value={config.source} onChange={(e) => updateConfig('source', e.target.value)} className="bg-zinc-800 border-l border-zinc-700 px-2 text-[10px] text-zinc-300 outline-none cursor-pointer">
                             <option value="tmdb">TMDB</option>
                             <option value="fanart">Fanart</option>
                         </select>
                     </div>
                 </div>
             </div>
          </div>
      </div>

      {/* --- LAYER LIST --- */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#0c0c0e]">
        
        <div className="flex items-center justify-between px-2 mb-2 mt-1 pb-2 border-b border-white/5">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layers</h3>
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group">
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300">Select All</span>
                <div 
                    className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${allVisibleSelected ? 'bg-indigo-600 border-indigo-500' : 'border-zinc-600 bg-zinc-800'}`}
                    onClick={(e) => { e.preventDefault(); handleSelectAll(!allVisibleSelected); }}
                >
                    {allVisibleSelected && <CheckSquare size={10} className="text-white" />}
                </div>
            </label>
        </div>
        
        {ALL_BADGES.map((badge) => {
          const isActive = config.ratings.includes(badge.id);
          const isSelected = selectedIds.has(badge.id);
          const ratingValue = fetchedData[badge.id as keyof RatingsData];
          
          const iconKey = (badge.id === 'rt' ? 'rt_fresh' : badge.id === 'rt_popcorn' ? 'popcorn_fresh' : badge.id) as BadgeIconKey;
          const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS.imdb;

          return (
            <div 
              key={badge.id}
              onClick={(e) => {
                  if (!isActive) return;
                  onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey);
              }}
              className={`
                group flex items-center gap-3 px-2 py-2 rounded-md transition-all border
                ${isSelected ? 'bg-indigo-900/20 border-indigo-500/30' : 'border-transparent hover:bg-white/5'}
                ${!isActive ? 'opacity-40 grayscale' : 'cursor-pointer'}
              `}
            >
              {/* Left Aligned Checkbox */}
              <div 
                className="flex items-center justify-center p-1"
                onClick={(e) => { e.stopPropagation(); if(isActive) onSelect(badge.id, true); }}
              >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-400' : 'bg-zinc-800 border-zinc-600 group-hover:border-zinc-500'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                  </div>
              </div>

              {/* Thumbnail */}
              <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded shadow-sm border border-white/5">
                  {badge.id === 'age' ? (
                      <span className="text-[8px] font-bold border rounded px-0.5 border-zinc-500 text-zinc-400">PG</span>
                  ) : (
                      <svg viewBox={iconData?.vb} className="w-4 h-4" style={{ color: isActive ? iconData?.color : '#71717a' }} dangerouslySetInnerHTML={{ __html: iconData?.body }} />
                  )}
              </div>

              {/* Label & Visibility */}
              <div className="flex-1 min-w-0 flex justify-between items-center pr-1">
                  <div className="flex flex-col">
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{badge.label}</span>
                      {isActive && ratingValue && <span className="text-[9px] text-zinc-500 font-mono">{ratingValue}</span>}
                  </div>
                  
                  <button 
                    onClick={(e) => toggleVisibility(e, badge.id)}
                    className={`p-1.5 rounded hover:bg-white/10 transition-all active:scale-90 ${isActive ? 'text-zinc-400 hover:text-white' : 'text-zinc-600'}`}
                  >
                    {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel;