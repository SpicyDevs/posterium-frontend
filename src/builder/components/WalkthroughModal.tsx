import {
  memo,
  useState,
  useCallback,
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
} from 'lucide-react';
import Button from '@/ui/Button';
import SegmentedControl from '@/ui/SegmentedControl';

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

interface Props {
  onComplete: (mode: BuilderMode) => void;
  onDismiss: () => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;

const WalkthroughModal = memo<Props>(({ onComplete, onDismiss, onSkip }) => {
  const [step, setStep] = useState(0);
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(
    () => new Set(['tmdb', 'fanart', 'imdb']),
  );
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'rating' | 'title'>('relevance');
  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [builderMode, setBuilderMode] = useState<BuilderMode>('simple');

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
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const isFirstStep = step === 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <>
      <style>{`
        @keyframes wt-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wt-step {
          animation: wt-fade-in 0.25s ease-out both;
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'var(--film-black)',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Close button — transient dismiss (does NOT save completion) */}
        <button
          onClick={onDismiss}
          aria-label="Close walkthrough"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
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
            zIndex: 10,
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

        {/* Inner container */}
        <div
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '60px 24px 40px',
          }}
        >
          {/* ── Progress bar ────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 48 }}>
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

          {/* ── Step content ────────────────────────────────────────────── */}
          <div className="wt-step" key={step}>
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
                builderMode={builderMode}
                onBuilderModeChange={setBuilderMode}
              />
            )}
          </div>

          {/* ── Bottom bar ──────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(196,124,46,0.08)',
              paddingTop: 20,
            }}
          >
            {/* Skip link — persists skip */}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--film-text-label)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--film-text-ghost)';
              }}
            >
              Skip walkthrough
            </button>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    transition: 'background 0.3s',
                    background:
                      i === step
                        ? 'var(--film-amber)'
                        : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ChevronLeft size={12} />}
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}

              {!isLastStep ? (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ChevronRight size={12} />}
                  onClick={handleNext}
                >
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

/* ─── Step Components ─────────────────────────────────────────────────────── */

function StepTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="poster-font"
      style={{
        fontSize: 32,
        fontWeight: 400,
        color: 'var(--film-cream)',
        margin: 0,
        lineHeight: 1.1,
      }}
    >
      {children}
    </h1>
  );
}

function StepSubtitle({ children }: { children: ReactNode }) {
  return (
    <p
      className="body-font"
      style={{
        fontSize: 13,
        color: 'var(--film-text-dim)',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 1.5,
      }}
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
      <StepSubtitle>
        Select the platforms you want to pull poster data from.
      </StepSubtitle>

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
                background: isSelected
                  ? 'rgba(196,124,46,0.08)'
                  : 'rgba(14,13,11,0.72)',
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
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected
                    ? 'rgba(196,124,46,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: isSelected
                    ? '1px solid rgba(196,124,46,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  flexShrink: 0,
                  color: isSelected
                    ? 'var(--film-amber)'
                    : 'var(--film-text-dim)',
                  transition: 'all 0.15s',
                }}
              >
                {integration.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: isSelected
                      ? 'var(--film-cream)'
                      : 'var(--film-text-label)',
                    transition: 'color 0.15s',
                    marginBottom: 2,
                  }}
                >
                  {integration.label}
                </div>
                <div
                  className="body-font"
                  style={{
                    fontSize: 10,
                    color: 'var(--film-text-ghost)',
                    lineHeight: 1.3,
                  }}
                >
                  {integration.description}
                </div>
              </div>

              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  background: isSelected
                    ? 'var(--film-amber)'
                    : 'rgba(255,255,255,0.04)',
                  border: isSelected
                    ? '1px solid rgba(196,124,46,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {isSelected && (
                  <Check size={10} style={{ color: '#070706' }} />
                )}
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
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(196,124,46,0.08)',
                  border: '1px solid rgba(196,124,46,0.14)',
                  color: 'var(--film-amber)',
                  flexShrink: 0,
                }}
              >
                {integration.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="syne-font"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--film-text-label)',
                    marginBottom: 4,
                  }}
                >
                  {integration.label} API Key
                </div>
                <input
                  type="text"
                  placeholder="Paste API key..."
                  value={apiKeys[integration.id] ?? ''}
                  onChange={(e) => onApiKeyChange(integration.id, e.target.value)}
                  className="mono-font"
                  style={{
                    width: '100%',
                    height: 32,
                    borderRadius: 6,
                    padding: '0 10px',
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--film-pale)',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                />
              </div>
            </div>
          ))}

        {Array.from(selectedIntegrations).length === 0 && (
          <p
            className="body-font"
            style={{
              fontSize: 12,
              color: 'var(--film-text-ghost)',
              textAlign: 'center',
              padding: '24px 0',
              margin: 0,
            }}
          >
            No integrations selected. Go back to Step 1 to choose platforms.
          </p>
        )}
      </div>

      <p
        className="body-font"
        style={{
          fontSize: 10,
          color: 'var(--film-text-ghost)',
          marginTop: 12,
          marginBottom: 0,
          fontStyle: 'italic',
        }}
      >
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
      <StepSubtitle>
        Set your default sorting and media type filters.
      </StepSubtitle>

      <div
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(196,124,46,0.12) transparent',
        }}
      >
        {/* Sort by */}
        <div style={{ marginBottom: 28 }}>
          <div
            className="syne-font"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--film-text-label)',
              marginBottom: 12,
            }}
          >
            Sort By
          </div>
          <SegmentedControl
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={onSortByChange}
            size="sm"
          />
        </div>

        {/* Media type */}
        <div style={{ marginBottom: 8 }}>
          <div
            className="syne-font"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--film-text-label)',
              marginBottom: 12,
            }}
          >
            Media Type
          </div>
          <SegmentedControl
            options={MEDIA_OPTIONS}
            value={mediaType}
            onChange={onMediaTypeChange}
            size="sm"
          />
        </div>
      </div>
    </>
  ),
);

StepCatalogPreferences.displayName = 'StepCatalogPreferences';

/* ─── Step 4: Completion ─────────────────────────────────────────────────── */

interface StepCompletionProps {
  builderMode: BuilderMode;
  onBuilderModeChange: (mode: BuilderMode) => void;
}

const MODE_OPTIONS = [
  { value: 'simple' as BuilderMode, label: 'Simple Builder' },
  { value: 'advanced' as BuilderMode, label: 'Advanced Builder' },
];

const EXPORT_ACTIONS = [
  { label: 'SVG', icon: <Download size={14} /> },
  { label: 'PNG', icon: <Download size={14} /> },
  { label: 'JPG', icon: <Download size={14} /> },
  { label: 'WebP', icon: <Download size={14} /> },
];

const StepCompletion = memo<StepCompletionProps>(
  ({ builderMode, onBuilderModeChange }) => (
    <>
      <StepTitle>You're All Set!</StepTitle>
      <StepSubtitle>
        Your poster builder is configured and ready to go. Choose how you'd like
        to start.
      </StepSubtitle>

      {/* Export quick actions */}
      <div style={{ marginBottom: 28 }}>
        <div
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--film-text-ghost)',
            marginBottom: 10,
          }}
        >
          Export Options
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {EXPORT_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled
              className="syne-font"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'not-allowed',
                opacity: 0.5,
                transition: 'all 0.15s',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--film-text-dim)',
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Builder mode selection */}
      <div style={{ marginBottom: 8 }}>
        <div
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--film-text-ghost)',
            marginBottom: 12,
          }}
        >
          Builder Mode
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
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
                  background: active
                    ? 'rgba(196,124,46,0.08)'
                    : 'rgba(14,13,11,0.72)',
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <Layout
                    size={14}
                    style={{
                      color: active
                        ? 'var(--film-amber)'
                        : 'var(--film-text-dim)',
                    }}
                  />
                  <span
                    className="syne-font"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: active
                        ? 'var(--film-cream)'
                        : 'var(--film-text-label)',
                    }}
                  >
                    {option.label}
                  </span>
                </div>
                <span
                  className="body-font"
                  style={{
                    fontSize: 10,
                    color: 'var(--film-text-ghost)',
                    lineHeight: 1.4,
                    display: 'block',
                  }}
                >
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
