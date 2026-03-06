// src/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface SidebarLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}

// FIX: Replaced `bg-app-sidebar` and `bg-app-header` with explicit hex values.
// In Tailwind v4, utility classes that reference undefined CSS custom properties
// (e.g. `--color-app-sidebar`) silently emit no CSS, leaving the element transparent.
// The sidebar background was therefore inherited from whatever the nearest opaque
// ancestor happened to be — a brittle implicit dependency. Explicit values make the
// component self-contained and correct regardless of its parent.
const SidebarLayout: React.FC<SidebarLayoutProps> = ({ header, children, bodyClassName }) => {
  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] overflow-y-auto lg:overflow-hidden custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-[#0c0c0e] shrink-0">
        {header}
      </div>

      {/* Body — lg:flex-1 + lg:overflow-y-auto keeps split-scroll behaviour on desktop */}
      <div
        className={clsx(
          'relative lg:flex-1 lg:overflow-y-auto custom-scrollbar pb-24 lg:pb-0',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;