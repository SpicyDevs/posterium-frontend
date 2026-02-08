import React, { useState, useRef, useEffect } from 'react';
import { PosterConfig, RatingType, PresetType, BadgeConfig, ApiKeys } from '../types';
// FIXED: Added 'Clock' to imports
import { Layout, Palette, Image as ImageIcon, ScanLine, ChevronDown, ChevronRight, Tv, Film, Settings, Globe, Check, ChevronsUpDown, Clock } from 'lucide-react';

interface Props {
  config: PosterConfig;
  onChange: (newConfig: PosterConfig) => void;
}

// --- ICONS & ASSETS ---
const BADGE_ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt: { vb: "0 0 80 80", body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g>` },
  meta: { vb: "0 0 32 32", body: `<path d="M0 0h32v32H0V0z" fill="#333"/><path d="M24.7 10.7l-7.3 11-3.6-5.8-3.2 5.1-5-8.2H2v13.6h4.3V15l1.6 2.8 3.8-6 3.8 5.9 7.3-10.9H22v13.6h4.5V10.7h-1.8z" fill="#FFF"/>` },
  tmdb: { vb: "0 0 32 32", body: `<path d="M3.7 27.6h24.6V4.4H3.7v23.2z" fill="#0d253f"/><path d="M12.6 18.6c0-3.3 2.1-5.7 5.6-5.7 1.8 0 3.2.7 4.1 1.8v-1.6h2.7v10.9h-2.7v-1.6c-.9 1.1-2.3 1.8-4.1 1.8-3.5 0-5.6-2.4-5.6-5.6zm8.1 0c0-1.9-1-3.4-2.7-3.4-1.8 0-2.8 1.5-2.8 3.4 0 1.9 1 3.4 2.8 3.4 1.7 0 2.7-1.5 2.7-3.4z" fill="#01b4e4"/>` },
  rt_popcorn: { vb: "0 0 512 512", body: `<path fill="#FA320A" d="M116.5 137.8l-13.8 62.4-44.5 200.5C53.7 420.9 69 440 90.1 440h331.8c21.1 0 36.4-19.1 31.9-39.3l-44.5-200.5-13.8-62.4H116.5zM256 64c20.3 0 37.9-11.7 46.5-28.8 8.6 17.1 26.2 28.8 46.5 28.8 28.3 0 51.2-22.9 51.2-51.2 0-3.3-.3-6.5-.9-9.6C391.8 19.6 376.5 32 358.5 32c-15.1 0-28.3-8.8-35-21.8C316.8 23.2 303.6 32 288.5 32c-15.1 0-28.3-8.8-35-21.8C246.8 23.2 233.6 32 218.5 32c-18 0-33.3-12.4-40.8-28.8-.6 3.1-.9 6.3-.9 9.6 0 28.3 22.9 51.2 51.2 51.2 20.3 0 37.9-11.7 46.5-28.8 8.6 17.1 26.2 28.8 46.5 28.8z"/>` },
  letterboxd: { vb: "0 0 512 512", body: `<path fill="#202830" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm-84 384c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm84-128c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm84-128c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z" fill-rule="evenodd"/>` },
  runtime: { vb: "0 0 24 24", body: `<path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.5"/>` }
};

const BadgeIcon: React.FC<{ type: string, className?: string }> = ({ type, className = "w-4 h-4" }) => {
  if (type === 'global') return <Globe className={className} />;
  
  // Special text icon for Age
  if (type === 'age') {
    return (
      <div className={`${className} flex items-center justify-center border rounded border-current opacity-75`}>
        <span className="text-[8px] font-bold leading-none">13+</span>
      </div>
    );
  }

  const iconData = BADGE_ICONS[type];
  if (iconData) {
    return (
      <svg 
        viewBox={iconData.vb} 
        className={className} 
        dangerouslySetInnerHTML={{ __html: iconData.body }} 
      />
    );
  }

  return <ScanLine className={className} />;
};

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

// Custom Select Component to show Icons
const IconSelect: React.FC<{
  value: string;
  options: { value: string; label: string; icon: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-md px-3 py-2 text-xs text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      >
        <div className="flex items-center gap-2">
          <BadgeIcon type={selectedOption.icon} className="w-4 h-4 text-zinc-400" />
          <span>{selectedOption.label}</span>
        </div>
        <ChevronsUpDown size={12} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-zinc-700/50 transition-colors ${value === opt.value ? 'bg-blue-600/10 text-blue-200' : 'text-zinc-300'}`}
            >
              <div className="flex items-center gap-2">
                <BadgeIcon type={opt.icon} className={`w-4 h-4 ${value === opt.value ? 'text-blue-400' : 'text-zinc-500'}`} />
                <span>{opt.label}</span>
              </div>
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
    const order: RatingType[] = ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'age', 'runtime'];
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

  const handleMediaTypeSwitch = (type: 'movie' | 'tv') => {
      if (config.mediaType === type) return;
      onChange({ 
          ...config, 
          mediaType: type,
          tmdbId: type === 'movie' ? MOVIE_DEFAULT_ID : TV_DEFAULT_ID
      });
  };

  const selectClass = "w-full appearance-none bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-[right_12px_center] bg-no-repeat pr-8";

  // Build styling options
  const styleOptions = [
    { value: 'global', label: 'Global Defaults', icon: 'global' },
    ...config.ratings.map(r => ({ value: r, label: `${r.replace('rt_popcorn', 'Popcorn').toUpperCase()} Override`, icon: r }))
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
            {['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb'].map((r) => (
                <button
                key={r}
                onClick={() => toggleRating(r as RatingType)}
                className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    config.ratings.includes(r as RatingType)
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 grayscale hover:grayscale-0'
                }`}
                >
                <BadgeIcon type={r} className={`w-4 h-4 ${!config.ratings.includes(r as RatingType) && 'opacity-50'}`} />
                <span>{r.replace('rt_popcorn', 'Popcorn').toUpperCase()}</span>
                </button>
            ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                 <button
                    onClick={() => toggleRating('age')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        config.ratings.includes('age')
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                    }`}
                >
                    <BadgeIcon type="age" className="w-4 h-4"/>
                    <span>Age</span>
                </button>
                <button
                    onClick={() => toggleRating('runtime')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                        config.ratings.includes('runtime')
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                    }`}
                >
                    <Clock size={16} />
                    <span>Runtime</span>
                </button>
            </div>
        </Section>

        {/* Styling */}
        <Section title="Styling" icon={<Palette size={16} />}>
            <div className="mb-3 relative">
                <IconSelect 
                    value={selectedBadge} 
                    options={styleOptions} 
                    onChange={(v) => setSelectedBadge(v as any)} 
                />
            </div>

            {selectedBadge === 'global' ? (
                <div className="space-y-4">
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
                    <p className="text-xs text-blue-300 mb-2 flex items-center gap-1">
                        Editing <BadgeIcon type={selectedBadge} className="w-3 h-3"/> <strong>{selectedBadge.replace('rt_popcorn', 'Popcorn').toUpperCase()}</strong>
                    </p>
                    
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
                <div><label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">MDBList API Key</label><input type="password" value={config.keys?.mdblist || ''} onChange={(e) => updateApiKey('mdblist' as any, e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"/></div>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default Controls;