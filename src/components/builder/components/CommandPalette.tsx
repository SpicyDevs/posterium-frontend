// src/components/builder/components/CommandPalette.tsx
import React, { useState, useEffect, useCallback, memo } from 'react';
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

const CommandPalette: React.FC<Props> = memo(({ isOpen, onClose, commands }) => {
  const [recentIds, setRecentIds] = useState<string[]>([]);

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

  const recentIdSet = new Set(recentIds);
  const recentCmds = recentIds
    .map(id => commands.find(c => c.id === id))
    .filter(Boolean) as PaletteCommand[];

  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: commands.filter(c => c.category === cat && !recentIdSet.has(c.id)),
  })).filter(g => g.items.length > 0);

  const categorizedSet = new Set(CATEGORY_ORDER);
  const otherItems = commands.filter(c => !categorizedSet.has(c.category) && !recentIdSet.has(c.id));

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(7,7,6,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '11vh',
        animation: 'cpBackdropIn 0.15s ease',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes cpBackdropIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cpPanelIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        [cmdk-root] { width: 100%; }
        [cmdk-input] {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 13px; color: var(--film-cream);
          font-family: 'Syne', sans-serif; font-weight: 500;
          caret-color: var(--film-amber);
        }
        [cmdk-input]::placeholder { color: rgba(140,130,112,0.4); }
        [cmdk-list] {
          max-height: 380px; overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(196,124,46,0.2) transparent;
          padding: 4px;
        }
        [cmdk-empty] {
          padding: 40px 20px; text-align: center;
          color: rgba(140,130,112,0.4);
          font-size: 12px; font-family: 'Syne', sans-serif;
        }
        [cmdk-group-heading] {
          padding: 8px 12px 4px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(140,130,112,0.4);
          font-family: 'Syne', sans-serif;
          user-select: none;
        }
        [cmdk-item] {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 7px;
          cursor: pointer; border: none; background: transparent;
          width: 100%; text-align: left;
          transition: background 0.07s;
          outline: none;
        }
        [cmdk-item][aria-selected="true"],
        [cmdk-item][data-selected="true"] {
          background: rgba(196,124,46,0.12) !important;
        }
        [cmdk-item][aria-selected="true"] .cp-icon,
        [cmdk-item][data-selected="true"] .cp-icon {
          background: rgba(196,124,46,0.15) !important;
          border-color: rgba(196,124,46,0.3) !important;
          color: var(--film-amber) !important;
        }
        [cmdk-item][aria-selected="true"] .cp-label,
        [cmdk-item][data-selected="true"] .cp-label {
          color: var(--film-cream) !important;
        }
        [cmdk-item][aria-selected="true"] .cp-kbd,
        [cmdk-item][data-selected="true"] .cp-kbd {
          color: rgba(196,124,46,0.7) !important;
        }
      `}</style>

      <div
        style={{
          width: '100%', maxWidth: 560, margin: '0 16px',
          background: 'rgba(14,13,11,0.97)',
          border: '1px solid rgba(196,124,46,0.22)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06), 0 0 60px rgba(196,124,46,0.06)',
          overflow: 'hidden',
          animation: 'cpPanelIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <Command
          loop
          shouldFilter
          filter={(value, search, keywords) => {
            const query = search.toLowerCase().trim();
            if (!query) return 1;
            const haystack = [value, ...(keywords ?? [])].join(' ').toLowerCase();
            return query.split(/\s+/).every(word => haystack.includes(word)) ? 1 : 0;
          }}
        >
          {/* Search header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(196,124,46,0.02)',
            }}
          >
            <Search size={15} style={{ color: 'rgba(196,124,46,0.55)', flexShrink: 0 }} />
            <Command.Input
              autoFocus
              placeholder="Search commands…"
              onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}
            />
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, color: 'rgba(140,130,112,0.6)',
                cursor: 'pointer', padding: '3px 7px',
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                transition: 'border-color 0.15s, color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--film-cream)';
                e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(140,130,112,0.6)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <Command.List>
            <Command.Empty>No commands match your search.</Command.Empty>

            {recentCmds.length > 0 && (
              <Command.Group heading="Recent">
                {recentCmds.map(cmd => (
                  <CmdItem
                    key={cmd.id}
                    cmd={cmd}
                    onSelect={() => { recordRecent(cmd.id); cmd.action(); onClose(); }}
                  />
                ))}
              </Command.Group>
            )}

            {grouped.map(({ cat, items }) => (
              <Command.Group key={cat} heading={cat}>
                {items.map(cmd => (
                  <CmdItem
                    key={cmd.id}
                    cmd={cmd}
                    onSelect={() => { recordRecent(cmd.id); cmd.action(); onClose(); }}
                  />
                ))}
              </Command.Group>
            ))}

            {otherItems.length > 0 && (
              <Command.Group heading="Other">
                {otherItems.map(cmd => (
                  <CmdItem
                    key={cmd.id}
                    cmd={cmd}
                    onSelect={() => { recordRecent(cmd.id); cmd.action(); onClose(); }}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '8px 14px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {([['↑↓', 'Navigate'], ['↵', 'Execute'], ['Esc', 'Close']] as [string, string][]).map(([key, label]) => (
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
              <span style={{
                fontSize: 9, color: 'rgba(140,130,112,0.3)',
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
              }}>
                POSTERIUM
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
});

// ── Single command row ─────────────────────────────────────────────────────────
const CmdItem = memo<{ cmd: PaletteCommand; onSelect: () => void }>(({ cmd, onSelect }) => (
  <Command.Item
    value={cmd.id}
    keywords={[cmd.label, cmd.description ?? '', cmd.category, ...(cmd.keywords ?? [])]}
    onSelect={onSelect}
  >
    <span
      className="cp-icon"
      style={{
        width: 28, height: 28,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(140,130,112,0.55)',
        transition: 'background 0.08s, border-color 0.08s, color 0.08s',
        flexShrink: 0,
      }}
    >
      {cmd.icon}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        className="cp-label"
        style={{
          display: 'block', fontSize: 12,
          color: 'rgba(240,230,204,0.72)',
          fontFamily: 'Syne, sans-serif', fontWeight: 600,
          transition: 'color 0.08s',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
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
      <kbd
        className="cp-kbd"
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 4, padding: '1px 5px',
          fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
          color: 'rgba(140,130,112,0.35)',
          flexShrink: 0, transition: 'color 0.08s',
        }}
      >
        {cmd.shortcut}
      </kbd>
    )}
  </Command.Item>
));

CmdItem.displayName = 'CmdItem';
CommandPalette.displayName = 'CommandPalette';
export default CommandPalette;
