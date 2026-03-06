// src/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface Props {
  header: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  /** Extra classes on the root container */
  className?: string;
}

/**
 * Shared sidebar shell.
 *
 * Structure:
 *   ┌──────────────────────────┐
 *   │  header (sticky, shrink) │  ← always visible, never scrolls away
 *   ├──────────────────────────┤
 *   │  body (scrollable)       │  ← flex-1, overflow-y: auto
 *   └──────────────────────────┘
 *
 * On mobile the component is rendered inside the bottom sheet whose own
 * container already has overflow-y: auto, so we just let children flow
 * naturally (no nested scroll trap).
 */
const SidebarLayout: React.FC<Props> = ({ header, children, bodyClassName, className }) => {
  return (
    <div className={clsx('flex flex-col h-full min-h-0 bg-[#0d0d0f]', className)}>
      {/* Sticky header — does NOT scroll */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-white/[0.06] bg-[#0d0d0f] z-10">
        {header}
      </div>

      {/* Scrollable body */}
      <div
        className={clsx(
          'flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;