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
      className={clsx('flex flex-col h-full min-h-0 relative', className)}
      style={{
        background: 'linear-gradient(180deg, rgba(20,18,14,0.98) 0%, rgba(12,11,9,0.98) 100%)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.4), transparent)' }}
      />
      <div
        className="shrink-0 px-3 pt-3 pb-2 z-10"
        style={{
          background: 'rgba(16,14,12,0.82)',
          borderBottom: '1px solid rgba(196,124,46,0.12)',
        }}
      >
        {header}
      </div>
      <div
        className={clsx('flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar', bodyClassName)}
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0))' }}
      >
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
