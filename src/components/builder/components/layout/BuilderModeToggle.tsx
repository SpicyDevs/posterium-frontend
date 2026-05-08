import React from 'react';
import clsx from 'clsx';

type BuilderMode = 'simple' | 'advanced';

interface Props {
  mode: BuilderMode;
  className?: string;
}

const items: Array<{ mode: BuilderMode; label: string; href: string }> = [
  { mode: 'simple', label: 'Simple', href: '/build' },
  { mode: 'advanced', label: 'Advanced', href: '/abuild' },
];

const BuilderModeToggle: React.FC<Props> = ({ mode, className }) => (
  <nav
    aria-label="Builder mode"
    className={clsx(
      'inline-flex items-center rounded-lg border border-[rgba(196,124,46,0.18)] bg-[rgba(255,255,255,0.035)] p-0.5 shadow-inner shadow-black/20',
      className
    )}
  >
    {items.map((item) => {
      const active = item.mode === mode;
      return (
        <a
          key={item.mode}
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={clsx(
            'h-6 px-2.5 rounded-md text-[9px] syne-font font-bold uppercase tracking-[0.11em] transition-all flex items-center',
            active
              ? 'bg-[var(--film-amber)] text-[var(--film-dark)] shadow-sm shadow-[rgba(196,124,46,0.25)]'
              : 'text-[var(--film-text-dim)] hover:text-[var(--film-cream)] hover:bg-white/[0.045]'
          )}
        >
          {item.label}
        </a>
      );
    })}
  </nav>
);

export default BuilderModeToggle;
