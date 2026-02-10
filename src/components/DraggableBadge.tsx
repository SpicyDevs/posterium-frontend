import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';
import { useEditor } from '../context/EditorContext';

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

const DraggableBadge: React.FC<Props> = ({ badgeId, config, x, y, canvasScale, onPositionChange, isSelected, onSelect }) => {
  const { ratingsData } = useEditor(); // USE REAL DATA
  const itemConfig = config.items[badgeId];
  
  const scale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number, mouseY: number, elemX: number, elemY: number } | null>(null);
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
        elemY: currentPos.y
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
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, canvasScale, width, height]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    handleStart(e.clientX, e.clientY);
  };

  const blurVal = itemConfig?.blur ?? config.blur;
  const alphaVal = itemConfig?.alpha ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;
  const hasShadow = itemConfig?.shadow ?? config.shadow;
  const showIcon = itemConfig?.icon ?? true;
  
  const bgRaw = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const backgroundStyle = bgRaw.startsWith('grad:') 
    ? `linear-gradient(135deg, ${bgRaw.split(':')[1]}, ${bgRaw.split(':')[2]})` 
    : bgRaw;

  const borderWidth = itemConfig?.borderW || 0;
  const borderColor = itemConfig?.borderC || 'transparent';
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
      // USE REAL RATINGS FROM CONTEXT
      const val = ratingsData[badgeId as keyof typeof ratingsData] || '0.0';

      if (badgeId === 'age') {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txtColor }}></div>
                 <span style={{ fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor }}>{val || 'N/A'}</span>
            </div>
        );
      }

      if (!showIcon) {
        return <span style={{ position: 'absolute', left: '50%', top: textTop, transform: 'translate(-50%, -50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{val}</span>;
      }

      // Determine RT icon state
      let iconKey: string = badgeId;
      if (badgeId === 'rt') {
          const num = parseInt(val.replace('%','')) || 0;
          iconKey = num >= 60 ? 'rt_fresh' : 'rt_rotten';
      }
      if (badgeId === 'rt_popcorn') {
          const num = parseInt(val.replace('%','')) || 0;
          iconKey = num >= 60 ? 'popcorn_fresh' : 'popcorn_rotten';
      }

      const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];

      return (
        <>
            {iconData && (
                <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
                    <svg viewBox={iconData.vb} width={iconSize} height={iconSize} style={{ display: 'block', color: txtColor }} dangerouslySetInnerHTML={{ __html: iconData.body }} />
                </div>
            )}
            <span style={{ position: 'absolute', right: textRight, top: textTop, transform: 'translateY(-50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{val}</span>
        </>
      );
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60]`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`, 
        background: backgroundStyle,
        borderRadius: `${radiusVal}px`,
        border: `${Math.max(borderWidth, isSelected ? 2 : 0)}px solid ${isSelected ? '#6366f1' : borderColor}`,
        backdropFilter: `blur(${blurVal}px)`,
        boxShadow: hasShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto', 
      }}
    >
      {renderContent()}
    </div>
  );
};

export default DraggableBadge;