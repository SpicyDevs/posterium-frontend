import React from 'react';
import { PosterConfig, RatingType, PresetType } from '../types';
import { Layout, Palette, Image as ImageIcon, BoxSelect, ScanLine, MousePointer2 } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

const Controls: React.FC<Props> = ({ config, onChange }) => {
  
  const handleChange = (key: keyof PosterConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const toggleRating = (r: RatingType) => {
    const current = new Set(config.ratings);
    if (current.has(r)) current.delete(r);
    else current.add(r);
    
    // Sort to maintain order preference if needed, or just convert to array
    const order: RatingType[] = ['imdb', 'rt', 'meta'];
    const newRatings = order.filter(x => current.has(x));
    handleChange('ratings', newRatings);
  };

  // 3x3 Grid Layout for presets
  const presets: {id: PresetType, label: string}[] = [
    { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' },
    { id: 'lc', label: 'LC' }, { id: 'cc', label: 'CC' }, { id: 'rc', label: 'RC' },
    { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' },
  ];

  return (
    <div className="space-y-8 p-6 bg-zinc-900/50 backdrop-blur-md h-full overflow-y-auto border-r border-white/5 w-full">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Configuration
        </h2>
        <p className="text-sm text-zinc-400">Customize your poster overlay.</p>
      </div>

      {/* Basic Settings */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-2">
            <ImageIcon size={18} /> <span>Media</span>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">TMDB ID</label>
          <input 
            type="text" 
            value={config.tmdbId}
            onChange={(e) => handleChange('tmdbId', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g. 157336"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Source</label>
          <div className="flex bg-zinc-800 rounded p-1 border border-zinc-700">
            {['tmdb', 'fanart'].map((s) => (
              <button
                key={s}
                onClick={() => handleChange('source', s)}
                className={`flex-1 text-xs py-1.5 rounded capitalize transition-colors ${config.source === s ? 'bg-zinc-600 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Ratings Selection */}
      <section className="space-y-3">
         <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-2">
            <ScanLine size={18} /> <span>Badges</span>
        </div>
        <div className="flex gap-2">
          {['imdb', 'rt', 'meta'].map((r) => (
            <button
              key={r}
              onClick={() => toggleRating(r as RatingType)}
              className={`flex-1 py-2 px-3 rounded border text-sm transition-all duration-200 ${
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

      {/* Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-2">
            <Palette size={18} /> <span>Appearance</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                 <label className="block text-xs font-medium text-zinc-500 mb-1">Theme</label>
                 <select 
                    value={config.theme} 
                    onChange={(e) => handleChange('theme', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-sm outline-none"
                 >
                     <option value="glass">Glass</option>
                     <option value="solid">Solid</option>
                 </select>
            </div>
            <div>
                 <label className="block text-xs font-medium text-zinc-500 mb-1">Size</label>
                 <select 
                    value={config.size} 
                    onChange={(e) => handleChange('size', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-sm outline-none"
                 >
                     <option value="sm">Small</option>
                     <option value="md">Medium</option>
                     <option value="lg">Large</option>
                 </select>
            </div>
        </div>

        <div className="flex items-center justify-between bg-zinc-800 p-2 rounded border border-zinc-700">
             <span className="text-sm text-zinc-400 ml-1">Drop Shadow</span>
             <button 
                onClick={() => handleChange('shadow', !config.shadow)}
                className={`w-10 h-5 rounded-full relative transition-colors ${config.shadow ? 'bg-blue-500' : 'bg-zinc-600'}`}
             >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.shadow ? 'left-6' : 'left-1'}`} />
             </button>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Custom Bg</label>
                <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded border border-zinc-700">
                    <input 
                        type="color" 
                        value={config.customBg || '#000000'}
                        onChange={(e) => handleChange('customBg', e.target.value)}
                        className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0"
                    />
                    <input 
                        type="text"
                        value={config.customBg}
                        onChange={(e) => handleChange('customBg', e.target.value)}
                        placeholder="None"
                        className="w-full bg-transparent text-xs outline-none text-zinc-300"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Custom Text</label>
                <div className="flex items-center gap-2 bg-zinc-800 p-1 rounded border border-zinc-700">
                    <input 
                        type="color" 
                        value={config.customTxt || '#ffffff'}
                        onChange={(e) => handleChange('customTxt', e.target.value)}
                        className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0"
                    />
                     <input 
                        type="text"
                        value={config.customTxt}
                        onChange={(e) => handleChange('customTxt', e.target.value)}
                        placeholder="None"
                        className="w-full bg-transparent text-xs outline-none text-zinc-300"
                    />
                </div>
            </div>
        </div>
      </section>

      {/* Layout & Presets */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-2">
            <Layout size={18} /> <span>Layout & Position</span>
        </div>

        <div>
             <label className="block text-xs font-medium text-zinc-500 mb-2">Preset Alignment</label>
             <div className="grid grid-cols-3 gap-2 bg-zinc-800 p-2 rounded border border-zinc-700">
                 {presets.map(p => (
                     <button
                        key={p.id}
                        onClick={() => {
                            // Reset manual coords when picking a preset for cleaner UX
                            handleChange('preset', p.id);
                            onChange({...config, preset: p.id, pos: {}});
                        }}
                        className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded transition-all ${
                            config.preset === p.id 
                            ? 'bg-blue-600 text-white shadow-inner' 
                            : 'bg-zinc-700/50 text-zinc-500 hover:bg-zinc-600 hover:text-zinc-300'
                        }`}
                        title={p.label}
                     >
                         <div className={`w-2 h-2 rounded-sm ${config.preset === p.id ? 'bg-white' : 'bg-current'}`} />
                     </button>
                 ))}
             </div>
        </div>

        <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Stacking</label>
             <div className="flex bg-zinc-800 rounded p-1 border border-zinc-700">
                <button 
                    onClick={() => handleChange('layout', 'col')}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded transition-all ${config.layout === 'col' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
                >
                    <BoxSelect className="rotate-0" size={14}/> Column
                </button>
                <button 
                    onClick={() => handleChange('layout', 'row')}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded transition-all ${config.layout === 'row' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
                >
                    <BoxSelect className="-rotate-90" size={14}/> Row
                </button>
             </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded flex gap-2 items-start">
            <MousePointer2 size={16} className="text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-200/70">
                <strong>Tip:</strong> You can drag the badges directly on the preview to create exact custom positions. This overrides presets.
            </p>
        </div>
      </section>

    </div>
  );
};

export default Controls;