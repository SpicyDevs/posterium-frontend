// src/components/builder/components/ShortcutsModal.tsx
import React, { memo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Canvas & View',
    shortcuts: [
      { keys: ['F'],          label: 'Toggle fullscreen' },
      { keys: ['G'],          label: 'Toggle grid overlay' },
      { keys: ["'"],          label: 'Toggle safe area' },
      { keys: ['⌘', '1'],    label: 'Fit / reset zoom' },
      { keys: ['⌘', '+'],    label: 'Zoom in' },
      { keys: ['⌘', '-'],    label: 'Zoom out' },
      { keys: ['['],          label: 'Toggle left sidebar' },
      { keys: [']'],          label: 'Toggle right sidebar' },
      { keys: ['Esc'],        label: 'Exit fullscreen / deselect' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Click'],      label: 'Select badge' },
      { keys: ['⇧+Click'],   label: 'Multi-select badge' },
      { keys: ['⌘', 'A'],    label: 'Select all badges' },
      { keys: ['⌘', 'D'],    label: 'Deselect all' },
      { keys: ['Tab'],        label: 'Cycle next badge' },
      { keys: ['⇧', 'Tab'],  label: 'Cycle previous badge' },
      { keys: ['Del / ⌫'],   label: 'Delete selected badges' },
    ],
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: ['⌘', '⇧', ']'], label: 'Bring to front' },
      { keys: ['⌘', ']'],       label: 'Bring forward' },
      { keys: ['⌘', '['],       label: 'Send backward' },
      { keys: ['⌘', '⇧', '['], label: 'Send to back' },
      { keys: ['H'],             label: 'Hide selected badges' },
    ],
  },
  {
    title: 'History & Actions',
    shortcuts: [
      { keys: ['⌘', 'Z'],       label: 'Undo' },
      { keys: ['⌘', 'Y'],       label: 'Redo' },
      { keys: ['⌘', '⇧', 'Z'], label: 'Redo (alt)' },
    ],
  },
  {
    title: 'App',
    shortcuts: [
      { keys: ['⌘', 'K'],       label: 'Command palette' },
      { keys: ['⌘', 'P'],       label: 'Command palette (alt)' },
      { keys: ['⌘', '/'],       label: 'Keyboard shortcuts' },
      { keys: ['⌘', '?'],       label: 'Keyboard shortcuts (alt)' },
    ],
  },
];

const totalShortcuts = SHORTCUT_GROUPS.reduce((acc, g) => acc + g.shortcuts.length, 0);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 22, height: 20, padding: '0 5px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderBottom: '2px solid rgba(0,0,0,0.35)',
      borderRadius: 4,
      fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
      color: 'rgba(196,124,46,0.85)',
      userSelect: 'none',
      lineHeight: 1,
    }}
  >
    {children}
  </kbd>
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<Props> = memo(({ isOpen, onClose }) => (
  <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(7,7,6,0.78)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation: 'smOverlayIn 0.15s ease',
        }}
      />

      <Dialog.Content
        aria-describedby={undefined}
        style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 9991,
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 680,
          margin: '0 16px',
          background: 'rgba(14,13,11,0.97)',
          border: '1px solid rgba(196,124,46,0.18)',
          borderRadius: 18,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.05), 0 0 60px rgba(196,124,46,0.05)',
          overflow: 'hidden',
          animation: 'smContentIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          maxHeight: '90dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <style>{`
          @keyframes smOverlayIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes smContentIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.96) translateY(4px); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1)    translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(196,124,46,0.02)',
            flexShrink: 0,
          }}
        >
          <Dialog.Title asChild>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(196,124,46,0.12)',
                  border: '1px solid rgba(196,124,46,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Keyboard size={14} style={{ color: 'var(--film-amber)' }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13, fontWeight: 600,
                    color: 'var(--film-cream)',
                    fontFamily: 'Syne, sans-serif',
                    margin: 0, lineHeight: 1.2,
                  }}
                >
                  Keyboard Shortcuts
                </p>
                <p
                  style={{
                    fontSize: 9, margin: '2px 0 0',
                    color: 'rgba(140,130,112,0.5)',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.1em',
                  }}
                >
                  POSTERIUM · ALL SHORTCUTS
                </p>
              </div>
            </div>
          </Dialog.Title>

          <Dialog.Close asChild>
            <button
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(140,130,112,0.6)',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--film-cream)';
                e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)';
                e.currentTarget.style.background = 'rgba(196,124,46,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(140,130,112,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <X size={13} />
            </button>
          </Dialog.Close>
        </div>

        {/* Shortcut grid */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            flex: 1, overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(196,124,46,0.2) transparent',
          }}
        >
          {SHORTCUT_GROUPS.map((group, gi) => (
            <div
              key={group.title}
              style={{
                padding: '16px',
                borderBottom: gi < SHORTCUT_GROUPS.length - 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                borderRight: gi % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <p
                style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', marginBottom: 12, marginTop: 0,
                  color: 'rgba(196,124,46,0.55)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {group.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.shortcuts.map(({ keys, label }) => (
                  <div
                    key={label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                  >
                    <span
                      style={{
                        fontSize: 11, color: 'rgba(240,230,204,0.72)',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {keys.map((k, i) => (
                        <React.Fragment key={`${k}-${i}`}>
                          {i > 0 && (
                            <span style={{ fontSize: 9, color: 'rgba(122,117,110,0.3)' }}>+</span>
                          )}
                          <Kbd>{k}</Kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.01)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
              color: 'rgba(140,130,112,0.35)', letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Press <Kbd>Esc</Kbd> or <Kbd>⌘/</Kbd> to close
          </span>
          <span
            style={{
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
              color: 'rgba(140,130,112,0.22)', letterSpacing: '0.08em',
            }}
          >
            {totalShortcuts} shortcuts
          </span>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
));

ShortcutsModal.displayName = 'ShortcutsModal';
export default ShortcutsModal;
