import React, { useState, useEffect, useRef } from 'react';
import {
  RatingType,
  PosterConfig,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
} from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';

interface Props {
  badgeId: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  canvasScale: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
  isSelected: boolean;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const DraggableBadge: React.FC<Props> = ({
  badgeId,
  config,
  x,
  y,
  canvasScale,
  onPositionChange,
  isSelected,
  onSelect,
}) => {
  const itemConfig = config.items[badgeId];

  const scale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
  } | null>(null);
  const [currentPos, setCurrentPos] = useState({ x, y });
  const posRef = useRef({ x, y });

  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x, y });
      posRef.current = { x, y };
    }
  }, [x, y, isDragging]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      elemX: currentPos.x,
      elemY: currentPos.y,
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const { mouseX, mouseY, elemX, elemY } = dragStartRef.current;

    const deltaX = (clientX - mouseX) / canvasScale;
    const deltaY = (clientY - mouseY) / canvasScale;

    let nextX = elemX + deltaX;
    let nextY = elemY + deltaY;

    nextX = Math.max(0, Math.min(nextX, CANVAS_WIDTH - width));
    nextY = Math.max(0, Math.min(nextY, CANVAS_HEIGHT - height));

    const newPos = { x: nextX, y: nextY };
    setCurrentPos(newPos);
    posRef.current = newPos;
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    onPositionChange(badgeId, posRef.current.x, posRef.current.y);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling while dragging the badge
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, canvasScale, width, height]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    handleStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    // Prevent default to stop synthetic mouse events from firing after touch
    // (but passive needs to be true/false depending on the browser, React handles this safely here)
    onSelect(badgeId, false); // Multi-select is hard on mobile, default to false
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const blurVal = itemConfig?.blur ?? config.blur;
  const alphaVal = itemConfig?.alpha ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;

  const rawShadow = itemConfig?.shadow ?? config.shadow;
  const shadowVal = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;

  const showIcon = itemConfig?.icon ?? true;

  const bgRaw = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const backgroundStyle = bgRaw.startsWith('grad:')
    ? `linear-gradient(135deg, ${bgRaw.split(':')[1]}, ${bgRaw.split(':')[2]})`
    : bgRaw;

// Default border width is 0 unless set, default color is white
  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
    const dummyVals: Record<string, string> = {
      imdb: '8.7',
      rt: '73%',
      rt_popcorn: '88%',
      letterboxd: '4.2',
      meta: '74',
      tmdb: '85%',
      runtime: '2h 15m',
      mal: '8.5',
      anilist: '85%',
    };
    const dummyVal = dummyVals[badgeId] || '0.0';

    if (badgeId === 'age') {
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div
            className="absolute inset-0 m-2.5 border-2 rounded opacity-50"
            style={{ borderColor: txtColor }}
          ></div>
          <span
            style={{
              fontSize: `${28 * scale}px`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 'bold',
              color: txtColor,
            }}
          >
            PG-13
          </span>
        </div>
      );
    }

    if (!showIcon) {
      return (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: textTop,
            transform: 'translate(-50%, -50%)',
            fontSize: `${28 * scale}px`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 'bold',
            color: txtColor,
            lineHeight: 1,
          }}
        >
          {dummyVal}
        </span>
      );
    }

    let iconKey: string =
      badgeId === 'rt' ? 'rt_fresh' : badgeId === 'rt_popcorn' ? 'popcorn_fresh' : badgeId;
    const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];

    return (
      <>
        {iconData && (
          <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
            <svg
              viewBox={iconData.vb}
              width={iconSize}
              height={iconSize}
              style={{ display: 'block', color: txtColor }}
              dangerouslySetInnerHTML={{ __html: iconData.body }}
            />
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            right: textRight,
            top: textTop,
            transform: 'translateY(-50%)',
            fontSize: `${28 * scale}px`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 'bold',
            color: txtColor,
            lineHeight: 1,
          }}
        >
          {dummyVal}
        </span>
      </>
    );
  };

  const dropShadow = shadowVal > 0 ? `0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0, 0, 0, 0.5)` : '';
  const finalBoxShadow = dropShadow || 'none';

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={`absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60]`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        background: backgroundStyle,
        borderRadius: `${radiusVal}px`,
        outline: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
        backdropFilter: `blur(${blurVal}px)`,
        boxShadow: finalBoxShadow,
        willChange: isDragging ? 'transform' : 'auto',
        touchAction: 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease-out',
      }}
    >
      {renderContent()}

      {/* Selection Checkmark Indicator */}
      {isSelected && (
        <div className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm border-2 border-zinc-900 z-10 pointer-events-none transition-all animate-in zoom-in-50 duration-200">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default DraggableBadge;
