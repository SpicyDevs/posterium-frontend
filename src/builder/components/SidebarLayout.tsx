// src/components/builder/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface Props {
  header?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  side?: 'left' | 'right' | 'none'; // Added for Cyberpunk styling
}

const SidebarLayout: React.FC<Props> = ({
  header,
  children,
  bodyClassName,
  className,
  side = 'none',
}) => {
  const isLeft = side === 'left';
  const isRight = side === 'right';

  // The base content of the sidebar
  const content = (
    <div
      className={clsx(
        'flex flex-col h-full w-full bg-[var(--film-dark)] relative',
        isLeft && 'cyber-path-left',
        isRight && 'cyber-path-right'
      )}
    >
      {/* Subtle inner edge glow on the cut side */}
      {side !== 'none' && (
        <div
          className={clsx(
            'absolute top-0 bottom-0 pointer-events-none opacity-[0.04] z-0',
            isLeft ? 'bg-gradient-to-l right-0 w-16' : 'bg-gradient-to-r left-0 w-16',
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

  // If no side specified, return standard orthogonal layout
  if (side === 'none') {
    return <div className={clsx('flex flex-col h-full', className)}>{content}</div>;
  }

  // Cyberpunk layered multi-line border wrapping
  return (
    <div
      className={clsx(
        'flex flex-col h-full',
        isLeft
          ? 'cyber-path-left cyber-border-outer-left'
          : 'cyber-path-right cyber-border-outer-right',
        className
      )}
    >
      <div
        className={clsx(
          'flex flex-col h-full w-full',
          isLeft
            ? 'cyber-path-left cyber-border-gap-left'
            : 'cyber-path-right cyber-border-gap-right'
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default SidebarLayout;
