import React, { useState } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig } from '../types';
import { Layout, Palette, Image as ImageIcon, ScanLine, ChevronDown, ChevronRight } from 'lucide-react';

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
    <div className="bg-zinc-900/50 backdrop-blur-md h-full w-full flex flex-col">
      <div className="p-4 border-b border-white/5 bg-[#0f0f11] sticky top-0 z-10">
        <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-wider">
          Configuration
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Media */}
        <Section title="Source Media" icon={<ImageIcon size={16} />}>
            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <input 
                        type="text" 
                        value={config.tmdbId}
                        onChange={(e) => handleChange('tmdbId', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="TMDB ID"
                    />
                </div>
                <select 
                    value={config.source} 
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="col-span-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs outline-none"
                >
                    <option value="tmdb">TMDB</option>
                    <option value="fanart">Fanart</option>
                </select>
            </div>
        </Section>

        {/* Badges */}
        <Section title="Active Badges" icon={<ScanLine size={16} />}>
            <div className="flex gap-2 flex-wrap">
            {['imdb', 'rt', 'meta', 'tmdb'].map((r) => (
                <button
                key={r}
                onClick={() => toggleRating(r as RatingType)}
                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-all ${
                    config.ratings.includes(r as RatingType)
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
                >
                {r.toUpperCase()}
                </button>
            ))}
            </div>
        </Section>

        {/* Styling */}
        <Section title="Styling" icon={<Palette size={16} />}>
            <div className="mb-3">
                <select 
                    value={selectedBadge}
                    onChange={(e) => setSelectedBadge(e.target.value as any)}
                    className="w-full bg-zinc-800 text-xs px-3 py-2 rounded border border-zinc-700 outline-none"
                >
                    <option value="global">Global Defaults</option>
                    {config.ratings.map(r => <option key={r} value={r}>{r.toUpperCase()} Override</option>)}
                </select>
            </div>

            {selectedBadge === 'global' ? (
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Blur</span>
                            <span>{config.blur}px</span>
                        </div>
                        <input type="range" min="0" max="20" value={config.blur} onChange={(e) => handleChange('blur', parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Opacity</span>
                            <span>{Math.round(config.alpha * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={config.alpha} onChange={(e) => handleChange('alpha', parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                            <span>Corner Radius</span>
                            <span>{config.radius}px</span>
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
                    
                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label className="text-[10px] text-zinc-500 mb-1 block">Background</label>
                            <div className="flex gap-1">
                                <input type="color" 
                                    value={config.items[selectedBadge]?.bg || '#000000'} 
                                    onChange={(e) => updateBadgeConfig(selectedBadge, { bg: e.target.value })}
                                    className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 mb-1 block">Text Color</label>
                            <div className="flex gap-1">
                                <input type="color" 
                                    value={config.items[selectedBadge]?.txt || '#ffffff'} 
                                    onChange={(e) => updateBadgeConfig(selectedBadge, { txt: e.target.value })}
                                    className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Per-Item Sliders */}
                    <div className="space-y-3 pt-2 border-t border-zinc-700/50">
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Blur Override</span>
                                <span>{config.items[selectedBadge]?.blur ?? config.blur}px</span>
                            </div>
                            <input type="range" min="0" max="20" 
                                value={config.items[selectedBadge]?.blur ?? config.blur} 
                                onChange={(e) => updateBadgeConfig(selectedBadge, { blur: parseInt(e.target.value) })} 
                                className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Opacity Override</span>
                                <span>{Math.round((config.items[selectedBadge]?.alpha ?? config.alpha) * 100)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.1" 
                                value={config.items[selectedBadge]?.alpha ?? config.alpha} 
                                onChange={(e) => updateBadgeConfig(selectedBadge, { alpha: parseFloat(e.target.value) })} 
                                className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                <span>Radius Override</span>
                                <span>{config.items[selectedBadge]?.radius ?? config.radius}px</span>
                            </div>
                            <input type="range" min="0" max="30" 
                                value={config.items[selectedBadge]?.radius ?? config.radius} 
                                onChange={(e) => updateBadgeConfig(selectedBadge, { radius: parseInt(e.target.value) })} 
                                className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer pt-1">
                                <input type="checkbox" 
                                    checked={config.items[selectedBadge]?.shadow ?? config.shadow} 
                                    onChange={(e) => updateBadgeConfig(selectedBadge, { shadow: e.target.checked })} 
                                    className="rounded bg-zinc-700 border-zinc-600 text-blue-500 w-4 h-4"
                                />
                                Shadow Override
                            </label>
                        </div>
                    </div>

                    <button onClick={() => updateBadgeConfig(selectedBadge, { 
                        bg: undefined, txt: undefined, blur: undefined, alpha: undefined, radius: undefined, shadow: undefined 
                    })} className="w-full mt-2 text-xs py-1.5 text-zinc-500 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">
                        Reset Overrides
                    </button>
                </div>
            )}
        </Section>

        {/* Layout */}
        <Section title="Layout & Presets" icon={<Layout size={16} />}>
            {/* Scrollable preset row for better mobile use */}
            <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700">
                {presets.map(p => (
                    <button
                        key={p.id}
                        onClick={() => {
                            handleChange('preset', p.id);
                            handleChange('items', {});
                        }}
                        className={`flex-shrink-0 px-3 py-2 text-xs font-bold rounded hover:bg-zinc-600 transition-colors border border-transparent ${config.preset === p.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => handleChange('layout', 'col')} 
                    className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'col' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                >
                    Column
                </button>
                <button 
                    onClick={() => handleChange('layout', 'row')} 
                    className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'row' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}
                >
                    Row
                </button>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default Controls;