// src/components/builder/components/CommandPalette.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid3x3,
  ShieldCheck,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  CheckSquare,
  MousePointer2Off,
  Download,
  Image,
  ScanLine,
  Droplet,
  Contrast,
  Layout,
  PanelLeft,
  PanelRight,
  ArrowUpToLine,
  ArrowDownToLine,
  Command,
  X,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, panelRef, onClose);

  // FIX: Push state to history to intercept mobile back button
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
        // If the component unmounts or closes normally, we need to pop the state if it's still there
        if (window.history.state?.modal === 'command-palette') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Load recent from sessionStorage
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

  // Filter commands
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show recent first, then all
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

  // Keyboard navigation
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

  // Auto-scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Reset active on query change
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

  // Group by category when no query
  const groups = React.useMemo(() => {
    if (filtered.query) return null;
    const map: Map<string, PaletteCommand[]> = new Map();
    if (filtered.recent.length > 0) map.set('Recent', filtered.recent);
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.all.filter((c) => c.category === cat);
      if (items.length) map.set(cat, items);
    }
    // Catch any uncategorized
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
        background: 'rgba(7,7,6,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'cp-backdrop 0.15s ease',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes cp-backdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cp-panel { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 16px',
          background: 'rgba(14,13,11,0.97)',
          border: '1px solid rgba(196,124,46,0.22)',
          borderRadius: 14,
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06), 0 0 60px rgba(196,124,46,0.06)',
          overflow: 'hidden',
          animation: 'cp-panel 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(196,124,46,0.02)',
          }}
        >
          <Search size={15} style={{ color: 'rgba(196,124,46,0.55)', flexShrink: 0 }} />
          <input
            className="min-w-0 max-[900px]:max-w-[220px]"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            autoComplete="off"
            spellCheck={false}
            style={
              {
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--film-cream)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 500,
                '::placeholder': { color: 'rgba(140,130,112,0.62)' },
              } as React.CSSProperties
            }
          />
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 5,
              color: 'rgba(140,130,112,0.72)',
              cursor: 'pointer',
              padding: '3px 7px',
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'border-color 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--film-cream)';
              e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(140,130,112,0.72)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
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
            scrollbarColor: 'rgba(196,124,46,0.2) transparent',
          }}
        >
          {flatList.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(140,130,112,0.62)',
                fontSize: 12,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              No commands match "{query}"
            </div>
          )}

          {filtered.query ? (
            // Flat filtered list
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
            // Grouped list
            <div style={{ padding: '4px' }}>
              {groups &&
                Array.from(groups.entries()).map(([cat, items]) => (
                  <React.Fragment key={cat}>
                    <div
                      style={{
                        padding: '8px 12px 4px',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        color:
                          cat === 'Recent' ? 'rgba(196,124,46,0.72)' : 'rgba(140,130,112,0.62)',
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
            gap: 16,
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          {[
            ['↑↓', 'Navigate'],
            ['↵', 'Execute'],
            ['Esc', 'Close'],
          ].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'rgba(196,124,46,0.6)',
                }}
              >
                {key}
              </kbd>
              <span
                style={{
                  fontSize: 9,
                  color: 'rgba(140,130,112,0.62)',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {label}
              </span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Command size={9} style={{ color: 'rgba(140,130,112,0.6)' }} />
            <span
              style={{
                fontSize: 9,
                color: 'rgba(140,130,112,0.6)',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
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
// ── Single command row ────────────────────────────────────────────────────────
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
      background: isActive ? 'rgba(196,124,46,0.12)' : 'transparent',
      border: 'none',
      borderRadius: 7,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.08s',
    }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        background: isActive ? 'rgba(196,124,46,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? 'rgba(196,124,46,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? 'var(--film-amber)' : 'rgba(140,130,112,0.68)',
        flexShrink: 0,
        transition: 'background 0.08s, border-color 0.08s, color 0.08s',
        lineHeight: 0,
      }}
    >
      {cmd.icon}
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          display: 'block',
          fontSize: 12,
          color: isActive ? 'var(--film-cream)' : 'rgba(240,230,204,0.7)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          transition: 'color 0.08s',
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
            fontSize: 10,
            marginTop: 1,
            color: 'rgba(140,130,112,0.62)',
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
        fontSize: 9,
        color: 'rgba(140,130,112,0.58)',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.1em',
        flexShrink: 0,
      }}
    >
      {cmd.category.split(' ')[0]}
    </span>
    {cmd.shortcut && (
      <kbd
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 4,
          padding: '1px 5px',
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
          color: isActive ? 'rgba(196,124,46,0.8)' : 'rgba(140,130,112,0.58)',
          flexShrink: 0,
          transition: 'color 0.08s',
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
