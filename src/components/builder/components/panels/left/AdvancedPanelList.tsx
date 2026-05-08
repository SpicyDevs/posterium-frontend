import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface AdvancedPanelListItem<T extends string = string> {
  id: T;
  label: string;
  desc: string;
  Icon: LucideIcon;
  badge?: number | null;
}

interface Props<T extends string> {
  items: readonly AdvancedPanelListItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

const AdvancedPanelList = <T extends string>({ items, activeId, onSelect }: Props<T>) => (
  <div className="space-y-1.5 p-2">
    {items.map(({ id, label, desc, Icon, badge }) => {
      const active = activeId === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={active ? 'true' : undefined}
          className={clsx(
            'w-full flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-left transition-all',
            active
              ? 'border-l-[var(--film-amber)] bg-[rgba(196,124,46,0.08)] text-[var(--film-cream)]'
              : 'border-l-transparent text-[var(--film-text-dim)] hover:bg-[rgba(196,124,46,0.04)] hover:text-[var(--film-text-label)]'
          )}
        >
          <span
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
              active
                ? 'border-[rgba(196,124,46,0.28)] bg-[rgba(196,124,46,0.14)] text-[var(--film-amber)]'
                : 'border-white/[0.06] bg-white/[0.03]'
            )}
          >
            <Icon size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] syne-font">
              {label}
              {!!badge && (
                <span className="rounded-full bg-[rgba(196,124,46,0.16)] px-1.5 py-0.5 text-[8px] text-[var(--film-amber)]">
                  {badge}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[9px] body-font text-[var(--film-text-dim)]">
              {desc}
            </span>
          </span>
        </button>
      );
    })}
  </div>
);

export default AdvancedPanelList;
