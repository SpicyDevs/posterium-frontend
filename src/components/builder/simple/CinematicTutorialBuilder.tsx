import React, { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, Copy, Download, FastForward, Sparkles } from 'lucide-react';
import type { PosterConfig } from '../types';
import { generateApiUrl } from '../utils';
import { simplePresets } from './presets';
import { tutorialSteps, type TutorialOptionId } from './tutorialSteps';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onExport: () => void;
  onSwitchAdvanced: () => void;
}

type Answer = TutorialOptionId | null;

const optionLetters: TutorialOptionId[] = ['a', 'b', 'c', 'd'];

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

  const completedCount = answers.filter(Boolean).length;
  const selectedAnswer = currentStep ? answers[stepIndex] : null;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--film-dark)]">
      <div className="border-b border-[rgba(196,124,46,0.12)] px-4 py-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--film-amber)]">
          <Sparkles size={13} /> Guided simple builder
        </div>
        <p className="mt-2 text-sm leading-5 text-[var(--film-text-dim)]">
          Answer a few visual questions while the poster canvas stays live. Use Advanced whenever
          you want full layer control.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        {!isComplete && currentStep ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--film-text-dim)]">
                  {currentStep.eyebrow} of {tutorialSteps.length}
                </div>
                <h2 className="mt-1 text-xl font-bold leading-6 text-[var(--film-cream)]">
                  {currentStep.title}
                </h2>
              </div>
              <div className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[11px] text-[var(--film-text-dim)]">
                {completedCount}/{tutorialSteps.length}
              </div>
            </div>

            <p className="mb-4 text-sm leading-5 text-[var(--film-text-dim)]">
              {currentStep.helper}
            </p>

            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full bg-[var(--film-amber)] transition-all"
                style={{ width: `${(stepIndex / tutorialSteps.length) * 100}%` }}
              />
            </div>

            {currentStep.id === 'starting-point' && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {simplePresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={clsx(
                      'rounded-xl border border-[rgba(255,255,255,0.08)] bg-gradient-to-br p-2',
                      preset.previewClass
                    )}
                  >
                    <div className="h-16 rounded-lg border border-white/10 bg-black/20" />
                    <div className="mt-2 truncate text-[10px] font-bold text-white/90">
                      {preset.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {currentStep.options.map((option) => {
                const selected = selectedAnswer === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={clsx(
                      'group w-full rounded-2xl border p-3 text-left transition-all',
                      selected
                        ? 'border-[var(--film-amber)] bg-[rgba(196,124,46,0.13)] shadow-[0_0_0_1px_rgba(196,124,46,0.18)]'
                        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(196,124,46,0.36)] hover:bg-[rgba(255,255,255,0.045)]'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={clsx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black',
                          selected
                            ? 'border-[var(--film-amber)] bg-[var(--film-amber)] text-[#070706]'
                            : 'border-[rgba(255,255,255,0.14)] text-[var(--film-cream)]'
                        )}
                      >
                        {option.id.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[var(--film-cream)]">{option.label}</span>
                          {selected && <Check size={15} className="text-[var(--film-amber)]" />}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[var(--film-text-dim)]">
                          {option.description}
                        </p>
                        <div className="mt-3 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#090908] p-2">
                          <div className="relative h-16 rounded-lg bg-gradient-to-br from-[#292524] via-[#12100d] to-black">
                            <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5">
                              {optionLetters.map((letter) => (
                                <span
                                  key={letter}
                                  className={clsx(
                                    'h-3 rounded-full bg-white/80',
                                    option.id === letter ? 'w-8' : 'w-3 opacity-45'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white/80">
                              {option.visual}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex min-h-full flex-col justify-center py-6">
            <div className="rounded-3xl border border-[rgba(196,124,46,0.22)] bg-[rgba(196,124,46,0.08)] p-5">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--film-amber)] text-[#070706]">
                <Check size={22} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--film-cream)]">Your poster is ready.</h2>
              <p className="mt-2 text-sm leading-5 text-[var(--film-text-dim)]">
                Export the current image, copy a reusable API URL, or switch to Advanced for precise
                layer editing.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={onExport}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--film-amber)] px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-[#070706] transition-transform hover:scale-[1.01]"
              >
                <Download size={16} /> Export
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm font-bold text-[var(--film-cream)] hover:border-[rgba(196,124,46,0.35)]"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
                {copied ? 'Copied API URL' : 'Copy API URL'}
              </button>
              <button
                type="button"
                onClick={onSwitchAdvanced}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(196,124,46,0.18)] px-4 py-3 text-sm font-bold text-[var(--film-amber)] hover:bg-[rgba(196,124,46,0.08)]"
              >
                <FastForward size={16} /> Switch to Advanced
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-black/20 p-3 text-[11px] leading-4 text-[var(--film-text-dim)]">
              {apiUrl}
            </div>
          </div>
        )}
      </div>

      {!isComplete && (
        <div className="border-t border-[rgba(196,124,46,0.12)] p-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-bold text-[var(--film-text-dim)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-2 text-xs font-bold text-[var(--film-text-dim)] hover:text-[var(--film-cream)]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--film-amber)] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#070706] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CinematicTutorialBuilder;
