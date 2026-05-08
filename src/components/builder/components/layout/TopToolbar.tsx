import React, { memo } from 'react';
import {
  ChevronDown,
  Download,
  Keyboard,
  PanelLeft,
  PanelRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { BuilderMode } from '../../types';

interface ToolbarBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  hideOnMobile?: boolean;
}

const ToolbarBtn = memo<ToolbarBtnProps>(
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

    if (href)
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
ToolbarBtn.displayName = 'ToolbarBtn';

interface BuilderModeToggleProps {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const BuilderModeToggle = memo<BuilderModeToggleProps>(({ mode, onChange }) => {
  const options: { id: BuilderMode; label: string }[] = [
    { id: 'simple', label: 'Simple' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div
      className="flex items-center gap-0.5 h-8 p-0.5 rounded-lg border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(196,124,46,0.16)' }}
      aria-label="Builder mode"
    >
      <SlidersHorizontal size={12} className="ml-1 text-[var(--film-text-dim)] hidden sm:block" />
      {options.map((option) => {
        const active = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className="h-6 px-2 rounded-md text-[10px] syne-font font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{
              color: active ? '#070706' : 'var(--film-text-dim)',
              background: active ? 'var(--film-amber)' : 'transparent',
            }}
          >
            <span className="hidden min-[520px]:inline">{option.label}</span>
            <span className="min-[520px]:hidden">{option.label[0]}</span>
          </button>
        );
      })}
    </div>
  );
});
BuilderModeToggle.displayName = 'BuilderModeToggle';

interface TopToolbarProps {
  builderMode: BuilderMode;
  onBuilderModeChange: (mode: BuilderMode) => void;
  leftVisible: boolean;
  rightVisible: boolean;
  shortcutsOpen: boolean;
  exportOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  importBtnRef: React.RefObject<HTMLButtonElement | null>;
  exportBtnRef: React.RefObject<HTMLButtonElement | null>;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onOpenPalette: () => void;
  onToggleShortcuts: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenImport: () => void;
  onToggleExport: () => void;
  onOpenReset: () => void;
}

const TopToolbar = memo<TopToolbarProps>(
  ({
    builderMode,
    onBuilderModeChange,
    leftVisible,
    rightVisible,
    shortcutsOpen,
    exportOpen,
    canUndo,
    canRedo,
    importBtnRef,
    exportBtnRef,
    onToggleLeft,
    onToggleRight,
    onOpenPalette,
    onToggleShortcuts,
    onUndo,
    onRedo,
    onOpenImport,
    onToggleExport,
    onOpenReset,
  }) => (
    <header
      className="h-12 shrink-0 flex items-center z-30 relative"
      style={{
        background: 'rgba(7,7,6,0.97)',
        borderBottom: '1px solid rgba(196,124,46,0.08)',
      }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-center px-2 sm:px-3 shrink-0 gap-1 overflow-hidden max-lg:!w-auto">
        <a href="/" className="flex items-center" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span
            className="poster-font select-none hidden sm:block"
            style={{
              fontSize: 18,
              color: 'var(--film-cream)',
              letterSpacing: '0.12em',
              lineHeight: 'normal',
            }}
          >
            POSTERIUM
          </span>
          <span
            className="poster-font select-none sm:hidden"
            style={{
              fontSize: 14,
              color: 'var(--film-amber)',
              letterSpacing: '0.12em',
              lineHeight: 'normal',
            }}
          >
            P
          </span>
        </a>
        <BuilderModeToggle mode={builderMode} onChange={onBuilderModeChange} />
        <button
          onClick={onOpenPalette}
          title="Search commands (⌘K)"
          className="hidden max-[750px]:flex items-center gap-2 h-8 w-[250px] max-[600px]:w-[100px] px-3 rounded-md transition-all pointer-events-auto"
          style={{
            color: 'var(--film-text-dim)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <Search size={12} className="shrink-0" />
          <span className="text-[11px] syne-font whitespace-nowrap">Search…</span>
        </button>
        <ToolbarBtn
          onClick={onToggleShortcuts}
          label="Keyboard Shortcuts (⌘/)"
          active={shortcutsOpen}
          hideOnMobile
        >
          <Keyboard size={14} />
        </ToolbarBtn>
      </div>

      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center gap-2 pointer-events-none px-1 sm:px-2">
        <button
          onClick={onToggleLeft}
          title={`${leftVisible ? 'Hide' : 'Show'} Layers ([)`}
          className="shrink-0 w-8 h-8 rounded-lg items-center justify-center transition-all hidden lg:flex pointer-events-auto"
          style={{
            color: leftVisible ? 'var(--film-amber)' : 'var(--film-text-dim)',
            border: '1px solid transparent',
            background: leftVisible ? 'rgba(196,124,46,0.08)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = leftVisible
              ? 'rgba(196,124,46,0.08)'
              : 'transparent';
          }}
        >
          <PanelLeft size={14} />
        </button>

        <button
          onClick={onOpenPalette}
          className="hidden min-[751px]:flex items-center gap-2 px-3 h-8 w-full max-w-[480px] max-[900px]:max-w-[380px] max-[800px]:max-w-[300px] rounded-md transition-colors pointer-events-auto"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--film-text-dim)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <Search size={13} className="shrink-0" />
          <span className="text-[11px] syne-font text-left flex-1 min-w-0 truncate">
            Search commands...
          </span>
          <kbd
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-white/5 shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onToggleRight}
          title={`${rightVisible ? 'Hide' : 'Show'} Inspector (])`}
          className="shrink-0 w-8 h-8 rounded-lg items-center justify-center transition-all hidden lg:flex pointer-events-auto"
          style={{
            color: rightVisible ? 'var(--film-amber)' : 'var(--film-text-dim)',
            border: '1px solid transparent',
            background: rightVisible ? 'rgba(196,124,46,0.08)' : 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = rightVisible
              ? 'rgba(196,124,46,0.08)'
              : 'transparent';
          }}
        >
          <PanelRight size={14} />
        </button>
      </div>

      <div className="ml-auto flex items-center justify-end px-2 sm:px-3 shrink-0 gap-0.5 sm:gap-1 max-lg:!w-auto">
        <div
          className="w-px h-4 mx-1 hidden lg:block"
          style={{ background: 'rgba(196,124,46,0.12)' }}
          aria-hidden="true"
        />
        <ToolbarBtn onClick={onUndo} disabled={!canUndo} label="Undo (⌘Z)">
          <Undo2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={onRedo} disabled={!canRedo} label="Redo (⌘Y)">
          <Redo2 size={14} />
        </ToolbarBtn>
        <div
          className="w-px h-4 mx-1 hidden lg:block"
          style={{ background: 'rgba(196,124,46,0.12)' }}
          aria-hidden="true"
        />
        <button
          ref={importBtnRef}
          onClick={onOpenImport}
          className="items-center gap-1.5 h-8 px-2.5 rounded-md transition-colors syne-font hidden sm:flex"
          style={{ color: 'var(--film-text-dim)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
          }}
        >
          <Download size={13} className="rotate-180" />
          <span className="text-[11px] font-medium uppercase tracking-wider max-[1300px]:hidden">
            Import
          </span>
        </button>
        <button
          ref={exportBtnRef}
          onClick={onToggleExport}
          className="flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-lg ml-1 syne-font transition-all active:scale-95"
          style={{
            background: exportOpen ? 'rgba(196,124,46,0.9)' : 'var(--film-amber)',
            color: '#070706',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: exportOpen ? 'none' : '0 0 16px rgba(196,124,46,0.2)',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!exportOpen) (e.currentTarget as HTMLElement).style.background = '#d4a245';
          }}
          onMouseLeave={(e) => {
            if (!exportOpen)
              (e.currentTarget as HTMLElement).style.background = 'var(--film-amber)';
          }}
        >
          <Download size={12} />
          <span className="max-[1300px]:hidden">Export</span>
          <ChevronDown
            className="max-[1300px]:hidden"
            size={10}
            style={{
              transform: exportOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>
        <div
          className="w-px h-4 mx-1 hidden lg:block"
          style={{ background: 'rgba(196,124,46,0.12)' }}
          aria-hidden="true"
        />
        <button
          onClick={onOpenReset}
          className="flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-md transition-colors syne-font text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
        >
          <RotateCcw size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider hidden min-[1401px]:inline">
            Reset
          </span>
        </button>
      </div>
    </header>
  )
);
TopToolbar.displayName = 'TopToolbar';

export default TopToolbar;
