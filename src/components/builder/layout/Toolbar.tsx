// src/components/builder/layout/Toolbar.tsx
import React, { memo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  RotateCcw, Undo2, Redo2,
  PanelLeft, PanelRight, Maximize2,
  Command, Keyboard,
} from 'lucide-react';
import CodeBox from '../components/CodeBox';
import type { PosterConfig, ExtensionType } from '../types';

export interface ToolbarProps {
  config: PosterConfig;
  baseUrl: string;
  onLoadConfig: (url: string) => void;
  onExtensionChange: (ext: ExtensionType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
  onTogglePalette: () => void;
  onToggleShortcuts: () => void;
  leftVisible: boolean;
  rightVisible: boolean;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleFullscreen: () => void;
}

interface TBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  hideOnMobile?: boolean;
}

const TBtn = memo<TBtnProps>(({
  onClick, disabled, label, danger, href, active, children, hideOnMobile = false,
}) => {
  const base = `relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] ${hideOnMobile ? 'hidden lg:flex' : ''}`;
  const cls = `${base} ${
    disabled
      ? 'text-zinc-700 cursor-not-allowed pointer-events-none'
      : active
        ? 'text-[#D4A245] bg-[#C47C2E]/15 ring-1 ring-[#C47C2E]/25 cursor-pointer'
        : danger
          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 cursor-pointer'
          : 'text-zinc-500 hover:text-[#D4A245] hover:bg-[#C47C2E]/10 active:scale-95 cursor-pointer'
  }`;

  const inner = href ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className={cls} aria-label={label}>
      {children}
    </a>
  ) : (
    <button
      onClick={onClick}
      disabled={!!disabled}
      className={cls}
      aria-label={label}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );

  if (disabled) return inner;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{inner}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-[100] px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap shadow-lg"
          style={{
            background: 'var(--film-mid)',
            color: 'var(--film-cream)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'Syne, sans-serif',
          }}
          sideOffset={6}
        >
          {label}
          <Tooltip.Arrow style={{ fill: 'var(--film-mid)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
TBtn.displayName = 'TBtn';

export const Toolbar = memo<ToolbarProps>((props) => {
  const {
    config, baseUrl, onLoadConfig, onExtensionChange,
    onUndo, onRedo, canUndo, canRedo,
    onReset, onTogglePalette, onToggleShortcuts,
    leftVisible, rightVisible, paletteOpen, shortcutsOpen,
    onToggleLeft, onToggleRight, onToggleFullscreen,
  } = props;

  return (
    <Tooltip.Provider delayDuration={300}>
      <header
        className="h-12 shrink-0 flex items-center gap-2 px-3 z-30 relative"
        style={{ background: 'var(--film-dark)', borderBottom: '1px solid rgba(196,124,46,0.1)' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.2), transparent)' }}
        />

        {/* Logo */}
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span
            className="poster-font select-none hidden sm:block"
            style={{ fontSize: 18, color: 'var(--film-cream)', letterSpacing: '0.12em', lineHeight: 1 }}
          >
            POSTERIUM
          </span>
          <span
            className="poster-font select-none sm:hidden"
            style={{ fontSize: 14, color: 'var(--film-amber)', letterSpacing: '0.12em', lineHeight: 1 }}
          >
            P
          </span>
        </a>

        <div className="w-px h-4 mx-1 shrink-0 hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* URL bar — takes available space */}
        <div className="flex-1 min-w-0">
          <CodeBox
            config={config}
            onLoadConfig={onLoadConfig}
            baseUrl={baseUrl}
            onExtensionChange={onExtensionChange}
          />
        </div>

        <div className="w-px h-4 mx-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Toolbar actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <TBtn onClick={onTogglePalette} label="Command Palette (⌘K)" active={paletteOpen}>
            <Command size={14} />
          </TBtn>
          <TBtn onClick={onToggleShortcuts} label="Keyboard Shortcuts (⌘/)" active={shortcutsOpen}>
            <Keyboard size={14} />
          </TBtn>

          <div className="w-px h-4 mx-0.5 hidden lg:block" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <TBtn onClick={onToggleLeft} label={`${leftVisible ? 'Hide' : 'Show'} Layers ([)`} active={!leftVisible} hideOnMobile>
            <PanelLeft size={14} />
          </TBtn>
          <TBtn onClick={onToggleRight} label={`${rightVisible ? 'Hide' : 'Show'} Inspector (])`} active={!rightVisible} hideOnMobile>
            <PanelRight size={14} />
          </TBtn>
          <TBtn onClick={onToggleFullscreen} label="Fullscreen (F)" hideOnMobile>
            <Maximize2 size={14} />
          </TBtn>

          <div className="w-px h-4 mx-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <TBtn onClick={onUndo} disabled={!canUndo} label="Undo (⌘Z)">
            <Undo2 size={14} />
          </TBtn>
          <TBtn onClick={onRedo} disabled={!canRedo} label="Redo (⌘Y)">
            <Redo2 size={14} />
          </TBtn>

          <div className="w-px h-4 mx-0.5 hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <TBtn onClick={onReset} danger label="Reset to defaults" hideOnMobile>
            <RotateCcw size={14} />
          </TBtn>

          <TBtn href="https://github.com/a5sh/freeposterapi" label="GitHub" hideOnMobile>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </TBtn>
        </div>
      </header>
    </Tooltip.Provider>
  );
});
Toolbar.displayName = 'Toolbar';
