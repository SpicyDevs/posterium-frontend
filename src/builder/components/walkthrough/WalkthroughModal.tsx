import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { X, Layout, Sliders } from 'lucide-react';
import type { BuilderMode } from '@/builder/components/ModeToggle';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/constants/badges';
import EntryChoice from './EntryChoice';
import BranchChoice from './BranchChoice';
import CommunityPresetsStep from './CommunityPresetsStep';
import LiveWalkthroughPreview from './LiveWalkthroughPreview';
import WizardChrome from './WizardChrome';
import SourceStep from './steps/SourceStep';
import ThemeStep from './steps/ThemeStep';
import IconStyleStep from './steps/IconStyleStep';
import RatingsStep from './steps/RatingsStep';
import MiscStep from './steps/MiscStep';
import LayoutStep from './steps/LayoutStep';
import ExportStep from './steps/ExportStep';

interface ExamplePreset {
  id: string;
  title: string;
  description: string;
  query: string;
}

interface WalkthroughModalProps {
  onComplete: (mode: BuilderMode, config: PosterConfig) => void;
  onDismiss: () => void;
  onSkip: () => void;
  presets?: ExamplePreset[];
}

const STEPS = [
  { id: 'source', label: 'Source' },
  { id: 'theme', label: 'Theme' },
  { id: 'iconStyle', label: 'Icon Style' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'misc', label: 'Misc' },
  { id: 'layout', label: 'Layout' },
  { id: 'export', label: 'Export' },
];

const WalkthroughModal = memo<WalkthroughModalProps>(({ onComplete, onDismiss, onSkip, presets = [] }) => {
  const [entryChoice, setEntryChoice] = useState<'walkthrough' | 'simple' | 'advanced' | null>(null);
  const [branch, setBranch] = useState<'guided' | 'community' | null>(null);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<PosterConfig>(() => ({ ...DEFAULT_CONFIG }));
  const [stepSnapshot, setStepSnapshot] = useState<PosterConfig>({ ...DEFAULT_CONFIG });
  const [builderMode, setBuilderMode] = useState<BuilderMode>('simple');
  const stepRef = useRef(step);
  stepRef.current = step;

  // Handle entry choice
  const handleEntryChoice = useCallback(
    (choice: 'walkthrough' | 'simple' | 'advanced') => {
      if (choice === 'simple') {
        onComplete('simple', { ...DEFAULT_CONFIG });
        return;
      }
      if (choice === 'advanced') {
        onComplete('advanced', { ...DEFAULT_CONFIG });
        return;
      }
      setEntryChoice('walkthrough');
    },
    [onComplete],
  );

  // Handle branch choice
  const handleBranchChoice = useCallback(
    (chosen: 'guided' | 'community') => {
      setBranch(chosen);
      if (chosen === 'guided') {
        setStep(0);
        setStepSnapshot({ ...config });
      }
    },
    [config],
  );

  const handleBackToEntry = useCallback(() => {
    setEntryChoice(null);
  }, []);

  const handleBackToBranch = useCallback(() => {
    setBranch(null);
    setStep(0);
  }, []);

  // Community presets: pick one and go straight to builder
  const handleSelectPreset = useCallback(
    (presetConfig: PosterConfig) => {
      onComplete('simple', presetConfig);
    },
    [onComplete],
  );

  // Guided setup step navigation
  const handleNext = useCallback(() => {
    const nextStep = stepRef.current + 1;
    if (nextStep >= STEPS.length) {
      // Export step — finalize
      onComplete(builderMode, config);
      return;
    }
    setStepSnapshot({ ...config });
    setStep(nextStep);
  }, [config, builderMode, onComplete]);

  const handleBack = useCallback(() => {
    if (stepRef.current <= 0) return;
    setConfig({ ...stepSnapshot });
    setStep(stepRef.current - 1);
  }, [stepSnapshot]);

  const handleSkip = useCallback(() => {
    if (stepRef.current >= STEPS.length - 1) return;
    // Restore pre-step snapshot (discard changes from this step)
    setConfig({ ...stepSnapshot });
    const nextStep = stepRef.current + 1;
    setStepSnapshot({ ...config });
    setStep(nextStep);
  }, [stepSnapshot, config]);

  const handleSkipWalkthrough = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // Config partial update helper
  const updateConfig = useCallback((updates: Partial<PosterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    if (entryChoice === null) return; // Only capture Escape once the user has engaged
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entryChoice, onDismiss]);

  // Back-button handling
  useEffect(() => {
    if (entryChoice === null) return;
    window.history.pushState({ modal: 'walkthrough' }, '');
    const handlePop = (e: PopStateEvent) => {
      e.preventDefault();
      onDismiss();
    };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      if (window.history.state?.modal === 'walkthrough') {
        window.history.back();
      }
    };
  }, [entryChoice, onDismiss]);

  const isGuided = branch === 'guided';
  const currentStep = STEPS[step];
  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes wt-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wt-step { animation: wt-fade-in 0.25s ease-out both; }
        @keyframes wt-spin { to { transform: rotate(360deg); } }
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
        {/* Close button — only show once the user has engaged */}
        {entryChoice !== null && (
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
        )}

        <div
          style={{
            width: '100%',
            maxWidth: entryChoice === null || branch === null ? 520 : 960,
            margin: '0 auto',
            padding: entryChoice === null || branch === null ? '40px 24px 24px' : '40px 24px 24px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Entry choice screen */}
          {entryChoice === null && (
            <EntryChoice onChoose={handleEntryChoice} />
          )}

          {/* Branch choice screen */}
          {entryChoice === 'walkthrough' && branch === null && (
            <BranchChoice onChoose={handleBranchChoice} onBack={handleBackToEntry} />
          )}

          {/* Community presets screen */}
          {entryChoice === 'walkthrough' && branch === 'community' && (
            <>
              <button
                type="button"
                onClick={handleBackToBranch}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: 'var(--film-text-ghost)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  marginBottom: 16,
                  fontFamily: 'inherit',
                  fontSize: 11,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--film-text-label)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--film-text-ghost)'; }}
              >
                <X size={14} /> Back to choices
              </button>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <CommunityPresetsStep presets={presets} onSelectPreset={handleSelectPreset} />
              </div>
            </>
          )}

          {/* Guided setup — step wizard */}
          {isGuided && (
            <>
              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
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

              {/* Step label */}
              <div
                className="syne-font"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--film-text-ghost)',
                  marginBottom: 8,
                }}
              >
                Step {step + 1} of {STEPS.length} — {currentStep.label}
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
                      <SourceStep config={config} onChange={updateConfig} />
                    )}
                    {step === 1 && (
                      <ThemeStep config={config} onChange={updateConfig} />
                    )}
                    {step === 2 && (
                      <IconStyleStep
                        iconType={config.iconType ?? 1}
                        onChange={(v) => updateConfig({ iconType: v })}
                      />
                    )}
                    {step === 3 && (
                      <RatingsStep
                        ratings={config.ratings}
                        onChange={(v) => updateConfig({ ratings: v })}
                      />
                    )}
                    {step === 4 && (
                      <MiscStep config={config} onChange={updateConfig} />
                    )}
                    {step === 5 && (
                      <LayoutStep config={config} onChange={updateConfig} />
                    )}
                    {step === 6 && (
                      <>
                        <ExportStep config={config} />
                        {/* Builder mode selection */}
                        <div style={{ marginTop: 20, marginBottom: 8 }}>
                          <div
                            className="syne-font"
                            style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 12 }}
                          >
                            Builder Mode
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            {[
                              { value: 'simple' as BuilderMode, label: 'Simple Builder', desc: 'Unified panels with source search, layers, and badge editing.' },
                              { value: 'advanced' as BuilderMode, label: 'Advanced Builder', desc: 'Dedicated panel navigation for source, layers, badges, and selection.' },
                            ].map((option) => {
                              const active = builderMode === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setBuilderMode(option.value)}
                                  style={{
                                    flex: 1,
                                    padding: '12px 14px',
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
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    {option.value === 'simple' ? <Layout size={14} style={{ color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }} /> : <Sliders size={14} style={{ color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }} />}
                                    <span className="syne-font" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: active ? 'var(--film-cream)' : 'var(--film-text-label)' }}>
                                      {option.label}
                                    </span>
                                  </div>
                                  <span className="body-font" style={{ fontSize: 9, color: 'var(--film-text-ghost)', lineHeight: 1.3, display: 'block' }}>
                                    {option.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: live preview */}
                <div
                  style={{
                    flex: '0 0 280px',
                    maxWidth: 280,
                  }}
                  className="max-[800px]:hidden"
                >
                  <LiveWalkthroughPreview config={config} />
                </div>
              </div>

              {/* Mobile live preview */}
              <div className="min-[801px]:hidden" style={{ marginTop: 16, marginBottom: 8 }}>
                <LiveWalkthroughPreview config={config} compact />
              </div>

              {/* Bottom bar */}
              <WizardChrome
                step={step}
                totalSteps={STEPS.length}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                onBack={handleBack}
                onSkip={handleSkip}
                onNext={handleNext}
                onSkipWalkthrough={handleSkipWalkthrough}
                nextLabel={isLastStep ? 'Launch Builder' : undefined}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
});

WalkthroughModal.displayName = 'WalkthroughModal';
export default WalkthroughModal;
