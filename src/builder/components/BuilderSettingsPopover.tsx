import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ToggleRow from './ui/ToggleRow';
import type { ViewOptions } from '../EditorContext';

interface BuilderSettingsPopoverProps {
  isOpen: boolean;
  viewOptions: ViewOptions;
  onToggleViewOption: (key: keyof ViewOptions) => void;
  isMobile?: boolean;
  /** Called when the user dismisses the popover (outside click / Escape). */
  onRequestClose?: () => void;
}

const BuilderSettingsPopover: React.FC<BuilderSettingsPopoverProps> = ({
  isOpen,
  viewOptions,
  onToggleViewOption,
  isMobile = false,
  onRequestClose,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  // ZoomOverlay owns the trigger and does not pass onRequestClose yet, so the
  // popover self-dismisses as a fallback. State resets when isOpen flips true,
  // so the trigger keeps toggling it open again.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOpen) setDismissed(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || dismissed) return;
    const dismiss = () => {
      setDismissed(true);
      onRequestClose?.();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      // Ignore the settings trigger so its own onClick toggle still flips state.
      if (
        (e.target as Element | null)?.closest?.('button')?.getAttribute('title') ===
        'Builder Settings'
      )
        return;
      dismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, dismissed, onRequestClose]);

  if (!isOpen || dismissed) return null;

  return (
    <div
      ref={rootRef}
      className="absolute z-[60] w-[260px] rounded-2xl overflow-hidden"
      style={{
        ...(isMobile
          ? { bottom: '100%', right: 0, marginBottom: 10 }
          : { right: '100%', top: 0, marginRight: 10 }),
        background: 'rgba(18,17,14,0.98)',
        border: '1px solid rgba(196,124,46,0.18)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06)',
        animation: 'builder-settings-in 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes builder-settings-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <SlidersHorizontal size={13} style={{ color: 'var(--film-amber)' }} />
        <span
          className="syne-font font-bold uppercase tracking-widest"
          style={{ fontSize: 10, color: 'var(--film-cream)' }}
        >
          Builder Settings
        </span>
      </div>
      <div className="px-4 py-3 space-y-4">
        <ToggleRow
          label="Snap to Grid"
          sub="Align dragged layers to 10px increments"
          checked={viewOptions.snapToGrid}
          onChange={() => onToggleViewOption('snapToGrid')}
        />
        <ToggleRow
          label="Show Grid Lines"
          sub="Display composition grid over the poster"
          checked={viewOptions.showGrid}
          onChange={() => onToggleViewOption('showGrid')}
        />
        <ToggleRow
          label="Show Safe Zones"
          sub="Preview title/action-safe boundaries"
          checked={viewOptions.showSafeArea}
          onChange={() => onToggleViewOption('showSafeArea')}
        />
      </div>
    </div>
  );
};

export default BuilderSettingsPopover;
