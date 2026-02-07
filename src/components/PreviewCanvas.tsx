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

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // Calculate available space
      // We subtract padding (32px) to ensure margins
      const parentWidth = containerRef.current.clientWidth - 32;
      const parentHeight = containerRef.current.clientHeight - 32;

      // Determine scale needed to fit width AND height
      const scaleX = parentWidth / CANVAS_WIDTH;
      const scaleY = parentHeight / CANVAS_HEIGHT;
      
      // Use the smaller scale so it always fits entirely
      const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 (don't scale up pixelated)
      
      setScale(newScale);
    };

    // Initial calcs
    handleResize();

    // Observer is better than window.resize for flex containers
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig(prev => {
      if (prev.layout === 'custom' && prev.preset === 'custom') {
         return {
            ...prev,
            items: { ...prev.items, [id]: { ...prev.items[id], x, y } }
         };
      }

      // Freeze all positions when starting manual drag
      const newItems = { ...prev.items };
      prev.ratings.forEach((r, index) => {
         const currentItem = newItems[r];
         if (currentItem?.x === undefined || currentItem?.y === undefined) {
             const autoPos = calculateAutoPosition(r, index, prev.ratings.length, prev);
             newItems[r] = { ...currentItem, x: autoPos.x, y: autoPos.y };
         }
      });
      newItems[id] = { ...newItems[id], x, y };

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.tmdbId}.jpg`;
    return config.source === 'fanart' ? `${base}?source=fanart&v=1` : `${base}?v=1`;
  }, [config.tmdbId, config.source]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
        <div 
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT,
                transform: `scale(${scale})`,
                // Shadows look better if they don't scale, but simplicity first
            }} 
            className="bg-black shadow-2xl relative shrink-0 ring-1 ring-white/10"
        >
            <img
                src={cleanPosterUrl}
                alt="Poster"
                className="w-full h-full object-cover select-none pointer-events-none"
            />
            
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                {[1, 2, 3].map(i => (
                    <React.Fragment key={i}>
                        <div className="absolute top-0 bottom-0 border-r border-white/20" style={{ left: `${i*25}%` }} />
                        <div className="absolute left-0 right-0 border-b border-white/20" style={{ top: `${i*25}%` }} />
                    </React.Fragment>
                ))}
            </div>

            {/* Badges */}
            {config.ratings.map((id, index) => {
                const auto = calculateAutoPosition(id, index, config.ratings.length, config);
                const itemConfig = config.items[id];
                const hasManual = itemConfig?.x !== undefined && itemConfig?.y !== undefined;
                
                return (
                    <DraggableBadge
                        key={id}
                        id={id}
                        config={config}
                        x={hasManual ? itemConfig!.x! : auto.x}
                        y={hasManual ? itemConfig!.y! : auto.y}
                        canvasScale={scale} // CRITICAL FIX: Pass the scale
                        onPositionChange={handlePositionChange}
                    />
                );
            })}
        </div>
        
        {/* Info Label */}
        <div className="absolute bottom-0 right-0 bg-black/50 text-[10px] px-2 py-1 rounded-tl text-white/50 pointer-events-none">
            {Math.round(scale * 100)}%
        </div>
    </div>
  );
};

export default PreviewCanvas;