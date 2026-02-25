// src/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface SidebarLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string; // Allows passing specific padding to the body if needed
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ header, children, bodyClassName }) => {
  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Shared Fixed Header Style */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-[#0f0f11] shrink-0">
        {header}
      </div>
      
      {/* Shared Scrollable Body Style */}
      <div className={clsx("flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e] relative", bodyClassName)}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
