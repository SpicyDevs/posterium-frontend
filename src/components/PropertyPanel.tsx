import React from 'react';
import { PosterConfig, RatingType, BadgeConfig, ApiKeys } from '../types';
import {  Monitor, Film, Globe, Layers } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
}

// UI Helpers
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-b border-white/5 py-4 px-4 last:border-0">
    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <label className="text-xs text-zinc-400 font-medium">{label}</label>
        </div>
        {children}
    </div>
);

const InputRange: React.FC<{ value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }> = ({ value, onChange, min, max, step = 1, unit = '' }) => (
    <div className="flex items-center gap-3">
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
        />
        <span className="text-xs font-mono text-zinc-500 w-8 text-right">{value}{unit}</span>
    </div>
);

const PropertyPanel: React.FC<Props> = ({ config, setConfig, selectedIds }) => {
  
  // -- HANDLERS --
  const updateConfig = (key: keyof PosterConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));
  const updateKeys = (key: keyof ApiKeys, value: string) => setConfig(prev => ({ ...prev, keys: { ...prev.keys, [key]: value } }));
  
  // Multi-edit handler
  const updateSelectedBadges = (updates: Partial<BadgeConfig>) => {
      setConfig(prev => {
          const newItems = { ...prev.items };
          selectedIds.forEach(id => {
              newItems[id] = { ...newItems[id], ...updates };
          });
          return { ...prev, items: newItems };
      });
  };

  // Helper to get a common value for a property from selected items (or default)
  const getCommonValue = <K extends keyof BadgeConfig>(prop: K, def: any): any => {
      const values = Array.from(selectedIds).map(id => config.items[id]?.[prop] ?? config[prop as keyof PosterConfig] ?? def);
      return values.every(v => v === values[0]) ? values[0] : null; // Return null if mixed
  };

  const isGlobal = selectedIds.size === 0;

  // -- RENDER: GLOBAL SETTINGS --
  if (isGlobal) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
         <div className="p-4 border-b border-white/5 bg-[#0c0c0e] sticky top-0 z-10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe size={16} className="text-indigo-400"/> Global Settings
            </h2>
         </div>

         <Section title="Media Source">
             <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-white/5 mb-3">
                 <button onClick={() => updateConfig('mediaType', 'movie')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${config.mediaType === 'movie' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}><Film size={12}/> Movie</button>
                 <button onClick={() => updateConfig('mediaType', 'tv')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${config.mediaType === 'tv' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}><Monitor size={12}/> TV Show</button>
             </div>
             <div className="space-y-2">
                 <input type="text" value={config.tmdbId} onChange={(e) => updateConfig('tmdbId', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="TMDB ID (e.g. 453395)" />
                 <select value={config.source} onChange={(e) => updateConfig('source', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 outline-none">
                     <option value="tmdb">TMDB Poster</option>
                     <option value="fanart">Fanart.tv Poster</option>
                 </select>
             </div>
         </Section>

         <Section title="Poster Effects">
            <ControlRow label="Background Blur">
                <InputRange value={config.posterBlur} min={0} max={20} onChange={(v) => updateConfig('posterBlur', v)} />
            </ControlRow>
            <label className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer mt-2">
                <span className="text-xs text-zinc-300">Grayscale</span>
                <input type="checkbox" checked={config.grayscale} onChange={(e) => updateConfig('grayscale', e.target.checked)} className="rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50" />
            </label>
         </Section>

         <Section title="Default Badge Style">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <ControlRow label="Glass Blur">
                        <InputRange value={config.blur} min={0} max={20} onChange={(v) => updateConfig('blur', v)} />
                    </ControlRow>
                </div>
                <div className="col-span-2">
                    <ControlRow label="Opacity">
                        <InputRange value={config.alpha} min={0} max={1} step={0.1} onChange={(v) => updateConfig('alpha', v)} />
                    </ControlRow>
                </div>
                <div className="col-span-2">
                    <ControlRow label="Corner Radius">
                         <InputRange value={config.radius} min={0} max={30} onChange={(v) => updateConfig('radius', v)} />
                    </ControlRow>
                </div>
            </div>
         </Section>

         <Section title="API Keys (Advanced)">
            <p className="text-[10px] text-zinc-500 mb-2">Optional keys to bypass rate limits.</p>
            <div className="space-y-2">
                <input type="password" value={config.keys?.tmdb || ''} onChange={(e) => updateKeys('tmdb', e.target.value)} placeholder="TMDB Key" className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 outline-none"/>
            </div>
         </Section>
      </div>
    );
  }

  // -- RENDER: MULTI-SELECT SETTINGS --
  // We use `getCommonValue` to determine if we show a value or a "Mixed" state
  const mixedVal = (val: any, def: any) => val === null ? '' : val ?? def;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-white/5 bg-[#0c0c0e] sticky top-0 z-10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-indigo-400"/> 
                {selectedIds.size} Badge{selectedIds.size > 1 ? 's' : ''} Selected
            </h2>
        </div>

        <Section title="Appearance">
            <ControlRow label="Scale">
                <InputRange 
                    value={getCommonValue('scale', 1.0) ?? 1.0} 
                    min={0.5} max={2.0} step={0.1} 
                    onChange={(v) => updateSelectedBadges({ scale: v })} 
                />
            </ControlRow>
        </Section>

        <Section title="Style Overrides">
            <div className="space-y-4">
                <ControlRow label="Background Color">
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                             <input type="color" className="absolute inset-0 opacity-0 w-full cursor-pointer" 
                                onChange={(e) => updateSelectedBadges({ bg: e.target.value })} 
                             />
                             <div className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded flex items-center px-2 text-xs text-zinc-400">
                                 <div className="w-4 h-4 rounded border border-white/10 mr-2" style={{ background: mixedVal(getCommonValue('bg', '#000000'), '#000') }}></div>
                                 {mixedVal(getCommonValue('bg', 'Default'), 'Mixed')}
                             </div>
                        </div>
                     </div>
                </ControlRow>
                
                <ControlRow label="Border Width">
                    <InputRange 
                        value={getCommonValue('borderW', 0) ?? 0} 
                        min={0} max={10} 
                        onChange={(v) => updateSelectedBadges({ borderW: v })} 
                    />
                </ControlRow>
                 <ControlRow label="Border Color">
                     <div className="relative w-full">
                         <input type="color" className="absolute inset-0 opacity-0 w-full cursor-pointer" 
                            onChange={(e) => updateSelectedBadges({ borderC: e.target.value })} 
                         />
                         <div className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded flex items-center px-2 text-xs text-zinc-400">
                             <div className="w-4 h-4 rounded border border-white/10 mr-2" style={{ background: mixedVal(getCommonValue('borderC', '#ffffff'), '#fff') }}></div>
                             Pick Color
                         </div>
                    </div>
                </ControlRow>
            </div>
        </Section>

        <Section title="Visibility">
            <label className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer">
                <span className="text-xs text-zinc-300">Show Icon</span>
                <input type="checkbox" 
                    checked={getCommonValue('icon', true) ?? true} 
                    onChange={(e) => updateSelectedBadges({ icon: e.target.checked })} 
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-500" 
                />
            </label>
            <label className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer mt-1">
                <span className="text-xs text-zinc-300">Drop Shadow</span>
                <input type="checkbox" 
                    checked={getCommonValue('shadow', true) ?? true} 
                    onChange={(e) => updateSelectedBadges({ shadow: e.target.checked })} 
                    className="rounded border-zinc-600 bg-zinc-800 text-indigo-500" 
                />
            </label>
        </Section>

        <div className="p-4">
             <button 
                onClick={() => setConfig(prev => {
                    const newItems = { ...prev.items };
                    selectedIds.forEach(id => delete newItems[id]); // Remove overrides
                    return { ...prev, items: newItems };
                })}
                className="w-full py-2 border border-white/10 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
             >
                Reset Overrides to Global
             </button>
        </div>
    </div>
  );
};

export default PropertyPanel;