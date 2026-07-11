import { type RefObject } from 'react';
import ModeToggle, { type BuilderMode } from './ModeToggle';
import ToolbarBtn from './ToolbarButton';
import {
  Search,
  Keyboard,
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface BuilderDesktopHeaderProps {
  isFullscreen: boolean;
  builderMode: BuilderMode;
  setBuilderMode: (m: BuilderMode) => void;
  setPaletteOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  canUndo: boolean;
  undo: () => void;
  canRedo: boolean;
  redo: () => void;
  importBtnRef: RefObject<HTMLButtonElement | null>;
  exportBtnRefDesktop: RefObject<HTMLButtonElement | null>;
  exportOpen: boolean;
  setExportOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsResetOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsImportOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const BuilderDesktopHeader: React.FC<BuilderDesktopHeaderProps> = ({
  isFullscreen,
  builderMode,
  setBuilderMode,
  setPaletteOpen,
  shortcutsOpen,
  setShortcutsOpen,
  canUndo,
  undo,
  canRedo,
  redo,
  importBtnRef,
  exportBtnRefDesktop,
  exportOpen,
  setExportOpen,
  setIsResetOpen,
  setIsImportOpen,
}) => {
  if (isFullscreen) return null;

  return (
    <header
      className="hidden lg:flex h-12 shrink-0 items-center z-30 relative"
      style={{
        background: 'rgba(7,7,6,0.97)',
        borderBottom: '1px solid rgba(196,124,46,0.08)',
      }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-center px-2 sm:px-3 shrink-0 gap-1 overflow-hidden max-lg:!w-auto">
        <a
          href="/"
          className="flex items-center"
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
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
        <ModeToggle mode={builderMode} onChange={setBuilderMode} />
        <button
          onClick={() => setPaletteOpen(true)}
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
          <Search size={13} className="shrink-0" />
          <span className="text-[11px] syne-font whitespace-nowrap">Search…</span>
        </button>
        <ToolbarBtn
          onClick={() => setShortcutsOpen((v) => !v)}
          label="Keyboard Shortcuts (⌘/)"
          active={shortcutsOpen}
          hideOnMobile
        >
          <Keyboard size={14} />
        </ToolbarBtn>
      </div>

      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center gap-2 pointer-events-none px-1 sm:px-2">
        <button
          onClick={() => setPaletteOpen(true)}
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
            className="text-[9px] mono-font px-1.5 py-0.5 rounded border bg-white/5 shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center justify-end px-2 sm:px-3 shrink-0 gap-0.5 sm:gap-1 max-lg:!w-auto">
        <div
          className="w-px h-4 mx-1 hidden lg:block"
          style={{ background: 'rgba(196,124,46,0.12)' }}
          aria-hidden="true"
        />

        <ToolbarBtn onClick={undo} disabled={!canUndo} label="Undo (⌘Z)">
          <Undo2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={redo} disabled={!canRedo} label="Redo (⌘Y)">
          <Redo2 size={14} />
        </ToolbarBtn>

        <div
          className="w-px h-4 mx-1 hidden lg:block"
          style={{ background: 'rgba(196,124,46,0.12)' }}
          aria-hidden="true"
        />

        <button
          ref={importBtnRef}
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md transition-colors syne-font hidden sm:flex"
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
          ref={exportBtnRefDesktop}
          onClick={() => setExportOpen((v) => !v)}
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
          <Download size={13} />
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
          onClick={() => setIsResetOpen(true)}
          className="flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-md transition-colors syne-font text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
        >
          <RotateCcw size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider hidden min-[1401px]:inline">
            Reset
          </span>
        </button>
      </div>
    </header>
  );
};

export default BuilderDesktopHeader;
