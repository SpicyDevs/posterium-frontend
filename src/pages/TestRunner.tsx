import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_API_BASE } from '../utils';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Play, Settings2, Database, Image as ImageIcon } from 'lucide-react';

const TestRunner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [ids, setIds] = useState({
    movie: '550',
    tv: '1399',
    anime: '5114'
  });

  const runTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const url = new URL(`${DEFAULT_API_BASE}/test`);
      url.searchParams.set('movie_id', ids.movie);
      url.searchParams.set('tv_id', ids.tv);
      url.searchParams.set('anime_id', ids.anime);
      url.searchParams.set('api_base', DEFAULT_API_BASE);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Test matrix failed with status ${res.status}`);
      
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    runTests();
  }, [runTests]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIds(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] text-zinc-200 font-sans overflow-y-auto custom-scrollbar relative">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/10 pb-6 gap-6 sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-30 pt-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <a href="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white bg-zinc-900 border border-white/5">
                <ArrowLeft size={20} />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Diagnostic Matrix</h1>
                <p className="text-xs text-zinc-500 mt-1">Execute 100% combination testing against all sources and media types.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5 shadow-inner">
              <Settings2 size={16} className="text-zinc-500 ml-1" />
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Movie ID</label>
                <input type="text" name="movie" value={ids.movie} onChange={handleIdChange} className="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none w-24 font-mono transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TV ID</label>
                <input type="text" name="tv" value={ids.tv} onChange={handleIdChange} className="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none w-24 font-mono transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Anime ID</label>
                <input type="text" name="anime" value={ids.anime} onChange={handleIdChange} className="bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none w-24 font-mono transition-colors" />
              </div>
              <button 
                onClick={runTests} 
                disabled={loading}
                className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                Execute Matrix
              </button>
            </div>
          </div>

          {data && !loading && (
            <div className="flex shrink-0 gap-6 text-sm font-mono bg-[#18181b] px-5 py-3 rounded-xl border border-white/10 shadow-xl">
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Total</span><span className="text-zinc-300 font-bold">{data.results.length}</span></div>
               <div className="w-px bg-white/10"></div>
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Pass</span><span className="text-green-400 font-bold">{data.results.filter((r:any) => r.ok).length}</span></div>
               <div className="w-px bg-white/10"></div>
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Fail</span><span className="text-red-400 font-bold">{data.results.filter((r:any) => !r.ok).length}</span></div>
            </div>
          )}
        </div>

        {/* State Processing */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 text-indigo-400 gap-5">
            <Loader2 size={56} className="animate-spin" />
            <p className="text-sm font-bold tracking-widest uppercase">Computing Matrix Geometry...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-5 rounded-xl shadow-lg">
            <p className="font-bold uppercase text-sm tracking-wider flex items-center gap-2"><XCircle size={18}/> Critical Execution Error</p>
            <p className="text-sm mt-2 font-mono">{error}</p>
          </div>
        )}

        {/* Matrix Grid */}
        {data && data.results && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {data.results.map((res: any, idx: number) => {
              const cleanPath = res.requestPath;
              const imgUrl = `${DEFAULT_API_BASE}${cleanPath.replace('.json', '.png')}`;

              return (
                <div key={idx} className="bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-white/10 transition-all hover:-translate-y-1">
                  
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center gap-2">
                       <span className="uppercase text-[9px] font-bold tracking-widest px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 shadow-inner">
                         {res.mediaType}
                       </span>
                       <span className="uppercase text-[9px] font-bold tracking-widest px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 shadow-inner">
                         {res.source}
                       </span>
                    </div>
                    {res.ok ? <CheckCircle2 size={18} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> : <XCircle size={18} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />}
                  </div>
                  
                  {/* Poster Preview */}
                  <div className="bg-[#0c0c0e] aspect-[2/3] w-full relative flex items-center justify-center p-6 overflow-hidden">
                     <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                     {res.ok ? (
                        <img 
                          src={imgUrl} 
                          alt={`${res.mediaType} ${res.source}`} 
                          className="w-full h-full object-contain rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-10 transition-transform duration-700 group-hover:scale-105" 
                          loading="lazy" 
                        />
                     ) : (
                        <div className="text-red-400/80 text-xs font-mono text-center flex flex-col items-center gap-3 z-10 bg-red-950/30 p-6 rounded-2xl border border-red-500/20 backdrop-blur">
                            <XCircle size={36} className="text-red-500" />
                            <span className="uppercase tracking-widest font-bold">Failed</span>
                            <span className="opacity-70">{res.error || `HTTP ${res.status}`}</span>
                        </div>
                     )}
                  </div>

                  {/* Card Details */}
                  <div className="p-4 bg-[#121214] border-t border-white/5 flex flex-col gap-3">
                    
                    <div className="grid grid-cols-2 gap-3 mb-1">
                        <div className="flex flex-col bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold mb-1 flex items-center gap-1"><Database size={10}/> Cache</span>
                            <span className="text-indigo-400 font-mono text-[11px] uppercase">{res.details?.cacheStatus || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold mb-1 flex items-center gap-1"><ImageIcon size={10}/> Sources</span>
                            <span className="text-zinc-300 font-mono text-[11px]">{res.details?.sourcesFound || 0} Retrieved</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs px-1">
                       <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Latency</span>
                       <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">{res.durationMs}ms</span>
                    </div>

                    <div className="pt-3 border-t border-white/5">
                       <a href={imgUrl} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-indigo-400/80 hover:text-indigo-300 hover:underline break-all block leading-tight bg-indigo-500/5 p-2 rounded border border-indigo-500/10">
                         {cleanPath}
                       </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRunner;