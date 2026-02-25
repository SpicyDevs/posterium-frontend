// src/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface SidebarLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ header, children, bodyClassName }) => {
  return (
    <div className="flex flex-col h-full bg-app-sidebar overflow-y-auto lg:overflow-hidden custom-scrollbar">
      {/* Header */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-app-header shrink-0">
        {header}
      </div>

      {/* Body */}
      {/* lg:flex-1 and lg:overflow-y-auto keeps the split-scroll behavior strictly for desktop */}
      <div
        className={clsx(
          'relative lg:flex-1 lg:overflow-y-auto custom-scrollbar pb-24 lg:pb-0',
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
