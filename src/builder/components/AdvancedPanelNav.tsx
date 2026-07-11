import React, { memo } from 'react';
import { Badge, Film, Layers, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';

export type BuilderPanelId = 'source' | 'layers' | 'badges' | 'selection';

export const BUILDER_PANELS: Array<{
  id: BuilderPanelId;
  label: string;
  description: string;
  Icon: React.ElementType;
}> = [
  { id: 'source', label: 'Source', description: 'Media, IDs, source', Icon: Film },
  { id: 'layers', label: 'Layers', description: 'Order and visibility', Icon: Layers },
  { id: 'badges', label: 'Badges', description: 'Global badge style', Icon: Badge },
  { id: 'selection', label: 'Selection', description: 'Selected layer edits', Icon: MousePointer2 },
];

interface Props {
  activePanel: BuilderPanelId;
  onChange: (panel: BuilderPanelId) => void;
}

const AdvancedPanelNav: React.FC<Props> = memo(({ activePanel, onChange }) => (
  <nav className="flex-1 overflow-y-auto custom-scrollbar p-2" aria-label="Advanced builder panels">
    <div className="space-y-1">
      {BUILDER_PANELS.map(({ id, label, description, Icon }) => {
        const active = id === activePanel;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={clsx(
              'w-full flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
              !active && 'hover:bg-[rgba(196,124,46,0.07)]'
            )}
            style={{
              background: active ? 'rgba(196,124,46,0.12)' : 'transparent',
              border: active ? '1px solid rgba(196,124,46,0.22)' : '1px solid transparent',
              color: active ? 'var(--film-cream)' : 'var(--film-text-dim)',
            }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: active ? 'rgba(196,124,46,0.16)' : 'rgba(255,255,255,0.04)' }}
            >
              <Icon size={13} />
            </span>
            <span className="min-w-0">
              <span className="block syne-font text-[12px] font-bold tracking-wide">{label}</span>
              <span className="block text-[9px] truncate" style={{ color: 'var(--film-text-dim)' }}>
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </nav>
));

AdvancedPanelNav.displayName = 'AdvancedPanelNav';
export default AdvancedPanelNav;
