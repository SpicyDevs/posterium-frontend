import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  FastForward,
  Film,
  Sparkles,
} from 'lucide-react';
import type { PosterConfig } from '../types';
import { generateApiUrl } from '../utils';
import { tutorialSteps, type TutorialOption, type TutorialOptionId } from './tutorialSteps';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onExport: () => void;
  onSwitchAdvanced: () => void;
}

type Answer = TutorialOptionId | null;

const posterGradients = [
  'from-[#140806] via-[#42220d] to-[#050302]',
  'from-[#07111f] via-[#173451] to-[#030711]',
  'from-[#18130f] via-[#3a332c] to-[#070504]',
  'from-[#111827] via-[#3a4157] to-[#05050a]',
];

const previewCopyByStep: Record<string, string[]> = {
  'starting-point': ['IMDb 8.7', 'RT 73%', '2026', 'PG-13'],
  ratings: ['IMDb 8.7', 'TMDB 84%', 'RT 73%', 'Meta 71'],
  placement: ['IMDb', 'RT', 'PG-13', '118m'],
  finish: ['8.7', '73%', 'PG-13', 'HD'],
};

const MiniPosterPreview: React.FC<{
  stepId: string;
  option: TutorialOption;
  selected: boolean;
}> = ({ stepId, option, selected }) => {
  const copy = previewCopyByStep[stepId] ?? previewCopyByStep['starting-point'];
  const gradient = posterGradients[option.id.charCodeAt(0) - 97] ?? posterGradients[0];
  const isMinimal = option.preview === 'title-block' || option.preview === 'minimal-type';
  const isStack =
    option.preview === 'right-stack' ||
    option.preview === 'corner-stack' ||
    option.preview === 'solid-stack';
  const isTop = option.preview === 'top-ribbon' || option.preview === 'glass-top';
  const isSolid = option.preview === 'solid-stack' || option.preview === 'crisp-solid';
  const isMono = option.preview === 'monochrome';
  const isGlass = option.preview === 'glass-top' || option.preview === 'premium-glass';

  const chipClass = clsx(
    'rounded-md px-2 py-1 text-[9px] font-black leading-none shadow-[0_8px_24px_rgba(0,0,0,0.45)]',
    isSolid && 'bg-[#0f172a] text-white',
    isGlass && 'border border-white/40 bg-white/20 text-white backdrop-blur-md',
    isMono && 'border border-white/30 bg-black/35 text-white',
    !isSolid && !isGlass && !isMono && 'border border-[#d79a45]/55 bg-black/55 text-[#ffe7bf]'
  );

  return (
    <div
      className={clsx(
        'relative h-40 overflow-hidden rounded-2xl border bg-gradient-to-br shadow-2xl transition-transform duration-300',
        gradient,
        selected
          ? 'border-[var(--film-amber)] scale-[1.02]'
          : 'border-white/10 group-hover:scale-[1.01]',
        isMono && 'grayscale'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.76))]" />
      <div className="absolute left-1/2 top-8 h-20 w-14 -translate-x-1/2 rounded-full bg-black/25 blur-sm" />
      <div className="absolute left-1/2 top-14 h-28 w-24 -translate-x-1/2 rounded-t-full bg-black/30" />
      <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

      {isMinimal ? (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-lg font-black uppercase leading-[0.9] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
            Cinema
            <br /> Night
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-white/90">
            <span>★ 8.7</span>
            <span>2026</span>
            <span>118m</span>
          </div>
        </div>
      ) : isStack ? (
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1.5">
          {copy.slice(0, 4).map((item) => (
            <span key={item} className={chipClass}>
              {item}
            </span>
          ))}
        </div>
      ) : isTop ? (
        <div className="absolute left-3 right-3 top-4 flex justify-center gap-1.5">
          {copy.slice(0, 3).map((item) => (
            <span key={item} className={chipClass}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="absolute bottom-4 left-3 right-3 flex justify-center gap-1.5">
          {copy.slice(0, 3).map((item) => (
            <span key={item} className={chipClass}>
              {item}
            </span>
          ))}
        </div>
      )}

      {option.preview === 'warm-cinema' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(196,124,46,0.36),transparent_42%)]" />
      )}
      <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur-sm">
        {option.previewLabel}
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

  const handleSkip = useCallback(() => {
    setAnswers((previous) => {
      const next = [...previous];
      next[stepIndex] = null;
      rebuildConfig(next);
      return next;
    });
    setStepIndex((index) => Math.min(index + 1, tutorialSteps.length));
  }, [rebuildConfig, stepIndex]);

  const handleNext = useCallback(() => {
    setStepIndex((index) => Math.min(index + 1, tutorialSteps.length));
  }, []);

  const handleBack = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [apiUrl]);

  const progress = isComplete ? 100 : Math.round((stepIndex / tutorialSteps.length) * 100);
  const completedCount = answers.filter(Boolean).length;
  const selectedAnswer = currentStep ? answers[stepIndex] : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style>{`
        @keyframes tutorial-rise {
          from { opacity: 0; transform: translate3d(0, 34px, 0) scale(0.96); filter: blur(12px); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        @keyframes tutorial-sweep {
          from { transform: translateX(-120%); opacity: 0; }
          18% { opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
        @keyframes tutorial-pulse {
          0%, 100% { opacity: 0.42; transform: scale(1); }
          50% { opacity: 0.82; transform: scale(1.08); }
        }
        .cinematic-wizard-card { animation: tutorial-rise 520ms cubic-bezier(.2,.9,.2,1) both; }
        .cinematic-wizard-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, transparent 0%, transparent 38%, rgba(255,255,255,0.12) 48%, transparent 58%, transparent 100%);
          animation: tutorial-sweep 3200ms ease-in-out infinite;
          pointer-events: none;
        }
        .cinematic-orb { animation: tutorial-pulse 3400ms ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(196,124,46,0.14),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.62),transparent_18%,transparent_82%,rgba(0,0,0,0.62))]" />
      <div className="cinematic-orb absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,124,46,0.18),transparent_62%)] blur-2xl" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

      <section
        className={clsx(
          'cinematic-wizard-card pointer-events-auto absolute left-1/2 w-[min(1120px,calc(100%-32px))] -translate-x-1/2 overflow-hidden rounded-[28px] border border-[rgba(196,124,46,0.32)] bg-[rgba(8,7,6,0.88)] shadow-[0_34px_120px_rgba(0,0,0,0.72)] backdrop-blur-2xl',
          isComplete ? 'top-1/2 max-w-[760px] -translate-y-1/2' : 'bottom-6'
        )}
        aria-label="Cinematic guided poster builder"
      >
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--film-amber)] to-transparent" />
          <div className="flex flex-col gap-5 p-5 lg:p-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--film-amber)]">
                  <Film size={15} /> Cinematic simple wizard
                </div>
                <h2 className="text-3xl font-black leading-none tracking-tight text-[var(--film-cream)] sm:text-4xl">
                  {isComplete ? 'Final cut locked.' : currentStep?.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--film-text-dim)]">
                  {isComplete
                    ? 'Your live canvas is ready. Export it, copy the API URL, or jump into Advanced for pixel-perfect finishing.'
                    : currentStep?.helper}
                </p>
              </div>

              <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                  <span>
                    {isComplete ? 'Complete' : `${currentStep?.eyebrow} / ${tutorialSteps.length}`}
                  </span>
                  <span>
                    {completedCount}/{tutorialSteps.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d08a2d] via-[#ffd28b] to-[#d08a2d] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {tutorialSteps.map((step, index) => (
                    <span
                      key={step.id}
                      className={clsx(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        index < stepIndex || answers[index]
                          ? 'bg-[var(--film-amber)]'
                          : 'bg-white/12'
                      )}
                    />
                  ))}
                </div>
              </div>
            </header>

            {!isComplete && currentStep ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                {currentStep.options.map((option) => {
                  const selected = selectedAnswer === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={clsx(
                        'group relative overflow-hidden rounded-3xl border p-3 text-left transition-all duration-300 hover:-translate-y-1',
                        selected
                          ? 'border-[var(--film-amber)] bg-[rgba(196,124,46,0.18)] shadow-[0_0_0_1px_rgba(196,124,46,0.35),0_22px_70px_rgba(196,124,46,0.18)]'
                          : 'border-white/10 bg-white/[0.035] hover:border-[rgba(196,124,46,0.42)] hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <MiniPosterPreview
                        stepId={currentStep.id}
                        option={option}
                        selected={selected}
                      />
                      <div className="mt-4 flex items-start gap-3">
                        <div
                          className={clsx(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black',
                            selected
                              ? 'border-[var(--film-amber)] bg-[var(--film-amber)] text-[#070706]'
                              : 'border-white/15 bg-black/25 text-[var(--film-cream)]'
                          )}
                        >
                          {option.id.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-black text-[var(--film-cream)]">
                            {option.label}
                            {selected && <Check size={15} className="text-[var(--film-amber)]" />}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[var(--film-text-dim)]">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-[1fr_0.8fr] md:items-stretch">
                <div className="rounded-3xl border border-[rgba(196,124,46,0.22)] bg-[rgba(196,124,46,0.09)] p-6">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--film-amber)] text-[#070706] shadow-[0_18px_50px_rgba(196,124,46,0.35)]">
                    <Check size={25} />
                  </div>
                  <h3 className="text-2xl font-black text-[var(--film-cream)]">
                    Ready for the marquee.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--film-text-dim)]">
                    The guided pass is complete. The canvas remains live behind this wizard, so you
                    can export with confidence or hand it off to the advanced editor.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3 text-[11px] leading-4 text-white/55">
                    {apiUrl}
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <button
                    type="button"
                    onClick={onExport}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--film-amber)] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-[#070706] shadow-[0_20px_60px_rgba(196,124,46,0.28)] transition-transform hover:scale-[1.015]"
                  >
                    <Download size={17} /> Export
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm font-bold text-[var(--film-cream)] hover:border-[rgba(196,124,46,0.38)]"
                  >
                    {copied ? <Check size={17} /> : <Copy size={17} />}{' '}
                    {copied ? 'Copied API URL' : 'Copy API URL'}
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchAdvanced}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(196,124,46,0.25)] px-5 py-4 text-sm font-bold text-[var(--film-amber)] hover:bg-[rgba(196,124,46,0.08)]"
                  >
                    <FastForward size={17} /> Switch to Advanced
                  </button>
                </div>
              </div>
            )}

            {!isComplete && (
              <footer className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  <Sparkles size={13} className="text-[var(--film-amber)]" /> Pick a frame. The
                  canvas updates instantly.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepIndex === 0}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-[var(--film-text-dim)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-[var(--film-text-dim)] hover:text-[var(--film-cream)]"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--film-amber)] px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#070706] shadow-[0_10px_30px_rgba(196,124,46,0.24)]"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </footer>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CinematicTutorialBuilder;
