// src/components/builder/components/ModeToggle.tsx
import React, { useRef, useState, useCallback } from 'react';
import { useEditor } from '../context/EditorContext';

/**
 * 140×32px segmented toggle between "Simple" and "Advanced" builder modes.
 * Persists selection to localStorage via EditorContext.
 * On first switch to Advanced, shows a 3-second tooltip.
 */
export const ModeToggle: React.FC = () => {
  const { builderMode, setBuilderMode } = useEditor();
  const hasShownTooltip = useRef(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback(
    (mode: 'simple' | 'advanced') => {
      if (mode === builderMode) return;
      setBuilderMode(mode);

      if (mode === 'advanced' && !hasShownTooltip.current) {
        hasShownTooltip.current = true;
        setTooltipVisible(true);
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = setTimeout(() => setTooltipVisible(false), 3000);
      }
    },
    [builderMode, setBuilderMode]
  );

  const activeStyle: React.CSSProperties = {
    background: 'var(--film-amber)',
    border: '1px solid var(--film-amber)',
    color: '#070706',
    fontWeight: 700,
  };

  const inactiveStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--film-text-dim)',
    fontWeight: 500,
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        role="group"
        aria-label="Builder mode"
        style={{
          display: 'flex',
          width: 140,
          height: 32,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-xs)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {(['simple', 'advanced'] as const).map((mode) => {
          const isActive = builderMode === mode;
          return (
            <button
              key={mode}
              aria-pressed={isActive}
              onClick={() => handleSelect(mode)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'inherit',
                transition: `background var(--transition-fast), color var(--transition-fast)`,
                ...(isActive ? activeStyle : inactiveStyle),
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          );
        })}
      </div>

      {/* First-switch tooltip */}
      {tooltipVisible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--film-mid)',
            border: '1px solid rgba(196,124,46,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            fontSize: 11,
            color: 'var(--film-cream)',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 'var(--z-modal)' as unknown as number,
            pointerEvents: 'none',
            fontFamily: "'Syne', sans-serif",
            animation: 'fade-up 0.2s ease forwards',
          }}
        >
          {/* Upward arrow */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'var(--film-mid)',
              border: '1px solid rgba(196,124,46,0.3)',
              borderBottom: 'none',
              borderRight: 'none',
            }}
          />
          Advanced mode unlocks all V3 controls.
        </div>
      )}
    </div>
  );
};

export default ModeToggle;
