import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: (config: PosterConfig) => void;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [zoomModifier, setZoomModifier] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Auto-fit logic
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      // Add padding calculation to prevent edge leaks
      const parentWidth = containerRef.current.clientWidth - 40; 
      const parentHeight = containerRef.current.clientHeight - 40;
      
      // Calculate scale to fit
      const scaleX = parentWidth / CANVAS_WIDTH;
      const scaleY = parentHeight / CANVAS_HEIGHT;
      
      // Ensure we don't scale up infinitely, but do scale down
      setAutoScale(Math.min(scaleX, scaleY, 1.0)); 
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
    };
  }, []);

  const currentScale = Math.max(0.1, autoScale * zoomModifier);

  const handlePositionChange = useCallback((id: RatingType, x: number, y: number) => {
    setConfig({
        ...config,
        layout: 'custom', 
        preset: 'custom',
        items: {
            ...config.items,
            [id]: { ...config.items[id], x, y }
        }
    });
  }, [config, setConfig]);

  // Memoize URL to prevent flickering, only update when structural keys change
  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.${config.extension}`;
    return config.source === 'fanart' ? `${base}?source=fanart&v=1` : `${base}?v=1`;
  }, [config.tmdbId, config.source, config.mediaType, config.extension]);

  useEffect(() => { setIsImageLoading(true); }, [cleanPosterUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent select-none">
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-50">
            <button onClick={() => setZoomModifier(p => Math.min(p + 0.1, 3))} className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors"><ZoomIn size={16} /></button>
            <button onClick={() => setZoomModifier(p => Math.max(p - 0.1, 0.1))} className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors"><ZoomOut size={16} /></button>
            <button onClick={() => setZoomModifier(1)} className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors" title="Reset Zoom"><RotateCcw size={16} /></button>
        </div>

        {/* Canvas Wrapper */}
        <div 
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT, 
                transform: `scale(${currentScale})`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            }} 
            className="relative bg-zinc-900 shadow-2xl transition-transform duration-75 ease-out origin-center"
        >
            {/* Loading State */}
            {isImageLoading && (
                <div className="absolute inset-0 z-10 bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            )}
            
            {/* Poster Image */}
            <img 
                src={cleanPosterUrl} 
                alt="Poster" 
                className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} 
                style={{ 
                    filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})` 
                }} 
                onLoad={() => setIsImageLoading(false)} 
            />

            {/* Grid Overlay (Optional visual aid) */}
            <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity z-0">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
            </div>

            {/* Badges Layer */}
            <div className="absolute inset-0 z-20 overflow-hidden">
                {config.ratings.map((id: RatingType, index: number) => {
                    const auto = calculateAutoPosition(id, index, config.ratings.length, config);
                    const item = config.items[id] || {};
                    
                    // Defaults
                    const bg = item.bg || config.globalBg || `rgba(0,0,0,${config.alpha})`;
                    const txt = item.txt || (config.globalTxt !== '#ffffff' ? config.globalTxt : '#ffffff');
                    const scale = item.scale !== undefined ? item.scale : config.globalScale;
                    const borderW = item.borderW !== undefined ? item.borderW : config.globalBorderW;
                    const borderC = item.borderC || (config.globalBorderC !== '#ffffff' ? config.globalBorderC : '#ffffff');
                    
                    return (
                        <DraggableBadge
                            key={id}
                            id={id}
                            x={item.x !== undefined ? item.x : auto.x}
                            y={item.y !== undefined ? item.y : auto.y}
                            w={BASE_BADGE_W} 
                            h={BASE_BADGE_H}
                            canvasScale={currentScale}
                            onPositionChange={handlePositionChange}
                            bg={bg}
                            txt={txt}
                            blur={item.blur !== undefined ? item.blur : config.blur}
                            alpha={item.alpha !== undefined ? item.alpha : config.alpha}
                            radius={item.radius !== undefined ? item.radius : config.radius}
                            shadow={item.shadow !== undefined ? item.shadow : config.shadow}
                            icon={item.icon !== undefined ? item.icon : true}
                            scale={scale}
                            borderW={borderW}
                            borderC={borderC}
                        />
                    );
                })}
            </div>
        </div>
        
        {/* Scale Indicator */}
        <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 text-[10px] px-2 py-1 rounded text-zinc-400 font-mono">
            {Math.round(currentScale * 100)}%
        </div>
    </div>
  );
};

export default PreviewCanvas;