import React, { memo, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { PosterConfig, RatingType } from '../../types';
import { ALL_BADGES } from '../../types';
import { useEditor } from '../../context/EditorContext';
import ModeToggle, { type BuilderMode } from '../navigation/ModeToggle';
import SourcePanel from '../panels/SourcePanel';
import StepIndicator from './StepIndicator';
import SkeletonLayoutSelector from './SkeletonLayoutSelector';
import RevealAndExport from './RevealAndExport';

const STEPS = ['Choose Media', 'Choose Layout', 'Select Ratings', 'Reveal & Export'] as const;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  mode: BuilderMode;
  onModeChange: (mode: BuilderMode) => void;
}

const WalkthroughLayout: React.FC<Props> = memo(
  ({ config, setConfig, baseUrl, handleLoadConfig, mode, onModeChange }) => {
    const { selectedIds, handleSelection } = useEditor();
    const [step, setStep] = useState(0);

    const canContinue = useMemo(() => {
      if (step === 0) return Boolean(config.tmdbId || config.imdbId);
      if (step === 2) return config.ratings.length > 0;
      return true;
    }, [step, config.tmdbId, config.imdbId, config.ratings.length]);

    const toggleBadge = (id: RatingType) => {
      setConfig((prev) =>
        prev.ratings.includes(id)
          ? { ...prev, ratings: prev.ratings.filter((r) => r !== id) }
          : { ...prev, ratings: [id, ...prev.ratings] }
      );
    };

    return (
      <div
        className="relative min-h-[100dvh] overflow-hidden"
        style={{
          background:
            'radial-gradient(1200px 700px at 20% 20%, rgba(196,124,46,0.12), transparent 50%), radial-gradient(1000px 800px at 80% 80%, rgba(255,255,255,0.05), transparent 55%), var(--film-black)',
          color: 'var(--film-cream)',
        }}
      >
        <header
          className="h-14 px-4 sm:px-6 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(196,124,46,0.12)', background: 'rgba(7,7,6,0.72)' }}
        >
          <a
            href="/"
            className="poster-font tracking-[0.12em]"
            style={{ textDecoration: 'none', color: 'var(--film-cream)' }}
          >
            POSTERIUM
          </a>

          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={onModeChange} />
            <a
              href="/"
              className="h-8 px-3 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                color: 'var(--film-text-dim)',
                textDecoration: 'none',
              }}
            >
              <X size={12} />
              Exit
            </a>
          </div>
        </header>

        <StepIndicator currentStep={step} steps={STEPS} />

        <main className="px-4 sm:px-6 py-5">
          <div
            className={clsx(
              'transition-all duration-300',
              step < 3 ? 'opacity-100 translate-y-0' : 'opacity-95 translate-y-[2px]'
            )}
          >
            {step === 0 && (
              <section
                className="mx-auto max-w-5xl rounded-2xl border p-4 sm:p-6"
                style={{
                  borderColor: 'rgba(196,124,46,0.2)',
                  background: 'rgba(10,10,10,0.65)',
                  backdropFilter: 'blur(18px)',
                }}
              >
                <SourcePanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelection}
                  chrome={false}
                  detailLevel="simple"
                />
              </section>
            )}

            {step === 1 && <SkeletonLayoutSelector config={config} setConfig={setConfig} />}

            {step === 2 && (
              <section className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_BADGES.map((badge) => {
                  const active = config.ratings.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => toggleBadge(badge.id)}
                      className={clsx(
                        'h-12 rounded-lg border px-3 text-left transition-all',
                        active && 'translate-y-[-1px]'
                      )}
                      style={{
                        borderColor: active ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
                        background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span className="text-[11px] syne-font">{badge.label}</span>
                    </button>
                  );
                })}
              </section>
            )}

            {step === 3 && (
              <RevealAndExport
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                onSelect={handleSelection}
                baseUrl={baseUrl}
                handleLoadConfig={handleLoadConfig}
              />
            )}
          </div>
        </main>

        <footer className="px-4 sm:px-6 pb-6 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="h-9 px-3 rounded-md border inline-flex items-center gap-1.5 text-[11px] syne-font disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <ArrowLeft size={13} />
            Back
          </button>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="h-9 px-3 rounded-md inline-flex items-center gap-1.5 text-[11px] syne-font font-bold uppercase tracking-wider disabled:opacity-40"
            style={{ background: 'var(--film-amber)', color: '#070706' }}
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Continue'}
            <ArrowRight size={13} />
          </button>
        </footer>
      </div>
    );
  }
);

WalkthroughLayout.displayName = 'WalkthroughLayout';
export default WalkthroughLayout;
