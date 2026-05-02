// src/components/builder/components/layout/InspectorSimple.tsx
import React, { useState } from 'react';
import type { PosterConfig, RatingType } from '../../types';
import { useEditor } from '../../context/EditorContext';
import BadgesPanelSimple from '../../panels/BadgesPanelSimple';
import LogoPanelSimple from '../../panels/LogoPanelSimple';
import PresetsTab from '../../panels/PresetsTab';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

type Tab = 'badges' | 'logo' | 'presets';
const TABS: { id: Tab; label: string }[] = [
  { id: 'badges', label: 'Badges' },
  { id: 'logo', label: 'Logo' },
  { id: 'presets', label: 'Presets' },
];

/**
 * Right sidebar for Simple mode — three tabs: Badges | Logo | Presets.
 * Shows an amber indicator bar if any Advanced-mode settings are active.
 */
export const InspectorSimple: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const [activeTab, setActiveTab] = useState<Tab>('badges');
  const { setBuilderMode } = useEditor();

  // Detect if any Advanced-only fields are non-default
  const hasAdvancedSettings =
    config.noEmbed ||
    config.uniformWidth ||
    config.decimalPlaces != null ||
    config.forceDecimal ||
    config.malIdOverride ||
    config.fontOverride ||
    config.iconPosition ||
    config.labelInside;

  const panelProps = { config, setConfig, selectedIds, onSelect };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--film-dark)', overflow: 'hidden' }}>
      {/* Advanced-settings active indicator */}
      {hasAdvancedSettings && (
        <button
          onClick={() => setBuilderMode('advanced')}
          style={{
            width: '100%',
            padding: '6px 12px',
            background: 'rgba(196,124,46,0.1)',
            border: 'none',
            borderBottom: '1px solid rgba(196,124,46,0.2)',
            color: 'var(--film-amber)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif',
            textAlign: 'left',
            flexShrink: 0,
          }}
        >
          ⚙ Advanced settings active — click to review
        </button>
      )}

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Right panel tabs"
        style={{ display: 'flex', borderBottom: '1px solid rgba(196,124,46,0.07)', flexShrink: 0 }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1, minHeight: 40,
              background: 'none', border: 'none',
              borderBottom: activeTab === id ? '2px solid var(--film-amber)' : '2px solid transparent',
              color: activeTab === id ? 'var(--film-amber)' : 'var(--film-text-dim)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif',
              transition: 'color var(--transition-fast)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div role="tabpanel" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {activeTab === 'badges' && <BadgesPanelSimple {...panelProps} />}
        {activeTab === 'logo'   && <LogoPanelSimple {...panelProps} />}
        {activeTab === 'presets'&& <PresetsTab {...panelProps} />}
      </div>
    </div>
  );
};

export default InspectorSimple;
