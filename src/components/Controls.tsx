import React, { useState } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
import { Layout, Palette, Image as ImageIcon, ScanLine, ChevronDown, ChevronRight, Tv, Film, Settings } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

const Section: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultOpen?: boolean 
}> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">
          {icon} <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

const Controls: React.FC<Props> = ({ config, onChange }) => {
  const [selectedBadge, setSelectedBadge] = useState<RatingType | 'global'>('global');

  // New Default IDs based on your request
  const MOVIE_DEFAULT_ID = "453395";
  const TV_DEFAULT_ID = "93405";

  const handleChange = (key: keyof PosterConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updateBadgeConfig = (id: RatingType, updates: Partial<BadgeConfig>) => {
      onChange({
          ...config,
          items: {
              ...config.items,
              [id]: { ...config.items[id], ...updates }
          }
      });
  };

  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    onChange({
        ...config,
        keys: {
            ...config.keys,
            [key]: value
        }
    });
  };

  const toggleRating = (r: RatingType) => {
    const current = new Set(config.ratings);
    if (current.has(r)) current.delete(r);
    else current.add(r);
    const order: RatingType[] = ['imdb', 'rt', 'meta', 'tmdb', 'age', 'runtime'];
    handleChange('ratings', order.filter(x => current.has(x)));
  };

  const presets: {id: PresetType, label: string}[] = [
    { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' },
    { id: 'lc', label: 'LC' }, { id: 'cc', label: 'CC' }, { id: 'rc', label: 'RC' },
    { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' },
  ];

  const handleLayoutChange = (layout: 'row' | 'col') => {
      onChange({ 
          ...config, 
          layout,
          items: {}
      });
  };

  const handlePresetChange = (preset: PresetType) => {
      onChange({ 
          ...config, 
          preset,
          items: {} 
      });
  };

  // Improved Select Styling
  const selectClass = "w-full appearance-none bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat pr-8";

  // Handle Media Type Switch with ID update
  const handleMediaTypeSwitch = (type: 'movie' | 'tv') => {
      if (config.mediaType === type) return;
      onChange({ 
          ...config, 
          mediaType: type,
          tmdbId: type === 'movie' ? MOVIE_DEFAULT_ID : TV_DEFAULT_ID
      });
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md h-full w-full flex flex-col">
      <div className="p-4 border-b border-white/5 bg-[#0f0f11] sticky top-0 z-10">
        <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-wider">
          Configuration
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Media */}
        <Section title="Source Media" icon={<ImageIcon size={16} />}>
            <div className="flex gap-2 mb-2">
                 <button 
                    onClick={() => handleMediaTypeSwitch('movie')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'movie' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                 >
                     <Film size={14}/> Movie
                 </button>
                 <button 
                    onClick={() => handleMediaTypeSwitch('tv')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'tv' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                 >
                     <Tv size={14}/> TV Show
                 </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="col-span-2">
                    <input 
                        type="text" 
                        value={config.tmdbId}
                        onChange={(e) => handleChange('tmdbId', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-200 placeholder-zinc-600"
                        placeholder="TMDB / IMDb ID"
                    />
                </div>
                <div className="col-span-1 relative">
                    <select 
                        value={config.source} 
                        onChange={(e) => handleChange('source', e.target.value)}
                        className={selectClass}
                    >
                        <option value="tmdb">TMDB</option>
                        <option value="fanart">Fanart</option>
                    </select>
                </div>
            </div>
            
            {/* Format Selector */}
            <div className="flex bg-zinc-800 rounded border border-zinc-700 p-1">
                {(['svg', 'jpg', 'webp', 'png'] as const).map((ext) => (
                    <button
                        key={ext}
                        onClick={() => handleChange('extension', ext)}
                        className={`flex-1 text-[10px] font-medium uppercase py-1.5 rounded transition-all ${
                            config.extension === ext 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                        }`}
                    >
                        {ext}
                    </button>
                ))}
            </div>
        </Section>

        {/* Badges */}
        <Section title="Active Badges" icon={<ScanLine size={16} />}>
            <div className="grid grid-cols-2 gap-2">
            {['imdb', 'rt', 'meta', 'tmdb'].map((r) => (
                <button
                key={r}
                onClick={() => toggleRating(r as RatingType)}
                className={`py-2 px-3 rounded border text-xs font-medium transition-all ${
                    config.ratings.includes(r as RatingType)
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
                >
                {r.toUpperCase()}
                </button>
            ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                 <button
                    onClick={() => toggleRating('age')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-all ${
                        config.ratings.includes('age')
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                    }`}
                >
                    Age Rating
                </button>
                <button
                    onClick={() => toggleRating('runtime')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-all ${
                        config.ratings.includes('runtime')
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                    }`}
                >
                    Runtime
                </button>
            </div>
        </Section>

        {/* Styling */}
        <Section title="Styling" icon={<Palette size={16} />}>
            <div className="mb-3 relative">
                <select 
                    value={selectedBadge}
                    onChange={(e) => setSelectedBadge(e.target.value as any)}
                    className={selectClass}
                >
                    <option value="global">Global Defaults</option>
                    {config.ratings.map(r => <option key={r} value={r}>{r.toUpperCase()} Override</option>)}
                </select>
            </div>

            {selectedBadge === 'global' ? (
                <div className="space-y-4">
                    {/* Global Sliders */}
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Blur</span><span>{config.blur}px</span>
                        </div>
                        <input type="range" min="0" max="20" value={config.blur} onChange={(e) => handleChange('blur', parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Opacity</span><span>{Math.round(config.alpha * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={config.alpha} onChange={(e) => handleChange('alpha', parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Corner Radius</span><span>{config.radius}px</span>
                        </div>
                        <input type="range" min="0" max="30" value={config.radius} onChange={(e) => handleChange('radius', parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer pt-1">
                            <input type="checkbox" checked={config.shadow} onChange={(e) => handleChange('shadow', e.target.checked)} className="rounded bg-zinc-700 border-zinc-600 text-blue-500 w-4 h-4"/>
                            Drop Shadow
                        </label>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 p-3 bg-zinc-800/50 rounded border border-blue-500/20">
                    <p className="text-xs text-blue-300 mb-2">Editing <strong>{selectedBadge.toUpperCase()}</strong> only</p>
                    
                    {/* Icon Visibility Toggle */}
                    {selectedBadge !== 'age' && (
                        <div className="mb-3 border-b border-zinc-700/50 pb-3">
                            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                <input type="checkbox" 
                                    checked={config.items[selectedBadge]?.icon ?? true} 
                                    onChange={(e) => updateBadgeConfig(selectedBadge, { icon: e.target.checked })} 
                                    className="rounded bg-zinc-700 border-zinc-600 text-blue-500 w-4 h-4"
                                />
                                Show Icon
                            </label>
                        </div>
                    )}

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 mb-1 block">Background</label>
                            <input type="color" value={config.items[selectedBadge]?.bg || '#000000'} onChange={(e) => updateBadgeConfig(selectedBadge, { bg: e.target.value })} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 mb-1 block">Text Color</label>
                            <input type="color" value={config.items[selectedBadge]?.txt || '#ffffff'} onChange={(e) => updateBadgeConfig(selectedBadge, { txt: e.target.value })} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                        </div>
                    </div>

                    {/* Per-Item Sliders */}
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Blur</span><span>{config.items[selectedBadge]?.blur ?? config.blur}px</span>
                            </div>
                            <input type="range" min="0" max="20" value={config.items[selectedBadge]?.blur ?? config.blur} onChange={(e) => updateBadgeConfig(selectedBadge, { blur: parseInt(e.target.value) })} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Opacity</span><span>{Math.round((config.items[selectedBadge]?.alpha ?? config.alpha) * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.1" value={config.items[selectedBadge]?.alpha ?? config.alpha} onChange={(e) => updateBadgeConfig(selectedBadge, { alpha: parseFloat(e.target.value) })} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Radius</span><span>{config.items[selectedBadge]?.radius ?? config.radius}px</span>
                            </div>
                            <input type="range" min="0" max="30" value={config.items[selectedBadge]?.radius ?? config.radius} onChange={(e) => updateBadgeConfig(selectedBadge, { radius: parseInt(e.target.value) })} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                        </div>
                    </div>

                    <button onClick={() => updateBadgeConfig(selectedBadge, { bg: undefined, txt: undefined, blur: undefined, alpha: undefined, radius: undefined, shadow: undefined, icon: undefined })} className="w-full mt-2 text-xs py-1.5 text-zinc-500 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">
                        Reset Overrides
                    </button>
                </div>
            )}
        </Section>

        {/* Layout */}
        <Section title="Layout & Presets" icon={<Layout size={16} />}>
            <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded border border-zinc-700 mb-3">
                {presets.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handlePresetChange(p.id)}
                        className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded hover:bg-zinc-600 transition-colors ${config.preset === p.id ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 bg-zinc-900/50'}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => handleLayoutChange('col')} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'col' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Column</button>
                <button onClick={() => handleLayoutChange('row')} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'row' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Row</button>
            </div>
        </Section>
        
        {/* Advanced Settings */}
        <Section title="Advanced Settings" icon={<Settings size={16} />} defaultOpen={false}>
            <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 leading-tight">Enter your own API keys to bypass rate limits.</p>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">TMDB API Key</label><input type="password" value={config.keys?.tmdb || ''} onChange={(e) => updateApiKey('tmdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Fanart.tv API Key</label><input type="password" value={config.keys?.fanart || ''} onChange={(e) => updateApiKey('fanart', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">OMDB API Key</label><input type="password" value={config.keys?.omdb || ''} onChange={(e) => updateApiKey('omdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default Controls;