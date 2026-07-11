import React from 'react';
import { GripVertical, Eye, EyeOff, Type } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import clsx from 'clsx';

interface TitleLayerRowProps {
  isActive: boolean;
  isSelected: boolean;
  onSelect: (multi: boolean) => void;
  onEnable: () => void;
  onDisable: () => void;
  provided?: DraggableProvided;
  isDraggingItem?: boolean;
}

const TitleLayerRow: React.FC<TitleLayerRowProps> = ({
  isActive,
  isSelected,
  onSelect,
  onEnable,
  onDisable,
  provided,
  isDraggingItem = false,
}) => {
  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      onClick={(e) => {
        if (isActive) onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
        else onEnable();
      }}
      className={clsx(
        'flex items-center gap-2 px-2 py-2 rounded-lg transition-all select-none',
        isSelected && isActive
          ? 'bg-[rgba(196,124,46,0.08)] ring-1 ring-[rgba(196,124,46,0.2)]'
          : isActive
            ? 'hover:bg-[rgba(196,124,46,0.06)] cursor-pointer'
            : 'opacity-50',
        isDraggingItem && 'shadow-2xl rotate-[0.5deg]'
      )}
      style={
        isDraggingItem
          ? { background: 'var(--film-mid)', ...(provided?.draggableProps.style ?? {}) }
          : (provided?.draggableProps.style ?? {})
      }
    >
      {isActive ? (
        <div
          {...provided?.dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 outline-none transition-colors shrink-0"
          style={{ color: 'var(--film-text-dim)', cursor: 'grab' }}
        >
          <GripVertical size={13} />
        </div>
      ) : (
        <div className="w-5 shrink-0" />
      )}
      <div
        className="shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          if (!isActive) onEnable();
          else onSelect(false);
        }}
      >
        <div
          className="w-4 h-4 rounded border flex items-center justify-center transition-all"
          style={{
            background: isSelected && isActive ? '#C47C2E' : 'var(--film-char)',
            borderColor: isSelected && isActive ? '#D4A245' : 'rgba(255,255,255,0.15)',
          }}
        >
          {isSelected && isActive && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
        </div>
      </div>
      <div
        className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Type size={12} style={{ color: 'var(--film-text-dim)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block syne-font truncate" style={{ fontSize: 11, fontWeight: 600 }}>
          Title
        </span>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <button
          onClick={() => (isActive ? onDisable() : onEnable())}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: isActive ? 'var(--film-text-dim)' : 'rgba(110,110,120,0.7)' }}
          title={isActive ? 'Hide layer' : 'Show layer'}
        >
          {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
    </div>
  );
};

export default TitleLayerRow;
