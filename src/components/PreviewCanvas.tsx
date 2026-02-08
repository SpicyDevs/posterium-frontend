import React, { useMemo, useRef, useEffect, useState, useCallback, useDeferredValue } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import { calculateAutoPosition, DEFAULT_API_BASE } from '../utils';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [zoomModifier, setZoomModifier] = useState(1);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Performance: Defer the config passed to layout/badges to keep UI sliders responsive
  const deferredConfig = useDeferredValue(config);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.clientWidth - 32;
      const parentHeight = containerRef.current.clientHeight - 32;
      const scaleX = parentWidth / CANVAS_WIDTH;
      const scaleY = parentHeight / CANVAS_HEIGHT;
      setAutoScale(Math.min(scaleX, scaleY, 1));
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const currentScale = autoScale * zoomModifier;

  const handlePositionChange = useCallback((id: RatingType, x: number, y: number) => {
    setConfig((prev: PosterConfig) => {
      if (prev.layout === 'custom' && prev.preset === 'custom') {
         return { ...prev, items: { ...prev.items, [id]: { ...prev.items[id], x, y } } };
      }
      const newItems = { ...prev.items };
      prev.ratings.forEach((r: RatingType, index: number) => {
         const currentItem = newItems[r];
         if (currentItem?.x === undefined || currentItem?.y === undefined) {
             const autoPos = calculateAutoPosition(r, index, prev.ratings.length, prev);
             newItems[r] = { ...currentItem, x: autoPos.x, y: autoPos.y };
         }
      });
      newItems[id] = { ...newItems[id], x, y };
      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  }, [setConfig]);

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${deferredConfig.mediaType}/${deferredConfig.tmdbId}.${deferredConfig.extension}`;
    return deferredConfig.source === 'fanart' ? `${base}?source=fanart&v=1` : `${base}?v=1`;
  }, [deferredConfig.tmdbId, deferredConfig.source, deferredConfig.mediaType, deferredConfig.extension]);

  useEffect(() => { setIsImageLoading(true); }, [cleanPosterUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative bg-black/20 overflow-hidden">
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
            <button onClick={() => setZoomModifier(p => Math.min(p + 0.1, 3))} className="p-2 bg-zinc-800/80 backdrop-blur text-zinc-300 rounded hover:bg-zinc-700 hover:text-white border border-zinc-700 shadow-lg"><ZoomIn size={16} /></button>
            <button onClick={() => setZoomModifier(p => Math.max(p - 0.1, 0.1))} className="p-2 bg-zinc-800/80 backdrop-blur text-zinc-300 rounded hover:bg-zinc-700 hover:text-white border border-zinc-700 shadow-lg"><ZoomOut size={16} /></button>
            {zoomModifier !== 1 && <button onClick={() => setZoomModifier(1)} className="p-2 bg-zinc-800/80 backdrop-blur text-blue-400 rounded hover:bg-zinc-700 hover:text-blue-300 border border-zinc-700 shadow-lg" title="Reset"><RotateCcw size={16} /></button>}
        </div>

        <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${currentScale})`, transition: 'transform 0.1s ease-out' }} className="bg-black shadow-2xl relative shrink-0 ring-1 ring-white/10">
            {isImageLoading && (
                <div className="absolute inset-0 z-[100] bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-zinc-400 gap-3 transition-opacity duration-300">
                    <Loader2 className="animate-spin text-blue-500" size={48} /><span className="text-xs font-semibold tracking-wider uppercase animate-pulse">Fetching Poster...</span>
                </div>
            )}
            <img src={cleanPosterUrl} alt="Poster" className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500 ${isImageLoading ? 'opacity-50' : 'opacity-100'}`} style={{ filter: `blur(${deferredConfig.posterBlur}px) grayscale(${deferredConfig.grayscale ? 1 : 0})` }} draggable={false} onLoad={() => setIsImageLoading(false)} onError={() => setIsImageLoading(false)} />
            <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                {[1, 2, 3].map(i => (<React.Fragment key={i}><div className="absolute top-0 bottom-0 border-r border-white/20" style={{ left: `${i*25}%` }} /><div className="absolute left-0 right-0 border-b border-white/20" style={{ top: `${i*25}%` }} /></React.Fragment>))}
            </div>

            {deferredConfig.ratings.map((id: RatingType, index: number) => {
                const auto = calculateAutoPosition(id, index, deferredConfig.ratings.length, deferredConfig);
                const item = deferredConfig.items[id] || {};
                
                // Effective props resolution
                const bg = item.bg || deferredConfig.globalBg || `rgba(0,0,0,${deferredConfig.alpha})`;
                const txt = item.txt || (deferredConfig.globalTxt !== '#ffffff' ? deferredConfig.globalTxt : '#ffffff');
                const scale = item.scale !== undefined ? item.scale : deferredConfig.globalScale;
                const borderW = item.borderW !== undefined ? item.borderW : deferredConfig.globalBorderW;
                const borderC = item.borderC || (deferredConfig.globalBorderC !== '#ffffff' ? deferredConfig.globalBorderC : '#ffffff');
                
                const w = BASE_BADGE_W; 
                const h = BASE_BADGE_H;

                return (
                    <DraggableBadge
                        key={id}
                        id={id}
                        x={item.x !== undefined ? item.x : auto.x}
                        y={item.y !== undefined ? item.y : auto.y}
                        w={w} h={h}
                        canvasScale={currentScale}
                        onPositionChange={handlePositionChange}
                        // Visual Props (Flattened for memoization)
                        bg={bg}
                        txt={txt}
                        blur={item.blur !== undefined ? item.blur : deferredConfig.blur}
                        alpha={item.alpha !== undefined ? item.alpha : deferredConfig.alpha}
                        radius={item.radius !== undefined ? item.radius : deferredConfig.radius}
                        shadow={item.shadow !== undefined ? item.shadow : deferredConfig.shadow}
                        icon={item.icon !== undefined ? item.icon : true}
                        scale={scale}
                        borderW={borderW}
                        borderC={borderC}
                    />
                );
            })}
        </div>
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-[10px] px-2 py-1 rounded text-zinc-400 pointer-events-none">{Math.round(currentScale * 100)}%</div>
    </div>
  );
};

export default PreviewCanvas;