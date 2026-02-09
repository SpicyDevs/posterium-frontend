import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
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

const DraggableBadge: React.FC<Props> = ({ badgeId, config, x, y, canvasScale, onPositionChange, isSelected, onSelect }) => {
  const itemConfig = config.items[badgeId];
  
  // NOTE: Scale determines dimension, NOT CSS transform, preventing "Double Scale" bug.
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

  // --- RENDERING ---
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
      const dummyVals: Record<string, string> = { imdb: '8.7', rt: '73%', rt_popcorn: '88%', letterboxd: '4.2', meta: '74', tmdb: '85%', runtime: '2h 15m' };
      const dummyVal = dummyVals[badgeId] || '0.0';

      if (badgeId === 'age') {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txtColor }}></div>
                 <span style={{ fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor }}>PG-13</span>
            </div>
        );
      }

      if (!showIcon) {
        return <span style={{ position: 'absolute', left: '50%', top: textTop, transform: 'translate(-50%, -50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{dummyVal}</span>;
      }

      // Icon Key mapping
      let iconKey: string = badgeId === 'rt' ? 'rt_fresh' : (badgeId === 'rt_popcorn' ? 'popcorn_fresh' : badgeId);
      const iconData = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];

      return (
        <>
            {iconData && (
                <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
                    <svg viewBox={iconData.vb} width={iconSize} height={iconSize} style={{ display: 'block', color: txtColor }} dangerouslySetInnerHTML={{ __html: iconData.body }} />
                </div>
            )}
            <span style={{ position: 'absolute', right: textRight, top: textTop, transform: 'translateY(-50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{dummyVal}</span>
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
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`, // No scale() here
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