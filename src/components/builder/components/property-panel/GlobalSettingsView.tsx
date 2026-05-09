import React, { useCallback, memo } from 'react';
import type { PosterConfig, RatingType, BadgeConfig } from '../../types';
import { DEFAULT_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../types';
import { Palette, Sliders, Hash, Type, ImagePlay } from 'lucide-react';
import SidebarLayout from '../SidebarLayout';
import { Section, SegmentedRow, SliderRow, ToggleRow, ColorRow, TextInputRow } from '../ui';
import { resolveShadow } from '../../utils/badge';
import AlignmentGrid from './AlignmentGrid';

interface GlobalSettingsViewProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  selectedLogo?: boolean;
  selectedMinimalElements?: Set<string>;
  detailLevel?: 'simple' | 'advanced';
}

const GlobalSettingsView: React.FC<GlobalSettingsViewProps> = memo(
  ({
    config,
    setConfig,
    selectedIds,
    selectedLogo = false,
    selectedMinimalElements = new Set(),
    detailLevel = 'simple',
  }) => {
    const isAdvanced = detailLevel === 'advanced';
    const badgesEnabled = config.ratings.length > 0;

    const updateConfig = useCallback(
      <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
        setConfig((prev) => {
          if (key === 'layout' || key === 'preset') {
            const newItems = { ...prev.items };
            (Object.keys(newItems) as RatingType[]).forEach((k) => {
              if (newItems[k]) {
                const { x: _x, y: _y, ...rest } = newItems[k]!;
                newItems[k] = rest;
              }
            });
            return { ...prev, [key]: value, items: newItems };
          }
          return { ...prev, [key]: value };
        });
      },
      [setConfig]
    );

    const clearGlobalColor = (key: 'bg' | 'txt') => {
      setConfig((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    };

    const LOGO_BASE_W = 320;
    const LOGO_BASE_H = 84;
    const LOGO_ASPECT = LOGO_BASE_W / LOGO_BASE_H;

    return (
      <SidebarLayout side="right" bodyClassName="pb-24">
        <Section title="Layout" sectionId="global-layout">
          <div className="flex items-start gap-4">
            <div>
              <p
                className="body-font mb-2"
                style={{ fontSize: 10, color: 'var(--film-text-label)', fontWeight: 500 }}
              >
                Position preset
              </p>
              <AlignmentGrid value={config.preset} onChange={(v) => updateConfig('preset', v)} />
            </div>
            <div className="flex-1">
              <p
                className="body-font mb-2"
                style={{ fontSize: 10, color: 'var(--film-text-label)', fontWeight: 500 }}
              >
                Flow direction
              </p>
              <div className="space-y-1.5">
                {[
                  { id: 'col' as const, label: 'Column' },
                  { id: 'row' as const, label: 'Row' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateConfig('layout', opt.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors border syne-font"
                    style={{
                      background:
                        config.layout === opt.id ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.03)',
                      color:
                        config.layout === opt.id ? 'var(--film-pale)' : 'var(--film-text-label)',
                      borderColor:
                        config.layout === opt.id ? 'rgba(196,124,46,0.22)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {badgesEnabled && (
          <>
            <Section title="Badge Appearance" icon={<Palette size={10} />} sectionId="global-badge-appearance">
              <ToggleRow
                label="Show Icons"
                checked={config.icon ?? true}
                onChange={(v) => updateConfig('icon', v)}
              />
              <ToggleRow
                label="Show Rating Text"
                sub="Hide to show icons only"
                checked={config.showText !== false}
                onChange={(v) => updateConfig('showText', v)}
              />
              <SegmentedRow
                label="Icon Style"
                options={[
                  { id: '1', label: 'Default' },
                  { id: '2', label: 'Alt' },
                  { id: '3', label: 'Mono' },
                ]}
                value={String(config.iconType ?? 1)}
                onChange={(v) => updateConfig('iconType', Math.max(1, Math.min(3, Number(v) || 1)))}
              />
            </Section>

            <Section title="Badge Shape" icon={<Sliders size={10} />} sectionId="global-badge-shape">
              <SliderRow
                label="Scale"
                value={config.scale ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                formatValue={(v) => `${v.toFixed(2)}×`}
                onChange={(v) => updateConfig('scale', v)}
                onReset={config.scale !== 1 ? () => updateConfig('scale', 1.0) : undefined}
              />
              <SliderRow
                label="Glass Blur"
                value={config.blur}
                min={0}
                max={20}
                unit="px"
                onChange={(v) => updateConfig('blur', v)}
                onReset={config.blur !== 0 ? () => updateConfig('blur', 0) : undefined}
              />
              <SliderRow
                label="Corner Radius"
                value={config.radius}
                min={0}
                max={30}
                unit="px"
                onChange={(v) => updateConfig('radius', v)}
              />
              <SliderRow
                label="Drop Shadow"
                value={resolveShadow(config.shadow as number | boolean, 6)}
                min={0}
                max={30}
                onChange={(v) => updateConfig('shadow', v)}
                onReset={
                  resolveShadow(config.shadow as number | boolean, 6) !== 6
                    ? () => updateConfig('shadow', 6)
                    : undefined
                }
              />
              <SliderRow
                label="Shadow X"
                value={config.shadowX ?? 0}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('shadowX', Math.round(v))}
              />
              <SliderRow
                label="Shadow Y"
                value={config.shadowY ?? 2}
                min={-20}
                max={20}
                step={1}
                unit="px"
                onChange={(v) => updateConfig('shadowY', Math.round(v))}
              />
              <ColorRow
                label="Shadow Color"
                value={config.shadowColor ?? '#000000'}
                onChange={(v) => updateConfig('shadowColor', v)}
              />
              <SliderRow
                label="Shadow Opacity"
                value={config.shadowOpacity ?? 0.35}
                min={0}
                max={1}
                step={0.01}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => updateConfig('shadowOpacity', Number(v.toFixed(2)))}
              />
            </Section>

            <Section title="Badge Colors" sectionId="global-badge-colors">
              <ColorRow
                label="Background"
                value={config.bg ?? '#000000'}
                onChange={(v) => updateConfig('bg', v)}
                onReset={config.bg ? () => clearGlobalColor('bg') : undefined}
                showOpacity
                opacity={config.alpha}
                onOpacityChange={(v) => updateConfig('alpha', v)}
              />
              <ColorRow
                label="Text & Icon Color"
                value={config.txt ?? '#ffffff'}
                onChange={(v) => updateConfig('txt', v)}
                onReset={config.txt ? () => clearGlobalColor('txt') : undefined}
              />
              <SliderRow
                label="Border Width"
                value={config.borderW ?? 0}
                min={0}
                max={10}
                unit="px"
                onChange={(v) => updateConfig('borderW', v)}
              />
              {(config.borderW ?? 0) > 0 && (
                <ColorRow
                  label="Border Color"
                  value={config.borderC ?? '#ffffff'}
                  onChange={(v) => updateConfig('borderC', v)}
                />
              )}
            </Section>

            {isAdvanced && (
              <Section title="Score" icon={<Hash size={10} />} defaultOpen={false} sectionId="global-score">
                <ToggleRow
                  label="Normalize to /10"
                  sub="Convert all scores to a 0–10 scale"
                  checked={config.normalize ?? false}
                  onChange={(v) => updateConfig('normalize', v)}
                />
                <ToggleRow
                  label="Show Denominator"
                  sub="Append /10 to ratings"
                  checked={(config.outOf ?? 0) > 0}
                  onChange={(v) => updateConfig('outOf', v ? 10 : undefined)}
                />
              </Section>
            )}

            {isAdvanced && (
              <Section title="Labels" icon={<Type size={10} />} defaultOpen={false} sectionId="global-labels">
                <button
                  type="button"
                  onClick={() => updateConfig('labelPos', config.labelPos ? undefined : 'below')}
                  className="w-full h-8 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95 syne-font mb-1"
                  style={{
                    background: config.labelPos ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.02)',
                    color: config.labelPos ? 'var(--film-pale)' : 'var(--film-text-dim)',
                    border: config.labelPos
                      ? '1px solid rgba(196,124,46,0.22)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {config.labelPos ? '✓ Labels Visible' : '✕ Labels Hidden'}
                </button>
                <SegmentedRow
                  label="Label Position"
                  options={[
                    { id: 'above', label: 'Above' },
                    { id: 'below', label: 'Below' },
                    { id: 'left', label: 'Left' },
                    { id: 'right', label: 'Right' },
                    { id: 'none', label: 'Hide' },
                  ]}
                  value={config.labelPos ?? 'none'}
                  onChange={(v) =>
                    updateConfig(
                      'labelPos',
                      (v === 'none' ? undefined : v) as PosterConfig['labelPos']
                    )
                  }
                />
                <TextInputRow
                  label="Label Text"
                  value={config.labelText ?? ''}
                  placeholder="Default (provider name)"
                  onChange={(v) => updateConfig('labelText', v || undefined)}
                  onClear={() => updateConfig('labelText', undefined)}
                />
                <SliderRow
                  label="Label Size"
                  value={config.labelSize ?? 11}
                  min={6}
                  max={32}
                  step={1}
                  unit="px"
                  onChange={(v) => updateConfig('labelSize', v)}
                />
                <ColorRow
                  label="Label Color"
                  value={config.labelColor ?? '#ffffff'}
                  onChange={(v) => updateConfig('labelColor', v)}
                  onReset={config.labelColor ? () => updateConfig('labelColor', undefined) : undefined}
                />
              </Section>
            )}
          </>
        )}

        {config.logo && (
          <Section title="Logo Overlay" icon={<ImagePlay size={10} />} sectionId="global-logo-overlay">
            <SliderRow
              label="Size"
              value={config.logoW}
              min={100}
              max={490}
              unit="px"
              onChange={(newW) => {
                const w = Math.round(newW);
                const h = Math.round(w / LOGO_ASPECT);
                setConfig((prev) => ({ ...prev, logoW: w, logoH: h }));
              }}
            />
            <SliderRow
              label="Opacity"
              value={config.logoOpacity}
              min={0}
              max={1}
              step={0.05}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => updateConfig('logoOpacity', v)}
            />
            <SliderRow
              label="Drop Shadow"
              value={config.logoShadow}
              min={0}
              max={30}
              onChange={(v) => updateConfig('logoShadow', v)}
            />
            <ToggleRow
              label="Background"
              sub="Add a styled panel behind the logo"
              checked={config.logoBgEnabled}
              onChange={(v) => updateConfig('logoBgEnabled', v)}
            />
            <SliderRow
              label="Border Width"
              value={config.logoBgBorderW}