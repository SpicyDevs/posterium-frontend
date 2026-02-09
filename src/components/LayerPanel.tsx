import React, { useState, useEffect } from 'react';
import { PosterConfig, RatingType, ALL_BADGES } from '../types';
import { Eye, EyeOff, Search, Loader2, Film, Monitor } from 'lucide-react';
import { BADGE_ICONS } from '../constants';
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
  const [fetchedRatings, setFetchedRatings] = useState<RatingsData>({});

  // 1. Debounced Search
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!searchQuery || searchQuery.length < 2) {
          setResults([]);
          return;
      }
      if (!config.keys?.tmdb) {
          setErrorMsg("TMDB API Key required in settings");
          return;
      }

      setIsSearching(true);
      setErrorMsg('');
      try {
          const response = await fetch(
              `https://api.themoviedb.org/3/search/multi?api_key=${config.keys.tmdb}&query=${encodeURIComponent(searchQuery)}`
          );
          const data = await response.json();
          if (data.results) {
              setResults(data.results.filter((i: any) => i.poster_path && (i.media_type === 'movie' || i.media_type === 'tv')));
          }
      } catch (e) {
          setErrorMsg("Failed to fetch results");
      } finally {
          setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, config.keys?.tmdb]);

  // 2. Metadata Fetching (Live Data)
  useEffect(() => {
      const fetchMetadata = async () => {
          if (!config.tmdbId) return;
          try {
              // Fetch using the Worker API format
              const res = await fetch(`${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.json`);
              if (res.ok) {
                  const data = await res.json();
                  if (data && data.ratings) {
                      setFetchedRatings(data.ratings);
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

  const toggleVisibility = (e: React.MouseEvent, id: RatingType) => {
    e.stopPropagation();
    const current = new Set(config.ratings);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    
    // Maintain standard sort order
    const sorted = ALL_BADGES.map(b => b.id).filter(id => current.has(id));
    setConfig({ ...config, ratings: sorted });
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Search Header */}
      <div className="p-3 border-b border-white/5 space-y-2 relative z-20">
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
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 mb-2 mt-2">Active Layers</h3>
        
        {ALL_BADGES.map((badge) => {
          const isActive = config.ratings.includes(badge.id);
          const isSelected = selectedIds.has(badge.id);
          const ratingValue = fetchedRatings[badge.id as keyof RatingsData];
          
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
              onClick={(e) => onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey)}
              className={`
                group flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-all border border-transparent
                ${isSelected ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 hover:border-white/5'}
                ${!isActive && !isSelected ? 'opacity-40 grayscale' : ''}
              `}
            >
              <button 
                onClick={(e) => toggleVisibility(e, badge.id)}
                className={`p-1.5 rounded hover:bg-white/10 transition-all active:scale-90 ${isActive ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600'}`}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <div className="w-6 h-6 flex items-center justify-center bg-zinc-800 rounded shadow-sm border border-white/5">
                  {badge.id === 'age' ? (
                      <span className="text-[8px] font-bold border rounded px-0.5 border-zinc-500 text-zinc-400">PG</span>
                  ) : (
                      <svg viewBox={iconData?.vb} className="w-4 h-4" style={{ color: isActive ? iconData?.color : '#71717a' }} dangerouslySetInnerHTML={{ __html: iconData?.body }} />
                  )}
              </div>

              <div className="flex-1 min-w-0 flex justify-between items-center pr-2">
                  <div className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-300'}`}>{badge.label}</div>
                  {isActive && ratingValue && <div className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 rounded">{ratingValue}</div>}
              </div>
              
              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />}
            </div>
          );
        })}
      </div>
      
      {!config.keys?.tmdb && (
          <div className="p-3 border-t border-white/5 bg-[#0f0f11]">
              <p className="text-[10px] text-orange-400/80 text-center">Add TMDB Key in settings to enable search.</p>
          </div>
      )}
    </div>
  );
};

export default LayerPanel;