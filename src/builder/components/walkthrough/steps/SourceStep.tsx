import { memo, useState, useEffect, useCallback, useRef } from 'react';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';
import MediaSearchCombobox, { type SearchResult } from '../../ui/MediaSearchCombobox';
import SelectBox from '../../ui/SelectBox';
import ToggleRow from '../../ui/ToggleRow';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface SourceStepProps {
  config: PosterConfig;
  onChange: (updates: Partial<PosterConfig>) => void;
}

const sourceOptions = [
  { id: 'tmdb', label: 'TMDB' },
  { id: 'fanart', label: 'Fanart.tv' },
  { id: 'metahub', label: 'Metahub' },
  { id: 'imdb', label: 'IMDb' },
  { id: 'mal', label: 'MyAnimeList' },
  { id: 'anilist', label: 'AniList' },
];

const SourceStep = memo<SourceStepProps>(({ config, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query || query.startsWith('tt') || /^\d+$/.test(query)) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    if (query.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${DEFAULT_API_BASE}/search?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const resultsArr: SearchResult[] = data.results ?? data;
        const filtered = resultsArr.filter(
          (r) => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'),
        );
        setResults(filtered);
      } catch {
        if (!ctrl.signal.aborted) setIsSearching(false);
      } finally {
        if (!ctrl.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.startsWith('tt') && value.length > 3) {
        onChange({ imdbId: value, tmdbId: '' });
      } else if (/^\d+$/.test(value) && value.length > 2) {
        onChange({ tmdbId: value, imdbId: config.imdbId });
      }
    },
    [onChange, config.imdbId],
  );

  const handleSelectResult = useCallback(
    (item: SearchResult | null) => {
      if (!item) return;
      onChange({
        tmdbId: item.id.toString(),
        imdbId: '',
        mediaType: item.media_type,
      });
      setQuery(item.title || item.name || '');
    },
    [onChange],
  );

  return (
    <div>
      <StepTitle>Choose a Poster Source</StepTitle>
      <StepSubtitle>
        Search for a movie or TV show, then select your poster source and preferences.
      </StepSubtitle>

      <div style={{ marginBottom: 16 }}>
        <MediaSearchCombobox
          onQueryChange={handleInputChange}
          results={results}
          isSearching={isSearching}
          onSelectResult={handleSelectResult}
          placeholder="Search or paste IMDb/TMDB ID…"
        />
      </div>

      {config.tmdbId || config.imdbId ? (
        <div style={{ marginBottom: 16 }}>
          <SelectBox
            value={config.source}
            onChange={(v) => onChange({ source: v as PosterConfig['source'] })}
            options={sourceOptions}
          />
        </div>
      ) : null}

      <div style={{ marginBottom: 8 }}>
        <ToggleRow
          label="Textless poster"
          sub="Use poster art without title text overlay"
          checked={config.textless}
          onChange={(v) => onChange({ textless: v })}
        />
      </div>
    </div>
  );
});

SourceStep.displayName = 'SourceStep';
export default SourceStep;
