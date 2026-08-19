import { memo, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Maximize2, Minimize2, RotateCcw, Settings, ZoomIn, ZoomOut } from 'lucide-react';
import type { ViewOptions } from '../EditorContext';
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
    // Native fullscreen (element Fullscreen API) is a mobile concept — the
    // desktop `isFullscreen` state would unmount the mobile tree, so mobile
    // uses requestFullscreen on the canvas container directly and tracks it
    // here. Only surfaced where the API exists (Android Chrome; iOS Safari
    // reports fullscreenEnabled=false, so the button hides there).
    const [nativeFs, setNativeFs] = useState(false);
    const [fsSupported, setFsSupported] = useState(false);
    useEffect(() => {
      if (typeof document === 'undefined') return;
      setFsSupported(!!document.fullscreenEnabled);
      const onFsChange = () => setNativeFs(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', onFsChange);
      return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);
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
    // Primary mobile control — touch targets must be >=44px; radius stays on
    // the established field token (8px) per DESIGN's radius economy.
    const btnSize = isMobile ? 44 : 32;
    const btnClass = 'flex items-center justify-center transition-all active:scale-90';
    const btnStyle = { ...buttonStyle, width: btnSize, height: btnSize, borderRadius: 8 };

    // ── MOBILE: coherent floating control group ──
    // One housing, one radius language (card 10px housing, punched 4px
    // buttons), bottom-right thumb reach. Zoom in/out (magnifier ±), reset
    // (rotate) and the settings gear are all self-evident glyphs, so they stay
    // icon-only — labels would add noise, not clarity. The settings gear stays
    // amber while its popover is open; outside clicks and Esc close it through
    // onRequestClose.
    if (isMobile) {
      const mb = (ariaLabel: string, icon: ReactNode, action: () => void, active = false) => (
        <button
          key={ariaLabel}
          onClick={action}
          aria-label={ariaLabel}
          aria-pressed={active}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            width: 44,
            height: 48,
            borderRadius: 4,
            flexShrink: 0,
            background: active ? 'rgba(196,124,46,0.1)' : 'transparent',
            border: 'none',
            color: active ? 'var(--film-amber)' : 'rgba(240,230,204,0.72)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {icon}
        </button>
      );
      return (
        <div
          className="fixed z-40 select-none"
          style={{
            bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            right: 12,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            padding: 4,
            borderRadius: 10,
            background: 'rgba(14,13,11,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(196,124,46,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(196,124,46,0.05)',
          }}
        >
          <BuilderSettingsPopover
            isOpen={settingsOpen}
            viewOptions={viewOptions}
            onToggleViewOption={onToggleViewOption}
            isMobile={isMobile}
            onRequestClose={() => setSettingsOpen(false)}
          />
          {mb('Zoom out', <ZoomOut size={16} />, onZoomOut)}
          {mb('Reset canvas view', <RotateCcw size={15} />, onResetView)}
          {mb('Zoom in', <ZoomIn size={16} />, onZoomIn)}
          <div
            aria-hidden="true"
            style={{
              width: 1,
              height: 30,
              background: 'rgba(196,124,46,0.15)',
              margin: '0 2px',
              flexShrink: 0,
            }}
          />
          {mb(
            'View settings',
            <Settings size={15} />,
            () => setSettingsOpen((v) => !v),
            settingsOpen
          )}
          {fsSupported &&
            mb(
              nativeFs ? 'Exit fullscreen' : 'Enter fullscreen',
              nativeFs ? <Minimize2 size={15} /> : <Maximize2 size={15} />,
              onToggleFullscreen
            )}
        </div>
      );
    }

    return (
      <div
        className={`fixed z-40 flex items-center gap-1 rounded-xl select-none ${isMobile ? 'flex-row' : 'flex-col'}`}
        style={{
          ...(isMobile
            ? { bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', right: 12 }
            : {
                top: '50%',
                transform: 'translateY(-50%)',
                right: isFullscreen ? 20 : rightSidebarWidth + 40,
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
          isMobile={isMobile}
          onRequestClose={() => setSettingsOpen(false)}
        />
        {[
          { icon: <ZoomIn size={isMobile ? 17 : 15} />, label: 'Zoom In', action: onZoomIn },
          { icon: <ZoomOut size={isMobile ? 17 : 15} />, label: 'Zoom Out', action: onZoomOut },
          {
            icon: <RotateCcw size={isMobile ? 17 : 15} />,
            label: 'Reset Canvas View',
            action: onResetView,
          },
        ].map(({ icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            title={label}
            aria-label={label}
            className={btnClass}
            style={btnStyle}
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
          aria-label="Builder Settings"
          aria-expanded={settingsOpen}
          className={btnClass}
          style={{
            ...btnStyle,
            color: settingsOpen ? 'var(--film-amber)' : 'var(--film-text-dim)',
            background: settingsOpen ? 'rgba(196,124,46,0.1)' : 'transparent',
          }}
          onMouseEnter={onHover}
          onMouseLeave={(e) =>
            onLeave(e, settingsOpen ? 'var(--film-amber)' : 'var(--film-text-dim)')
          }
        >
          <Settings size={isMobile ? 17 : 15} />
        </button>
        {(!isMobile || fsSupported) && (
          <button
            onClick={onToggleFullscreen}
            title={
              nativeFs
                ? 'Exit Fullscreen (Esc)'
                : isFullscreen
                  ? 'Exit Fullscreen (F or Esc)'
                  : 'Enter Fullscreen (F)'
            }
            aria-label={nativeFs || isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className={btnClass}
            style={{
              ...btnStyle,
              color: nativeFs || isFullscreen ? 'rgba(196,124,46,0.7)' : 'var(--film-text-dim)',
            }}
            onMouseEnter={onHover}
            onMouseLeave={(e) =>
              onLeave(e, nativeFs || isFullscreen ? 'rgba(196,124,46,0.7)' : 'var(--film-text-dim)')
            }
          >
            {nativeFs || isFullscreen ? (
              <Minimize2 size={isMobile ? 17 : 15} />
            ) : (
              <Maximize2 size={isMobile ? 17 : 15} />
            )}
          </button>
        )}
      </div>
    );
  }
);
ZoomOverlay.displayName = 'ZoomOverlay';

export default ZoomOverlay;
