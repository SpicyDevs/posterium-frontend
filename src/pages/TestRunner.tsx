import React, { useState, useEffect } from 'react';
import { DEFAULT_API_BASE } from '../utils';
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

const TestRunner: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        const url = `${DEFAULT_API_BASE}/test/?run=1&movie_id=550&tv_id=1399&anime_id=5114&sources=tmdb,fanart,imdb,metahub,mal,anilist`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Test failed with status ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    runTests();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-zinc-200 p-6 font-sans overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-xl font-bold text-white tracking-tight">Diagnostic Test Matrix</h1>
          </div>
          {data && (
            <div className="flex gap-4 text-sm font-mono bg-zinc-900/50 px-4 py-2 rounded-lg border border-white/5">
               <div className="text-zinc-400">Total: {data.results.length}</div>
               <div className="text-green-400">Pass: {data.results.filter((r:any) => r.ok).length}</div>
               <div className="text-red-400">Fail: {data.results.filter((r:any) => !r.ok).length}</div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-indigo-400 gap-4">
            <Loader2 size={48} className="animate-spin" />
            <p className="text-sm font-medium tracking-wide">Executing Matrix Tests (may take a few seconds)...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg">
            <p className="font-bold uppercase text-xs tracking-wider">Error executing tests</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {data && data.results && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.results.map((res: any, idx: number) => {
              const cleanPath = res.requestPath;
              const imgUrl = `${DEFAULT_API_BASE}${cleanPath}`;

              return (
                <div key={idx} className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden shadow-lg flex flex-col group hover:border-white/10 transition-colors">
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#0c0c0e]">
                    <div className="flex items-center gap-2">
                       <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                         {res.mediaType}
                       </span>
                       <span className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                         {res.source}
                       </span>
                    </div>
                    {res.ok ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                  </div>
                  
                  <div className="bg-[#0c0c0e]/50 aspect-[2/3] w-full relative flex items-center justify-center p-6 overflow-hidden">
                     {res.ok ? (
                        <img 
                          src={imgUrl} 
                          alt={`${res.mediaType} ${res.source}`} 
                          className="w-full h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] object-contain rounded-lg transition-transform duration-700 hover:scale-105" 
                          loading="lazy" 
                        />
                     ) : (
                        <div className="text-red-400/80 text-xs font-mono text-center flex flex-col items-center gap-2">
                            <XCircle size={32} />
                            Failed<br/>{res.error || `Status: ${res.status}`}
                        </div>
                     )}
                  </div>

                  <div className="p-4 bg-[#0c0c0e] border-t border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Status</span>
                       <span className={res.ok ? "text-green-400 font-mono" : "text-red-400 font-mono"}>{res.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">Latency</span>
                       <span className="text-zinc-300 font-mono">{res.durationMs}ms</span>
                    </div>
                    <div className="pt-3 border-t border-white/5">
                       <a href={imgUrl} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-indigo-400/80 hover:text-indigo-300 hover:underline break-all block leading-tight">
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