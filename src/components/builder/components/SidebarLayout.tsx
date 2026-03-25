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
      className={clsx('flex flex-col h-full min-h-0 relative overflow-hidden', className)}
      style={{
        background: 'linear-gradient(180deg, rgba(10,9,7,0.95), rgba(7,7,6,0.96))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 48px rgba(0,0,0,0.55)',
        borderLeft: '1px solid rgba(196,124,46,0.08)',
        borderRight: '1px solid rgba(196,124,46,0.08)',
        backdropFilter: 'blur(12px) saturate(1.05)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 10%, rgba(196,124,46,0.08), transparent 36%), radial-gradient(circle at 80% 0%, rgba(196,124,46,0.06), transparent 42%)',
          opacity: 0.8,
        }}
      />

      <div
        className="shrink-0 px-3 pt-3 pb-2 z-10 relative"
        style={{
          background: 'linear-gradient(180deg, rgba(18,16,13,0.96), rgba(12,11,9,0.92))',
          borderBottom: '1px solid rgba(196,124,46,0.12)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.3), transparent)' }}
        />
        <div
          aria-hidden
          className="absolute inset-x-3 top-3 rounded-full h-7 blur-xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(196,124,46,0.25), transparent 60%)' }}
        />
        <div className="relative z-10">
          {header}
        </div>
      </div>

      <div
        className={clsx('flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar relative', bodyClassName)}
        style={{
          background: 'radial-gradient(circle at 50% -10%, rgba(196,124,46,0.05), transparent 55%)',
          paddingBottom: 12,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-3 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)' }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
