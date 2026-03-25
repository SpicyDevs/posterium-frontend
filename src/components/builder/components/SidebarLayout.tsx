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
    <div
      className={clsx(
        'flex flex-col h-full min-h-0 glass-surface rounded-xl overflow-hidden',
        className,
      )}
    >
      {/* Header — slightly elevated section matching palette header treatment */}
      <div
        className="shrink-0 px-3 pt-3 pb-2 z-10"
        style={{
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid rgba(196,124,46,0.1)',
        }}
      >
        {header}
      </div>
      <div
        className={clsx(
          'flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 pb-3',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
