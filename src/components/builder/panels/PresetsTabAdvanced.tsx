// src/components/builder/panels/PresetsTabAdvanced.tsx
import React from 'react';
import { Lock } from 'lucide-react';
import type { PanelProps } from '../components/AdvancedPanelArea';
import PresetsTab from './PresetsTab';

/**
 * Advanced-mode presets tab.
 * Renders the same 3 built-in presets as PresetsTab, plus a disabled
 * "Custom Presets" card explaining that user-saved presets are a future feature.
 */
const PresetsTabAdvanced: React.FC<PanelProps> = (props) => (
  <div>
    <PresetsTab {...props} />

    {/* Disabled "Custom Presets" card */}
    <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.015)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-sm)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
        title="Coming in a future update"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={13} style={{ color: 'var(--film-text-ghost)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--film-text-dim)',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Custom Presets
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--film-text-ghost)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 7px',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Soon
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.5 }}>
          Save and share your own poster configurations. Coming in a future update.
        </span>
      </div>
    </div>
  </div>
);

export default PresetsTabAdvanced;
