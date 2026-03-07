// src/pages/dashboard/components/ApiSection.tsx
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import FadeSection from './FadeSection';
import { API_PARAMS } from '../data';
import { SAMPLE_URL } from '../utils';

const ApiSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SAMPLE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <FadeSection>
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Simple API</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">One URL, infinite posters</h2>
            <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
              No auth. No rate limits. Just a URL that returns a poster with live ratings baked in.
            </p>
          </div>
        </FadeSection>

        {/* Code block */}
        <FadeSection delay={100}>
          <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: '#0d0d0f' }}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono ml-1">
                  GET /movie/453395.png
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                {copied
                  ? <Check size={10} className="text-emerald-400" />
                  : <Copy size={10} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Syntax-highlighted URL */}
            <div className="p-4 sm:p-6 overflow-x-auto">
              <pre className="text-[11px] sm:text-[12px] font-mono text-zinc-400 leading-7 whitespace-pre-wrap break-all sm:break-normal">
                <span className="text-indigo-400">https://api.spicydevs.xyz</span>
                <span className="text-violet-400">/movie/453395.png</span>{'\n'}
                <span className="text-zinc-700">  ?</span><span className="text-amber-400">r</span><span className="text-zinc-700">=</span><span className="text-emerald-400">imdb,rt,meta,tmdb</span>{'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">source</span><span className="text-zinc-700">=</span><span className="text-emerald-400">tmdb</span>{'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">blur</span><span className="text-zinc-700">=</span><span className="text-sky-400">8</span>
                {'  '}<span className="text-zinc-700">&</span><span className="text-amber-400">alpha</span><span className="text-zinc-700">=</span><span className="text-sky-400">0.45</span>
                {'  '}<span className="text-zinc-700">&</span><span className="text-amber-400">rad</span><span className="text-zinc-700">=</span><span className="text-sky-400">12</span>{'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">imdb_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">310</span>
                {'  '}<span className="text-zinc-700">&</span><span className="text-amber-400">imdb_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">20</span>{'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">rt_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">310</span>
                {'  '}<span className="text-zinc-700">&</span><span className="text-amber-400">rt_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">90</span>
              </pre>
            </div>

            {/* Response badge */}
            <div className="border-t border-white/[0.06] px-4 sm:px-5 py-3 flex items-center gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                200 OK
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono">Content-Type: image/png</span>
            </div>
          </div>
        </FadeSection>

        {/* Param reference grid */}
        <FadeSection delay={150}>
          <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
            {API_PARAMS.map(p => (
              <div key={p.p} className="flex gap-3 p-3 rounded-xl bg-[#0d0d0f] border border-white/[0.06]">
                <code className="text-[10px] sm:text-[11px] font-mono text-amber-400 flex-shrink-0 mt-0.5 leading-tight">
                  {p.p}
                </code>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500">{p.d}</p>
                  <p className="text-[10px] font-mono text-zinc-700 mt-0.5">{p.e}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeSection>
      </div>
    </section>
  );
};

export default ApiSection;