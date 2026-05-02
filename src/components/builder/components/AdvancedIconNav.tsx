// src/components/builder/components/AdvancedIconNav.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Image,
  Award,
  Star,
  LayoutGrid,
  MousePointer2,
  ListFilter,
  Settings2,
  Bookmark,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import type { AdvancedPanelId } from '../context/EditorContext';

interface NavItem {
  id: AdvancedPanelId;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'source',   icon: <Film size={18} />,        label: 'Source',        shortcut: '1' },
  { id: 'poster',   icon: <Image size={18} />,        label: 'Poster',        shortcut: '2' },
  { id: 'badges',   icon: <Award size={18} />,        label: 'Badges',        shortcut: '3' },
  { id: 'logo',     icon: <Star size={18} />,          label: 'Logo',          shortcut: '4' },
  { id: 'layout',   icon: <LayoutGrid size={18} />,   label: 'Layout',        shortcut: '5' },
  { id: 'selected', icon: <MousePointer2 size={18} />, label: 'Selection',     shortcut: '6' },
  { id: 'fallbacks',icon: <ListFilter size={18} />,   label: 'Fallbacks',     shortcut: '7' },
  { id: 'advanced', icon: <Settings2 size={18} />,    label: 'Advanced',      shortcut: '8' },
  { id: 'presets',  icon: <Bookmark size={18} />,     label: 'Presets',       shortcut: '9' },
];

const TOOLTIP_DELAY_MS = 200;

/**
 * 56px wide vertical icon strip for Advanced builder mode.
 * Clicking an icon activates the corresponding panel in AdvancedPanelArea.
 * Hover tooltips appear after 200ms on the right side of each icon.
 * Decorative amber bars at top and bottom.
 */
export const AdvancedIconNav: React.FC = () => {
  const { advancedPanel, setAdvancedPanel } = useEditor();
  const [tooltip, setTooltip] = useState<AdvancedPanelId | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = (id: AdvancedPanelId) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setTooltip(id), TOOLTIP_DELAY_MS);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    setTooltip(null);
  };

  useEffect(() => () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
  }, []);

  return (
    <div
      role="navigation"
      aria-label="Advanced panel navigation"
      style={{
        width: 56,
        flexShrink: 0,
        background: 'var(--film-dark)',
        borderRight: '1px solid rgba(196,124,46,0.07)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 'var(--z-sidebar)' as unknown as number,
      }}
    >
      {/* Decorative amber top bar */}
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
          opacity: 0.4,
          flexShrink: 0,
        }}
      />

      {/* Nav icons */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          paddingTop: 8,
          paddingBottom: 8,
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
        }}
      >
        {NAV_ITEMS.map(({ id, icon, label, shortcut }) => {
          const isActive = advancedPanel === id;
          return (
            <div key={id} style={{ position: 'relative', width: '100%' }}>
              <button
                onClick={() => setAdvancedPanel(id)}
                onMouseEnter={() => showTooltip(id)}
                onMouseLeave={hideTooltip}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
                style={{
                  width: '100%',
                  minHeight: 48,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  background: isActive
                    ? 'rgba(196,124,46,0.12)'
                    : 'transparent',
                  border: 'none',
                  borderLeft: isActive
                    ? '2px solid var(--film-amber)'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? 'var(--film-amber)' : 'var(--film-text-dim)',
                  transition: `color var(--transition-fast), background var(--transition-fast)`,
                  padding: '0 4px',
                }}
                onFocus={() => showTooltip(id)}
                onBlur={hideTooltip}
              >
                {icon}
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif',
                    lineHeight: 1,
                  }}
                >
                  {label.slice(0, 3)}
                </span>
              </button>

              {/* Tooltip */}
              {tooltip === id && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 8px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--film-mid)',
                    border: '1px solid rgba(196,124,46,0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 10px',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                    color: 'var(--film-cream)',
                    boxShadow: 'var(--shadow-sm)',
                    zIndex: 'var(--z-top)' as unknown as number,
                    pointerEvents: 'none',
                    fontFamily: 'Syne, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {/* Left arrow */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: -5,
                      top: '50%',
                      transform: 'translateY(-50%) rotate(45deg)',
                      width: 8,
                      height: 8,
                      background: 'var(--film-mid)',
                      border: '1px solid rgba(196,124,46,0.3)',
                      borderTop: 'none',
                      borderRight: 'none',
                    }}
                  />
                  {label}
                  {shortcut && (
                    <kbd
                      style={{
                        fontSize: 9,
                        color: 'var(--film-text-ghost)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3,
                        padding: '1px 4px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {shortcut}
                    </kbd>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Decorative amber bottom bar */}
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
          opacity: 0.4,
          flexShrink: 0,
        }}
      />
    </div>
  );
};

export default AdvancedIconNav;
