import { memo } from 'react';
import type { PosterConfig } from '@/types/poster';
import { DEFAULT_CONFIG } from '@/constants/badges';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface ThemeStepProps {
  config: PosterConfig;
  onChange: (updates: Partial<PosterConfig>) => void;
}

interface ThemeOption {
  id: string;
  label: string;
  description: string;
  apply: Partial<PosterConfig>;
}

const THEMES: ThemeOption[] = [
  {
    id: 'glass',
    label: 'Glass',
    description: 'Frosted glassmorphism badges with backdrop blur',
    apply: {
      theme: 'glass',
      uiPreset: 'b',
      blur: DEFAULT_CONFIG.blur,
      alpha: DEFAULT_CONFIG.alpha,
      radius: DEFAULT_CONFIG.radius,
      shadow: DEFAULT_CONFIG.shadow,
      icon: true,
      showText: true,
    },
  },
  {
    id: 'solid',
    label: 'Solid',
    description: 'Solid background badges with high opacity',
    apply: {
      theme: 'solid',
      uiPreset: 'b',
      blur: 0,
      alpha: 0.92,
      icon: true,
      showText: true,
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean minimal style — no background, just text',
    apply: {
      uiPreset: 'm',
      blur: 0,
      alpha: 0,
      radius: 0,
      shadow: 0,
      icon: false,
      showText: true,
      theme: 'glass',
    } as Partial<PosterConfig>,
  },
  {
    id: 'text-only',
    label: 'Text Only',
    description: 'Rating text and numbers only, no icon or glass panel',
    apply: {
      uiPreset: 'b',
      icon: false,
      showText: true,
      theme: 'glass',
      blur: 0,
      alpha: 0.4,
    },
  },
];

const ThemeStep = memo<ThemeStepProps>(({ config, onChange }) => {
  const currentTheme = (() => {
    if (config.uiPreset === 'm') return 'minimal';
    if (config.icon === false && config.showText !== false) return 'text-only';
    if (config.theme === 'solid') return 'solid';
    return 'glass';
  })();

  return (
    <div>
      <StepTitle>Choose a Theme</StepTitle>
      <StepSubtitle>
        Select a visual style for your rating badges. You can fine-tune later.
      </StepSubtitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {THEMES.map((theme) => {
          const active = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.apply)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 16,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
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
              <div
                className="syne-font"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: active ? 'var(--film-cream)' : 'var(--film-text-label)',
                }}
              >
                {theme.label}
              </div>
              <div
                className="body-font"
                style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.3 }}
              >
                {theme.description}
              </div>
              <div
                style={{
                  height: 40,
                  borderRadius: 6,
                  marginTop: 4,
                  background:
                    theme.id === 'glass'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                      : theme.id === 'solid'
                        ? 'rgba(30,28,24,0.8)'
                        : theme.id === 'minimal'
                          ? 'transparent'
                          : 'rgba(20,18,16,0.5)',
                  border:
                    theme.id === 'glass'
                      ? '1px solid rgba(255,255,255,0.06)'
                      : theme.id === 'solid'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : theme.id === 'minimal'
                          ? '1px dashed rgba(255,255,255,0.1)'
                          : '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  color: 'var(--film-text-dim)',
                }}
              >
                {theme.id === 'minimal'
                  ? '8.4'
                  : theme.id === 'text-only'
                    ? 'IMDb 8.4'
                    : '★ IMDb 8.4'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

ThemeStep.displayName = 'ThemeStep';
export default ThemeStep;
