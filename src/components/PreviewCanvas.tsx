import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [zoomModifier, setZoomModifier] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      // -32 for padding
      const scaleX = (containerRef.current.clientWidth - 40) / CANVAS_WIDTH;
      const scaleY = (containerRef.current.clientHeight - 40) / CANVAS_HEIGHT;
      setAutoScale(Math.min(scaleX, scaleY, 1));
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const currentScale = autoScale * zoomModifier;

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig((prev: PosterConfig) => {
      const newItems = { ...prev.items };
      // If we are in auto layout, dragging one element switches everything to custom positions to avoid snapping back
      if (prev.layout !== 'custom' || prev.preset !== 'custom') {
          prev.ratings.forEach((r, idx) => {
              const auto = calculateAutoPosition(r, idx, prev.ratings.length, prev);
              // Use existing override if present, else auto
              if (!newItems[r]) newItems[r] = { x: auto.x, y: auto.y };
              else {
                  if (newItems[r]!.x === undefined) newItems[r]!.x = auto.x;
                  if (newItems[r]!.y === undefined) newItems[r]!.y = auto.y;
              }
          });
      }
      
      newItems[id] = { ...newItems[id], x, y };
      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.${config.extension}`;
    return config.source === 'fanart' ? `${base}?source=fanart&v=1` : `${base}?v=1`;
  }, [config.tmdbId, config.source, config.mediaType, config.extension]);

  useEffect(() => { setIsImageLoading(true); }, [cleanPosterUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden">
        
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full p-1 z-50 shadow-xl">
            <button onClick={() => setZoomModifier(z => Math.max(z - 0.1, 0.2))} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><ZoomOut size={16}/></button>
            <span className="text-[10px] font-mono w-12 text-center text-zinc-300">{Math.round(currentScale * 100)}%</span>
            <button onClick={() => setZoomModifier(z => Math.min(z + 0.1, 3))} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><ZoomIn size={16}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => setZoomModifier(1)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><RotateCcw size={14}/></button>
        </div>

        {/* The Poster Canvas */}
        <div 
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT,
                transform: `scale(${currentScale})`,
                transition: 'transform 0.1s cubic-bezier(0,0,0.2,1)'
            }} 
            className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/10 group"
        >
            {/* Loading State */}
            {isImageLoading && (
                <div className="absolute inset-0 z-40 bg-zinc-900/80 backdrop-blur flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            )}

            <img
                src={cleanPosterUrl}
                alt="Poster"
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                style={{ filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})` }}
                onLoad={() => setIsImageLoading(false)}
            />
            
            {/* Badges */}
            {config.ratings.map((id: RatingType, index: number) => {
                const auto = calculateAutoPosition(id, index, config.ratings.length, config);
                const itemConfig = config.items[id];
                const hasManual = itemConfig?.x !== undefined && itemConfig?.y !== undefined;
                
                return (
                    <DraggableBadge
                        key={id}
                        badgeId={id}
                        config={config}
                        x={hasManual ? itemConfig!.x! : auto.x}
                        y={hasManual ? itemConfig!.y! : auto.y}
                        canvasScale={currentScale} 
                        onPositionChange={handlePositionChange}
                        isSelected={selectedIds.has(id)}
                        onSelect={onSelect}
                    />
                );
            })}
        </div>
    </div>
  );
};

export default PreviewCanvas;