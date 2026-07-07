import React, { memo } from 'react';

interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  hideOnMobile?: boolean;
}

const ToolbarButton = memo<ToolbarButtonProps>(
  ({ onClick, disabled, label, danger, href, active, children, hideOnMobile = false }) => {
    const base = `relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] ${hideOnMobile ? 'hidden lg:flex' : ''}`;
    const cls = `${base} ${
      disabled
        ? 'cursor-not-allowed pointer-events-none'
        : active
          ? 'cursor-pointer'
          : 'active:scale-95 cursor-pointer'
    }`;

    const activeStyle = active
      ? {
          color: 'var(--film-amber)',
          background: 'rgba(196,124,46,0.1)',
          border: '1px solid rgba(196,124,46,0.2)',
        }
      : disabled
        ? { color: 'rgba(255,255,255,0.15)', border: '1px solid transparent', opacity: 0.5 }
        : danger
          ? { color: 'var(--film-text-dim)', border: '1px solid transparent' }
          : { color: 'var(--film-text-dim)', border: '1px solid transparent' };

    const tooltip = !disabled && (
      <span
        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 pointer-events-none z-[200] shadow-lg syne-font"
        style={{
          background: 'var(--film-mid)',
          color: 'var(--film-cream)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {label}
      </span>
    );

    const hoverEvents =
      !disabled && !active
        ? {
            onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
              const el = e.currentTarget as HTMLElement;
              if (danger) {
                el.style.color = 'rgba(248,113,113,0.8)';
                el.style.background = 'rgba(248,113,113,0.08)';
              } else {
                el.style.color = 'var(--film-text-label)';
                el.style.background = 'rgba(196,124,46,0.07)';
              }
            },
            onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'var(--film-text-dim)';
              el.style.background = 'transparent';
            },
          }
        : {};

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={cls}
          aria-label={label}
          style={activeStyle}
          {...hoverEvents}
        >
          {children}
          {tooltip}
        </a>
      );
    }

    return (
      <button
        onClick={onClick}
        disabled={!!disabled}
        className={cls}
        aria-label={label}
        aria-disabled={disabled}
        style={activeStyle}
        {...hoverEvents}
      >
        {children}
        {tooltip}
      </button>
    );
  }
);
ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;
