import React, { memo } from 'react';
import { Layers, ShieldCheck, Contrast, ScanLine, Eye } from 'lucide-react';

type SheetTab = 'source' | 'poster' | 'badges';

interface Props {
  activeTab: SheetTab;
  leftOpen: boolean;
  rightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onSelectTab: (tab: SheetTab) => void;
}

const BUTTON_STYLE: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'rgba(240,230,204,0.72)',
  WebkitTapHighlightColor: 'transparent',
};

const ActiveButtonStyle: React.CSSProperties = {
  ...BUTTON_STYLE,
  background: 'rgba(196,124,46,0.12)',
  color: 'var(--film-amber)',
};

const MobileNavBar = memo<Props>(
  ({ activeTab, leftOpen, rightOpen, onToggleLeft, onToggleRight, onSelectTab }) => (
    <nav
      aria-label="Mobile builder navigation"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 56,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        background: 'rgba(7,7,6,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <button
        onClick={onToggleLeft}
        aria-label="Toggle layers drawer"
        style={leftOpen ? ActiveButtonStyle : BUTTON_STYLE}
      >
        <Layers size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => onSelectTab('source')}
          aria-label="Edit source"
          style={activeTab === 'source' ? ActiveButtonStyle : BUTTON_STYLE}
        >
          <ScanLine size={18} />
        </button>
        <button
          onClick={() => onSelectTab('poster')}
          aria-label="Edit poster settings"
          style={activeTab === 'poster' ? ActiveButtonStyle : BUTTON_STYLE}
        >
          <Contrast size={18} />
        </button>
        <button
          onClick={() => onSelectTab('badges')}
          aria-label="Edit badges"
          style={activeTab === 'badges' ? ActiveButtonStyle : BUTTON_STYLE}
        >
          <ShieldCheck size={18} />
        </button>
      </div>

      <button
        onClick={onToggleRight}
        aria-label="Toggle inspector drawer"
        style={rightOpen ? ActiveButtonStyle : BUTTON_STYLE}
      >
        <Eye size={18} />
      </button>
    </nav>
  )
);

MobileNavBar.displayName = 'MobileNavBar';
export default MobileNavBar;
