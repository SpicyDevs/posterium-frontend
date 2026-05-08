import { memo, useState } from 'react';
import type React from 'react';
import {
  Grid3x3,
  Magnet,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings2,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ViewOptions {
  showSafeArea: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
}

const OverlayButton = ({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
    style={{
      color: active ? 'var(--film-amber)' : 'var(--film-text-dim)',
      cursor: 'pointer',
      background: active ? 'rgba(196,124,46,0.1)' : 'transparent',
      border: 'none',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
      (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.color = active
        ? 'var(--film-amber)'
        : 'var(--film-text-dim)';
      (e.currentTarget as HTMLElement).style.background = active
        ? 'rgba(196,124,46,0.1)'
        : 'transparent';
    }}
  >
    {children}
  </button>
);

const ZoomOverlay = memo<{
  isFullscreen: boolean;
  rightSidebarWidth: number;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isMobile: boolean;
  viewOptions: ViewOptions;
  onToggleViewOption: (key: keyof ViewOptions) => void;
}>(
  ({
    isFullscreen,
    rightSidebarWidth,
    onToggleFullscreen,
    onZoomIn,
    onZoomOut,
    onResetView,
    isMobile,
    viewOptions,
    onToggleViewOption,
  }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const placement = isMobile
      ? { bottom: 76, right: 12 }
      : {
          top: '50%',
          transform: 'translateY(-50%)',
          right: isFullscreen ? 20 : rightSidebarWidth + 20,
          transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
        };

    return (
      <div className="fixed z-40 select-none" style={placement}>
        <div
          className={`flex items-center gap-1 rounded-xl ${isMobile ? 'flex-row' : 'flex-col'}`}
          style={{
            background: 'rgba(14,13,11,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(196,124,46,0.18)',
            padding: '6px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <OverlayButton title="Zoom In" onClick={onZoomIn}>
            <ZoomIn size={15} />
          </OverlayButton>
          <OverlayButton title="Zoom Out" onClick={onZoomOut}>
            <ZoomOut size={15} />
          </OverlayButton>
          <OverlayButton title="Reset Zoom / Fit Canvas" onClick={onResetView}>
            <RotateCcw size={14} />
          </OverlayButton>
          <OverlayButton
            title="Builder Settings"
            active={settingsOpen}
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <Settings2 size={14} />
          </OverlayButton>

          {!isMobile && (
            <div
              style={{
                width: 20,
                height: 1,
                background: 'rgba(255,255,255,0.08)',
                margin: '2px 0',
              }}
            />
          )}
          {!isMobile && (
            <OverlayButton
              title={isFullscreen ? 'Exit Fullscreen (F or Esc)' : 'Enter Fullscreen (F)'}
              active={isFullscreen}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </OverlayButton>
          )}
        </div>

        {settingsOpen && (
          <div
            className="absolute rounded-2xl overflow-hidden"
            style={{
              width: 238,
              right: isMobile ? 0 : 46,
              bottom: isMobile ? 46 : 'auto',
              top: isMobile ? 'auto' : '50%',
              transform: isMobile ? 'none' : 'translateY(-50%)',
              background: 'rgba(18,17,14,0.98)',
              border: '1px solid rgba(196,124,46,0.18)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(196,124,46,0.06)',
            }}
          >
            <div
              className="px-3 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p
                className="syne-font uppercase tracking-widest"
                style={{ fontSize: 10, color: 'var(--film-cream)', fontWeight: 700 }}
              >
                Builder Settings
              </p>
              <p
                className="body-font mt-0.5"
                style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
              >
                Canvas guides and movement behavior
              </p>
            </div>
            <div className="p-2 space-y-1">
              {[
                { key: 'showGrid' as const, label: 'Show grid lines', Icon: Grid3x3 },
                { key: 'showSafeArea' as const, label: 'Show safe zones', Icon: ShieldCheck },
                { key: 'snapToGrid' as const, label: 'Snap to grid', Icon: Magnet },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleViewOption(key)}
                  className="w-full h-9 px-2.5 rounded-lg flex items-center justify-between gap-2 transition-all syne-font"
                  style={{
                    color: viewOptions[key] ? 'var(--film-cream)' : 'var(--film-text-dim)',
                    background: viewOptions[key]
                      ? 'rgba(196,124,46,0.1)'
                      : 'rgba(255,255,255,0.025)',
                    border: viewOptions[key]
                      ? '1px solid rgba(196,124,46,0.22)'
                      : '1px solid rgba(255,255,255,0.05)',
                    fontSize: 11,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={12} />
                    {label}
                  </span>
                  <span
                    className="mono-font"
                    style={{
                      fontSize: 9,
                      color: viewOptions[key] ? 'var(--film-amber)' : 'var(--film-text-dim)',
                    }}
                  >
                    {viewOptions[key] ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);
ZoomOverlay.displayName = 'ZoomOverlay';

export default ZoomOverlay;
