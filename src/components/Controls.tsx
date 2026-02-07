import React, { useState } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig } from '../types';
import { Layout, Palette, Image as ImageIcon, ScanLine } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

const Controls: React.FC<Props> = ({ config, onChange }) => {
  const [selectedBadge, setSelectedBadge] = useState<RatingType | 'global'>('global');

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

  const toggleRating = (r: RatingType) => {
    const current = new Set(config.ratings);
    if (current.has(r)) current.delete(r);
    else current.add(r);
    const order: RatingType[] = ['imdb', 'rt', 'meta', 'tmdb'];
    handleChange('ratings', order.filter(x => current.has(x)));
  };

  const presets: {id: PresetType, label: string}[] = [
    { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' },
    { id: 'lc', label: 'LC' }, { id: 'cc', label: 'CC' }, { id: 'rc', label: 'RC' },
    { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' },
  ];

  return (
    <div className="space-y-6 p-6 bg-zinc-900/50 backdrop-blur-md h-full overflow-y-auto border-r border-white/5 w-full">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Configuration
        </h2>
      </div>

      {/* Media */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold border-b border-white/5 pb-1">
            <ImageIcon size={16} /> <span className="text-sm">Source Media</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <input 
                type="text" 
                value={config.tmdbId}
                onChange={(e) => handleChange('tmdbId', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="TMDB ID"
            />
             <select 
                value={config.source} 
                onChange={(e) => handleChange('source', e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs outline-none"
             >
                 <option value="tmdb">TMDB</option>
                 <option value="fanart">Fanart.tv</option>
             </select>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-3">
         <div className="flex items-center gap-2 text-zinc-300 font-semibold border-b border-white/5 pb-1">
            <ScanLine size={16} /> <span className="text-sm">Active Badges</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['imdb', 'rt', 'meta', 'tmdb'].map((r) => (
            <button
              key={r}
              onClick={() => toggleRating(r as RatingType)}
              className={`flex-1 py-1.5 px-3 rounded border text-xs font-medium transition-all ${
                config.ratings.includes(r as RatingType)
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Styling Controls */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-zinc-300 font-semibold border-b border-white/5 pb-1">
            <div className="flex items-center gap-2">
                <Palette size={16} /> <span className="text-sm">Styling</span>
            </div>
            <select 
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value as any)}
                className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 outline-none"
            >
                <option value="global">Global Defaults</option>
                {config.ratings.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
        </div>

        {selectedBadge === 'global' ? (
            <div className="space-y-3 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Blur</label>
                        <input type="range" min="0" max="20" value={config.blur} onChange={(e) => handleChange('blur', parseInt(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Opacity</label>
                        <input type="range" min="0" max="1" step="0.1" value={config.alpha} onChange={(e) => handleChange('alpha', parseFloat(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Corner Radius</label>
                        <input type="number" value={config.radius} onChange={(e) => handleChange('radius', parseInt(e.target.value))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"/>
                    </div>
                     <div className="flex items-end">
                        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                            <input type="checkbox" checked={config.shadow} onChange={(e) => handleChange('shadow', e.target.checked)} className="rounded bg-zinc-700 border-zinc-600 text-blue-500"/>
                            Drop Shadow
                        </label>
                    </div>
                </div>
            </div>
        ) : (
             <div className="space-y-3 p-3 bg-zinc-800/50 rounded border border-white/5 animate-in fade-in duration-300">
                 <p className="text-xs text-blue-300 mb-2">Editing <strong>{selectedBadge.toUpperCase()}</strong> specific style</p>
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-[10px] text-zinc-500">Background</label>
                        <div className="flex gap-1">
                            <input type="color" 
                                value={config.items[selectedBadge]?.bg || '#000000'} 
                                onChange={(e) => updateBadgeConfig(selectedBadge, { bg: e.target.value })}
                                className="h-6 w-6 rounded bg-transparent cursor-pointer"
                            />
                            <button onClick={() => updateBadgeConfig(selectedBadge, { bg: undefined })} className="text-[10px] text-zinc-500 hover:text-white">Reset</button>
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] text-zinc-500">Text Color</label>
                        <div className="flex gap-1">
                            <input type="color" 
                                value={config.items[selectedBadge]?.txt || '#ffffff'} 
                                onChange={(e) => updateBadgeConfig(selectedBadge, { txt: e.target.value })}
                                className="h-6 w-6 rounded bg-transparent cursor-pointer"
                            />
                             <button onClick={() => updateBadgeConfig(selectedBadge, { txt: undefined })} className="text-[10px] text-zinc-500 hover:text-white">Reset</button>
                        </div>
                     </div>
                 </div>
             </div>
        )}
      </section>

      {/* Layout */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold border-b border-white/5 pb-1">
            <Layout size={16} /> <span className="text-sm">Layout</span>
        </div>
        
        <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded border border-zinc-700">
             {presets.map(p => (
                 <button
                    key={p.id}
                    onClick={() => {
                        // Clear manual positions when applying preset to snap back
                        handleChange('preset', p.id);
                        handleChange('items', {});
                    }}
                    className={`aspect-square text-[10px] font-bold rounded hover:bg-zinc-600 ${config.preset === p.id ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                 >
                     {p.label}
                 </button>
             ))}
        </div>
        
        <div className="flex gap-2 mt-2">
            <button 
                onClick={() => handleChange('layout', 'col')} 
                className={`flex-1 text-xs py-1 rounded border ${config.layout === 'col' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400'}`}
            >
                Column
            </button>
            <button 
                onClick={() => handleChange('layout', 'row')} 
                className={`flex-1 text-xs py-1 rounded border ${config.layout === 'row' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400'}`}
            >
                Row
            </button>
        </div>
      </section>
    </div>
  );
};

export default Controls;