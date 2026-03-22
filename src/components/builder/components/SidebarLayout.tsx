// src/components/builder/components/SidebarLayout.tsx
import React from 'react';
import clsx from 'clsx';

interface Props {
  header: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}

const SidebarLayout: React.FC<Props> = ({ header, children, bodyClassName, className }) => {
  return (
    <div className={clsx('flex flex-col h-full min-h-0 bg-[#0d0d0f]', className)}>
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/6 bg-[#0d0d0f] z-10">
        {header}
      </div>
      <div className={clsx('flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar', bodyClassName)}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
