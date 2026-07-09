import type React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import ToggleRow from './ui/ToggleRow';
import type { ViewOptions } from '../EditorContext';

interface BuilderSettingsPopoverProps {
  isOpen: boolean;
  viewOptions: ViewOptions;
  onToggleViewOption: (key: keyof ViewOptions) => void;
  isMobile?: boolean;
}

const BuilderSettingsPopover: React.FC<BuilderSettingsPopoverProps> = ({
  isOpen,
  viewOptions,
  onToggleViewOption,
  isMobile = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
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
