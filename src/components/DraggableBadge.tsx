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

  const itemConfig = config.items[id];
  
  // Robustly handle initial position
  const getInitialPos = () => {
     if (itemConfig?.x !== undefined && itemConfig?.y !== undefined) {
         return { x: itemConfig.x, y: itemConfig.y };
     }
     return autoPos;
  };

  const [visualPos, setVisualPos] = useState(getInitialPos());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Sync state with config changes only when not dragging
  useEffect(() => {
    if (!isDragging) {
      setVisualPos(getInitialPos());
    }
  }, [itemConfig, autoPos, isDragging, config.preset, config.layout]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault();  // Prevent text selection
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


  const bgColor = itemConfig?.bg || `rgba(0,0,0, ${config.alpha})`;
  const txtColor = itemConfig?.txt || '#ffffff';

  // Fix: Ensure icons are visible. Some need stroke, some need fill.
  const getIcon = () => {
    switch (id) {
      // Star looks best filled with no stroke
      case 'imdb': return <Star fill="#f5c518" strokeWidth={0} size={24 * scale} />;
      // Ticket looks best filled
      case 'rt': return <Ticket fill="#fa320a" strokeWidth={0} size={24 * scale} />; 
      // Gauge needs stroke (default), fill might clutter it
      case 'meta': return <Gauge color="#66cc33" strokeWidth={2.5} size={24 * scale} />;
      // Clapperboard needs stroke
      case 'tmdb': return <Clapperboard color="#01b4e4" strokeWidth={2.5} size={24 * scale} />;
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
      // CRITICAL FIX: Added top-0 left-0 to force positioning from origin.
      className="absolute top-0 left-0 flex items-center justify-between select-none cursor-move group z-50 hover:z-[60]"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // Ensure visualPos is never NaN
        transform: `translate(${visualPos.x || 0}px, ${visualPos.y || 0}px)`,
        backgroundColor: bgColor,
        color: txtColor,
        borderRadius: `${config.radius}px`,
        backdropFilter: `blur(${config.blur}px)`,
        // Use standard CSS box shadow
        boxShadow: config.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)' : 'none',
        paddingLeft: '12px',
        paddingRight: '12px',
        willChange: 'transform',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle hint */}
        <div className="opacity-0 group-hover:opacity-100 absolute -left-5 bg-blue-600 rounded p-1 text-white transition-opacity">
           <GripVertical size={14} />
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