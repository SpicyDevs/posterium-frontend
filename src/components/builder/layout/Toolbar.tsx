// src/components/builder/layout/Toolbar.tsx
import React, { memo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Undo2, Redo2, PanelLeft, PanelRight, Maximize2,
  RotateCcw, Command, Keyboard,
} from 'lucide-react';
import type { PosterConfig, ExtensionType } from '../types';
import CodeBox from '../components/CodeBox';

export interface ToolbarProps {
  config: PosterConfig;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  onExtensionChange: (ext: ExtensionType) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onReset: () => void;
  onPalette: () => void;
  isPaletteOpen: boolean;
  onShortcuts: () => void;
  isShortcutsOpen: boolean;
  onToggleLeft: () => void;
  leftVisible: boolean;
  onToggleRight: () => void;
  rightVisible: boolean;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

// ── Tooltip-wrapped button ──────────────────────────────────────────────────
interface TBtnProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  href?: string;
  hideOnMobile?: boolean;
  children: React.ReactNode;
}

const TBtn = memo<TBtnProps>(({
  label, onClick, disabled, active, danger, href, hideOnMobile, children,
}) => {
  const baseStyle: React.CSSProperties = {
    width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: 'none',
    background: active ? 'rgba(196,124,46,0.15)' : 'transparent',
    color: disabled
      ? 'rgba(100,95,85,0.4)'
      : active
        ? '#D4A245'
        : danger
          ? 'rgba(140,130,112,0.5)'
          : 'rgba(140,130,112,0.6)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'color 0.13s, background 0.13s, box-shadow 0.13s',
    outline: 'none',
    boxShadow: active ? '0 0 0 1px rgba(196,124,46,0.25)' : 'none',
    flexShrink: 0,
    position: 'relative',
  };

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    const t = e.currentTarget as HTMLElement;
    t.style.color = danger ? '#f87171' : '#D4A245';
    t.style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(196,124,46,0.1)';
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    const t = e.currentTarget as HTMLElement;
    t.style.color = active ? '#D4A245' : danger ? 'rgba(140,130,112,0.5)' : 'rgba(140,130,112,0.6)';
    t.style.background = active ? 'rgba(196,124,46,0.15)' : 'transparent';
  };

  const inner = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      style={{ ...baseStyle, textDecoration: 'none' }}
      className={hideOnMobile ? 'hidden lg:flex' : ''}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </a>
  ) : (
    <button
      onClick={onClick}
      disabled={!!disabled}
      style={baseStyle}
      className={hideOnMobile ? 'hidden lg:flex' : ''}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      aria-pressed={active}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{inner}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={8}
          style={{
            background: 'rgba(14,13,11,0.96)',
            border: '1px solid rgba(196,124,46,0.16)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 7,
            padding: '5px 10px',
            fontSize: 11,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 500,
            color: 'var(--film-cream)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            zIndex: 9998,
          }}
        >
          {label}
          <Tooltip.Arrow
            style={{ fill: 'rgba(14,13,11,0.96)' }}
            width={10}
            height={5}
          />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});
TBtn.displayName = 'TBtn';

// ── Divider ─────────────────────────────────────────────────────────────────
const Divider: React.FC<{ mobile?: boolean }> = ({ mobile }) => (
  <div
    className={mobile ? '' : 'hidden lg:block'}
    style={{
      width: 1, height: 16, flexShrink: 0,
      background: 'rgba(255,255,255,0.08)',
    }}
  />
);

// ── Toolbar ─────────────────────────────────────────────────────────────────
const Toolbar: React.FC<ToolbarProps> = ({
  config, baseUrl, handleLoadConfig, onExtensionChange,
  undo, redo, canUndo, canRedo, onReset,
  onPalette, isPaletteOpen,
  onShortcuts, isShortcutsOpen,
  onToggleLeft, leftVisible,
  onToggleRight, rightVisible,
  onToggleFullscreen,
}) => (
  <Tooltip.Provider delayDuration={500} skipDelayDuration={150}>
    <header
      className="h-12 shrink-0 flex items-center gap-2 px-3 z-30 relative"
      style={{ background: 'var(--film-dark)', borderBottom: '1px solid rgba(196,124,46,0.1)' }}
    >
      {/* Ambient gradient line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.2), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span
          className="poster-font select-none hidden sm:block"
          style={{
            fontSize: 18, color: 'var(--film-cream)',
            letterSpacing: '0.12em', lineHeight: 1,
          }}
        >
          POSTERIUM
        </span>
        <span
          className="poster-font select-none sm:hidden"
          style={{
            fontSize: 14, color: 'var(--film-amber)',
            letterSpacing: '0.12em', lineHeight: 1,
          }}
        >
          P
        </span>
      </a>

      <Divider />

      {/* URL bar */}
      <div className="flex-1 min-w-0">
        <CodeBox
          config={config}
          onLoadConfig={handleLoadConfig}
          baseUrl={baseUrl}
          onExtensionChange={onExtensionChange}
        />
      </div>

      <Divider mobile />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Command palette */}
        <TBtn onClick={onPalette} label="Command Palette (⌘K)" active={isPaletteOpen}>
          <Command size={14} />
        </TBtn>

        {/* Keyboard shortcuts */}
        <TBtn onClick={onShortcuts} label="Keyboard Shortcuts (⌘/)" active={isShortcutsOpen}>
          <Keyboard size={14} />
        </TBtn>

        <Divider />

        {/* Sidebar toggles – desktop only */}
        <TBtn
          onClick={onToggleLeft}
          label={`${leftVisible ? 'Hide' : 'Show'} Layers ([)`}
          active={!leftVisible}
          hideOnMobile
        >
          <PanelLeft size={14} />
        </TBtn>
        <TBtn
          onClick={onToggleRight}
          label={`${rightVisible ? 'Hide' : 'Show'} Inspector (])`}
          active={!rightVisible}
          hideOnMobile
        >
          <PanelRight size={14} />
        </TBtn>

        {/* Fullscreen – desktop only */}
        <TBtn onClick={onToggleFullscreen} label="Fullscreen (F)" hideOnMobile>
          <Maximize2 size={14} />
        </TBtn>

        <Divider mobile />

        {/* Undo / Redo */}
        <TBtn onClick={undo} disabled={!canUndo} label="Undo (⌘Z)">
          <Undo2 size={14} />
        </TBtn>
        <TBtn onClick={redo} disabled={!canRedo} label="Redo (⌘Y)">
          <Redo2 size={14} />
        </TBtn>

        <Divider />

        {/* Reset */}
        <TBtn onClick={onReset} danger label="Reset to defaults" hideOnMobile>
          <RotateCcw size={14} />
        </TBtn>

        {/* GitHub */}
        <TBtn href="https://github.com/xdaayush/freeposterapi" label="GitHub" hideOnMobile>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </TBtn>
      </div>
    </header>
  </Tooltip.Provider>
);

export default Toolbar;
