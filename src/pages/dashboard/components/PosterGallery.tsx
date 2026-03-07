// src/pages/dashboard/components/PosterGallery.tsx
import React from 'react';
import { Film, Tv, ArrowRight } from 'lucide-react';
import { Link } from '../../../Router';
import FadeSection from './FadeSection';
import { POSTERS } from '../data';
import { buildPosterUrl } from '../utils';

const PosterGallery: React.FC = () => (
  <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
    <div className="max-w-6xl mx-auto">
      {/* Heading */}
      <FadeSection>
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Gallery</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Endless possibilities</h2>
          <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
            Each poster is customized with different badge placements, styles, and data sources.
          </p>
        </div>
      </FadeSection>

      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {POSTERS.map((poster, i) => (
          <FadeSection key={poster.id} delay={i * 50} className="break-inside-avoid mb-3">
            <div
              className="relative rounded-xl overflow-hidden border border-white/[0.07] group card-3d"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
            >
              <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                {/* Skeleton */}
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(135deg, #0d0d0f, ${poster.accent}15)` }}
                />
                <img
                  src={buildPosterUrl(poster, 'sm')}
                  alt={poster.title}
                  loading="lazy"
                  className="relative w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}
                >
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-[11px] font-bold text-white truncate">{poster.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] text-zinc-400 font-mono">{poster.year}</span>
                      <span
                        className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                        style={{ background: `${poster.accent}20`, color: poster.accent }}
                      >
                        {poster.type === 'movie' ? <Film size={8} /> : <Tv size={8} />} {poster.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {poster.badges.split(',').map(b => (
                        <span key={b} className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono uppercase">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeSection>
        ))}
      </div>

      {/* CTA link */}
      <FadeSection delay={200}>
        <div className="mt-10 text-center">
          <Link
            to="/build"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-[12px] font-semibold text-indigo-300 hover:text-white border border-indigo-500/25 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
          >
            Create your own poster <ArrowRight size={12} />
          </Link>
        </div>
      </FadeSection>
    </div>
  </section>
);

export default PosterGallery;