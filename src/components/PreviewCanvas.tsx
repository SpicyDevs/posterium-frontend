import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';
import { ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { viewOptions, mobileSheetMode } = useEditor(); 
  const containerRef = useRef<HTMLDivElement>(null);
  
  // -- VIEW STATE --
  const [autoScale, setAutoScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isPanning, setIsPanning] = useState(false);

  // -- GESTURE STATE --
  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number, y: number } | null>(null);

  // 1. Initial Fit-to-Screen Logic
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const padding = 40;
      const scaleX = (containerRef.current.clientWidth - padding) / CANVAS_WIDTH;
      const scaleY = (containerRef.current.clientHeight - padding) / CANVAS_HEIGHT;
      setAutoScale(Math.min(scaleX, scaleY, 1));
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mobileSheetMode]);

  const currentScale = autoScale * zoom;

  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setZoom(z => Math.max(0.2, Math.min(z * delta, 4)));
      } else {
          setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          lastDist.current = dist;
      } else if (e.touches.length === 1) {
          setIsPanning(true);
          lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastDist.current) {
          const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const delta = dist / lastDist.current;
          setZoom(z => Math.max(0.2, Math.min(z * delta, 4)));
          lastDist.current = dist;
      } else if (e.touches.length === 1 && lastPan.current && isPanning) {
          const dx = e.touches[0].clientX - lastPan.current.x;
          const dy = e.touches[0].clientY - lastPan.current.y;
          setPan(p => ({ x: p.x + dx, y: p.y + dy }));
          lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  };

  const handleTouchEnd = () => {
      lastDist.current = null;
      lastPan.current = null;
      setIsPanning(false);
  };

  const resetView = () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
  };

  const handlePositionChange = (id: RatingType, x: number, y: number) => {
    setConfig((prev: PosterConfig) => {
      const newItems = { ...prev.items };
      if (prev.layout !== 'custom' || prev.preset !== 'custom') {
          prev.ratings.forEach((r, idx) => {
              const auto = calculateAutoPosition(r, idx, prev.ratings.length, prev);
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

  // UPDATED: Correctly appends source param for all sources AND textless
  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.${config.extension}`;
    const params = new URLSearchParams();
    if (config.source !== 'tmdb') params.set('source', config.source);
    if (config.textless) params.set('textless', '1'); // <--- Added this check
    
    params.set('v', '2');
    
    return `${base}?${params.toString()}`;
  }, [config.tmdbId, config.source, config.mediaType, config.extension, config.textless]); // <--- Added textless dependency

  useEffect(() => { setIsImageLoading(true); }, [cleanPosterUrl]);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        
        {/* Mobile Floating Action Bar */}
        <div 
            className="absolute right-4 md:right-6 flex flex-col md:flex-row items-center gap-2 z-50 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
            style={{ 
                bottom: mobileSheetMode === 'half' ? '55%' : '5rem',
                opacity: mobileSheetMode === 'full' ? 0 : 1,
                pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto'
            }}
        >
             {isPanning && (
                 <div className="bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full mb-2 md:mb-0 md:mr-2 pointer-events-none">
                     Panning
                 </div>
             )}

             <div className="flex flex-col md:flex-row items-center gap-1 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full p-1.5 shadow-xl">
                <button onClick={() => setZoom(z => Math.min(z + 0.1, 4))} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-transform"><ZoomIn size={18}/></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-transform"><ZoomOut size={18}/></button>
                <div className="w-4 h-px md:w-px md:h-4 bg-white/10 mx-1"></div>
                <button onClick={resetView} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-transform" title="Fit to Screen"><Maximize size={16}/></button>
             </div>
        </div>

        {/* The Poster Canvas Container */}
        <div 
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
                transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0,0,0.2,1)'
            }} 
            className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/10 group will-change-transform"
        >
            {isImageLoading && (
                <div className="absolute inset-0 z-40 bg-zinc-900/80 backdrop-blur flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={40} />
                </div>
            )}

            {viewOptions?.showGrid && (
                <div className="absolute inset-0 z-30 pointer-events-none opacity-20">
                    <div className="absolute top-0 bottom-0 left-1/3 border-l border-white"></div>
                    <div className="absolute top-0 bottom-0 left-2/3 border-l border-white"></div>
                    <div className="absolute left-0 right-0 top-1/3 border-t border-white"></div>
                    <div className="absolute left-0 right-0 top-2/3 border-t border-white"></div>
                </div>
            )}

            {viewOptions?.showSafeArea && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <div className="absolute inset-8 border border-red-500/30 border-dashed">
                        <div className="absolute top-2 left-2 text-[10px] text-red-500/50 font-mono uppercase">Safe Area</div>
                    </div>
                </div>
            )}

            <img
                src={cleanPosterUrl}
                alt="Poster"
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                style={{ filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})` }}
                onLoad={() => setIsImageLoading(false)}
            />
            
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