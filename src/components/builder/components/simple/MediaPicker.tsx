import React, { useEffect, useState } from 'react';
import { Search, Loader2, Film, Tv } from 'lucide-react';
import type { PosterConfig } from '../../types';
import { DEFAULT_API_BASE } from '../../utils';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
}

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  title?: string;
}

const MediaPicker: React.FC<Props> = ({ config, setConfig, title = 'Media selection' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${DEFAULT_API_BASE}/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const data = await response.json();
        const next = Array.isArray(data.results)
          ? data.results.filter(
              (item: SearchResult) =>
                item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')
            )
          : [];
        setResults(next);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setError('Search failed. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
    setConfig((prev) => ({
      ...prev,
      tmdbId: String(item.id),
      imdbId: undefined,
      mediaType,
    }));
    setSelectedTitle(item.title || item.name || '');
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <p className="syne-font uppercase tracking-widest" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
        {title}
      </p>

      <div
        className="relative flex items-center h-10 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span className="pl-3" style={{ color: 'var(--film-text-dim)' }}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
        </span>
        <input
          aria-label="Search media"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a movie or show"
          className="w-full h-full px-2 bg-transparent border-none outline-none syne-font"
          style={{ fontSize: 11, color: 'var(--film-cream)' }}
        />
      </div>

      {results.length > 0 && (
        <div
          className="max-h-56 overflow-y-auto rounded-xl p-1"
          style={{ background: 'var(--film-mid)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {results.map((item) => {
            const label = item.title || item.name || 'Untitled';
            const year = (item.release_date || item.first_air_date || '').split('-')[0];
            const isTv = item.media_type === 'tv';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[rgba(196,124,46,0.1)] transition-colors"
              >
                <p className="syne-font truncate" style={{ fontSize: 11, color: 'var(--film-cream)' }}>
                  {label}
                </p>
                <p className="mono-font mt-0.5 flex items-center gap-1.5" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
                  {year || '—'} {isTv ? <Tv size={10} /> : <Film size={10} />} {isTv ? 'TV' : 'Movie'}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {(selectedTitle || config.tmdbId) && (
        <p className="body-font" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
          Selected: {selectedTitle || `TMDB #${config.tmdbId}`}
        </p>
      )}

      {error && (
        <p className="body-font" style={{ fontSize: 10, color: '#fca5a5' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default MediaPicker;
