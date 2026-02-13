import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_API_BASE } from '../utils';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Play, Settings2, Database, Image as ImageIcon } from 'lucide-react';

const TestRunner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, any>>({});

  const [ids, setIds] = useState({
    movie: '550',
    tv: '1399',
    anime: '5114'
  });

  const runTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLiveResults({});
    
    try {
      // 1. Fetch dry-run matrix manifest from backend
      const url = new URL(`${DEFAULT_API_BASE}/test`);
      url.searchParams.set('run', '0'); // Request manifest only
      url.searchParams.set('movie_id', ids.movie);
      url.searchParams.set('tv_id', ids.tv);
      url.searchParams.set('anime_id', ids.anime);
      url.searchParams.set('api_base', DEFAULT_API_BASE); // Passes frontend's base URL to avoid internal worker blocks
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Failed to fetch test manifest: ${res.status}`);
      
      const json = await res.json();
      setLoading(false);
      
      // 2. Execute requests directly from the client browser
      setIsExecuting(true);
      const matrix = json.matrix || [];
      
      // Initialize pending state for UI
      const initialResults: Record<string, any> = {};
      matrix.forEach((m: any) => {
         initialResults[m.requestPath] = { ...m, _status: 'pending' };
      });
      setLiveResults(initialResults);

      // Execute network requests sequentially to prevent Cloudflare 522 timeouts
      // and avoid rate-limiting the external upstream APIs (TMDB, Fanart, etc.)
      for (const testCase of matrix) {
         const startedAt = Date.now();
         try {
            const fetchUrl = `${DEFAULT_API_BASE}${testCase.requestPath}`;
            const testRes = await fetch(fetchUrl);
            
            let responseData = null;
            if (testRes.ok && testRes.headers.get('content-type')?.includes('application/json')) {
                responseData = await testRes.json();
            }

            setLiveResults(prev => ({
                ...prev,
                [testCase.requestPath]: {
                    ...testCase,
                    _status: 'complete',
                    status: testRes.status,
                    ok: testRes.ok,
                    durationMs: Date.now() - startedAt,
                    details: responseData ? {
                        cacheStatus: responseData.meta?.cache_status || "miss",
                        sourcesFound: Object.keys(responseData.poster?.all_sources || {}).length
                    } : null
                }
            }));
         } catch (err: any) {
            setLiveResults(prev => ({
                ...prev,
                [testCase.requestPath]: {
                    ...testCase,
                    _status: 'error',
                    status: 0,
                    ok: false,
                    durationMs: Date.now() - startedAt,
                    error: err.message || "Network request blocked/failed"
                }
            }));
         }
         
         // 250ms throttle between each request to allow Worker & upstream APIs to breathe
         await new Promise(resolve => setTimeout(resolve, 250));
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    runTests();
  }, [runTests]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIds(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resultsArray = Object.values(liveResults);
  const total = resultsArray.length;
  const completed = resultsArray.filter((r: any) => r._status !== 'pending').length;
  const passed = resultsArray.filter((r: any) => r.ok).length;
  const failed = resultsArray.filter((r: any) => r._status !== 'pending' && !r.ok).length;

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
                disabled={loading || isExecuting}
                className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {(loading || isExecuting) ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                {isExecuting ? 'Executing...' : 'Execute Matrix'}
              </button>
            </div>
          </div>

          {total > 0 && (
            <div className="flex shrink-0 gap-6 text-sm font-mono bg-[#18181b] px-5 py-3 rounded-xl border border-white/10 shadow-xl transition-all">
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Progress</span><span className="text-blue-400 font-bold">{completed}/{total}</span></div>
               <div className="w-px bg-white/10"></div>
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Pass</span><span className="text-green-400 font-bold">{passed}</span></div>
               <div className="w-px bg-white/10"></div>
               <div className="flex flex-col"><span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Fail</span><span className="text-red-400 font-bold">{failed}</span></div>
            </div>
          )}
        </div>

        {/* State Processing */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 text-indigo-400 gap-5">
            <Loader2 size={56} className="animate-spin" />
            <p className="text-sm font-bold tracking-widest uppercase">Fetching Manifest...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-5 rounded-xl shadow-lg mt-6">
            <p className="font-bold uppercase text-sm tracking-wider flex items-center gap-2"><XCircle size={18}/> Critical Execution Error</p>
            <p className="text-sm mt-2 font-mono">{error}</p>
          </div>
        )}

        {/* Matrix Grid */}
        {total > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 mt-6">
            {resultsArray.map((res: any, idx: number) => {
              const cleanPath = res.requestPath;
              const imgUrl = `${DEFAULT_API_BASE}${cleanPath.replace('.json', '.png')}`;
              const isPending = res._status === 'pending';

              return (
                <div key={idx} className={`bg-[#18181b] border ${isPending ? 'border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-white/5 shadow-2xl'} rounded-2xl overflow-hidden flex flex-col group hover:border-white/10 transition-all hover:-translate-y-1`}>
                  
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
                    {isPending ? (
                      <Loader2 size={18} className="text-indigo-400 animate-spin" />
                    ) : res.ok ? (
                      <CheckCircle2 size={18} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    ) : (
                      <XCircle size={18} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    )}
                  </div>
                  
                  {/* Poster Preview */}
                  <div className="bg-[#0c0c0e] aspect-[2/3] w-full relative flex items-center justify-center p-6 overflow-hidden">
                     <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                     {isPending ? (
                         <div className="text-indigo-400/80 text-xs font-mono text-center flex flex-col items-center gap-3 z-10">
                            <Loader2 size={24} className="animate-spin text-indigo-500/50" />
                            <span className="uppercase tracking-widest font-bold text-[10px]">Awaiting Execution</span>
                         </div>
                     ) : res.ok ? (
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
                            <span className="opacity-70 text-[10px] break-all">{res.error || `HTTP ${res.status}`}</span>
                        </div>
                     )}
                  </div>

                  {/* Card Details */}
                  <div className="p-4 bg-[#121214] border-t border-white/5 flex flex-col gap-3">
                    
                    <div className="grid grid-cols-2 gap-3 mb-1">
                        <div className="flex flex-col bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold mb-1 flex items-center gap-1"><Database size={10}/> Cache</span>
                            <span className={`font-mono text-[11px] uppercase ${isPending ? 'text-zinc-600' : 'text-indigo-400'}`}>
                              {isPending ? '---' : res.details?.cacheStatus || 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-col bg-black/40 rounded p-2 border border-white/5">
                            <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold mb-1 flex items-center gap-1"><ImageIcon size={10}/> Sources</span>
                            <span className={`font-mono text-[11px] ${isPending ? 'text-zinc-600' : 'text-zinc-300'}`}>
                              {isPending ? '---' : `${res.details?.sourcesFound || 0} Retrieved`}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs px-1">
                       <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Latency</span>
                       {isPending ? (
                          <span className="text-zinc-600 font-mono bg-white/5 px-2 py-0.5 rounded text-[10px]">--- ms</span>
                       ) : (
                          <span className={`${res.ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'} font-mono px-2 py-0.5 rounded text-[10px]`}>
                            {res.durationMs}ms
                          </span>
                       )}
                    </div>

                    <div className="pt-3 border-t border-white/5">
                       <a href={isPending ? '#' : imgUrl} target="_blank" rel="noreferrer" className={`text-[10px] font-mono break-all block leading-tight p-2 rounded border ${isPending ? 'text-zinc-600 bg-white/5 border-white/5 pointer-events-none' : 'text-indigo-400/80 hover:text-indigo-300 hover:underline bg-indigo-500/5 border-indigo-500/10'}`}>
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