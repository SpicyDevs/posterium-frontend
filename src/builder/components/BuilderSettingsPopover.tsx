import type React from 'react';
import { Grid3x3, Magnet, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import ToggleRow from './ui/ToggleRow';
import type { ViewOptions } from '../EditorContext';

interface BuilderSettingsPopoverProps {
  isOpen: boolean;
  viewOptions: ViewOptions;
  onToggleViewOption: (key: keyof ViewOptions) => void;
}

const BuilderSettingsPopover: React.FC<BuilderSettingsPopoverProps> = ({
  isOpen,
  viewOptions,
  onToggleViewOption,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute z-[60] w-[260px] rounded-2xl overflow-hidden"
      style={{
        right: '100%',
        top: 0,
        marginRight: 10,
        background: 'rgba(18,17,14,0.98)',
        border: '1px solid rgba(196,124,46,0.18)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06)',
        animation: 'builder-settings-in 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes builder-settings-in {
          from { opacity: 0; transform: translateX(8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
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
      <div
        className="grid grid-cols-3 gap-1.5 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {[
          { label: 'Snap', active: viewOptions.snapToGrid, Icon: Magnet },
          { label: 'Grid', active: viewOptions.showGrid, Icon: Grid3x3 },
          { label: 'Safe', active: viewOptions.showSafeArea, Icon: ShieldCheck },
        ].map(({ label, active, Icon }) => (
          <div
            key={label}
            className="h-8 rounded-lg flex items-center justify-center gap-1 syne-font text-[9px] font-bold uppercase"
            style={{
              color: active ? 'var(--film-amber)' : 'var(--film-text-dim)',
              background: active ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.025)',
              border: active
                ? '1px solid rgba(196,124,46,0.18)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Icon size={10} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuilderSettingsPopover;
