import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { BuilderMode } from '@/builder/components/ModeToggle';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/constants/badges';
import EntryChoice from './EntryChoice';
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

const WalkthroughModal = memo<WalkthroughModalProps>(
  ({ onComplete, onDismiss, onSkip, presets = [] }) => {
    const [entryChoice, setEntryChoice] = useState<
      'walkthrough' | 'simple' | 'advanced' | 'community' | null
    >(null);
    const [step, setStep] = useState(0);
    const [config, setConfig] = useState<PosterConfig>(() => ({ ...DEFAULT_CONFIG }));
    const [stepSnapshot, setStepSnapshot] = useState<PosterConfig>({ ...DEFAULT_CONFIG });
    const [builderMode, setBuilderMode] = useState<BuilderMode>('simple');
    const stepRef = useRef(step);
    stepRef.current = step;

    // Handle entry choice
    const handleEntryChoice = useCallback(
      (choice: 'walkthrough' | 'simple' | 'advanced' | 'community') => {
        if (choice === 'simple') {
          onComplete('simple', { ...DEFAULT_CONFIG });
          return;
        }
        if (choice === 'advanced') {
          onComplete('advanced', { ...DEFAULT_CONFIG });
          return;
        }
        if (choice === 'community') {
          setEntryChoice('community');
          return;
        }
        // 'walkthrough' → go straight into the guided step wizard
        setEntryChoice('walkthrough');
        setStep(0);
        setStepSnapshot({ ...config });
      },
      [onComplete, config]
    );

    const handleBackToEntry = useCallback(() => {
      setEntryChoice(null);
    }, []);

    // Community presets: pick one and go straight to builder
    const handleSelectPreset = useCallback(
      (presetConfig: PosterConfig) => {
        onComplete('simple', presetConfig);
      },
      [onComplete]
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
      const nextStep = stepRef.current + 1;
      const reverted = { ...stepSnapshot };
      setStepSnapshot(reverted);
      setConfig(reverted);
      setStep(nextStep);
    }, [stepSnapshot]);

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

    const isGuided = entryChoice === 'walkthrough';
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
              maxWidth: entryChoice === null || entryChoice === 'community' ? 520 : 960,
              margin: '0 auto',
              padding: '40px 24px 24px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Entry choice screen */}
            {entryChoice === null && <EntryChoice onChoose={handleEntryChoice} />}

            {/* Community presets screen */}
            {entryChoice === 'community' && (
              <>
                <button
                  type="button"
                  onClick={handleBackToEntry}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--film-text-label)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--film-text-ghost)';
                  }}
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
                      {step === 0 && <SourceStep config={config} onChange={updateConfig} />}
                      {step === 1 && <ThemeStep config={config} onChange={updateConfig} />}
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
                      {step === 4 && <MiscStep config={config} onChange={updateConfig} />}
                      {step === 5 && <LayoutStep config={config} onChange={updateConfig} />}
                      {step === 6 && (
                        <ExportStep
                          config={config}
                          onChange={updateConfig}
                          builderMode={builderMode}
                          setBuilderMode={setBuilderMode}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: live preview — shared across all steps */}
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
  }
);

WalkthroughModal.displayName = 'WalkthroughModal';
export default WalkthroughModal;
