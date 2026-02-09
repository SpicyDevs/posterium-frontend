import React, { useMemo, useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
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
  const [autoScale, setAutoScale] = useState(0.5);
  const [zoomModifier, setZoomModifier] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const prevUrlRef = useRef<string>("");

  // FIX: Robust Auto-fit logic using ResizeObserver
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // Calculate available space with safety padding
      const padding = 32; 
      const parentWidth = Math.max(0, containerRef.current.clientWidth - padding);
      const parentHeight = Math.max(0, containerRef.current.clientHeight - padding);
      
      if (parentWidth === 0 || parentHeight === 0) return;

      const scaleX = parentWidth / CANVAS_WIDTH;
      const scaleY = parentHeight / CANVAS_HEIGHT;
      
      // Use the smaller scale to ensure it fits entirely
      setAutoScale(Math.min(scaleX, scaleY, 1.2)); 
    };
    
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
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

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.${config.extension}`;
    return config.source === 'fanart' ? `${base}?source=fanart&v=1` : `${base}?v=1`;
  }, [config.tmdbId, config.source, config.mediaType, config.extension]);

  // FIX: Prevent loading state flicker (Black Screen) on drag
  useEffect(() => { 
      if (prevUrlRef.current !== cleanPosterUrl) {
          setIsImageLoading(true); 
          prevUrlRef.current = cleanPosterUrl;
      }
  }, [cleanPosterUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent select-none touch-none">
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1 z-50">
            <button onClick={() => setZoomModifier(p => Math.min(p + 0.1, 3))} className="p-2 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors backdrop-blur"><ZoomIn size={16} /></button>
            <button onClick={() => setZoomModifier(p => Math.max(p - 0.1, 0.1))} className="p-2 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors backdrop-blur"><ZoomOut size={16} /></button>
            <button onClick={() => setZoomModifier(1)} className="p-2 bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white rounded shadow-lg transition-colors backdrop-blur" title="Reset Zoom"><RotateCcw size={16} /></button>
        </div>

        {/* Canvas Wrapper */}
        <div 
            style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT, 
                transform: `scale(${currentScale})`,
                transformOrigin: 'center center', // FIX: Ensure scaling centers correctly
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            }} 
            className="relative bg-zinc-900 shadow-2xl transition-transform duration-75 ease-out"
        >
            {/* Loading State Overlay */}
            {isImageLoading && (
                <div className="absolute inset-0 z-30 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="text-xs font-mono uppercase tracking-wider">Loading...</span>
                </div>
            )}
            
            {/* Poster Image */}
            <img 
                src={cleanPosterUrl} 
                alt="Poster" 
                className="w-full h-full object-cover pointer-events-none absolute inset-0 z-0"
                style={{ 
                    filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})`,
                    opacity: isImageLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                }} 
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
            />

            {/* Badges Layer - Ensure it's above image */}
            <div className="absolute inset-0 z-20 overflow-hidden">
                {!isImageLoading && config.ratings.map((id: RatingType, index: number) => {
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
        <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur border border-zinc-800 text-[10px] px-2 py-1 rounded text-zinc-400 font-mono pointer-events-none">
            {Math.round(currentScale * 100)}%
        </div>
    </div>
  );
};

export default PreviewCanvas;