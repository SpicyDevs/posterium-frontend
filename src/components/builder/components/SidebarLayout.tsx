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
    <div className={clsx('flex flex-col h-full', className)}>
      {header && (
        <div
          className="shrink-0 px-3 pt-3 pb-2 z-10 hidden lg:block"
          style={{
            background: 'var(--film-dark)',
            borderBottom: '1px solid rgba(196,124,46,0.07)',
          }}
        >
          {header}
        </div>
      )}
      <div
        className={clsx(
          'flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar pt-2 lg:pt-0',
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
