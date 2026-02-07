import React, { useState, useEffect } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { GripVertical } from 'lucide-react';

interface Props {
  id: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
}

const ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt_fresh: { vb: "0 0 32 32", body: `<path d="M16 32c8.8 0 16-7.2 16-16S24.8 0 16 0 0 7.2 0 16s7.2 16 16 16z" fill="#FA320A"/><path d="M23.2 21.6c-.7.3-1.8.8-3.4.6-2.1-.2-2.3-1.7-3.1-4.2-.6-1.9-2.3-4-2.3-4s1.7 1.1 2.8 2.3c.7.8 1.4 2.8 1.6 3.3.1.5.3.8.8.7.6-.1.8-.7.6-1.3-.8-2.6-4.5-5.9-6-6.8-1.7-.9-3.3-1-4.7.9-.5.7-.9 2.1-.8 3.6.4 4.3 4.9 8.2 8.7 8.2 5.3 0 7.6-3.8 7.3-5.2-.2-1.2-1.1-1.9-1.5-2.1z" fill="#FFF"/>` },
  rt_rotten: { vb: "0 0 32 32", body: `<path d="M15.4 3.8c-1.8-2.6-.9-2.2-6.6.7-1.1 1.9-1.2 4.4-4.5 5.5C1.6 10.9.1 14.8.9 18.2c.5 2 2.3 4.1 3.5 5.3 1.9 2 4.1 4 8.7 4.5 3.1.3 6.6-1 8.7-3.2 2.6-2.9 2.5-6.8 1.8-9.2-.8-2.8-3.5-3.5-5.3-4.2-1.9-.8-1.5-4.4-2.9-7.6z" fill="#5F9624"/><path d="M9.8 19.3c-2.3.9-3.9-.2-4.1-1.3-.3-1.8 4.2-3.8 4.2-3.8s-1.8 2-1.4 3.2c.2.6 1.3 1.9 1.3 1.9z" fill="#9ACA4F"/>` },
  meta: { vb: "0 0 32 32", body: `<path d="M0 0h32v32H0V0z" fill="#333"/><path d="M24.7 10.7l-7.3 11-3.6-5.8-3.2 5.1-5-8.2H2v13.6h4.3V15l1.6 2.8 3.8-6 3.8 5.9 7.3-10.9H22v13.6h4.5V10.7h-1.8z" fill="#FFF"/>` },
  tmdb: { vb: "0 0 32 32", body: `<path d="M3.7 27.6h24.6V4.4H3.7v23.2z" fill="#0d253f"/><path d="M12.6 18.6c0-3.3 2.1-5.7 5.6-5.7 1.8 0 3.2.7 4.1 1.8v-1.6h2.7v10.9h-2.7v-1.6c-.9 1.1-2.3 1.8-4.1 1.8-3.5 0-5.6-2.4-5.6-5.6zm8.1 0c0-1.9-1-3.4-2.7-3.4-1.8 0-2.8 1.5-2.8 3.4 0 1.9 1 3.4 2.8 3.4 1.7 0 2.7-1.5 2.7-3.4z" fill="#01b4e4"/>` }
};

const DraggableBadge: React.FC<Props> = ({ id, config, x, y, onPositionChange }) => {
  const scale = getScale(config.size);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;
  const itemConfig = config.items[id];

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPos, setTempPos] = useState({ x, y });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setTempPos({ x, y });
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      const snapThreshold = 15;
      const vSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_WIDTH);
      const hSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_HEIGHT);

      const centerX = newX + width / 2;
      const centerY = newY + height / 2;

      for (const line of vSnaps) {
        if (Math.abs(centerX - line) < snapThreshold) newX = line - width / 2;
      }
      for (const line of hSnaps) {
        if (Math.abs(centerY - line) < snapThreshold) newY = line - height / 2;
      }

      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

      setTempPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(id, tempPos.x, tempPos.y);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onPositionChange, width, height, tempPos.x, tempPos.y]);

  const bgColor = itemConfig?.bg || `rgba(0,0,0, ${config.alpha})`;
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  
  // FIXED: Use true 50% centering instead of 63%
  const textTop = '50%';

  const renderIcon = () => {
    const iconKey = id === 'rt' ? 'rt_fresh' : id;
    const iconData = ICONS[iconKey];

    if (!iconData) return null;

    return (
        <svg 
            viewBox={iconData.vb} 
            width={iconSize} 
            height={iconSize}
            style={{ display: 'block' }}
            dangerouslySetInnerHTML={{ __html: iconData.body }}
        />
    );
  };

  const getDummyValue = () => {
    switch(id) {
        case 'imdb': return '8.7';
        case 'rt': return '73%';
        case 'meta': return '74';
        case 'tmdb': return '85%';
    }
  }

  const renderX = isDragging ? tempPos.x : x;
  const renderY = isDragging ? tempPos.y : y;

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60]"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${renderX}px, ${renderY}px)`,
        backgroundColor: bgColor,
        borderRadius: `${config.radius}px`,
        backdropFilter: `blur(${config.blur}px)`,
        boxShadow: config.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto', 
      }}
    >
      <div className="opacity-0 group-hover:opacity-100 absolute -left-6 top-1/2 -translate-y-1/2 bg-blue-600 rounded p-1 text-white transition-opacity">
           <GripVertical size={14} />
      </div>

      <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
          {renderIcon()}
      </div>

      <span style={{ 
          position: 'absolute',
          right: textRight,
          top: textTop,
          transform: 'translateY(-50%)', // Centering logic
          fontSize: `${28 * scale}px`, 
          fontFamily: "'Inter', sans-serif", // Matches Backend
          fontWeight: 'bold',
          color: txtColor,
          lineHeight: 1 
      }}>
          {getDummyValue()}
      </span>
    </div>
  );
};

export default DraggableBadge;