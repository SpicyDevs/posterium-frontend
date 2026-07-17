import {
  memo,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  X,
  Check,
  Film,
  Tv,
  Star,
  Database,
  BookOpen,
  Palette,
  ChevronLeft,
  ChevronRight,
  Download,
  Layout,
  Copy,
  Search,
  Loader2,
  ImageOff,
  ExternalLink,
} from 'lucide-react';
import type { ExtensionType, PosterConfig } from '@/types/poster';
import Button from '@/ui/Button';
import SegmentedControl from '@/ui/SegmentedControl';
import { FilmCorners } from '@/ui/primitives';
import { generateApiUrl } from '@/builder/utils/url-generator';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';
import { DEFAULT_CONFIG } from '@/constants/badges';
import {
  saveIntegrations,
  saveApiKeys,
  savePrefs,
} from '../walkthroughStorage';

type BuilderMode = 'simple' | 'advanced';

interface IntegrationDef {
  id: string;
  label: string;
  icon: ReactNode;
  description: string;
}

const INTEGRATIONS: IntegrationDef[] = [
  { id: 'tmdb', label: 'TMDB', icon: <Film size={16} />, description: 'Movie & TV poster data' },
  { id: 'fanart', label: 'Fanart.tv', icon: <Palette size={16} />, description: 'Fan art & alternative posters' },
  { id: 'imdb', label: 'IMDb', icon: <Star size={16} />, description: 'Ratings & metadata' },
  { id: 'mal', label: 'MyAnimeList', icon: <Tv size={16} />, description: 'Anime & manga data' },
  { id: 'anilist', label: 'AniList', icon: <BookOpen size={16} />, description: 'Anime tracking & metadata' },
  { id: 'metahub', label: 'Metahub', icon: <Database size={16} />, description: 'Aggregated metadata' },
];

interface SearchResultItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
}

interface PosterSelection {
  tmdbId?: string;
  imdbId?: string;
  mediaType: 'movie' | 'tv';
  title: string;
  year: string;
  source: string;
}

interface Props {
  onComplete: (mode: BuilderMode) => void;
  onDismiss: () => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;
const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
];

const WalkthroughModal = memo<Props>(({ onComplete, onDismiss, onSkip }) => {
  const [step, setStep] = useState(0);
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(
    () => new Set(['tmdb', 'fanart', 'imdb']),
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'rating' | 'title'>('relevance');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [builderMode, setBuilderMode] = useState<BuilderMode>('simple');
  const [poster, setPoster] = useState<PosterSelection | null>(null);
  const [exportFormat, setExportFormat] = useState<ExtensionType>('png');
  const [copied, setCopied] = useState<'url' | 'aio' | 'builder' | null>(null);
  const [downloading, setDownloading] = useState(false);

  const toggleIntegration = useCallback((id: string) => {
    setSelectedIntegrations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApiKeyChange = useCallback((id: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (step === 0) saveIntegrations(Array.from(selectedIntegrations));
    if (step === 1) saveApiKeys(apiKeys);
    if (step === 2) savePrefs({ sortBy, mediaType });
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }, [step, selectedIntegrations, apiKeys, sortBy, mediaType]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const isFirstStep = step === 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const hasPoster = poster !== null;

  const exportUrl = useMemo(() => {
    if (!hasPoster) return '';
    try {
      const partial: PosterConfig = {
        ...DEFAULT_CONFIG,
        extension: exportFormat,
        mediaType: poster.mediaType,
        source: poster.source as PosterConfig['source'],
        ...(poster.tmdbId && { tmdbId: poster.tmdbId, imdbId: undefined }),
        ...(poster.imdbId && { imdbId: poster.imdbId, tmdbId: '' }),
        ratings: ['imdb', 'rt', 'meta'],
        items: {},
      };
      return generateApiUrl(partial, DEFAULT_API_BASE);
    } catch {
      return '';
    }
  }, [hasPoster, poster, exportFormat]);

  const handleCopyUrl = useCallback(async () => {
    if (!exportUrl) return;
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied('url');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* */ }
  }, [exportUrl]);

  const handleDownload = useCallback(() => {
    if (!exportUrl) return;
    setDownloading(true);
    try {
      const u = new URL(exportUrl);
      u.searchParams.set('download', '');
      window.open(u.toString(), '_blank', 'noopener,noreferrer');
    } catch { /* */ }
    setTimeout(() => setDownloading(false), 800);
  }, [exportUrl]);

  const handleAioCopy = useCallback(async () => {
    if (!exportUrl) return;
    try {
      const templateUrl = exportUrl.replace(/\/poster\/[^.]+\./, '/poster/{imdb_id}.');
      const safe = templateUrl.includes('{imdb_id}') ? templateUrl : exportUrl;
      await navigator.clipboard.writeText(safe);
      setCopied('aio');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* */ }
  }, [exportUrl]);

  const handleBuilderCopy = useCallback(async () => {
    if (!exportUrl) return;
    try {
      const link = `${window.location.origin}/build?url=${encodeURIComponent(exportUrl)}`;
      await navigator.clipboard.writeText(link);
      setCopied('builder');
      setTimeout(() => setCopied(null), 2000);
    } catch { /* */ }
  }, [exportUrl]);

  return (
    <>
      <style>{`
        @keyframes wt-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wt-step { animation: wt-fade-in 0.25s ease-out both; }
        @keyframes wt-spin { to { transform: rotate(360deg); } }
        .wt-spinner { animation: wt-spin 0.8s linear infinite; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'var(--film-black)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Close walkthrough"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 110,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(196,124,46,0.12)',
            color: 'rgba(140,130,112,0.6)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--film-cream)';
            e.currentTarget.style.borderColor = 'rgba(196,124,46,0.24)';
            e.currentTarget.style.background = 'rgba(196,124,46,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(140,130,112,0.6)';
            e.currentTarget.style.borderColor = 'rgba(196,124,46,0.12)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <X size={14} />
        </button>

        <div
          style={{
            width: '100%',
            maxWidth: 960,
            margin: '0 auto',
            padding: '40px 24px 24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  transition: 'background 0.3s ease',
                  background:
                    i < step
                      ? 'var(--film-amber)'
                      : i === step
                        ? 'var(--film-gold)'
                        : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>

          {/* Main content: split layout */}
          <div style={{ display: 'flex', gap: 28, flex: 1, minHeight: 0 }}>
            {/* Left: step content */}
            <div
              style={{
                flex: '1 1 55%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="wt-step" key={step} style={{ flex: 1 }}>
                {step === 0 && (
                  <StepIntegrationSetup
                    integrations={INTEGRATIONS}
                    selected={selectedIntegrations}
                    onToggle={toggleIntegration}
                  />
                )}
                {step === 1 && (
                  <StepConnections
                    integrations={INTEGRATIONS}
                    selectedIntegrations={selectedIntegrations}
                    apiKeys={apiKeys}
                    onApiKeyChange={handleApiKeyChange}
                  />
                )}
                {step === 2 && (
                  <StepCatalogPreferences
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    mediaType={mediaType}
                    onMediaTypeChange={setMediaType}
                  />
                )}
                {step === 3 && (
                  <StepCompletion
                    hasPoster={hasPoster}
                    exportFormat={exportFormat}
                    onExportFormatChange={setExportFormat}
                    copied={copied}
                    downloading={downloading}
                    onCopyUrl={handleCopyUrl}
                    onDownload={handleDownload}
                    onAioCopy={handleAioCopy}
                    onBuilderCopy={handleBuilderCopy}
                    builderMode={builderMode}
                    onBuilderModeChange={setBuilderMode}
                  />
                )}
              </div>
            </div>

            {/* Right: poster preview */}
            <div
              style={{
                flex: '0 0 340px',
                maxWidth: 340,
              }}
              className="max-[800px]:hidden"
            >
              <PosterPreviewPane
                poster={poster}
                onPosterChange={setPoster}
              />
            </div>
          </div>

          {/* Mobile poster preview (visible below 800px) */}
          <div
            className="min-[801px]:hidden"
            style={{ marginTop: 16, marginBottom: 8 }}
          >
            <PosterPreviewPane
              poster={poster}
              onPosterChange={setPoster}
              compact
            />
          </div>

          {/* Bottom bar */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(196,124,46,0.08)',
              paddingTop: 16,
              flexShrink: 0,
            }}
          >
            <button
              onClick={onSkip}
              className="syne-font"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--film-text-ghost)',
                cursor: 'pointer',
                transition: 'color 0.15s',
                padding: '6px 0',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--film-text-label)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--film-text-ghost)'; }}
            >
              Skip walkthrough
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    transition: 'background 0.3s',
                    background: i === step ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirstStep && (
                <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={12} />} onClick={handleBack}>
                  Back
                </Button>
              )}
              {!isLastStep ? (
                <Button variant="primary" size="sm" rightIcon={<ChevronRight size={12} />} onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ChevronRight size={12} />}
                  onClick={() => onComplete(builderMode)}
                >
                  Launch Builder
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

WalkthroughModal.displayName = 'WalkthroughModal';
export default WalkthroughModal;

/* ─── Poster Preview Pane ───────────────────────────────────────────────── */

interface PosterPreviewPaneProps {
  poster: PosterSelection | null;
  onPosterChange: (p: PosterSelection | null) => void;
  compact?: boolean;
}

const PosterPreviewPane = memo<PosterPreviewPaneProps>(({ poster, onPosterChange, compact }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Close results on click outside
  useEffect(() => {
    if (!showResults) return;
    const handler = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showResults]);

  // Debounced search
  useEffect(() => {
    if (!query || query.startsWith('tt') || /^\d+$/.test(query)) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
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
        const data: SearchResultItem[] = await res.json();
        const filtered = data.filter(
          (r) => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'),
        );
        setResults(filtered);
        setShowResults(filtered.length > 0);
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

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setShowResults(false);
    setImageLoaded(false);
    setImageError(false);

    // Direct ID entry
    if (value.startsWith('tt') && value.length > 3) {
      onPosterChange({
        imdbId: value,
        mediaType: 'movie',
        title: `IMDb ${value}`,
        year: '',
        source: 'tmdb',
      });
    } else if (/^\d+$/.test(value) && value.length > 2) {
      onPosterChange({
        tmdbId: value,
        mediaType: 'movie',
        title: `TMDB ${value}`,
        year: '',
        source: 'tmdb',
      });
    }
  }, [onPosterChange]);

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      onPosterChange({
        tmdbId: item.id.toString(),
        mediaType: item.media_type,
        title: item.title || item.name || '',
        year: (item.release_date || item.first_air_date || '').split('-')[0],
        source: 'tmdb',
      });
      setQuery(item.title || item.name || '');
      setShowResults(false);
      setImageLoaded(false);
      setImageError(false);
    },
    [onPosterChange],
  );

  const posterUrl = useMemo(() => {
    if (!poster) return '';
    const id = poster.imdbId || poster.tmdbId || '';
    const type = poster.imdbId ? 'poster' : poster.mediaType;
    return `${DEFAULT_API_BASE}/${type}/${id}.svg?source=${poster.source}&_t=${id}`;
  }, [poster]);

  const paneHeight = compact ? 220 : 400;

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(196,124,46,0.14)',
        background: 'rgba(14,13,11,0.72)',
        height: compact ? 'auto' : '100%',
      }}
    >
      {/* Search / ID input */}
      <div style={{ padding: 12, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 36,
            padding: '0 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {isSearching ? (
            <Loader2 size={14} className="wt-spinner" style={{ color: 'var(--film-text-ghost)', flexShrink: 0 }} />
          ) : (
            <Search size={14} style={{ color: 'var(--film-text-ghost)', flexShrink: 0 }} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            placeholder="Search or paste IMDb/TMDB ID..."
            className="body-font"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 11,
              color: 'var(--film-cream)',
              minWidth: 0,
            }}
          />
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            style={{
              position: 'absolute',
              top: 52,
              left: 12,
              right: 12,
              zIndex: 50,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(196,124,46,0.18)',
              background: 'rgba(18,17,14,0.98)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
              maxHeight: 220,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(196,124,46,0.12) transparent',
            }}
          >
            {results.map((item) => {
              const title = item.title || item.name || '';
              const year = (item.release_date || item.first_air_date || '').split('-')[0];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,124,46,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <img
                    src={item.poster_path}
                    alt=""
                    style={{ width: 32, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="syne-font" style={{ fontSize: 10, color: 'var(--film-cream)', fontWeight: 700 }}>
                      {title}
                    </div>
                    {year && (
                      <div className="body-font" style={{ fontSize: 9, color: 'var(--film-text-ghost)' }}>
                        {year}
                      </div>
                    )}
                  </div>
                  <span
                    className="mono-font"
                    style={{ fontSize: 8, color: 'var(--film-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  >
                    {item.media_type}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Poster image */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '2 / 3',
          maxHeight: compact ? 160 : paneHeight - 80,
          margin: '0 12px 12px',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(7,7,6,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {posterUrl ? (
          <>
            {!imageLoaded && !imageError && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(110deg, #111009 25%, #1a1712 50%, #111009 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.8s linear infinite',
                }}
              />
            )}
            <img
              src={posterUrl}
              alt={poster?.title ?? 'Poster preview'}
              onLoad={() => { setImageLoaded(true); setImageError(false); }}
              onError={() => { setImageLoaded(true); setImageError(true); }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: imageLoaded && !imageError ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
            <FilmCorners />
            {imageError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: 'var(--film-text-ghost)',
                }}
              >
                <ImageOff size={24} />
                <span className="body-font" style={{ fontSize: 10 }}>Poster not found</span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--film-text-ghost)',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <Film size={28} />
            <span className="body-font" style={{ fontSize: 10, lineHeight: 1.4 }}>
              Search for a movie or TV show to preview
            </span>
          </div>
        )}
      </div>

      {/* Media info */}
      {poster && (
        <div style={{ padding: '0 12px 12px' }}>
          <div className="syne-font" style={{ fontSize: 11, fontWeight: 700, color: 'var(--film-cream)', marginBottom: 2 }}>
            {poster.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {poster.year && (
              <span className="body-font" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>{poster.year}</span>
            )}
            <span
              className="mono-font"
              style={{
                fontSize: 8,
                padding: '1px 5px',
                borderRadius: 3,
                background: 'rgba(196,124,46,0.1)',
                border: '1px solid rgba(196,124,46,0.2)',
                color: 'var(--film-amber)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {poster.mediaType}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

PosterPreviewPane.displayName = 'PosterPreviewPane';

/* ─── Step UI Primitives ────────────────────────────────────────────────── */

function StepTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="poster-font"
      style={{ fontSize: 32, fontWeight: 400, color: 'var(--film-cream)', margin: 0, lineHeight: 1.1 }}
    >
      {children}
    </h1>
  );
}

function StepSubtitle({ children }: { children: ReactNode }) {
  return (
    <p
      className="body-font"
      style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8, marginBottom: 24, lineHeight: 1.5 }}
    >
      {children}
    </p>
  );
}

/* ─── Step 1: Integration Setup ──────────────────────────────────────────── */

interface StepIntegrationSetupProps {
  integrations: IntegrationDef[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

const StepIntegrationSetup = memo<StepIntegrationSetupProps>(
  ({ integrations, selected, onToggle }) => (
    <>
      <StepTitle>Choose Integrations</StepTitle>
      <StepSubtitle>Select the platforms you want to pull poster data from.</StepSubtitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {integrations.map((integration) => {
          const isSelected = selected.has(integration.id);
          return (
            <button
              key={integration.id}
              type="button"
              onClick={() => onToggle(integration.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'inherit',
                background: isSelected ? 'rgba(196,124,46,0.08)' : 'rgba(14,13,11,0.72)',
                border: isSelected
                  ? '1px solid rgba(196,124,46,0.35)'
                  : '1px solid rgba(196,124,46,0.14)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(196,124,46,0.24)';
                  e.currentTarget.style.background = 'rgba(24,22,18,0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(196,124,46,0.14)';
                  e.currentTarget.style.background = 'rgba(14,13,11,0.72)';
                }
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? 'rgba(196,124,46,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1px solid rgba(196,124,46,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  flexShrink: 0, color: isSelected ? 'var(--film-amber)' : 'var(--film-text-dim)', transition: 'all 0.15s',
                }}
              >
                {integration.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: isSelected ? 'var(--film-cream)' : 'var(--film-text-label)', transition: 'color 0.15s', marginBottom: 2,
                  }}
                >
                  {integration.label}
                </div>
                <div className="body-font" style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.3 }}>
                  {integration.description}
                </div>
              </div>
              <div
                style={{
                  width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                  background: isSelected ? 'var(--film-amber)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1px solid rgba(196,124,46,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {isSelected && <Check size={10} style={{ color: '#070706' }} />}
              </div>
            </button>
          );
        })}
      </div>
    </>
  ),
);

StepIntegrationSetup.displayName = 'StepIntegrationSetup';

/* ─── Step 2: Connections ────────────────────────────────────────────────── */

interface StepConnectionsProps {
  integrations: IntegrationDef[];
  selectedIntegrations: Set<string>;
  apiKeys: Record<string, string>;
  onApiKeyChange: (id: string, value: string) => void;
}

const StepConnections = memo<StepConnectionsProps>(
  ({ integrations, selectedIntegrations, apiKeys, onApiKeyChange }) => (
    <>
      <StepTitle>API Keys</StepTitle>
      <StepSubtitle>
        Connect your accounts (optional — you can do this later in Settings).
      </StepSubtitle>
      <div
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(196,124,46,0.12) transparent',
        }}
      >
        {integrations
          .filter((i) => selectedIntegrations.has(i.id))
          .map((integration) => (
            <div
              key={integration.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(196,124,46,0.08)', border: '1px solid rgba(196,124,46,0.14)', color: 'var(--film-amber)', flexShrink: 0,
                }}
              >
                {integration.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="syne-font" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--film-text-label)', marginBottom: 4 }}>
                  {integration.label} API Key
                </div>
                <input
                  type="text"
                  placeholder="Paste API key..."
                  value={apiKeys[integration.id] ?? ''}
                  onChange={(e) => onApiKeyChange(integration.id, e.target.value)}
                  className="mono-font"
                  style={{
                    width: '100%', height: 32, borderRadius: 6, padding: '0 10px', fontSize: 11,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--film-pale)', outline: 'none', transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(196,124,46,0.4)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
            </div>
          ))}
        {Array.from(selectedIntegrations).length === 0 && (
          <p className="body-font" style={{ fontSize: 12, color: 'var(--film-text-ghost)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
            No integrations selected. Go back to Step 1 to choose platforms.
          </p>
        )}
      </div>
      <p className="body-font" style={{ fontSize: 10, color: 'var(--film-text-ghost)', marginTop: 12, marginBottom: 0, fontStyle: 'italic' }}>
        API keys are stored locally and never sent to our servers.
      </p>
    </>
  ),
);

StepConnections.displayName = 'StepConnections';

/* ─── Step 3: Catalog Preferences ────────────────────────────────────────── */

interface StepCatalogPreferencesProps {
  sortBy: 'relevance' | 'year' | 'rating' | 'title';
  onSortByChange: (v: 'relevance' | 'year' | 'rating' | 'title') => void;
  mediaType: 'all' | 'movie' | 'tv' | 'anime';
  onMediaTypeChange: (v: 'all' | 'movie' | 'tv' | 'anime') => void;
}

const SORT_OPTIONS = [
  { value: 'relevance' as const, label: 'Relevance' },
  { value: 'year' as const, label: 'Year' },
  { value: 'rating' as const, label: 'Rating' },
  { value: 'title' as const, label: 'Title' },
];

const MEDIA_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'movie' as const, label: 'Movies' },
  { value: 'tv' as const, label: 'TV' },
  { value: 'anime' as const, label: 'Anime' },
];

const StepCatalogPreferences = memo<StepCatalogPreferencesProps>(
  ({ sortBy, onSortByChange, mediaType, onMediaTypeChange }) => (
    <>
      <StepTitle>Catalog Preferences</StepTitle>
      <StepSubtitle>Set your default sorting and media type filters.</StepSubtitle>
      <div style={{ maxHeight: 340, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(196,124,46,0.12) transparent' }}>
        <div style={{ marginBottom: 28 }}>
          <div className="syne-font" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--film-text-label)', marginBottom: 12 }}>
            Sort By
          </div>
          <SegmentedControl options={SORT_OPTIONS} value={sortBy} onChange={onSortByChange} size="sm" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div className="syne-font" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--film-text-label)', marginBottom: 12 }}>
            Media Type
          </div>
          <SegmentedControl options={MEDIA_OPTIONS} value={mediaType} onChange={onMediaTypeChange} size="sm" />
        </div>
      </div>
    </>
  ),
);

StepCatalogPreferences.displayName = 'StepCatalogPreferences';

/* ─── Step 4: Completion + Export ────────────────────────────────────────── */

interface StepCompletionProps {
  hasPoster: boolean;
  exportFormat: ExtensionType;
  onExportFormatChange: (f: ExtensionType) => void;
  copied: 'url' | 'aio' | 'builder' | null;
  downloading: boolean;
  onCopyUrl: () => void;
  onDownload: () => void;
  onAioCopy: () => void;
  onBuilderCopy: () => void;
  builderMode: BuilderMode;
  onBuilderModeChange: (mode: BuilderMode) => void;
}

const MODE_OPTIONS = [
  { value: 'simple' as BuilderMode, label: 'Simple Builder' },
  { value: 'advanced' as BuilderMode, label: 'Advanced Builder' },
];

const StepCompletion = memo<StepCompletionProps>(
  ({
    hasPoster,
    exportFormat,
    onExportFormatChange,
    copied,
    downloading,
    onCopyUrl,
    onDownload,
    onAioCopy,
    onBuilderCopy,
    builderMode,
    onBuilderModeChange,
  }) => (
    <>
      <StepTitle>You're All Set!</StepTitle>
      <StepSubtitle>
        Your poster builder is configured and ready to go. Choose how you'd like to start.
      </StepSubtitle>

      {/* Export section */}
      <div style={{ marginBottom: 24 }}>
        <div className="syne-font" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 10 }}>
          Export Options
        </div>

        {/* Format selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {EXT_OPTIONS.map((ext) => (
            <button
              key={ext.id}
              type="button"
              onClick={() => onExportFormatChange(ext.id)}
              className="syne-font"
              style={{
                flex: 1,
                height: 34,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: exportFormat === ext.id ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                border: exportFormat === ext.id
                  ? '1px solid rgba(196,124,46,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: exportFormat === ext.id ? 'var(--film-pale)' : 'var(--film-text-dim)',
              }}
            >
              {ext.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
          <ActionButton
            disabled={!hasPoster}
            icon={copied === 'url' ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
            label={copied === 'url' ? 'Copied' : 'Copy URL'}
            onClick={onCopyUrl}
          />
          <ActionButton
            disabled={!hasPoster}
            icon={downloading ? <Loader2 size={12} className="wt-spinner" /> : <Download size={12} />}
            label={downloading ? '...' : 'Download'}
            onClick={onDownload}
            amber
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
          <ActionButton
            disabled={!hasPoster}
            icon={copied === 'aio' ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
            label={copied === 'aio' ? 'Copied' : 'Copy for AIOMetadata'}
            onClick={onAioCopy}
          />
          <ActionButton
            disabled={!hasPoster}
            icon={copied === 'builder' ? <Check size={12} style={{ color: '#34d399' }} /> : <ExternalLink size={12} />}
            label={copied === 'builder' ? 'Copied' : 'Copy Builder Link'}
            onClick={onBuilderCopy}
          />
        </div>

        {!hasPoster && (
          <p className="body-font" style={{ fontSize: 9, color: 'var(--film-text-ghost)', margin: '4px 0 0', fontStyle: 'italic', textAlign: 'center' }}>
            Search for a poster in the panel on the right to enable export options
          </p>
        )}
      </div>

      {/* Builder mode selection */}
      <div style={{ marginBottom: 8 }}>
        <div className="syne-font" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 12 }}>
          Builder Mode
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {MODE_OPTIONS.map((option) => {
            const active = builderMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onBuilderModeChange(option.value)}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                  background: active ? 'rgba(196,124,46,0.08)' : 'rgba(14,13,11,0.72)',
                  border: active
                    ? '1px solid rgba(196,124,46,0.35)'
                    : '1px solid rgba(196,124,46,0.14)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.24)';
                    e.currentTarget.style.background = 'rgba(24,22,18,0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.14)';
                    e.currentTarget.style.background = 'rgba(14,13,11,0.72)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Layout size={14} style={{ color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }} />
                  <span className="syne-font" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: active ? 'var(--film-cream)' : 'var(--film-text-label)' }}>
                    {option.label}
                  </span>
                </div>
                <span className="body-font" style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.4, display: 'block' }}>
                  {option.value === 'simple'
                    ? 'Unified panels with source search, layers, and badge editing.'
                    : 'Dedicated panel navigation for source, layers, badges, and selection.'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  ),
);

StepCompletion.displayName = 'StepCompletion';

/* ─── Action Button (Export helper) ──────────────────────────────────────── */

interface ActionButtonProps {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  amber?: boolean;
}

const ActionButton = memo<ActionButtonProps>(({ disabled, icon, label, onClick, amber }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="syne-font"
    style={{
      height: 34,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s',
      background: amber ? 'var(--film-amber)' : 'rgba(255,255,255,0.03)',
      border: amber ? '1px solid rgba(196,124,46,0.3)' : '1px solid rgba(255,255,255,0.08)',
      color: amber ? '#070706' : 'var(--film-text-dim)',
    }}
  >
    {icon}
    {label}
  </button>
));

ActionButton.displayName = 'ActionButton';
