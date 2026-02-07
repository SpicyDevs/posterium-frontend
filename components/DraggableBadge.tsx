import React, { useState, useEffect } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { Star, GripVertical, Ticket, Gauge, Clapperboard } from 'lucide-react';

interface Props {
  id: RatingType;
  config: PosterConfig;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
  autoPos: { x: number, y: number }; 
}

const DraggableBadge: React.FC<Props> = ({ id, config, onPositionChange, autoPos }) => {
  const scale = getScale(config.size);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  // Use manual position if set, otherwise auto
  const itemConfig = config.items[id];
  const currentPos = (itemConfig?.x !== undefined && itemConfig?.y !== undefined) 
    ? { x: itemConfig.x, y: itemConfig.y } 
    : autoPos;
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [visualPos, setVisualPos] = useState(currentPos);

  // Sync when config changes externally (e.g. preset change)
  useEffect(() => {
    if (!isDragging) {
      setVisualPos((itemConfig?.x !== undefined && itemConfig?.y !== undefined) 
        ? { x: itemConfig.x, y: itemConfig.y } 
        : autoPos);
    }
  }, [itemConfig, autoPos, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - visualPos.x,
      y: e.clientY - visualPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // --- Snapping Logic ---
      const snapThreshold = 15;
      
      // Vertical Lines (0, 0.25, 0.5, 0.75, 1.0)
      const vSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_WIDTH);
      // Horizontal Lines
      const hSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_HEIGHT);

      // Snap Center of Badge to Line
      const centerX = newX + width / 2;
      const centerY = newY + height / 2;

      for (const line of vSnaps) {
        if (Math.abs(centerX - line) < snapThreshold) newX = line - width / 2;
      }
      for (const line of hSnaps) {
        if (Math.abs(centerY - line) < snapThreshold) newY = line - height / 2;
      }

      // Hard boundaries
      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

      setVisualPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onPositionChange(id, visualPos.x, visualPos.y);
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
  }, [isDragging, dragOffset, id, onPositionChange, width, height]);


  // Determine Colors
  const bgColor = itemConfig?.bg || `rgba(0,0,0, ${config.alpha})`;
  const txtColor = itemConfig?.txt || '#ffffff';

  const getIcon = () => {
    switch (id) {
      case 'imdb': return <Star fill="#f5c518" strokeWidth={0} size={24 * scale} />;
      case 'rt': return <Ticket fill="#fa320a" strokeWidth={0} size={24 * scale} />; 
      case 'meta': return <Gauge color="#66cc33" size={24 * scale} />;
      case 'tmdb': return <Clapperboard color="#01b4e4" size={24 * scale} />;
    }
  };

  const getDummyValue = () => {
    switch(id) {
        case 'imdb': return '8.7';
        case 'rt': return '73%';
        case 'meta': return '74';
        case 'tmdb': return '85%';
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute flex items-center justify-between select-none cursor-move group"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${visualPos.x}px, ${visualPos.y}px)`,
        backgroundColor: bgColor,
        color: txtColor,
        borderRadius: `${config.radius}px`,
        backdropFilter: `blur(${config.blur}px)`,
        boxShadow: config.shadow ? '3px 5px 2px rgba(0,0,0,0.4)' : 'none',
        paddingLeft: '10px',
        paddingRight: '10px',
        willChange: 'transform',
      }}
    >
      <div className="flex items-center gap-2">
         {/* Hidden drag handle hint */}
        <div className="opacity-0 group-hover:opacity-100 absolute -left-4 bg-blue-500/80 rounded p-0.5 text-white">
           <GripVertical size={12} />
        </div>
        {getIcon()}
      </div>
      <span style={{ 
          fontSize: `${28 * scale}px`, 
          fontFamily: 'Arial, sans-serif', 
          fontWeight: 'bold',
          lineHeight: 1 
      }}>
          {getDummyValue()}
      </span>
    </div>
  );
};

export default DraggableBadge;