// src/components/builder/components/panels/PresetPanel.tsx
import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
import { Sparkles } from 'lucide-react';
import SidebarLayout from '../SidebarLayout';

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<PosterConfig>;
}

const PRESETS: Preset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and bold. Single badge, high contrast.',
    icon: '◊',
    config: {
      preset: 'cc',
      layout: 'col',
      scale: 1.2,
      blur: 0,
      radius: 12,
      shadow: 6,
      alpha: 0.5,
      icon: true,
      showText: true,
      iconType: 1,
      borderW: 0,
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Glassy effect. Multiple badges, subtle blur.',
    icon: '✦',
    config: {
      preset: 'br',
      layout: 'col',
      scale: 0.9,
      blur: 12,
      radius: 20,
      shadow: 12,
      alpha: 0.35,
      icon: true,
      showText: true,
      iconType: 1,
      borderW: 1,
      borderC: '#ffffff',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Graphic and colorful. High saturation.',
    icon: '●',
    config: {
      preset: 'tl',
      layout: 'row',
      scale: 1.1,
      blur: 0,
      radius: 8,
      shadow: 4,
      alpha: 0.8,
      icon: false,
      showText: true,
      iconType: 1,
      borderW: 2,
      borderC: '#C47C2E',
    },
  },
];

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const PresetPanel: React.FC<Props> = memo(({ config, setConfig }) => {
  const applyPreset = (preset: Preset) => {
    setConfig((prev) => {
      const updated = { ...prev };
      Object.entries(preset.config).forEach(([key, value]) => {
        (updated as any)[key] = value;
      });
      // Reset custom item configs when applying a preset
      return {
        ...updated,
        items: {
          title: {},
          year: {},
          imdb: {},
          rt: {},
          rt_popcorn: {},
          tmdb: {},
          letterboxd: {},
          meta: {},
          mal: {},
          anilist: {},
          age: {},
          runtime: {},
        },
      };
    });
  };

  return (
    <SidebarLayout side="right" bodyClassName="pb-24 px-3 pt-4">
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={13} style={{ color: 'var(--film-amber)' }} />
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--film-text-label)',
                fontFamily: 'Syne, sans-serif',
                margin: 0,
              }}
            >
              Visual Presets
            </p>
          </div>
          <p
            style={{
              fontSize: 10,
              color: 'var(--film-text-dim)',
              fontFamily: 'DM Sans, sans-serif',
              margin: 0,
            }}
          >
            Choose a starting point. Customize further with the badges panel.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PRESETS.map((preset) => {
            const isActive = config.preset === preset.config.preset;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: isActive
                    ? 'rgba(196,124,46,0.12)'
                    : 'rgba(255,255,255,0.02)',
                  border: isActive
                    ? '1px solid rgba(196,124,46,0.24)'
                    : '1px solid rgba(196,124,46,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.16)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.08)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isActive
                        ? 'rgba(196,124,46,0.15)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isActive ? 'rgba(196,124,46,0.24)' : 'rgba(196,124,46,0.08)'
                      }`,
                      fontSize: 16,
                      color: isActive ? 'var(--film-amber)' : 'rgba(196,124,46,0.6)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {preset.icon}
                  </span>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--film-amber)',
                        fontFamily: 'Syne, sans-serif',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? 'var(--film-cream)' : 'var(--film-text-label)',
                    fontFamily: 'Syne, sans-serif',
                    margin: '0 0 4px 0',
                    transition: 'color 0.2s',
                  }}
                >
                  {preset.name}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: 'rgba(140,130,112,0.65)',
                    fontFamily: 'DM Sans, sans-serif',
                    margin: 0,
                  }}
                >
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(196,124,46,0.04)',
            border: '1px solid rgba(196,124,46,0.12)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(196,124,46,0.65)',
              fontFamily: 'Syne, sans-serif',
              marginBottom: 6,
              margin: '0 0 6px 0',
            }}
          >
            Pro Tip
          </p>
          <p
            style={{
              fontSize: 10,
              color: 'rgba(140,130,112,0.7)',
              fontFamily: 'DM Sans, sans-serif',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Presets apply global badge settings. You can still customize individual badges in the badges panel.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
});

PresetPanel.displayName = 'PresetPanel';
export default PresetPanel;