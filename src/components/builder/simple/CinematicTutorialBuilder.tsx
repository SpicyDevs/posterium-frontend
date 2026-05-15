import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Copy,
  Download,
  FastForward,
} from 'lucide-react';
import type { PosterConfig } from '../types';
import { generateApiUrl } from '../utils';
import {
  tutorialSteps,
  type TutorialOption,
  type TutorialOptionId,
  type TutorialPreview,
} from './tutorialSteps';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onExport: () => void;
  onSwitchAdvanced: () => void;
}

type Answer = TutorialOptionId | null;

type BadgeStyle = 'warm' | 'solid' | 'minimal' | 'glass' | 'mono';

const previewBackdrops: Record<BadgeStyle, string> = {
  warm: 'from-[#110704] via-[#5a2b0f] to-[#090706]',
  solid: 'from-[#08111d] via-[#1d3653] to-[#05070b]',
  minimal: 'from-[#14110f] via-[#3b3028] to-[#050404]',
  glass: 'from-[#08131f] via-[#536176] to-[#07090e]',
  mono: 'from-[#050505] via-[#444444] to-[#0a0a0a]',
};

const badgeClasses: Record<BadgeStyle, string> = {
  warm: 'border-[#d79a45]/80 bg-[#080706]/80 text-[#f8ead2] shadow-[0_8px_20px_rgba(0,0,0,0.55)]',
  solid: 'border-white/5 bg-[#0f172a]/95 text-white shadow-[0_8px_18px_rgba(0,0,0,0.45)]',
  minimal: 'border-white/10 bg-black/20 text-white shadow-[0_8px_22px_rgba(0,0,0,0.45)]',
  glass:
    'border-white/35 bg-white/15 text-white shadow-[0_12px_28px_rgba(0,0,0,0.5)] backdrop-blur-sm',
  mono: 'border-white/45 bg-black/45 text-white shadow-[0_10px_24px_rgba(0,0,0,0.55)]',
};

const MiniPosterPreview: React.FC<{ preview: TutorialPreview; selected?: boolean }> = ({
  preview,
  selected = false,
}) => {
  const labels = preview.labels.slice(0, 4);
  const badge = (label: string, compact = false) => (
    <span
      key={label}
      className={clsx(
        'rounded-full border px-1.5 py-1 text-[8px] font-black leading-none tracking-wide',
        compact ? 'min-w-7 text-center' : 'min-w-0 text-center',
        badgeClasses[preview.style]
      )}
    >
      {label}
    </span>
  );

  return (
    <div
      className={clsx(
        'relative aspect-[5/7] w-full overflow-hidden rounded-[18px] border bg-gradient-to-br shadow-2xl',
        previewBackdrops[preview.style],
        selected ? 'border-[var(--film-amber)]' : 'border-white/15'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.22),transparent_24%),linear-gradient(160deg,transparent_35%,rgba(0,0,0,0.68)_86%)]" />
      <div className="absolute left-1/2 top-[18%] h-24 w-24 -translate-x-1/2 rounded-full border border-white/10 bg-black/10 blur-[1px]" />
      <div className="absolute inset-x-5 top-5 h-px bg-white/20" />
      <div className="absolute inset-x-5 bottom-5 h-px bg-white/20" />

      {preview.placement === 'bottom-row' && (
        <div className="absolute inset-x-3 bottom-6 flex justify-center gap-1.5">
          {labels.map((label) => badge(label))}
        </div>
      )}

      {preview.placement === 'right-stack' && (
        <div className="absolute bottom-6 right-3 flex flex-col items-end gap-1.5">
          {labels.map((label) => badge(label))}
        </div>
      )}

      {preview.placement === 'top-ribbon' && (
        <div className="absolute inset-x-3 top-6 flex justify-center gap-1.5">
          {labels.map((label) => badge(label, true))}
        </div>
      )}

      {preview.placement === 'split-corners' && (
        <>
          <div className="absolute left-3 top-6 flex flex-col gap-1.5">
            {labels.slice(0, 2).map((label) => badge(label, true))}
          </div>
          <div className="absolute bottom-6 right-3 flex flex-col items-end gap-1.5">
            {labels.slice(2).map((label) => badge(label, true))}
          </div>
        </>
      )}

      {preview.placement === 'title-block' && (
        <div className="absolute inset-x-4 bottom-7">
          <div className="max-w-[82%] text-left text-[15px] font-black leading-[0.9] tracking-[-0.04em] text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]">
            {preview.title ?? 'THE FEATURE'}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {labels.map((label) => badge(label, true))}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-white/70">
        Live look
      </div>
    </div>
  );
};

const CinematicTutorialBuilder: React.FC<Props> = ({
  config,
  setConfig,
  baseUrl,
  onExport,
  onSwitchAdvanced,
}) => {
  const initialConfigRef = useRef(config);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => tutorialSteps.map(() => null));
  const [copied, setCopied] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);

  const currentStep = tutorialSteps[stepIndex];
  const isComplete = stepIndex >= tutorialSteps.length;
  const apiUrl = useMemo(() => generateApiUrl(config, baseUrl), [config, baseUrl]);

  const rebuildConfig = useCallback(
    (nextAnswers: Answer[]) => {
      const rebuilt = tutorialSteps.reduce((draft, step, index) => {
        const answer = nextAnswers[index];
        const option = answer ? step.options.find((candidate) => candidate.id === answer) : null;
        return option ? option.apply(draft) : draft;
      }, initialConfigRef.current);

      setConfig(rebuilt);
    },
    [setConfig]
  );

  const handleSelect = useCallback(
    (answer: TutorialOptionId) => {
      setAnswers((previous) => {
        const next = [...previous];
        next[stepIndex] = answer;
        rebuildConfig(next);
        return next;
      });
    },
    [rebuildConfig, stepIndex]
  );

  const moveTo = useCallback((nextIndex: number) => {
    setStepIndex(Math.max(0, Math.min(nextIndex, tutorialSteps.length)));
    setTransitionKey((key) => key + 1);
  }, []);

  const handleSkip = useCallback(() => {
    setAnswers((previous) => {
      const next = [...previous];
      next[stepIndex] = null;
      rebuildConfig(next);
      return next;
    });
    moveTo(stepIndex + 1);
  }, [moveTo, rebuildConfig, stepIndex]);

  const handleNext = useCallback(() => {
    moveTo(stepIndex + 1);
  }, [moveTo, stepIndex]);

  const handleBack = useCallback(() => {
    moveTo(stepIndex - 1);
  }, [moveTo, stepIndex]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [apiUrl]);

  const completedCount = answers.filter(Boolean).length;
  const selectedAnswer = currentStep ? answers[stepIndex] : null;
  const selectedOption = currentStep?.options.find((option) => option.id === selectedAnswer);
  const heroOption = selectedOption ?? currentStep?.options[0];
  const progress = isComplete ? 100 : ((stepIndex + 1) / tutorialSteps.length) * 100;

  const renderOption = (option: TutorialOption) => {
    const selected = selectedAnswer === option.id;
    return (
      <button
        key={option.id}
        type="button"
        onClick={() => handleSelect(option.id)}
        className={clsx(
          'group relative overflow-hidden rounded-[24px] border p-3 text-left transition-all duration-300',
          'bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.018))]',
          selected
            ? 'border-[var(--film-amber)] shadow-[0_0_0_1px_rgba(196,124,46,0.42),0_28px_70px_rgba(196,124,46,0.16)]'
            : 'border-white/10 hover:-translate-y-1 hover:border-[rgba(196,124,46,0.55)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.32)]'
        )}
      >
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,rgba(196,124,46,0.2),transparent_44%)]" />
        <div className="relative grid grid-cols-[112px_1fr] gap-4 max-sm:grid-cols-1">
          <MiniPosterPreview preview={option.preview} selected={selected} />
          <div className="flex min-w-0 flex-col justify-between py-1">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black',
                    selected
                      ? 'border-[var(--film-amber)] bg-[var(--film-amber)] text-[#070706]'
                      : 'border-white/15 bg-black/25 text-[var(--film-cream)]'
                  )}
                >
                  {option.id.toUpperCase()}
                </span>
                {selected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(196,124,46,0.16)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--film-amber)]">
                    <Check size={12} /> selected
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black leading-tight tracking-[-0.03em] text-[var(--film-cream)]">
                {option.label}
              </h3>
              <p className="mt-2 text-sm leading-5 text-[var(--film-text-dim)]">
                {option.description}
              </p>
            </div>
            <div className="mt-4 inline-flex w-fit rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
              {option.visual}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style>{`
        @keyframes wizardEnter {
          from { opacity: 0; transform: translate3d(-28px, 18px, 0) scale(.965); filter: blur(8px); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        @keyframes sceneCut {
          from { opacity: 0; transform: translateX(26px) scale(.985); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes projectorSweep {
          0% { transform: translateX(-42%) skewX(-18deg); opacity: 0; }
          30% { opacity: .65; }
          100% { transform: translateX(152%) skewX(-18deg); opacity: 0; }
        }
        .cinematic-wizard-shell { animation: wizardEnter 520ms cubic-bezier(.16,1,.3,1) both; }
        .cinematic-scene { animation: sceneCut 360ms cubic-bezier(.16,1,.3,1) both; }
        .projector-sweep::after {
          content: ''; position: absolute; inset: -20% auto -20% 0; width: 36%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
          animation: projectorSweep 2100ms ease-in-out infinite; pointer-events: none;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(196,124,46,0.13),transparent_32%),linear-gradient(90deg,rgba(5,4,3,0.95),rgba(5,4,3,0.66)_44%,rgba(5,4,3,0.12)_76%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />

      <section className="cinematic-wizard-shell pointer-events-auto absolute bottom-5 left-5 top-5 flex w-[min(940px,calc(100vw-40px))] flex-col overflow-hidden rounded-[34px] border border-[rgba(196,124,46,0.26)] bg-[rgba(8,7,6,0.88)] shadow-[0_34px_120px_rgba(0,0,0,0.72)] backdrop-blur-2xl max-lg:right-5 max-lg:w-auto">
        <div className="projector-sweep relative overflow-hidden border-b border-[rgba(196,124,46,0.18)] bg-[linear-gradient(135deg,rgba(196,124,46,0.18),rgba(255,255,255,0.045)_36%,rgba(0,0,0,0.25))] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--film-amber)]">
                <Clapperboard size={16} /> Cinematic simple wizard
              </div>
              <h2 className="mt-2 text-3xl font-black leading-none tracking-[-0.055em] text-[var(--film-cream)] sm:text-4xl">
                Build a poster with a director&apos;s cut flow.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-[var(--film-text-dim)]">
                Big choices, live canvas, zero quiet side-panel energy. Pick a look and we cut the
                poster in real time.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                Progress
              </div>
              <div className="mt-1 text-2xl font-black text-[var(--film-cream)]">
                {completedCount}/{tutorialSteps.length}
              </div>
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#c47c2e,#ffd38a)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 custom-scrollbar sm:p-6">
          {!isComplete && currentStep ? (
            <div key={transitionKey} className="cinematic-scene">
              <div className="mb-5 grid gap-5 lg:grid-cols-[1fr_250px]">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--film-amber)]">
                    {currentStep.eyebrow} / {currentStep.directive}
                  </div>
                  <h3 className="mt-2 text-4xl font-black leading-[0.92] tracking-[-0.065em] text-[var(--film-cream)] sm:text-5xl">
                    {currentStep.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-6 text-[var(--film-text-dim)]">
                    {currentStep.helper}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.035] p-3">
                  {heroOption && (
                    <MiniPosterPreview preview={heroOption.preview} selected={!!selectedOption} />
                  )}
                  {!selectedOption && (
                    <div className="mt-3 rounded-full border border-dashed border-white/15 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                      Suggested opening frame — choose A, B, C, or D
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {currentStep.options.map(renderOption)}
              </div>
            </div>
          ) : (
            <div
              key={transitionKey}
              className="cinematic-scene grid min-h-full items-center gap-6 lg:grid-cols-[1fr_320px]"
            >
              <div>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--film-amber)] text-[#070706] shadow-[0_18px_60px_rgba(196,124,46,0.35)]">
                  <Check size={30} />
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--film-amber)]">
                  Final cut locked
                </div>
                <h3 className="mt-2 text-5xl font-black leading-[0.9] tracking-[-0.075em] text-[var(--film-cream)] sm:text-6xl">
                  Your poster is ready for release.
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-6 text-[var(--film-text-dim)]">
                  Export the current image, copy the live API URL, or jump into Advanced to tune the
                  last pixels like a pro editor.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={onExport}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--film-amber)] px-4 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#070706] shadow-[0_18px_50px_rgba(196,124,46,0.28)] transition-transform hover:scale-[1.025]"
                  >
                    <Download size={17} /> Export
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-4 text-sm font-black text-[var(--film-cream)] hover:border-[rgba(196,124,46,0.45)]"
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}{' '}
                    {copied ? 'Copied' : 'Copy API URL'}
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchAdvanced}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(196,124,46,0.35)] bg-[rgba(196,124,46,0.08)] px-4 py-4 text-sm font-black text-[var(--film-amber)] hover:bg-[rgba(196,124,46,0.14)]"
                  >
                    <FastForward size={17} /> Advanced
                  </button>
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-5 text-[var(--film-text-dim)]">
                  {apiUrl}
                </div>
              </div>
              <div className="rounded-[32px] border border-[rgba(196,124,46,0.2)] bg-white/[0.035] p-4 shadow-2xl">
                <MiniPosterPreview
                  selected
                  preview={{
                    placement: 'bottom-row',
                    style: 'warm',
                    labels: ['IMDb 8.7', 'RT 73%', 'AUD 91%'],
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {!isComplete && (
          <div className="border-t border-[rgba(196,124,46,0.18)] bg-black/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={stepIndex === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--film-text-dim)] disabled:cursor-not-allowed disabled:opacity-35 hover:text-[var(--film-cream)]"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <div className="flex flex-1 justify-center gap-2 max-sm:order-first max-sm:w-full">
                {tutorialSteps.map((step, index) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => moveTo(index)}
                    className={clsx(
                      'h-2.5 rounded-full transition-all',
                      index === stepIndex
                        ? 'w-10 bg-[var(--film-amber)]'
                        : answers[index]
                          ? 'w-5 bg-white/45'
                          : 'w-5 bg-white/15'
                    )}
                    aria-label={`Go to ${step.eyebrow}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--film-text-dim)] hover:text-[var(--film-cream)]"
                >
                  Skip scene
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--film-amber)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#070706] shadow-[0_12px_36px_rgba(196,124,46,0.24)] transition-transform hover:scale-[1.03]"
                >
                  {stepIndex === tutorialSteps.length - 1 ? 'Final cut' : 'Next scene'}{' '}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CinematicTutorialBuilder;
