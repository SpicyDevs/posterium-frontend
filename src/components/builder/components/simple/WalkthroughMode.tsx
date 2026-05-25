import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Download } from 'lucide-react';
import type { ExtensionType, PosterConfig, PresetType, RatingType } from '../../types';
import { ALL_BADGES } from '../../types';
import PreviewCanvas from '../PreviewCanvas';
import { Button, Card } from '@/components/ui';
import ExportMenu from '@/components/shared/ExportMenu';
import MediaPicker from './MediaPicker';
import type { BuilderMode } from '../navigation/ModeToggle';

type WalkthroughStyle = 'glass' | 'solid' | 'minimal';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  baseUrl: string;
  onLoadConfig: (url: string) => void;
  onExtensionChange: (ext: ExtensionType) => void;
  onExit: (mode: BuilderMode) => void;
}

const BADGE_OPTIONS: RatingType[] = ['imdb', 'rt', 'rt_popcorn', 'meta', 'tmdb', 'age', 'runtime', 'year'];
const PRESET_OPTIONS: { id: PresetType; label: string }[] = [
  { id: 'bl', label: 'Bottom Left' },
  { id: 'br', label: 'Bottom Right' },
  { id: 'tl', label: 'Top Left' },
  { id: 'tr', label: 'Top Right' },
];

const WalkthroughMode: React.FC<Props> = ({
  config,
  setConfig,
  baseUrl,
  onLoadConfig,
  onExtensionChange,
  onExit,
}) => {
  const [step, setStep] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);

  const style: WalkthroughStyle = useMemo(() => {
    if ((config.uiPreset ?? 'b') === 'm') return 'minimal';
    return config.theme;
  }, [config.theme, config.uiPreset]);

  const selectedSet = useMemo(() => new Set<RatingType>(), []);

  const applyStyle = (next: WalkthroughStyle) => {
    setConfig((prev) => {
      if (next === 'minimal') {
        return { ...prev, theme: 'solid', uiPreset: 'm' };
      }
      return { ...prev, theme: next, uiPreset: 'b' };
    });
  };

  const toggleBadge = (id: RatingType, enabled: boolean) => {
    setConfig((prev) => {
      if (enabled && !prev.ratings.includes(id)) return { ...prev, ratings: [...prev.ratings, id] };
      if (!enabled) return { ...prev, ratings: prev.ratings.filter((rating) => rating !== id) };
      return prev;
    });
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8" style={{ background: 'var(--film-black)' }}>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="syne-font uppercase tracking-widest" style={{ fontSize: 10, color: 'var(--film-amber)' }}>
              Walkthrough
            </p>
            <h2 className="syne-font" style={{ fontSize: 20, color: 'var(--film-cream)' }}>
              Step {step} of 4
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onExit('simple')}>
            Skip to Simple
          </Button>
        </div>

        {step === 1 && (
          <Card variant="elevated">
            <MediaPicker config={config} setConfig={setConfig} title="Step 1 · Pick your media" />
          </Card>
        )}

        {step === 2 && (
          <Card variant="elevated" className="space-y-4">
            <p className="syne-font uppercase tracking-widest" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
              Step 2 · Choose the vibe
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                { id: 'glass', label: 'Glass' },
                { id: 'solid', label: 'Solid' },
                { id: 'minimal', label: 'Minimal' },
              ] as const).map((option) => {
                const active = style === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyStyle(option.id)}
                    className="rounded-xl p-4 text-left transition-colors"
                    style={{
                      border: active ? '1px solid rgba(196,124,46,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                      color: 'var(--film-cream)',
                    }}
                  >
                    <p className="syne-font" style={{ fontSize: 13 }}>{option.label}</p>
                  </button>
                );
              })}
            </div>
            <div>
              <p className="syne-font uppercase tracking-widest mb-2" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
                Preset layout
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_OPTIONS.map((option) => {
                  const active = config.preset === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, preset: option.id, layout: 'row' }))
                      }
                      className="px-3 py-2 rounded-lg syne-font text-[11px]"
                      style={{
                        border: active ? '1px solid rgba(196,124,46,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                        color: active ? 'var(--film-amber)' : 'var(--film-text-label)',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card variant="elevated" className="space-y-3">
            <p className="syne-font uppercase tracking-widest" style={{ fontSize: 10, color: 'var(--film-text-dim)' }}>
              Step 3 · Choose badges
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {BADGE_OPTIONS.map((id) => {
                const label = ALL_BADGES.find((badge) => badge.id === id)?.label ?? id;
                const active = config.ratings.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleBadge(id, !active)}
                    className="w-full px-3 py-2 rounded-lg text-left syne-font text-[11px]"
                    style={{
                      border: active ? '1px solid rgba(196,124,46,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                      color: active ? 'var(--film-amber)' : 'var(--film-text-label)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_360px] gap-4">
            <Card variant="elevated" padding="none" className="relative min-h-[520px]">
              <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md syne-font text-[10px] uppercase tracking-widest" style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--film-amber)' }}>
                <Sparkles size={11} className="inline mr-1" /> Preview
              </div>
              <div className="h-[520px]">
                <PreviewCanvas
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedSet}
                  onSelect={() => undefined}
                  onContextMenu={() => undefined}
                  onLogoContextMenu={() => undefined}
                />
              </div>
            </Card>

            <Card variant="elevated" className="space-y-3">
              <p className="syne-font" style={{ fontSize: 14, color: 'var(--film-cream)' }}>
                Step 4 · Generate & Export
              </p>
              <Button
                ref={exportBtnRef}
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<Download size={13} />}
                onClick={() => setExportOpen((open) => !open)}
              >
                Export Options
              </Button>
              {exportOpen && (
                <ExportMenu
                  config={config}
                  onLoadConfig={onLoadConfig}
                  baseUrl={baseUrl}
                  onExtensionChange={onExtensionChange}
                  isOpen={exportOpen}
                  onClose={() => setExportOpen(false)}
                  anchorRef={exportBtnRef}
                />
              )}

              <div className="pt-2 space-y-2">
                <Button variant="secondary" size="md" fullWidth onClick={() => onExit('simple')}>
                  Tweak in Simple Mode
                </Button>
                <Button variant="amber" size="md" fullWidth onClick={() => onExit('advanced')}>
                  Fine-tune in Advanced Mode
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={12} />}
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={12} />}
            onClick={() => setStep((value) => Math.min(4, value + 1))}
            disabled={(step === 1 && !config.tmdbId) || step === 4}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughMode;
