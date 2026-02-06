import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { Star, GripVertical, Ticket, Gauge } from 'lucide-react';

interface Props {
  id: RatingType;
  config: PosterConfig;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
  // If provided, this is the calculated position from the preset logic
  autoPos: { x: number, y: number }; 
}

const DraggableBadge: React.FC<Props> = ({ id, config, onPositionChange, autoPos }) => {
  const scale = getScale(config.size);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  // Current coordinates
  const currentPos = config.pos[id] || autoPos;
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Visual state for the drag preview
  const [visualPos, setVisualPos] = useState(currentPos);

  useEffect(() => {
    if (!isDragging) {
      setVisualPos(config.pos[id] || autoPos);
    }
  }, [config.pos, autoPos, id, isDragging]);

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

      // Snapping Logic
      const snapX = CANVAS_WIDTH / 4; // 1/4th snapping
      const snapY = CANVAS_HEIGHT / 4;

      const SNAP_THRESHOLD = 20;

      // Check horizontal snap lines
      for (let i = 0; i <= 4; i++) {
        const line = i * snapX;
        // Snap the center of the badge or edges? Let's snap the top-left for simplicity in this logic, 
        // or snap based on proximity to line
        if (Math.abs(newX - line) < SNAP_THRESHOLD) newX = line;
      }
      
      // Check vertical snap lines
      for (let i = 0; i <= 4; i++) {
        const line = i * snapY;
        if (Math.abs(newY - line) < SNAP_THRESHOLD) newY = line;
      }

      // Boundaries
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
  }, [isDragging, dragOffset, id, onPositionChange, visualPos, width, height]);


  // Styles based on config
  const getStyles = () => {
    const baseStyle = {
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: `${8 * scale}px`,
      transform: `translate(${visualPos.x}px, ${visualPos.y}px)`,
    };

    if (config.customBg) {
      return {
        ...baseStyle,
        backgroundColor: config.customBg,
        color: config.customTxt || '#fff',
        border: 'none',
      };
    }

    if (config.theme === 'glass') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#fff',
      };
    }

    // Solid theme
    return {
      ...baseStyle,
      backgroundColor: '#18181b',
      color: '#fff',
      border: 'none',
    };
  };

  const getIcon = () => {
    switch (id) {
      case 'imdb': return <Star fill="#f5c518" strokeWidth={0} size={24 * scale} />;
      case 'rt': return <Ticket fill="#fa320a" strokeWidth={0} size={24 * scale} />; // Approximation
      case 'meta': return <Gauge color="#66cc33" size={24 * scale} />;
    }
  };

  const getValue = () => {
    switch(id) {
        case 'imdb': return '8.7';
        case 'rt': return '73%';
        case 'meta': return '74';
    }
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute flex items-center justify-between px-3 select-none cursor-move group ${config.shadow ? 'shadow-xl' : ''}`}
      style={{
        ...getStyles(),
        willChange: 'transform',
        boxShadow: config.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none'
      }}
    >
      <div className="flex items-center gap-2">
         {/* Drag Handle visible on hover */}
        <div className="opacity-0 group-hover:opacity-100 absolute -left-4 bg-white/20 rounded p-0.5">
           <GripVertical size={12} />
        </div>
        {getIcon()}
      </div>
      <span style={{ fontSize: `${28 * scale}px`, fontWeight: 'bold' }}>{getValue()}</span>
    </div>
  );
};

export default DraggableBadge;