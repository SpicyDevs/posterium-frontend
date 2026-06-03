import React, { memo, useMemo, useState } from 'react';
import { Download, Redo2, Undo2 } from 'lucide-react';
import type { RatingType } from '../../types';

export type MobileDrawerSide = 'left' | 'right' | null;
export type MobileDrawerTab = 'source' | 'layers' | 'badges' | 'selection';

interface Props {
  drawerSide: MobileDrawerSide;
  activeTab: MobileDrawerTab;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exportButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const labelForBadge = (id: string) =>
  id
    .split(/[-_]/g)
    .map((part) => part.toUpperCase())
    .join(' ');

const MobileToolbar: React.FC<Props> = memo(
  ({
    drawerSide,
    activeTab,
    selectedIds,
    selectedLogo,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    exportButtonRef,
  }) => {
    const [brandPressed, setBrandPressed] = useState(false);
    const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0);
    const titleKey = `${drawerSide ?? 'canvas'}-${activeTab}-${selectedCount}-${Array.from(selectedIds).join(',')}-${selectedLogo}`;

    const { title, subtitle } = useMemo(() => {
      if (!drawerSide) return { title: 'CANVAS', subtitle: 'TAP POSTER TO SELECT LAYERS' };
      if (drawerSide === 'left') {
        return activeTab === 'layers'
          ? { title: 'LAYERS', subtitle: 'VISIBILITY & ORDER' }
          : { title: 'SOURCE', subtitle: 'MEDIA & POSTER SOURCE' };
      }
      if (activeTab === 'badges') return { title: 'BADGES', subtitle: 'GLOBAL BADGE STYLE' };
      if (selectedCount === 0)
        return { title: 'SELECTION', subtitle: 'CLICK A LAYER ON THE CANVAS' };
      if (selectedCount > 1)
        return { title: `${selectedCount} LAYERS`, subtitle: 'LAYER-SPECIFIC CONFIGURATION' };
      return {
        title: selectedLogo ? 'LOGO' : labelForBadge(Array.from(selectedIds)[0] ?? 'LAYER'),
        subtitle: 'LAYER-SPECIFIC CONFIGURATION',
      };
    }, [activeTab, drawerSide, selectedCount, selectedIds, selectedLogo]);

    return (
      <div
        className="lg:hidden"
        style={{
          gridArea: 'toolbar',
          height: 48,
          position: 'relative',
          zIndex: 50,
          background: 'rgba(7,7,6,0.97)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: '1px solid rgba(196,124,46,0.1)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 1,
            pointerEvents: 'none',
            zIndex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
          }}
        />
        <div
          style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 10px', gap: 6 }}
        >
          <button
            type="button"
            aria-label="Posterium"
            onTouchStart={() => setBrandPressed(true)}
            onTouchEnd={() => window.setTimeout(() => setBrandPressed(false), 120)}
            onTouchCancel={() => setBrandPressed(false)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(196,124,46,0.2)',
              background: brandPressed ? 'rgba(196,124,46,0.15)' : 'rgba(196,124,46,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.08s ease',
            }}
          >
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--film-amber)',
                letterSpacing: '0.12em',
              }}
            >
              P
            </span>
          </button>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px',
            }}
          >
            <div
              key={titleKey}
              className="mobile-panel-title"
              style={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <div
                style={{
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--film-cream)',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 8,
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  color: 'rgba(140,130,112,0.45)',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ActionButton label="Undo" disabled={!canUndo} onClick={onUndo}>
              <Undo2 size={14} />
            </ActionButton>
            <ActionButton label="Redo" disabled={!canRedo} onClick={onRedo}>
              <Redo2 size={14} />
            </ActionButton>
            <div
              aria-hidden="true"
              style={{
                width: 1,
                height: 16,
                background: 'rgba(196,124,46,0.12)',
                flexShrink: 0,
                margin: '0 2px',
              }}
            />
            <button
              ref={exportButtonRef}
              type="button"
              aria-label="Export"
              onClick={onExport}
              className="mobile-toolbar-export"
              style={{
                width: 36,
                height: 36,
                padding: 2,
                border: '1px solid transparent',
                background: 'transparent',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(196,124,46,0.12)',
                  border: '1px solid rgba(196,124,46,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--film-amber)',
                }}
              >
                <Download size={14} />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

const ActionButton: React.FC<{
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, disabled, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="mobile-toolbar-action"
    style={{
      width: 36,
      height: 36,
      padding: 2,
      background: 'transparent',
      border: '1px solid transparent',
      pointerEvents: disabled ? 'none' : 'auto',
    }}
  >
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: disabled ? 'rgba(140,130,112,0.25)' : 'rgba(240,230,204,0.8)',
      }}
    >
      {children}
    </span>
  </button>
);

MobileToolbar.displayName = 'MobileToolbar';
export default MobileToolbar;
