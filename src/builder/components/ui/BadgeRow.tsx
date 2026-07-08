import React, { useEffect, useState } from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import clsx from 'clsx';
import type { RatingType } from '../../types';
import { BADGE_ICONS, fetchApiIcons } from '../../../constants/badges';

interface BadgeRowProps {
  badge: { id: RatingType; label: string };
  isActive: boolean;
  isSelected: boolean;
  ratingVal: string | undefined;
  iconKey: string;
  fallbackEnabled: boolean;
  onSelect: (id: RatingType, multi: boolean) => void;
  handleToggleVisibility: (id: RatingType, visible: boolean) => void;
  provided?: DraggableProvided;
  isDraggingItem?: boolean;
}

const BadgeRow: React.FC<BadgeRowProps> = ({
  badge,
  isActive,
  isSelected,
  ratingVal,
  iconKey,
  fallbackEnabled,
  onSelect,
  handleToggleVisibility,
  provided,
  isDraggingItem = false,
}) => {
  const [iconsLoaded, setIconsLoaded] = useState(false);

  useEffect(() => {
    // Fetches the dynamic icons payload exactly once and triggers a re-render to paint SVG geometry
    fetchApiIcons().then(() => setIconsLoaded(true));
  }, []);

  const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badge.id];
  const iconColor = isActive ? (iconData?.color ?? 'var(--film-text-dim)') : 'rgba(74,74,82,0.6)';
  const inactiveOpacity = fallbackEnabled ? 'opacity-70' : 'opacity-50';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      onSelect(badge.id, true);
    } else {
      handleToggleVisibility(badge.id, true);
    }
  };

  return (
    <div
      data-icons-loaded={iconsLoaded}
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      onClick={(e) => {
        if (isActive) onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      className={clsx(
        'flex items-center gap-2 px-2 py-2 rounded-lg transition-all select-none',
        isSelected
          ? 'bg-[rgba(196,124,46,0.08)] ring-1 ring-[rgba(196,124,46,0.2)]'
          : isActive
            ? 'hover:bg-[rgba(196,124,46,0.06)] cursor-pointer'
            : inactiveOpacity,
        isDraggingItem && 'shadow-2xl rotate-[0.5deg]'
      )}
      style={
        isDraggingItem
          ? { background: 'var(--film-mid)', ...(provided?.draggableProps.style ?? {}) }
          : (provided?.draggableProps.style ?? {})
      }
    >
      {isActive || fallbackEnabled ? (
        <div
          {...provided?.dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 outline-none transition-colors shrink-0"
          style={{ color: 'var(--film-text-dim)', cursor: 'grab' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
          }}
        >
          <GripVertical size={13} />
        </div>
      ) : (
        <div className="w-5 shrink-0" />
      )}

      <div className="shrink-0" onClick={handleCheckboxClick}>
        <div
          className="w-4 h-4 rounded border flex items-center justify-center transition-all"
          style={{
            background: isSelected ? '#C47C2E' : 'var(--film-char)',
            borderColor: isSelected ? '#D4A245' : 'rgba(255,255,255,0.15)',
          }}
        >
          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
        </div>
      </div>

      <div
        className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {badge.id === 'age' ? (
          <span className="mono-font" style={{ fontSize: 8, fontWeight: 700, color: iconColor }}>
            PG
          </span>
        ) : iconData ? (
          <svg
            viewBox={iconData.vb}
            className="w-3.5 h-3.5"
            style={{ color: iconColor }}
            dangerouslySetInnerHTML={{ __html: iconData.body }}
          />
        ) : (
          <span
            className="mono-font"
            style={{ fontSize: 8, fontWeight: 700, color: 'var(--film-text-dim)' }}
          >
            {badge.label.slice(0, 2)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="block syne-font truncate"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isSelected
              ? 'var(--film-cream)'
              : isActive
                ? 'var(--film-text-label)'
                : 'var(--film-text-dim)',
          }}
        >
          {badge.label}
        </span>
        {isActive && ratingVal && badge.id !== 'title' && (
          <span className="mono-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
            {badge.id === 'year' ? ratingVal.replace(/\.0+$/, '') : ratingVal}
          </span>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <button
          onClick={() => handleToggleVisibility(badge.id, !isActive)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
          style={{ color: isActive ? 'var(--film-text-dim)' : 'rgba(110,110,120,0.7)' }}
          title={isActive ? 'Hide badge' : 'Show badge'}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = isActive
              ? 'var(--film-text-dim)'
              : 'rgba(110,110,120,0.7)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {isActive ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
    </div>
  );
};

export default BadgeRow;
