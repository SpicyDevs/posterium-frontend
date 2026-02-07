import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-Scale Logic for Mobile Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      // Get parent width (minus padding)
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const availableWidth = parentWidth - 40; // 40px safety margin
      // On mobile, limit height to 60% of screen so controls are visible
      const availableHeight = (window.innerHeight * 0.6) - 40; 

      // Calculate scale to fit width
      const scaleX = availableWidth < CANVAS_WIDTH ? availableWidth / CANVAS_WIDTH : 1;
      
      // Calculate scale to fit height
      const scaleY = availableHeight < CANVAS_HEIGHT ? availableHeight / CANVAS_HEIGHT : 1;
      
      // Use the smaller scale to ensure it fits entirely
      setScale(Math.min(scaleX, window.innerWidth < 768 ? scaleY : 1, 1));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig(prev => {
      // If we are already in custom mode, just update the dragged item
      if (prev.layout === 'custom' && prev.preset === 'custom') {
         return {
            ...prev,
            items: {
                ...prev.items,
                [id]: { ...prev.items[id], x, y }
            }
         };
      }

      // If switching from auto to manual, we must "freeze" the current positions
      // of ALL items so they don't jump when the layout property changes to 'custom'.
      const newItems = { ...prev.items };
      
      prev.ratings.forEach((r, index) => {
         // Calculate where it currently is visually
         const currentItem = newItems[r];
         // Only freeze if it doesn't already have a manual position
         if (currentItem?.x === undefined || currentItem?.y === undefined) {
             const autoPos = calculateAutoPosition(r, index, prev.ratings.length, prev);
             newItems[r] = { ...currentItem, x: autoPos.x, y: autoPos.y };
         }
      });

      // Update the specific item being dragged with new coordinates
      newItems[id] = { ...newItems[id], x, y };

      return {
         ...prev,
         layout: 'custom', // Deselects Row/Col buttons
         preset: 'custom', // Deselects Preset buttons
         items: newItems
      };
    });
  };

  const renderGridLines = () => {
    const lines = [];
    for (let i = 1; i < 4; i++) {
      lines.push(
        <div key={`v-${i}`} className="absolute top-0 bottom-0 border-r border-blue-400/20 pointer-events-none" style={{ left: `${(i / 4) * 100}%` }} />
      );
      lines.push(
        <div key={`h-${i}`} className="absolute left-0 right-0 border-b border-blue-400/20 pointer-events-none" style={{ top: `${(i / 4) * 100}%` }} />
      );
    }
    return lines;
  };

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.tmdbId}.jpg`;
    
    // Add params to force cache bust and select source
    if (config.source === 'fanart') {
        return `${base}?source=fanart&v=1`;
    }
    return `${base}?v=1`;
  }, [config.tmdbId, config.source]);

  return (
    <div 
      ref={containerRef}
      className="relative flex justify-center items-center transition-transform duration-200 ease-out"
      style={{
        // We scale the outer container
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
      }}
    >
      <div 
        style={{ 
          width: CANVAS_WIDTH, 
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left' 
        }} 
        className="absolute top-0 left-0 bg-black shadow-2xl overflow-hidden ring-1 ring-white/10 group rounded-sm"
      >

        {/* The Clean Poster */}
        <img
          src={cleanPosterUrl}
          alt="Poster Preview"
          className="w-full h-full object-cover opacity-100 select-none"
          draggable={false}
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40">
            {renderGridLines()}
        </div>

        {/* Badges Overlay */}
        {config.ratings.map((id, index) => {
          const auto = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          const hasManualPos = itemConfig?.x !== undefined && itemConfig?.y !== undefined;
          const finalX = hasManualPos ? itemConfig!.x! : auto.x;
          const finalY = hasManualPos ? itemConfig!.y! : auto.y;

          return (
            <DraggableBadge
              key={id}
              id={id}
              config={config}
              x={finalX}
              y={finalY}
              onPositionChange={handlePositionChange}
            />
          );
        })}

        <div className="absolute bottom-2 right-2 text-[10px] text-white/30 pointer-events-none font-mono z-0">
          {CANVAS_WIDTH}x{CANVAS_HEIGHT}
        </div>
      </div>
    </div>
  );
};

export default PreviewCanvas;