import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Settings2, SlidersHorizontal, Minus } from 'lucide-react';

type BottomTab = 'left' | 'settings' | 'right';

type Props = {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children: React.ReactNode;
};

const PANEL_OPTIONS = [10, 20, 30, 40] as const;

const AdvancedMobileStudio: React.FC<Props> = ({ leftPanel, rightPanel, children }) => {
  const [openPanel, setOpenPanel] = useState<'left' | 'right' | null>(null);
  const [activeTab, setActiveTab] = useState<BottomTab>('settings');
  const [resizePosterForPanel, setResizePosterForPanel] = useState(true);
  const [leftPanelPercent, setLeftPanelPercent] = useState<number>(30);
  const [rightPanelPercent, setRightPanelPercent] = useState<number>(30);

  const panelPercent = useMemo(
    () => (openPanel === 'left' ? leftPanelPercent : openPanel === 'right' ? rightPanelPercent : 30),
    [openPanel, leftPanelPercent, rightPanelPercent]
  );

  const posterScale = openPanel && resizePosterForPanel ? 1 - panelPercent / 100 : 1;

  const onAdjust = (side: 'left' | 'right') => {
    const current = side === 'left' ? leftPanelPercent : rightPanelPercent;
    const idx = PANEL_OPTIONS.indexOf(current as (typeof PANEL_OPTIONS)[number]);
    const next = PANEL_OPTIONS[(idx + 1) % PANEL_OPTIONS.length];
    if (side === 'left') setLeftPanelPercent(next);
    else setRightPanelPercent(next);
  };

  return (
    <div className="lg:hidden flex-1 min-h-0 flex flex-col relative bg-[#111113]">
      <main className="relative flex-1 overflow-hidden">
        <div
          className="h-full w-full transition-transform duration-300 origin-center"
          style={{ transform: `scale(${posterScale})` }}
        >
          {children}
        </div>

        {openPanel === 'left' && (
          <section
            className="absolute left-0 top-0 bottom-0 z-40 bg-[var(--film-dark)] border-r border-[rgba(196,124,46,0.2)] shadow-2xl"
            style={{ width: `${leftPanelPercent}%` }}
          >
            <div className="h-full overflow-y-auto">{leftPanel}</div>
          </section>
        )}
        {openPanel === 'right' && (
          <section
            className="absolute right-0 top-0 bottom-0 z-40 bg-[var(--film-dark)] border-l border-[rgba(196,124,46,0.2)] shadow-2xl"
            style={{ width: `${rightPanelPercent}%` }}
          >
            <div className="h-full overflow-y-auto">{rightPanel}</div>
          </section>
        )}
      </main>

      <nav className="h-16 shrink-0 grid grid-cols-3 border-t border-[rgba(196,124,46,0.2)] bg-[#090807]">
        <button
          className="flex flex-col items-center justify-center text-[var(--film-text-dim)]"
          onClick={() => {
            setActiveTab('left');
            setOpenPanel((v) => (v === 'left' ? null : 'left'));
          }}
        >
          <ArrowLeft size={18} />
          <span className="text-[10px]">Left</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-[var(--film-amber)]"
          onClick={() => {
            setActiveTab('settings');
            setOpenPanel(null);
          }}
        >
          <Settings2 size={18} />
          <span className="text-[10px]">Settings</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-[var(--film-text-dim)]"
          onClick={() => {
            setActiveTab('right');
            setOpenPanel((v) => (v === 'right' ? null : 'right'));
          }}
        >
          <ArrowRight size={18} />
          <span className="text-[10px]">Right</span>
        </button>
      </nav>

      {activeTab === 'settings' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] rounded-2xl border border-[rgba(196,124,46,0.25)] bg-[#141210] p-4 shadow-2xl">
          <div className="flex items-center gap-2 text-[var(--film-amber)] font-semibold text-sm">
            <SlidersHorizontal size={16} /> Mobile Settings
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--film-text)]">
            <input
              type="checkbox"
              checked={resizePosterForPanel}
              onChange={(e) => setResizePosterForPanel(e.target.checked)}
            />
            Resize poster when panel opens
          </label>
          <div className="mt-3 text-xs text-[var(--film-text-dim)]">
            Panel size: Left {leftPanelPercent}% · Right {rightPanelPercent}%
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="h-8 px-3 rounded-md bg-[rgba(196,124,46,0.12)] text-[var(--film-amber)] text-xs flex items-center gap-1"
              onClick={() => onAdjust('left')}
            >
              <Minus size={12} /> Left panel
            </button>
            <button
              className="h-8 px-3 rounded-md bg-[rgba(196,124,46,0.12)] text-[var(--film-amber)] text-xs flex items-center gap-1"
              onClick={() => onAdjust('right')}
            >
              <Minus size={12} /> Right panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedMobileStudio;
