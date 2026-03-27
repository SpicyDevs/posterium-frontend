// src/components/builder/components/CommandPalette.tsx
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, Command as CommandIcon } from 'lucide-react';

export interface PaletteCommand {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
  shortcut?: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

const CATEGORY_ORDER = [
  'View & Canvas',
  'Layers & Selection',
  'Badges',
  'Canvas Properties',
  'Export',
  'File',
];

// ── Individual command item ───────────────────────────────────────────────────
const CmdItem = memo<{ cmd: PaletteCommand; onSelect: (cmd: PaletteCommand) => void }>(({ cmd, onSelect }) => (
  <Command.Item
    value={`${cmd.label} ${cmd.category}`}
    keywords={[cmd.description ?? '', ...(cmd.keywords ?? [])]}
    onSelect={() => onSelect(cmd)}
    className="cmd-item"
    style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      borderRadius: 7,
      cursor: 'pointer',
      textAlign: 'left',
      border: 'none',
      background: 'transparent',
      width: '100%',
      transition: 'background 0.1s',
    }}
  >
    <span style={{
      width: 28, height: 28,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 7,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(140,130,112,0.55)',
      flexShrink: 0, lineHeight: 0,
    }}>
      {cmd.icon}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{
        display: 'block', fontSize: 12,
        color: 'rgba(240,230,204,0.85)',
        fontFamily: 'Syne, sans-serif', fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {cmd.label}
      </span>
      {cmd.description && (
        <span style={{
          display: 'block', fontSize: 10, marginTop: 1,
          color: 'rgba(140,130,112,0.45)',
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {cmd.description}
        </span>
      )}
    </span>
    <span style={{
      fontSize: 9, color: 'rgba(140,130,112,0.3)',
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '0.1em', flexShrink: 0,
    }}>
      {cmd.category.split(' ')[0]}
    </span>
    {cmd.shortcut && (
      <kbd style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        borderBottom: '2px solid rgba(0,0,0,0.3)',
        borderRadius: 4, padding: '1px 5px',
        fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
        color: 'rgba(196,124,46,0.6)',
        flexShrink: 0,
      }}>
        {cmd.shortcut}
      </kbd>
    )}
  </Command.Item>
));
CmdItem.displayName = 'CmdItem';

// ── Main CommandPalette ───────────────────────────────────────────────────────
const CommandPalette: React.FC<Props> = memo(({ isOpen, onClose, commands }) => {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Load recent command IDs from sessionStorage on mount
  useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem('posterium_recent_cmds') || '[]');
      setRecentIds(r);
    } catch { /* ignore */ }
  }, []);

  const recordRecent = useCallback((id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 5);
      try { sessionStorage.setItem('posterium_recent_cmds', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const recentCommands = useMemo(
    () => recentIds.map(id => commands.find(c => c.id === id)).filter(Boolean) as PaletteCommand[],
    [recentIds, commands],
  );

  const groupedCommands = useMemo(() => {
    const map = new Map<string, PaletteCommand[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = commands.filter(c => c.category === cat);
      if (items.length) map.set(cat, items);
    }
    const categorized = new Set(CATEGORY_ORDER);
    const other = commands.filter(c => !categorized.has(c.category));
    if (other.length) map.set('Other', other);
    return map;
  }, [commands]);

  const handleSelect = useCallback((cmd: PaletteCommand) => {
    recordRecent(cmd.id);
    cmd.action();
    onClose();
  }, [recordRecent, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(7,7,6,0.78)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'cp-backdrop 0.15s ease',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes cp-backdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-panel { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        [cmdk-group-heading] {
          padding: 8px 12px 4px !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 0.14em !important;
          color: rgba(140,130,112,0.4) !important;
          font-family: Syne, sans-serif !important;
          text-transform: uppercase !important;
        }
        .cmd-item[aria-selected="true"] {
          background: rgba(196,124,46,0.12) !important;
        }
        .cmd-item[aria-selected="true"] > span:first-child {
          background: rgba(196,124,46,0.15) !important;
          border-color: rgba(196,124,46,0.2) !important;
          color: rgba(196,124,46,0.8) !important;
        }
        [cmdk-input] { caret-color: var(--film-amber, #D4A245); }
        [cmdk-list]::-webkit-scrollbar { width: 4px; }
        [cmdk-list]::-webkit-scrollbar-track { background: transparent; }
        [cmdk-list]::-webkit-scrollbar-thumb { background: rgba(196,124,46,0.2); border-radius: 2px; }
      `}</style>

      <div
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: 'rgba(14,13,11,0.97)',
          border: '1px solid rgba(196,124,46,0.22)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(196,124,46,0.06)',
          overflow: 'hidden',
          animation: 'cp-panel 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Command
          label="Command palette"
          filter={(value, search, keywords) => {
            const q = search.toLowerCase();
            const combined = [value, ...(keywords ?? [])].join(' ').toLowerCase();
            return q.split(' ').every(word => combined.includes(word)) ? 1 : 0;
          }}
        >
          {/* Search header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(196,124,46,0.02)',
          }}>
            <Search size={15} style={{ color: 'rgba(196,124,46,0.55)', flexShrink: 0 }} />
            <Command.Input
              placeholder="Search commands…"
              autoFocus
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--film-cream)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 500,
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, color: 'rgba(140,130,112,0.6)',
                cursor: 'pointer', padding: '3px 7px',
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                flexShrink: 0, transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--film-cream)'; e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(140,130,112,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              ESC
            </button>
          </div>

          {/* Results list */}
          <Command.List style={{
            maxHeight: 380, overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(196,124,46,0.2) transparent',
          }}>
            <Command.Empty style={{
              padding: '40px 20px', textAlign: 'center',
              color: 'rgba(140,130,112,0.4)',
              fontSize: 12, fontFamily: 'Syne, sans-serif',
            }}>
              No commands found.
            </Command.Empty>

            {recentCommands.length > 0 && (
              <Command.Group heading="Recent" style={{ padding: '4px' }}>
                {recentCommands.map(cmd => (
                  <CmdItem key={`recent-${cmd.id}`} cmd={cmd} onSelect={handleSelect} />
                ))}
              </Command.Group>
            )}

            {Array.from(groupedCommands.entries()).map(([cat, items]) => (
              <Command.Group key={cat} heading={cat} style={{ padding: '4px' }}>
                {items.map(cmd => (
                  <CmdItem key={cmd.id} cmd={cmd} onSelect={handleSelect} />
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.01)',
          }}>
            {[['↑↓', 'Navigate'], ['↵', 'Execute'], ['Esc', 'Close']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <kbd style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '2px 6px',
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                  color: 'rgba(196,124,46,0.6)',
                }}>{key}</kbd>
                <span style={{ fontSize: 9, color: 'rgba(140,130,112,0.4)', fontFamily: 'Syne, sans-serif' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CommandIcon size={9} style={{ color: 'rgba(140,130,112,0.3)' }} />
              <span style={{ fontSize: 9, color: 'rgba(140,130,112,0.3)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>POSTERIUM</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
});
CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
