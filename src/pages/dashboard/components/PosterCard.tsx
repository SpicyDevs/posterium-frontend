// src/pages/dashboard/components/PosterCard.tsx
import { memo, useState } from 'react';
import { Film, Tv } from 'lucide-react';
import type { PosterItem } from '../types';
import { buildPosterUrl } from '../utils';

interface Props {
  poster: PosterItem;
  /** Used for staggered animation-delay in grids. */
  index?: number;
}

const PosterCard = memo<Props>(({ poster, index = 0 }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  const MediaIcon = poster.type === 'tv' ? Tv : Film;

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/[0.07] card-3d cursor-default"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)', animationDelay: `${index * 0.07}s` }}
    >
      {/* Fixed 2:3 aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
        {/* Skeleton */}
        {!loaded && !error && (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, #111113, ${poster.accent}18)`, animation: 'pulse 2s ease-in-out infinite' }}
          />
        )}

        {/* Image or error state */}
        {!error ? (
          <img
            src={buildPosterUrl(poster, 'sm')}
            alt={poster.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, #111113, ${poster.accent}20)` }}
          >
            <Film size={24} className="text-zinc-700" />
            <span className="text-[10px] text-zinc-700">{poster.title}</span>
          </div>
        )}

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
                <MediaIcon size={8} /> {poster.type}
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
  );
});

PosterCard.displayName = 'PosterCard';
export default PosterCard;