// src/components/builder/components/ContextMenu.tsx
import React, { useEffect, useRef, memo, useCallback } from 'react';
import {
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  MousePointer2,
  MousePointer2Off,
  CheckSquare,
  Square,
  Copy,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import type { RatingType } from '../types';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  badgeId: RatingType | null;
}

interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  divider?: boolean; // divider BEFORE this item
  disabled?: boolean;
}

interface Props {
  state: ContextMenuState;
  onClose: () => void;
  isSelected: boolean;
  onBringToFront: (id: RatingType) => void;
  onBringForward: (id: RatingType) => void;
  onSendBackward: (id: RatingType) => void;
  onSendToBack: (id: RatingType) => void;
  onHide: (id: RatingType) => void;
  onShowAll: () => void;
  onSelect: (id: RatingType) => void;
  onDeselect: (id: RatingType) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDuplicate?: (id: RatingType) => void;
  onResetBadge: (id: RatingType) => void;
  onDelete: (id: RatingType) => void;
}

const ContextMenu: React.FC<Props> = memo(
  ({
    state,
    onClose,
    isSelected,
    onBringToFront,
    onBringForward,
    onSendBackward,
    onSendToBack,
    onHide,
    onShowAll,
    onSelect,
    onDeselect,
    onSelectAll,
    onDeselectAll,
    onDuplicate,
    onResetBadge,
    onDelete,
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Clamp position to viewport
    const [pos, setPos] = React.useState({ x: state.x, y: state.y });
    React.useEffect(() => {
      if (!state.visible || !menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth,
        vh = window.innerHeight;
      setPos({
        x: state.x + rect.width > vw ? vw - rect.width - 8 : state.x,
        y: state.y + rect.height > vh ? vh - rect.height - 8 : state.y,
      });
    }, [state.visible, state.x, state.y]);

    // Close on outside click / escape / scroll
    useEffect(() => {
      if (!state.visible) return;
      const close = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
      };
      const esc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('mousedown', close);
      document.addEventListener('keydown', esc);
      document.addEventListener('scroll', onClose, true);
      return () => {
        document.removeEventListener('mousedown', close);
        document.removeEventListener('keydown', esc);
        document.removeEventListener('scroll', onClose, true);
      };
    }, [state.visible, onClose]);

    const exec = useCallback(
      (fn: () => void) => {
        fn();
        onClose();
      },
      [onClose]
    );

    if (!state.visible || !state.badgeId) return null;

    const id = state.badgeId;

    interface Group {
      items: ContextMenuAction[];
    }

    const groups: Group[] = [
      {
        items: [
          {
            id: 'front',
            label: 'Bring to Front',
            icon: <ArrowUpToLine size={12} />,
            shortcut: '⌘⇧]',
          },
          { id: 'forward', label: 'Bring Forward', icon: <ArrowUp size={12} />, shortcut: '⌘]' },
          { id: 'back', label: 'Send Backward', icon: <ArrowDown size={12} />, shortcut: '⌘[' },
          {
            id: 'toback',
            label: 'Send to Back',
            icon: <ArrowDownToLine size={12} />,
            shortcut: '⌘⇧[',
          },
        ],
      },
      {
        items: [
          { id: 'hide', label: 'Hide Badge', icon: <EyeOff size={12} />, shortcut: 'H' },
          { id: 'showall', label: 'Show All Badges', icon: <Eye size={12} /> },
          {
            id: 'select',
            label: isSelected ? 'Deselect Badge' : 'Select Badge',
            icon: isSelected ? <Square size={12} /> : <MousePointer2 size={12} />,
          },
          { id: 'selectall', label: 'Select All', icon: <CheckSquare size={12} /> },
          {
            id: 'deselectall',
            label: 'Deselect All',
            icon: <MousePointer2Off size={12} />,
            shortcut: '⌘D',
          },
        ],
      },
      {
        items: [
          ...(onDuplicate ? [{ id: 'dup', label: 'Duplicate', icon: <Copy size={12} /> }] : []),
          { id: 'reset', label: 'Reset to Defaults', icon: <RotateCcw size={12} /> },
          { id: 'delete', label: 'Delete Badge', icon: <Trash2 size={12} />, danger: true },
        ],
      },
    ];

    const handleAction = (actionId: string) => {
      switch (actionId) {
        case 'front':
          exec(() => onBringToFront(id));
          break;
        case 'forward':
          exec(() => onBringForward(id));
          break;
        case 'back':
          exec(() => onSendBackward(id));
          break;
        case 'toback':
          exec(() => onSendToBack(id));
          break;
        case 'hide':
          exec(() => onHide(id));
          break;
        case 'showall':
          exec(() => onShowAll());
          break;
        case 'select':
          exec(() => (isSelected ? onDeselect(id) : onSelect(id)));
          break;
        case 'selectall':
          exec(() => onSelectAll());
          break;
        case 'deselectall':
          exec(() => onDeselectAll());
          break;
        case 'dup':
          exec(() => onDuplicate?.(id));
          break;
        case 'reset':
          exec(() => onResetBadge(id));
          break;
        case 'delete':
          exec(() => onDelete(id));
          break;
      }
    };

    return (
      <div
        ref={menuRef}
        role="menu"
        aria-label="Badge context menu"
        style={{
          position: 'fixed',
          top: pos.y,
          left: pos.x,
          zIndex: 9000,
          minWidth: 200,
          background: 'rgba(14,13,11,0.92)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: '1px solid rgba(196,124,46,0.2)',
          borderRadius: 10,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,124,46,0.06)',
          padding: '4px',
          animation: 'ctx-enter 0.12s cubic-bezier(0.16,1,0.3,1)',
          transformOrigin: 'top left',
        }}
      >
        <style>{`
        @keyframes ctx-enter {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

        {/* Badge label header */}
        <div
          style={{
            padding: '7px 10px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--film-amber)',
              boxShadow: '0 0 6px rgba(196,124,46,0.6)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--film-amber)',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {id}
          </span>
          {isSelected && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 8,
                color: 'rgba(196,124,46,0.5)',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
              }}
            >
              selected
            </span>
          )}
        </div>

        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            )}
            {group.items.map((item) => (
              <button
                key={item.id}
                role="menuitem"
                onClick={() => handleAction(item.id)}
                disabled={item.disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  width: '100%',
                  padding: '7px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: item.danger ? 'rgba(248,113,113,0.85)' : 'rgba(240,230,204,0.75)',
                  fontSize: 11,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 500,
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = item.danger
                    ? 'rgba(248,113,113,0.1)'
                    : 'rgba(196,124,46,0.12)';
                  el.style.color = item.danger ? 'rgb(248,113,113)' : 'var(--film-cream)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'transparent';
                  el.style.color = item.danger
                    ? 'rgba(248,113,113,0.85)'
                    : 'rgba(240,230,204,0.75)';
                }}
              >
                <span style={{ opacity: 0.7, flexShrink: 0, lineHeight: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.shortcut && (
                  <span
                    style={{
                      fontSize: 9,
                      color: 'rgba(140,130,112,0.45)',
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
