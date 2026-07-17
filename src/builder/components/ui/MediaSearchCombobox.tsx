import { Combobox } from '@headlessui/react';
import { Search, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

interface MediaSearchComboboxProps {
  onQueryChange: (value: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  onSelectResult: (item: SearchResult | null) => void;
  placeholder?: string;
}

const MediaSearchCombobox: React.FC<MediaSearchComboboxProps> = ({
  onQueryChange,
  results,
  isSearching,
  onSelectResult,
  placeholder = 'Search…',
}) => {
  return (
    <Combobox value={null as SearchResult | null} onChange={onSelectResult}>
      <div className="relative">
        <div
          className="relative flex items-center h-9 rounded-lg transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.contains(document.activeElement)) {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <div className="pl-3" style={{ color: 'var(--film-text-dim)', flexShrink: 0 }}>
            {isSearching ? (
              <Loader2
                size={12}
                className="animate-spin"
                style={{ color: 'var(--film-amber)' }}
              />
            ) : (
              <Search size={12} />
            )}
          </div>
          <Combobox.Input
            className="flex-1 bg-transparent border-none text-[11px] placeholder-[var(--film-text-dim)] px-2 focus:outline-none focus:ring-0 h-full syne-font"
            style={{ color: 'var(--film-pale)' }}
            onChange={(e) => onQueryChange(e.target.value)}
            displayValue={() => ''}
            placeholder={placeholder}
          />
        </div>
        {results.length > 0 && (
          <Combobox.Options
            transition
            className="absolute top-full mt-1 z-50 w-full custom-scrollbar py-1.5 focus:outline-none transition duration-75 ease-in data-[closed]:opacity-0 max-h-64 overflow-y-auto"
            style={{
              background: 'var(--film-mid)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {results.map((item) => (
              <Combobox.Option
                key={item.id}
                value={item}
                className={({ active }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                    active && 'bg-[rgba(196,124,46,0.08)]',
                  )
                }
              >
                <img
                  src={item.poster_path}
                  alt=""
                  className="w-8 h-11 object-cover rounded-md shrink-0"
                  style={{ background: 'var(--film-char)' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="syne-font font-medium truncate"
                    style={{ fontSize: 11, color: 'var(--film-cream)' }}
                  >
                    {item.title || item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="mono-font"
                      style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
                    >
                      {(item.release_date || item.first_air_date)?.split('-')[0]}
                    </span>
                    <span
                      className="syne-font px-1 py-px rounded"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          item.media_type === 'tv'
                            ? 'rgba(59,130,246,0.12)'
                            : 'rgba(196,124,46,0.12)',
                        color: item.media_type === 'tv' ? '#60a5fa' : 'var(--film-amber)',
                      }}
                    >
                      {item.media_type}
                    </span>
                  </div>
                </div>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
};

export default MediaSearchCombobox;
