// src/components/builder/panels/PresetsTab.tsx
import React from 'react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import type { PosterConfig } from '../types';

const PRESETS: Array<{ id: string; label: string; description: string; config: Partial<PosterConfig> }> = [
  {
    id: 'minimal-glass',
    label: 'Minimal Glass',
    description: 'Clean frosted glass badges, bottom-left cluster',
    config: { theme: 'glass', preset: 'bl', layout: 'row', blur: 12, alpha: 0.55, radius: 10, shadow: 6, size: 'md' },
  },
  {
    id: 'solid-top',
    label: 'Solid Top',
    description: 'Opaque solid badges across the top',
    config: { theme: 'solid', preset: 'tc', layout: 'row', blur: 0, alpha: 0.82, radius: 6, shadow: 4, size: 'sm' },
  },
  {
    id: 'corner-stack',
    label: 'Corner Stack',
    description: 'Vertical column, bottom-right corner',
    config: { theme: 'glass', preset: 'br', layout: 'col', blur: 10, alpha: 0.6, radius: 8, shadow: 8, size: 'sm' },
  },
];

const CARD_BASE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 'var(--radius-sm)',
  padding: 12,
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast), background var(--transition-fast)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const PresetsTab: React.FC<PanelProps> = ({ config, setConfig }) => (
  <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8 }}>
    {PRESETS.map(({ id, label, description, config: preset }) => {
      const isActive =
        config.theme === preset.theme &&
        config.preset === preset.preset &&
        config.layout === preset.layout;

      return (
        <button
          key={id}
          onClick={() => setConfig((p) => ({ ...p, ...preset }))}
          style={{
            ...CARD_BASE,
            borderColor: isActive ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.07)',
            background: isActive ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.03)',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          }}
        >
          {/* Colour swatch preview */}
          <div
            style={{
              height: 36,
              borderRadius: 4,
              background: isActive
                ? 'linear-gradient(135deg, rgba(196,124,46,0.3), rgba(196,124,46,0.1))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 8,
              gap: 4,
            }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 24,
                  height: 16,
                  borderRadius: preset.radius as number ?? 6,
                  background: isActive ? 'rgba(196,124,46,0.5)' : 'rgba(255,255,255,0.15)',
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: isActive ? 'var(--film-amber)' : 'var(--film-cream)',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {label}
            {isActive && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 9,
                  color: 'var(--film-amber)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Active
              </span>
            )}
          </span>
          <span style={{ fontSize: 10, color: 'var(--film-text-dim)', lineHeight: 1.4 }}>
            {description}
          </span>
        </button>
      );
    })}
  </div>
);

export default PresetsTab;
