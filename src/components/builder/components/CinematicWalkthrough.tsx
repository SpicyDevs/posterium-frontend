import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { PosterConfig, PresetType, RatingType, ThemeType } from '../types';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  onRequestAdvancedMode?: () => void;
  onRequestExport?: () => void;
}

const THEME_OPTIONS: {
  id: ThemeType;
  label: string;
  description: string;
  style: React.CSSProperties;
}[] = [
  {
    id: 'glass',
    label: 'Glass',
    description: 'Soft glow, frosted panels, cinematic depth.',
    style: {
      background:
        'linear-gradient(140deg, rgba(255,255,255,0.12), rgba(196,124,46,0.12), rgba(0,0,0,0.4))',
      border: '1px solid rgba(255,255,255,0.15)',
    },
  },
  {
    id: 'solid',
    label: 'Solid',
    description: 'Bold contrast, crisp edges, clean typography.',
    style: {
      background:
        'linear-gradient(140deg, rgba(196,124,46,0.3), rgba(255,255,255,0.08), rgba(0,0,0,0.6))',
      border: '1px solid rgba(196,124,46,0.25)',
    },
  },
];

const RATING_OPTIONS: { id: RatingType; label: string; sub: string }[] = [
  { id: 'imdb', label: 'IMDb', sub: 'Audience favorite' },
  { id: 'rt', label: 'Rotten Tomatoes', sub: 'Critic score' },
  { id: 'letterboxd', label: 'Letterboxd', sub: 'Community buzz' },
  { id: 'tmdb', label: 'TMDB', sub: 'Trending picks' },
];

const PRESET_OPTIONS: { id: PresetType; label: string; dot?: { x: number; y: number } }[] = [
  { id: 'tl', label: 'Top Left', dot: { x: 18, y: 18 } },
  { id: 'tc', label: 'Top Center', dot: { x: 50, y: 18 } },
  { id: 'tr', label: 'Top Right', dot: { x: 82, y: 18 } },
  { id: 'lc', label: 'Left Center', dot: { x: 18, y: 50 } },
  { id: 'cc', label: 'Center', dot: { x: 50, y: 50 } },
  { id: 'rc', label: 'Right Center', dot: { x: 82, y: 50 } },
  { id: 'bl', label: 'Bottom Left', dot: { x: 18, y: 82 } },
  { id: 'bc', label: 'Bottom Center', dot: { x: 50, y: 82 } },
  { id: 'br', label: 'Bottom Right', dot: { x: 82, y: 82 } },
  { id: 'custom', label: 'Custom' },
];

const STEP_LABELS = ['Theme', 'Ratings', 'Layout', 'Finish'];

const CinematicWalkthrough: React.FC<Props> = ({
  config,
  setConfig,
  onRequestAdvancedMode,
  onRequestExport,
}) => {
  const [step, setStep] = useState(0);
  const selectedRatings = useMemo(
    () => new Set(config.ratings.filter((id) => RATING_OPTIONS.some((opt) => opt.id === id))),
    [config.ratings]
  );

  const setTheme = (theme: ThemeType) => setConfig((prev) => ({ ...prev, theme }));
  const toggleRating = (id: RatingType) =>
    setConfig((prev) => {
      const exists = prev.ratings.includes(id);
      const next = exists ? prev.ratings.filter((r) => r !== id) : [...prev.ratings, id];
      const ordered = RATING_OPTIONS.map((opt) => opt.id).filter((opt) => next.includes(opt));
      return { ...prev, ratings: ordered };
    });
  const setPreset = (preset: PresetType) => setConfig((prev) => ({ ...prev, preset }));

  const handleExport = () => {
    setConfig((prev) => ({ ...prev, extension: 'png' }));
    onRequestExport?.();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(7,7,6,0.75), rgba(7,7,6,0.9))',
          backdropFilter: 'blur(6px)',
        }}
      />
      <div className="relative z-10 w-full max-w-5xl">
        <div
          className="rounded-[28px] border border-white/10 bg-[#0e0e10]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          style={{ boxShadow: '0 40px 120px rgba(0,0,0,0.55)' }}
        >
          <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--film-text-dim)]">
                  Step {step + 1} of {STEP_LABELS.length}
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--film-cream)]">
                  {STEP_LABELS[step]}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {STEP_LABELS.map((label, idx) => (
                  <div
                    key={label}
                    className={clsx(
                      'h-2 w-10 rounded-full transition-all',
                      idx <= step ? 'bg-[var(--film-amber)]' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8 min-h-[360px]">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={clsx(
                      'group relative rounded-2xl p-6 text-left transition-all duration-300',
                      'hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]',
                      config.theme === opt.id
                        ? 'ring-2 ring-[var(--film-amber)]'
                        : 'ring-1 ring-white/10'
                    )}
                    style={opt.style}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[12px] syne-font uppercase tracking-[0.3em] text-[var(--film-cream)]">
                        {opt.label}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] uppercase tracking-[0.2em]',
                          config.theme === opt.id ? 'text-[var(--film-amber)]' : 'text-white/40'
                        )}
                      >
                        {config.theme === opt.id ? 'Selected' : 'Select'}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{opt.description}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {RATING_OPTIONS.map((opt) => {
                  const active = selectedRatings.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleRating(opt.id)}
                      className={clsx(
                        'rounded-2xl p-4 text-left transition-all duration-300',
                        'border border-white/10 hover:border-[var(--film-amber)]',
                        active
                          ? 'bg-[rgba(196,124,46,0.18)] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
                          : 'bg-white/5'
                      )}
                    >
                      <p className="text-sm font-semibold text-white">{opt.label}</p>
                      <p className="text-[11px] text-white/60 mt-1">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PRESET_OPTIONS.map((opt) => {
                  const active = config.preset === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreset(opt.id)}
                      className={clsx(
                        'rounded-2xl p-4 text-left border transition-all duration-300',
                        active
                          ? 'border-[var(--film-amber)] bg-[rgba(196,124,46,0.12)]'
                          : 'border-white/10 bg-white/5 hover:border-[var(--film-amber)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-16 w-16 rounded-xl border border-white/15 bg-[#0a0a0d]"
                          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)' }}
                        >
                          {opt.dot ? (
                            <span
                              className="absolute h-2.5 w-2.5 rounded-full bg-[var(--film-amber)]"
                              style={{
                                left: `${opt.dot.x}%`,
                                top: `${opt.dot.y}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-white/50 text-lg">
                              ✦
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{opt.label}</p>
                          <p className="text-[11px] text-white/60 mt-1">
                            {opt.id === 'custom' ? 'Drag to fine-tune later.' : 'Balanced framing.'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[rgba(196,124,46,0.2)] text-[var(--film-amber)] text-2xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                    Your poster is ready.
                  </h3>
                  <p className="text-sm text-white/70 mt-2">
                    Export instantly or jump into advanced controls for fine-tuning.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] bg-[var(--film-amber)] text-[#070706] shadow-[0_20px_40px_rgba(196,124,46,0.35)]"
                  >
                    Export High-Res (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={onRequestAdvancedMode}
                    className="px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] border border-white/15 text-white/80 hover:text-white hover:border-[var(--film-amber)] transition-colors"
                  >
                    Go to Advanced Mode
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 sm:px-10 pb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={clsx(
                'px-4 py-2 rounded-lg text-[11px] uppercase tracking-[0.2em] transition-all',
                step === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/70 hover:text-white'
              )}
              disabled={step === 0}
            >
              Back
            </button>
            {step < STEP_LABELS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1))}
                className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.22em] bg-white/10 text-white hover:bg-[rgba(196,124,46,0.2)] hover:text-white transition-all"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicWalkthrough;
