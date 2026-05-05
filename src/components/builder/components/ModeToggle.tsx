// src/components/builder/components/ModeToggle.tsx
import React, { useState } from 'react';
import { useEditor } from '../context/EditorContext';

export const ModeToggle: React.FC = () => {
  const { builderMode, setBuilderMode } = useEditor();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (mode: 'simple' | 'advanced') => {
    if (mode === 'advanced' && builderMode === 'simple') {
      const hasSeen = localStorage.getItem('posterium_seen_advanced_tip');
      if (!hasSeen) {
        setShowTooltip(true);
        localStorage.setItem('posterium_seen_advanced_tip', 'true');
        setTimeout(() => setShowTooltip(false), 3000);
      }
    }
    setBuilderMode(mode);
  };

  return (
    <div className="relative flex items-center bg-zinc-900/50 p-1 border border-white/5 rounded-[var(--radius-xs)] w-[140px] h-8">
      <button
        onClick={() => handleToggle('simple')}
        className={`flex-1 h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-[2px] ${
          builderMode === 'simple'
            ? 'bg-[var(--film-amber)] text-[var(--film-black)] shadow-[0_0_12px_rgba(196,124,46,0.3)]'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Simple
      </button>
      <button
        onClick={() => handleToggle('advanced')}
        className={`flex-1 h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-[2px] ${
          builderMode === 'advanced'
            ? 'bg-[var(--film-amber)] text-[var(--film-black)] shadow-[0_0_12px_rgba(196,124,46,0.3)]'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Advanced
      </button>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[var(--film-amber)] text-[var(--film-black)] text-[11px] font-bold rounded-sm shadow-xl z-50 whitespace-nowrap animate-fade-up">
          Advanced mode unlocks all V3 controls.
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-bottom-[var(--film-amber)]" />
        </div>
      )}
    </div>
  );
};
