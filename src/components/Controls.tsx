import React, { useState, useEffect, useRef } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
import { Layout, Palette, Image as ImageIcon, ScanLine, ChevronDown, ChevronRight, Tv, Film, Settings, Globe, Check, ChevronsUpDown, Clock, Sparkles } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

// Performance: A slider that only commits changes to the global state on release
const DebouncedSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (val: number) => void;
}> = ({ value, min, max, step = 1, label, unit = "", onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  // Sync with external changes (e.g. reset button)
  useEffect(() => { setLocalVal(value); }, [value]);

  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
        <span>{label}</span>
        <span>{Math.round(localVal * 100) / 100}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={localVal}
        onChange={(e) => setLocalVal(parseFloat(e.target.value))}
        onMouseUp={() => onChange(localVal)}
        onTouchEnd={() => onChange(localVal)}
        className="w-full accent-blue-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      />
    </div>
  );
};

const BadgeIcon: React.FC<{ type: string, className?: string }> = ({ type, className = "w-4 h-4" }) => {
  if (type === 'global') return <Globe className={className} />;
  if (type === 'age') return <div className={`${className} flex items-center justify-center border rounded border-current opacity-75`}><span className="text-[8px] font-bold leading-none">13+</span></div>;
  if (['imdb', 'rt', 'rt_popcorn', 'tmdb', 'meta', 'letterboxd', 'runtime'].includes(type)) return <ScanLine className={className} />; 
  return <ScanLine className={className} />;
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">{icon} <span>{title}</span></div>
        {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

const IconSelect: React.FC<{ value: string; options: { value: string; label: string; icon: string }[]; onChange: (value: string) => void; }> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find(o => o.value === value) || options[0];
  return (
    <div className="relative w-full" ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-md px-3 py-2 text-xs text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50">
        <div className="flex items-center gap-2"><BadgeIcon type={selectedOption.icon} className="w-4 h-4 text-zinc-400" /><span>{selectedOption.label}</span></div>
        <ChevronsUpDown size={12} className="text-zinc-500" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-zinc-700/50 transition-colors ${value === opt.value ? 'bg-blue-600/10 text-blue-200' : 'text-zinc-300'}`}>
              <div className="flex items-center gap-2"><BadgeIcon type={opt.icon} className={`w-4 h-4 ${value === opt.value ? 'text-blue-400' : 'text-zinc-500'}`} /><span>{opt.label}</span></div>
              {value === opt.value && <Check size={12} className="text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Controls: React.FC<Props> = ({ config, onChange }) => {
  const [selectedBadge, setSelectedBadge] = useState<RatingType | 'global'>('global');
  
  const isGlobal = selectedBadge === 'global';
  const itemConfig = !isGlobal ? config.items[selectedBadge as RatingType] : null;

  const handleChange = (key: keyof PosterConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const getCurrentValue = <K extends keyof BadgeConfig>(key: K, globalKey: keyof PosterConfig) => {
      if (isGlobal) return config[globalKey];
      return itemConfig?.[key] !== undefined ? itemConfig[key] : config[globalKey];
  };

  const updateValue = (key: keyof BadgeConfig, globalKey: keyof PosterConfig, value: any) => {
      if (isGlobal) {
          onChange({ ...config, [globalKey]: value });
      } else {
          onChange({
              ...config,
              items: { ...config.items, [selectedBadge as RatingType]: { ...itemConfig, [key]: value } }
          });
      }
  };

  const getBgValue = () => isGlobal ? (config.globalBg || 'rgba(0,0,0,0.4)') : (itemConfig?.bg || config.globalBg || 'rgba(0,0,0,0.4)');
  const isGradient = (bg: string) => bg?.startsWith('grad:') || false;
  const getGradientColors = (bg: string) => {
      if (!bg || !bg.startsWith('grad:')) return ['#000000', '#000000'];
      const parts = bg.split(':');
      return [parts[1] || '#000000', parts[2] || parts[1] || '#000000'];
  };
  const toHex = (c: any) => (typeof c === 'string' && c.startsWith('#')) ? c : '#000000';

  const handleBgTypeChange = (useGrad: boolean) => {
      const current = getBgValue();
      let newVal = '#000000';
      if (useGrad) {
          if (!current.startsWith('grad:')) newVal = `grad:${current}:${current}`;
      } else {
          if (current.startsWith('grad:')) newVal = current.split(':')[1];
      }
      updateValue('bg', 'globalBg', newVal);
  };

  const handleGradientColorChange = (idx: 0 | 1, val: string) => {
      const current = getBgValue();
      const colors = getGradientColors(current);
      colors[idx] = val;
      updateValue('bg', 'globalBg', `grad:${colors[0]}:${colors[1]}`);
  };

  const updateApiKey = (key: keyof ApiKeys, value: string) => {
    onChange({ ...config, keys: { ...config.keys, [key]: value } });
  };

  const toggleRating = (r: RatingType) => {
    const current = new Set(config.ratings);
    if (current.has(r)) current.delete(r); else current.add(r);
    // Maintain a specific sort order
    const order: RatingType[] = ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'age', 'runtime'];
    const newRatings = order.filter(x => current.has(x));
    handleChange('ratings', newRatings);
  };

  const selectClass = "w-full appearance-none bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat pr-8";
  const styleOptions = [{ value: 'global', label: 'Global Defaults', icon: 'global' }, ...config.ratings.map(r => ({ value: r, label: `${r.replace('rt_popcorn', 'Popcorn').toUpperCase()} Override`, icon: r }))];
  const presets: {id: PresetType, label: string}[] = [ { id: 'tl', label: 'TL' }, { id: 'tc', label: 'TC' }, { id: 'tr', label: 'TR' }, { id: 'lc', label: 'LC' }, { id: 'cc', label: 'CC' }, { id: 'rc', label: 'RC' }, { id: 'bl', label: 'BL' }, { id: 'bc', label: 'BC' }, { id: 'br', label: 'BR' } ];

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md h-full w-full flex flex-col">
      <div className="p-4 border-b border-white/5 bg-[#0f0f11] sticky top-0 z-10">
        <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-wider">Configuration</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Source & Effects" icon={<ImageIcon size={16} />}>
            <div className="flex gap-2 mb-2">
                 <button onClick={() => onChange({...config, mediaType: 'movie', tmdbId: '453395'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'movie' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Film size={14}/> Movie</button>
                 <button onClick={() => onChange({...config, mediaType: 'tv', tmdbId: '93405'})} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs border transition-colors ${config.mediaType === 'tv' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}><Tv size={14}/> TV Show</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="col-span-2"><input type="text" value={config.tmdbId} onChange={(e) => onChange({...config, tmdbId: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-zinc-200 placeholder-zinc-600" placeholder="TMDB ID"/></div>
                <div className="col-span-1 relative"><select value={config.source} onChange={(e) => onChange({...config, source: e.target.value as any})} className={selectClass}><option value="tmdb">TMDB</option><option value="fanart">Fanart</option></select></div>
            </div>
            
            <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300 flex items-center gap-2"><Sparkles size={12}/> Grayscale</label>
                    <input type="checkbox" checked={config.grayscale} onChange={(e) => onChange({...config, grayscale: e.target.checked})} className="rounded bg-zinc-700 border-zinc-600 text-blue-500 w-4 h-4"/>
                </div>
                <DebouncedSlider label="Background Blur" unit="px" min={0} max={20} value={config.posterBlur} onChange={(v) => onChange({...config, posterBlur: v})} />
            </div>
        </Section>

        <Section title="Active Badges" icon={<ScanLine size={16} />}>
            <div className="grid grid-cols-2 gap-2">
            {['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb'].map((r) => (
                <button key={r} onClick={() => toggleRating(r as RatingType)} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes(r as RatingType) ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 grayscale hover:grayscale-0'}`}>
                <BadgeIcon type={r} className={`w-4 h-4 ${!config.ratings.includes(r as RatingType) && 'opacity-50'}`} /><span>{r.replace('rt_popcorn', 'Popcorn').toUpperCase()}</span>
                </button>
            ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                 <button onClick={() => toggleRating('age')} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes('age') ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}><BadgeIcon type="age" className="w-4 h-4"/><span>Age</span></button>
                <button onClick={() => toggleRating('runtime')} className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${config.ratings.includes('runtime') ? 'bg-blue-600/20 border-blue-500/50 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}><Clock size={16} /><span>Runtime</span></button>
            </div>
        </Section>

        <Section title="Styling" icon={<Palette size={16} />}>
            <div className="mb-3 relative"><IconSelect value={selectedBadge} options={styleOptions} onChange={(v) => setSelectedBadge(v as any)} /></div>

            <div className={`space-y-3 p-3 rounded border ${isGlobal ? 'bg-zinc-900/30 border-transparent' : 'bg-blue-500/5 border-blue-500/20'}`}>
                <DebouncedSlider label="Scale" unit="x" min={0.5} max={2.0} step={0.1} value={getCurrentValue('scale', 'globalScale') as number} onChange={(v) => updateValue('scale', 'globalScale', v)} />

                {/* Colors & Background */}
                <div className="mb-3">
                    <label className="text-[10px] text-zinc-500 mb-1 block">Background</label>
                    <div className="flex bg-zinc-900 rounded p-1 mb-2">
                         <button onClick={() => handleBgTypeChange(false)} className={`flex-1 text-[10px] py-1 rounded ${!isGradient(getBgValue()!) ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Solid</button>
                         <button onClick={() => handleBgTypeChange(true)} className={`flex-1 text-[10px] py-1 rounded ${isGradient(getBgValue()!) ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Gradient</button>
                    </div>
                    {isGradient(getBgValue()!) ? (
                         <div className="grid grid-cols-2 gap-2">
                             <div><input type="color" value={getGradientColors(getBgValue()!)[0]} onChange={(e) => handleGradientColorChange(0, e.target.value)} className="h-8 w-full rounded border-zinc-700"/></div>
                             <div><input type="color" value={getGradientColors(getBgValue()!)[1]} onChange={(e) => handleGradientColorChange(1, e.target.value)} className="h-8 w-full rounded border-zinc-700"/></div>
                         </div>
                    ) : (
                         <input type="color" value={toHex(getBgValue()!)} onChange={(e) => updateValue('bg', 'globalBg', e.target.value)} className="h-8 w-full rounded border-zinc-700"/>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                     <div>
                        <label className="text-[10px] text-zinc-500 mb-1 block">Text Color</label>
                        <input type="color" value={toHex(getCurrentValue('txt', 'globalTxt') as string)} onChange={(e) => updateValue('txt', 'globalTxt', e.target.value)} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                     </div>
                     <div>
                        <label className="text-[10px] text-zinc-500 mb-1 block">Border Color</label>
                        <input type="color" value={toHex(getCurrentValue('borderC', 'globalBorderC') as string)} onChange={(e) => updateValue('borderC', 'globalBorderC', e.target.value)} className="h-8 w-full rounded bg-transparent cursor-pointer border border-zinc-700"/>
                     </div>
                </div>

                <DebouncedSlider label="Border Width" unit="px" min={0} max={10} value={getCurrentValue('borderW', 'globalBorderW') as number} onChange={(v) => updateValue('borderW', 'globalBorderW', v)} />

                <div className="space-y-3 pt-2 border-t border-zinc-700/50">
                    <DebouncedSlider label="Blur" unit="px" min={0} max={20} value={getCurrentValue('blur', 'blur') as number} onChange={(v) => updateValue('blur', 'blur', v)} />
                    <DebouncedSlider label="Opacity" unit="" min={0} max={1} step={0.1} value={getCurrentValue('alpha', 'alpha') as number} onChange={(v) => updateValue('alpha', 'alpha', v)} />
                    <DebouncedSlider label="Radius" unit="px" min={0} max={30} value={getCurrentValue('radius', 'radius') as number} onChange={(v) => updateValue('radius', 'radius', v)} />
                </div>

                {!isGlobal && (
                    <button onClick={() => onChange({...config, items: { ...config.items, [selectedBadge as RatingType]: undefined }})} className="w-full mt-2 text-xs py-1.5 text-zinc-500 hover:text-white border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">Reset Overrides</button>
                )}
            </div>
        </Section>

        <Section title="Layout" icon={<Layout size={16} />}>
            <div className="grid grid-cols-3 gap-1 bg-zinc-800 p-1 rounded border border-zinc-700 mb-3">{presets.map(p => (<button key={p.id} onClick={() => onChange({...config, preset: p.id, items: {}})} className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded hover:bg-zinc-600 transition-colors ${config.preset === p.id ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500 bg-zinc-900/50'}`}>{p.label}</button>))}</div>
            <div className="flex gap-2"><button onClick={() => onChange({...config, layout: 'col', items: {}})} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'col' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Column</button><button onClick={() => onChange({...config, layout: 'row', items: {}})} className={`flex-1 text-xs py-2 rounded border transition-colors ${config.layout === 'row' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'}`}>Row</button></div>
        </Section>

        <Section title="Advanced Settings" icon={<Settings size={16} />} defaultOpen={false}>
            <div className="space-y-3">
                <p className="text-[10px] text-zinc-500 leading-tight">Enter your own API keys to bypass rate limits.</p>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">TMDB API Key</label><input type="password" value={config.keys?.tmdb || ''} onChange={(e) => updateApiKey('tmdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Fanart.tv API Key</label><input type="password" value={config.keys?.fanart || ''} onChange={(e) => updateApiKey('fanart', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">OMDB API Key</label><input type="password" value={config.keys?.omdb || ''} onChange={(e) => updateApiKey('omdb', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">MDBList API Key</label><input type="password" value={config.keys?.mdblist || ''} onChange={(e) => updateApiKey('mdblist' as any, e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default Controls;