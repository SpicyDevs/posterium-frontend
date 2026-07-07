import { memo, useState, type MouseEvent } from 'react';
import { Maximize2, Minimize2, RotateCcw, Settings, ZoomIn, ZoomOut } from 'lucide-react';
import type { ViewOptions } from '../../context/EditorContext';
import BuilderSettingsPopover from './BuilderSettingsPopover';

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
    const buttonStyle = {
      color: 'var(--film-text-dim)',
      cursor: 'pointer',
      background: 'transparent',
      border: 'none',
    };
    const onHover = (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.color = 'var(--film-amber)';
      e.currentTarget.style.background = 'rgba(196,124,46,0.1)';
    };
    const onLeave = (e: MouseEvent<HTMLButtonElement>, color = 'var(--film-text-dim)') => {
      e.currentTarget.style.color = color;
      e.currentTarget.style.background = 'transparent';
    };

    return (
      <div
        className={`fixed z-40 flex items-center gap-1 rounded-xl select-none ${isMobile ? 'flex-row' : 'flex-col'}`}
        style={{
          ...(isMobile
            ? { bottom: 76, right: 12 }
            : {
                top: '50%',
                transform: 'translateY(-50%)',
                right: isFullscreen ? 20 : rightSidebarWidth + 20,
                transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
              }),
          background: 'rgba(14,13,11,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(196,124,46,0.18)',
          padding: '6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <BuilderSettingsPopover
          isOpen={settingsOpen}
          viewOptions={viewOptions}
          onToggleViewOption={onToggleViewOption}
        />
        {[
          { icon: <ZoomIn size={15} />, label: 'Zoom In', action: onZoomIn },
          { icon: <ZoomOut size={15} />, label: 'Zoom Out', action: onZoomOut },
          { icon: <RotateCcw size={14} />, label: 'Reset Canvas View', action: onResetView },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={buttonStyle}
            onMouseEnter={onHover}
            onMouseLeave={(e) => onLeave(e)}
          >
            {icon}
          </button>
        ))}
        {!isMobile && (
          <div
            style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0' }}
          />
        )}
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          title="Builder Settings"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{
            ...buttonStyle,
            color: settingsOpen ? 'var(--film-amber)' : 'var(--film-text-dim)',
            background: settingsOpen ? 'rgba(196,124,46,0.1)' : 'transparent',
          }}
          onMouseEnter={onHover}
          onMouseLeave={(e) =>
            onLeave(e, settingsOpen ? 'var(--film-amber)' : 'var(--film-text-dim)')
          }
        >
          <Settings size={15} />
        </button>
        {!isMobile && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F or Esc)' : 'Enter Fullscreen (F)'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{
              ...buttonStyle,
              color: isFullscreen ? 'rgba(196,124,46,0.7)' : 'var(--film-text-dim)',
            }}
            onMouseEnter={onHover}
            onMouseLeave={(e) =>
              onLeave(e, isFullscreen ? 'rgba(196,124,46,0.7)' : 'var(--film-text-dim)')
            }
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
      </div>
    );
  }
);
ZoomOverlay.displayName = 'ZoomOverlay';

export default ZoomOverlay;
