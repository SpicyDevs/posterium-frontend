// src/components/builder/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface Props {
  header?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  side?: 'left' | 'right' | 'none';
}

const SIDEBAR_BORDER: Record<string, string> = {
  left: 'border-l border-[rgba(196,124,46,0.16)]',
  right: 'border-r border-[rgba(196,124,46,0.16)]',
};

const SidebarLayout: React.FC<Props> = ({
  header,
  children,
  bodyClassName,
  className,
  side = 'none',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-[var(--film-dark)] relative',
        side !== 'none' && SIDEBAR_BORDER[side],
        className
      )}
    >
      {/* Subtle amber glow along the cut edge */}
      {side !== 'none' && (
        <div
          className={clsx(
            'absolute top-0 bottom-0 pointer-events-none opacity-[0.04] z-0',
            side === 'left' ? 'bg-gradient-to-l right-0 w-16' : 'bg-gradient-to-r left-0 w-16',
            'from-[var(--film-amber)] to-transparent'
          )}
        />
      )}

      {header && (
        <div
          className="shrink-0 px-3 pt-3 pb-2 z-10 hidden lg:block"
          style={{
            background: 'var(--film-mid)',
            borderBottom: '1px solid rgba(196,124,46,0.07)',
          }}
        >
          {header}
        </div>
      )}
      <div
        className={clsx(
          'flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar pt-4 relative z-10',
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
