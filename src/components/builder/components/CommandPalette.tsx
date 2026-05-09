// src/components/builder/components/CommandPalette.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Command, Search, X } from 'lucide-react';

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
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'command-palette' }, '');
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'command-palette') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      const r = JSON.parse(sessionStorage.getItem('posterium_recent_cmds') || '[]');
      setRecentIds(r);
    } catch {
      /* ignore */
    }
  }, []);

  const recordRecent = useCallback((id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 5);
      try {
        sessionStorage.setItem('posterium_recent_cmds', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const recentCmds = recentIds
        .map((id) => commands.find((c) => c.id === id))
        .filter(Boolean) as PaletteCommand[];
      const rest = commands.filter((c) => !recentIds.includes(c.id));
      return { query: false as const, recent: recentCmds, all: rest };
    }
    const results = commands.filter((c) => {
      const haystack = [c.label, c.description ?? '', c.category, ...(c.keywords ?? [])]
        .join(' ')
        .toLowerCase();
      return q.split(' ').every((word) => haystack.includes(word));
    });
    return { query: true as const, results };
  }, [query, commands, recentIds]);

  const flatList: PaletteCommand[] = React.useMemo(() => {
    if (filtered.query) return filtered.results;
    return [...filtered.recent, ...filtered.all];
  }, [filtered]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = flatList[activeIdx];
        if (cmd) {
          recordRecent(cmd.id);
          cmd.action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, flatList, activeIdx, onClose, recordRecent]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleExecute = useCallback(
    (cmd: PaletteCommand) => {
      recordRecent(cmd.id);
      cmd.action();
      onClose();
    },
    [recordRecent, onClose]
  );

  const groups = React.useMemo(() => {
    if (filtered.query) return null;
    const map: Map<string, PaletteCommand[]> = new Map();
    if (filtered.recent.length > 0) map.set('Recent', filtered.recent);
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.all.filter((c) => c.category === cat);
      if (items.length) map.set(cat, items);
    }
    const categorized = new Set(CATEGORY_ORDER);
    const other = filtered.all.filter((c) => !categorized.has(c.category));
    if (other.length) map.set('Other', other);
    return map;
  }, [filtered]);

  if (!isOpen) return null;

  let globalIdx = 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7,7,6,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes cp-backdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-panel { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 16px',
          background: 'rgba(14,13,11,0.96)',
          border: '1px solid rgba(196,124,46,0.16)',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.02)',
          overflow: 'hidden',
          animation: 'cp-panel 0.2s cubic-bezier(0.2,0.6,0.2,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <Search size={14} style={{ color: 'rgba(196,124,46,0.5)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            autoComplete="off"
            spellCheck={false}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--film-cream)',
              fontFamily: 'Syne, sans-serif',
              fontWeight: 500,
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(196,124,46,0.12)',
              borderRadius: 5,
              color: 'rgba(140,130,112,0.6)',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.2s',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'rgba(196,124,46,0.8)';
              el.style.borderColor = 'rgba(196,124,46,0.24)';
              el.style.background = 'rgba(196,124,46,0.06)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = 'rgba(140,130,112,0.6)';
              el.style.borderColor = 'rgba(196,124,46,0.12)';
              el.style.background = 'transparent';
            }}
          >
            <X size={12} />
            ESC
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: 380,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(196,124,46,0.15) transparent',
          }}
        >
          {flatList.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(140,130,112,0.5)',
                fontSize: 12,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              No commands match "{query}"
            </div>
          )}

          {filtered.query ? (
            <div style={{ padding: '4px' }}>
              {flatList.map((cmd, i) => (
                <CommandItem
                  key={cmd.id}
                  cmd={cmd}
                  idx={i}
                  isActive={i === activeIdx}
                  onHover={setActiveIdx}
                  onExecute={handleExecute}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '4px' }}>
              {groups &&
                Array.from(groups.entries()).map(([cat, items]) => (
                  <React.Fragment key={cat}>
                    <div
                      style={{
                        padding: '8px 12px 4px',
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color: cat === 'Recent' ? 'rgba(196,124,46,0.6)' : 'rgba(140,130,112,0.5)',
                        fontFamily: 'Syne, sans-serif',
                        textTransform: 'uppercase',
                      }}
                    >
                      {cat}
                    </div>
                    {items.map((cmd) => {
                      const idx = globalIdx++;
                      return (
                        <CommandItem
                          key={cmd.id}
                          cmd={cmd}
                          idx={idx}
                          isActive={idx === activeIdx}
                          onHover={setActiveIdx}
                          onExecute={handleExecute}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 14px',
            borderTop: '1px solid rgba(196,124,46,0.08)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          {[
            ['↑↓', 'Navigate'],
            ['↵', 'Execute'],
            ['Esc', 'Close'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(196,124,46,0.12)',
                  borderRadius: 3,
                  padding: '2px 5px',
                  fontSize: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'rgba(196,124,46,0.5)',
                }}
              >
                {key}
              </kbd>
              <span
                style={{
                  fontSize: 8,
                  color: 'rgba(140,130,112,0.5)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {label}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Command size={8} style={{ color: 'rgba(140,130,112,0.5)' }} />
            <span
              style={{
                fontSize: 8,
                color: 'rgba(140,130,112,0.5)',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.08em',
              }}
            >
              POSTERIUM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const CommandItem = memo<{
  cmd: PaletteCommand;
  idx: number;
  isActive: boolean;
  onHover: (idx: number) => void;
  onExecute: (cmd: PaletteCommand) => void;
}>(({ cmd, idx, isActive, onHover, onExecute }) => (
  <button
    data-idx={idx}
    role="option"
    aria-selected={isActive}
    onClick={() => onExecute(cmd)}
    onMouseEnter={() => onHover(idx)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '8px 10px',
      background: isActive ? 'rgba(196,124,46,0.08)' : 'transparent',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.1s',
    }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        background: isActive ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(196,124,46,0.24)' : 'rgba(196,124,46,0.08)'}`,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? 'var(--film-amber)' : 'rgba(140,130,112,0.6)',
        flexShrink: 0,
        transition: 'all 0.1s',
        lineHeight: 0,
      }}
    >
      {cmd.icon}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          display: 'block',
          fontSize: 11,
          color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.65)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          transition: 'color 0.1s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {cmd.label}
      </span>
      {cmd.description && (
        <span
          style={{
            display: 'block',
            fontSize: 9,
            marginTop: 2,
            color: 'rgba(140,130,112,0.5)',
            fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {cmd.description}
        </span>
      )}
    </span>
    <span
      style={{
        fontSize: 8,
        color: 'rgba(140,130,112,0.5)',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.08em',
        flexShrink: 0,
      }}
    >
      {cmd.category.split(' ')[0]}
    </span>
    {cmd.shortcut && (
      <kbd
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${isActive ? 'rgba(196,124,46,0.2)' : 'rgba(196,124,46,0.08)'}`,
          borderRadius: 3,
          padding: '1px 4px',
          fontSize: 8,
          fontFamily: 'JetBrains Mono, monospace',
          color: isActive ? 'rgba(196,124,46,0.7)' : 'rgba(140,130,112,0.5)',
          flexShrink: 0,
          transition: 'all 0.1s',
        }}
      >
        {cmd.shortcut}
      </kbd>
    )}
  </button>
));
CommandItem.displayName = 'CommandItem';

CommandPalette.displayName = 'CommandPalette';
export default CommandPalette;