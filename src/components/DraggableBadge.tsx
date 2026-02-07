// src/components/DraggableBadge.tsx
import React, { useState, useEffect } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { Star, GripVertical, Ticket, Gauge, Clapperboard } from 'lucide-react';

interface Props {
  id: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
}

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

  // Backend size is 36px. Frontend previously used 24px.
  // Backend pos: x=10, y=12.
  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;

  // Backend text: x=130 (end), y=38 (baseline). 
  // 140 width - 130 x = 10px right padding.
  const textRight = 10 * scale;
  // Approximating baseline y=38 in a 60px height box. 
  // 38/60 = ~63% from top.
  const textTop = '63%'; 

  const getIcon = () => {
    const props = { size: iconSize, strokeWidth: 0, fill: "currentColor" };
    switch (id) {
      case 'imdb': return <Star {...props} fill="#f5c518" />;
      case 'rt': return <Ticket {...props} fill="#fa320a" />; 
      case 'meta': return <Gauge {...props} strokeWidth={2.5} color="#66cc33" fill="none" />;
      case 'tmdb': return <Clapperboard {...props} strokeWidth={2.5} color="#01b4e4" fill="none" />;
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
        // Even if backend doesn't support blur yet, user asked to "apply" flags.
        // We keep it visually here so the editor feels "correct" to the user's intent.
        backdropFilter: `blur(${config.blur}px)`,
        boxShadow: config.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto', 
      }}
    >
        {/* Drag Handle */}
        <div className="opacity-0 group-hover:opacity-100 absolute -left-6 top-1/2 -translate-y-1/2 bg-blue-600 rounded p-1 text-white transition-opacity">
           <GripVertical size={14} />
        </div>

        {/* Icon: Absolute positioning to match SVG */}
        <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
            {getIcon()}
        </div>

        {/* Text: Absolute positioning to match SVG */}
        <span style={{ 
            position: 'absolute',
            right: textRight,
            top: textTop,
            transform: 'translateY(-50%)', // Centering adjustment
            fontSize: `${28 * scale}px`, 
            fontFamily: 'Arial, sans-serif', 
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