import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Wand2,
} from 'lucide-react';
import type { PosterConfig } from '../types';
import { generateApiUrl } from '../utils';
import { tutorialSteps, type MiniPreview, type TutorialOptionId } from './tutorialSteps';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onExport: () => void;
  onSwitchAdvanced: () => void;
}

type Answer = TutorialOptionId | null;

type PosterTone = MiniPreview['tone'];

const answerKeys: TutorialOptionId[] = ['a', 'b', 'c', 'd'];

const toneClass: Record<PosterTone, string> = {
  ember: 'from-[#050201] via-[#3b1907] to-[#c7791c]',
  'noir-blue': 'from-[#020617] via-[#0f2744] to-[#38bdf8]',
  plum: 'from-[#120617] via-[#4c1d4f] to-[#f0abfc]',
  silver: 'from-[#070707] via-[#323846] to-[#e5e7eb]',
  redline: 'from-[#080202] via-[#4b0808] to-[#ef4444]',
  mono: 'from-[#050505] via-[#3f3f46] to-[#fafafa]',
};

const MiniPoster: React.FC<{ preview: MiniPreview; selected?: boolean }> = ({
  preview,
  selected,
}) => {
  const badgeClass = clsx(
    'rounded-[5px] px-1.5 py-1 text-[8px] font-black leading-none shadow-[0_8px_18px_rgba(0,0,0,0.45)]',
    preview.finish === 'glass' && 'border border-white/35 bg-white/20 text-white backdrop-blur-sm',
    preview.finish === 'solid' && 'bg-slate-950/90 text-white',
    preview.finish === 'minimal' && 'bg-transparent px-0 text-white shadow-none'
  );

  return (
    <div
      className={clsx(
        'relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-gradient-to-br shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
        toneClass[preview.tone],
        selected ? 'border-[rgba(234,178,93,0.85)]' : 'border-white/15'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.34),transparent_22%),linear-gradient(145deg,transparent_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute left-[12%] top-[14%] h-[34%] w-[42%] rounded-full bg-white/10 blur-xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/28 to-transparent" />

      {preview.layout === 'top-ribbon' && (
        <div className="absolute left-2 right-2 top-2 flex justify-center gap-1">
          {preview.badges.slice(0, 4).map((badge) => (
            <span key={badge} className={badgeClass}>
              {badge}
            </span>
          ))}
        </div>
      )}

      {preview.layout === 'right-stack' && (
        <div className="absolute bottom-4 right-2 flex w-[45%] flex-col gap-1.5">
          {preview.badges.slice(0, 4).map((badge) => (
            <span key={badge} className={badgeClass}>
              {badge}
            </span>
          ))}
        </div>
      )}

      {preview.layout === 'bottom-row' && (
        <div className="absolute inset-x-2 bottom-3 flex justify-center gap-1">
          {preview.badges.slice(0, 4).map((badge) => (
            <span key={badge} className={badgeClass}>
              {badge}
            </span>
          ))}
        </div>
      )}

      {preview.layout === 'title-block' && (
        <div className="absolute inset-x-3 bottom-3">
          <div className="text-[13px] font-black leading-[0.9] tracking-[-0.04em] text-white drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)]">
            {preview.title}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[8px] font-bold text-white/90">
            {preview.badges.slice(0, 4).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      )}

      {preview.layout !== 'title-block' && (
        <div className="absolute bottom-[22%] left-3 right-3 text-[10px] font-black leading-none tracking-[-0.04em] text-white/85 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
          {preview.title}
        </div>
      )}
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isComplete || !currentStep) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (answerKeys.includes(key as TutorialOptionId)) {
        event.preventDefault();
        handleSelect(key as TutorialOptionId);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentStep, handleNext, handleSelect, isComplete]);

  const selectedAnswer = currentStep ? answers[stepIndex] : null;
  const progress = isComplete ? 100 : Math.round((stepIndex / tutorialSteps.length) * 100);
  const heroPreview = currentStep?.options.find((option) => option.id === selectedAnswer)?.preview;

  return (
    <section className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style>{`
        @keyframes wizard-pop {
          0% { opacity: 0; transform: translate3d(0, 24px, 0) scale(0.96); filter: blur(10px); }
          100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        @keyframes reel-sweep {
          0% { transform: translateX(-38%); opacity: 0; }
          18% { opacity: .85; }
          100% { transform: translateX(38%); opacity: 0; }
        }
        @keyframes card-rise {
          0% { opacity: 0; transform: translateY(18px) scale(.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cinematic-wizard { animation: wizard-pop 520ms cubic-bezier(.16, 1, .3, 1) both; }
        .cinematic-card { animation: card-rise 460ms cubic-bezier(.16, 1, .3, 1) both; }
        .cinematic-reel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent 35%, rgba(255,255,255,.16), transparent 65%);
          animation: reel-sweep 3.8s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(196,124,46,0.08),rgba(0,0,0,0.74)_58%,rgba(0,0,0,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.45)_0,transparent_22%,transparent_78%,rgba(0,0,0,0.45)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />

      <div className="pointer-events-auto flex h-full items-center justify-center px-3 py-5 sm:px-6">
        <div className="cinematic-wizard grid max-h-full w-full max-w-[1180px] overflow-hidden rounded-[28px] border border-[rgba(234,178,93,0.32)] bg-[rgba(9,8,6,0.88)] shadow-[0_38px_120px_rgba(0,0,0,0.86),0_0_90px_rgba(196,124,46,0.18)] backdrop-blur-2xl lg:grid-cols-[0.86fr_1.14fr]">
          <aside className="cinematic-reel relative hidden min-h-[660px] overflow-hidden border-r border-[rgba(234,178,93,0.16)] bg-gradient-to-br from-[#1b1007] via-[#070706] to-black p-8 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_22%,rgba(234,178,93,.22),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(148,163,184,.12),transparent_32%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(234,178,93,0.32)] bg-black/28 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--film-amber)]">
                  <Film size={13} /> Simple mode director
                </div>
                <h2 className="mt-5 text-5xl font-black leading-[0.88] tracking-[-0.08em] text-white">
                  Build a poster like a title sequence.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
                  This is no longer a quiet side panel. Make four confident calls, watch the live
                  canvas react, then export or jump into Advanced for frame-perfect edits.
                </p>
              </div>

              <div>
                <div className="mb-3 rounded-2xl border border-white/10 bg-black/24 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--film-amber)]">
                    Live canvas stays rolling
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/56">
                    The real poster remains visible behind this premiere overlay while these
                    miniatures show the exact badge composition you are choosing.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(currentStep?.options.slice(0, 2).map((option) => option.preview) ?? [])
                    .slice(0, 2)
                    .map((preview) => (
                      <MiniPoster
                        key={preview.title}
                        preview={preview}
                        selected={heroPreview?.title === preview.title}
                      />
                    ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col">
            <header className="border-b border-[rgba(234,178,93,0.14)] px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--film-amber)]">
                  <Sparkles size={14} /> Cinematic tutorial wizard
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/68">
                  {isComplete ? 'Final cut' : `Scene ${stepIndex + 1} / ${tutorialSteps.length}`}
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9b5a19] via-[var(--film-amber)] to-[#ffe8b4] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 custom-scrollbar sm:px-7">
              {!isComplete && currentStep ? (
                <>
                  <div className="mb-5">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
                      {currentStep.eyebrow}
                    </div>
                    <h3 className="mt-2 text-3xl font-black leading-[0.95] tracking-[-0.05em] text-white sm:text-4xl">
                      {currentStep.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                      {currentStep.helper}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[rgba(196,124,46,0.12)] px-3 py-1.5 text-xs font-bold text-[#f7d7a5]">
                      <Wand2 size={13} /> {currentStep.direction}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentStep.options.map((option, index) => {
                      const selected = selectedAnswer === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelect(option.id)}
                          className={clsx(
                            'cinematic-card group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300',
                            selected
                              ? 'border-[rgba(234,178,93,0.85)] bg-[rgba(196,124,46,0.14)] shadow-[0_0_0_1px_rgba(234,178,93,0.25),0_18px_50px_rgba(0,0,0,0.42)]'
                              : 'border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-[rgba(234,178,93,0.38)] hover:bg-white/[0.065]'
                          )}
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="relative grid grid-cols-[104px_1fr] gap-3 sm:grid-cols-[126px_1fr]">
                            <MiniPoster preview={option.preview} selected={selected} />
                            <div className="min-w-0 py-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={clsx(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black',
                                    selected
                                      ? 'border-[var(--film-amber)] bg-[var(--film-amber)] text-black'
                                      : 'border-white/15 text-white/86'
                                  )}
                                >
                                  {option.id.toUpperCase()}
                                </span>
                                {selected && (
                                  <Check size={17} className="text-[var(--film-amber)]" />
                                )}
                              </div>
                              <div className="mt-3 text-base font-black leading-5 text-white">
                                {option.label}
                              </div>
                              <p className="mt-2 text-xs leading-5 text-white/58">
                                {option.description}
                              </p>
                              <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                                Press {option.id.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[520px] flex-col justify-center py-6">
                  <div className="rounded-[26px] border border-[rgba(234,178,93,0.28)] bg-[radial-gradient(circle_at_25%_0%,rgba(234,178,93,0.22),transparent_36%),rgba(255,255,255,0.045)] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.42)]">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--film-amber)] text-black shadow-[0_18px_45px_rgba(196,124,46,0.34)]">
                      <Check size={26} />
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--film-amber)]">
                      Final cut locked
                    </div>
                    <h3 className="mt-2 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white">
                      Your poster has a direction now.
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
                      Export the current frame, copy the live API URL, or switch to Advanced and
                      keep refining with the full pro editor.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={onExport}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[var(--film-amber)] px-4 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition-transform hover:scale-[1.02]"
                    >
                      <Download size={17} /> Export
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.055] px-4 py-4 text-sm font-bold text-white hover:border-[rgba(234,178,93,0.4)]"
                    >
                      {copied ? <Check size={17} /> : <Copy size={17} />}{' '}
                      {copied ? 'Copied API URL' : 'Copy API URL'}
                    </button>
                    <button
                      type="button"
                      onClick={onSwitchAdvanced}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(234,178,93,0.26)] px-4 py-4 text-sm font-bold text-[var(--film-amber)] hover:bg-[rgba(196,124,46,0.1)]"
                    >
                      <FastForward size={17} /> Switch to Advanced
                    </button>
                  </div>

                  <div className="mt-4 max-h-24 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] leading-4 text-white/42">
                    {apiUrl}
                  </div>
                </div>
              )}
            </div>

            {!isComplete && (
              <footer className="border-t border-[rgba(234,178,93,0.14)] p-4 sm:px-7">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepIndex === 0}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-3 text-xs font-bold text-white/55 disabled:cursor-not-allowed disabled:opacity-35 hover:text-white"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-xl border border-white/10 px-3 py-3 text-xs font-bold text-white/55 hover:text-white"
                  >
                    Skip scene
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--film-amber)] px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-black"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </footer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicTutorialBuilder;
