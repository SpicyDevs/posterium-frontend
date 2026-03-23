// src/components/builder/components/DraggableBadge.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { RatingType, PosterConfig } from '../types';
import { BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { BADGE_ICONS } from '../constants';

const PLACEHOLDER: Record<string, string> = {
  imdb: '8.4', rt: '76%', rt_popcorn: '91%', letterboxd: '4.1',
  meta: '72', tmdb: '83%', runtime: '2h 8m', mal: '8.2', anilist: '82%', age: 'PG-13',
};

interface Props {
  badgeId: RatingType; config: PosterConfig; x: number; y: number;
  canvasScale: number; onDragMove: (id: RatingType, dx: number, dy: number) => void;
  onDragEnd: (id: RatingType, dx: number, dy: number) => void;
  isSelected: boolean; onSelect: (id: RatingType, multi: boolean) => void;
  isObscuring?: boolean; onHoverChange?: (isHovered: boolean) => void; liveRating?: string;
}

const DraggableBadge: React.FC<Props> = ({
  badgeId, config, x, y, canvasScale, onDragMove, onDragEnd,
  isSelected, onSelect, isObscuring, onHoverChange, liveRating,
}) => {
  const itemConfig = config.items[badgeId];
  const scale  = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width  = BASE_BADGE_W * scale, height = BASE_BADGE_H * scale;
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef   = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const justSelectedRef = useRef(false); // Track if selection happened on mouse down
  
  const onDragEndRef   = useRef(onDragEnd);
  const onSelectRef    = useRef(onSelect);
  const isSelectedRef  = useRef(isSelected);
  const canvasScaleRef = useRef(canvasScale);
  
  onDragEndRef.current   = onDragEnd;   
  onSelectRef.current    = onSelect;
  isSelectedRef.current  = isSelected; 
  canvasScaleRef.current = canvasScale;
  
  const displayVal = liveRating ?? PLACEHOLDER[badgeId] ?? '—';
  const blurVal    = itemConfig?.blur   ?? config.blur;
  const alphaVal   = itemConfig?.alpha  ?? config.alpha;
  const radiusVal  = itemConfig?.radius ?? config.radius;
  const rawShadow  = itemConfig?.shadow ?? config.shadow;
  const shadowVal  = typeof rawShadow === 'boolean' ? (rawShadow ? 6 : 0) : rawShadow;
  const showIcon   = itemConfig?.icon ?? config.icon ?? true;
  const txtColor   = itemConfig?.txt  || '#ffffff';
  
  const rawBg = itemConfig?.bg ?? config.bg;
  const bgRaw = (() => {
    if (!rawBg) return `rgba(0,0,0,${alphaVal})`;
    if (rawBg.startsWith('grad:')) return rawBg;
    const fullHex = /^#[0-9a-fA-F]{3}$/.test(rawBg) ? `#${rawBg[1]}${rawBg[1]}${rawBg[2]}${rawBg[2]}${rawBg[3]}${rawBg[3]}` : rawBg;
    if (/^#[0-9a-fA-F]{6}$/.test(fullHex)) {
      const r = parseInt(fullHex.slice(1,3),16), g = parseInt(fullHex.slice(3,5),16), b = parseInt(fullHex.slice(5,7),16);
      return `rgba(${r},${g},${b},${alphaVal})`;
    }
    return rawBg;
  })();
  
  const backgroundStyle = rawBg?.startsWith('grad:') ? `linear-gradient(135deg, ${rawBg.split(':')[1]}, ${rawBg.split(':')[2]})` : bgRaw;
  const borderWidth = itemConfig?.borderW ?? config.borderW ?? 0;
  const borderColor = itemConfig?.borderC ?? config.borderC ?? '#ffffff';
  
  let iconKey: string = badgeId;
  if (badgeId === 'rt') { const pct = parseInt(displayVal); iconKey = (!isNaN(pct) && pct >= 60) ? 'rt_fresh' : 'rt_rotten'; }
  else if (badgeId === 'rt_popcorn') { const pct = parseInt(displayVal); iconKey = (!isNaN(pct) && pct >= 60) ? 'popcorn_fresh' : 'popcorn_rotten'; }
  
  const iconData  = BADGE_ICONS[iconKey] || BADGE_ICONS[badgeId];
  const iconSize  = 36 * scale, iconLeft = 10 * scale, iconTop = 12 * scale, textRight = 10 * scale;

  const handleStart = (clientX: number, clientY: number) => { 
    setIsDragging(true); 
    dragStartRef.current = { mouseX: clientX, mouseY: clientY }; 
  };
  
  const handleMove  = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const dx = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const dy = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;
    if (isFinite(dx) && isFinite(dy)) onDragMove(badgeId, dx, dy);
  };
  
  const handleEnd = (e: MouseEvent | TouchEvent) => {
    setIsDragging(false);
    if (!dragStartRef.current) return;
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const dx = (clientX - dragStartRef.current.mouseX) / canvasScaleRef.current;
    const dy = (clientY - dragStartRef.current.mouseY) / canvasScaleRef.current;
    
    // Check if the interaction was purely a click and not a drag
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      const isShift = 'shiftKey' in e ? e.shiftKey : false;
      const isCtrl  = 'ctrlKey'  in e ? e.ctrlKey  : false;
      const isMeta  = 'metaKey'  in e ? e.metaKey  : false;
      const multi   = isShift || isCtrl || isMeta;
      
      // If we didn't just select it on MouseDown, it means it was already selected.
      // So since this is just a click, we cleanly toggle the selection off.
      if (!justSelectedRef.current) {
        onSelectRef.current(badgeId, multi);
      }
    }
    
    onDragEndRef.current(badgeId, dx, dy);
    dragStartRef.current = null;
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMM = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMU = (e: MouseEvent) => handleEnd(e);
    const onTM = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTE = (e: TouchEvent) => handleEnd(e);
    
    window.addEventListener('mousemove', onMM); 
    window.addEventListener('mouseup', onMU);
    window.addEventListener('touchmove', onTM, { passive: false }); 
    window.addEventListener('touchend', onTE);
    
    return () => { 
      window.removeEventListener('mousemove', onMM); 
      window.removeEventListener('mouseup', onMU); 
      window.removeEventListener('touchmove', onTM); 
      window.removeEventListener('touchend', onTE); 
    };
  }, [isDragging]);

  const onMouseDown = (e: React.MouseEvent) => { 
    e.stopPropagation(); 
    e.preventDefault(); 
    
    const multi = e.shiftKey || e.ctrlKey || e.metaKey;
    if (!isSelected) {
      onSelect(badgeId, multi); 
      justSelectedRef.current = true;
    } else {
      justSelectedRef.current = false;
    }
    
    handleStart(e.clientX, e.clientY); 
  };
  
  const onTouchStart = (e: React.TouchEvent) => { 
    e.stopPropagation(); 
    if (!isSelected) {
      onSelect(badgeId, false); 
      justSelectedRef.current = true;
    } else {
      justSelectedRef.current = false;
    }
    handleStart(e.touches[0].clientX, e.touches[0].clientY); 
  };

  const renderContent = () => {
    if (badgeId === 'age') {
      const fontSize = Math.min(28, displayVal.length > 4 ? 20 : 28) * scale;
      return (
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="absolute inset-0 m-[10%] border-2 rounded opacity-50" style={{ borderColor: txtColor }} />
          <span style={{ fontSize, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor }}>{displayVal}</span>
        </div>
      );
    }
    if (!showIcon) return <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{displayVal}</span>;
    if (iconData) {
      let fSize = 28;
      if (badgeId === 'runtime' && displayVal.length > 5) fSize = 22;
      else if (displayVal.length > 5) fSize = 24;
      return (
        <>
          <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
            <svg viewBox={iconData.vb} width={iconSize} height={iconSize} style={{ display: 'block', color: txtColor }} dangerouslySetInnerHTML={{ __html: iconData.body }} />
          </div>
          <span style={{ position: 'absolute', right: textRight, top: '50%', transform: 'translateY(-50%)', fontSize: `${fSize * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{displayVal}</span>
        </>
      );
    }
    return <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{displayVal}</span>;
  };

  const dropShadow    = shadowVal > 0 ? `0 ${shadowVal * 0.5}px ${shadowVal}px -1px rgba(0,0,0,0.55)` : '';
  const slantPattern  = `repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.08) 4px,rgba(255,255,255,0.08) 8px)`;
  const finalBg       = isObscuring ? `${slantPattern}, ${backgroundStyle}` : backgroundStyle;

  return (
    <div
      onMouseDown={onMouseDown} onTouchStart={onTouchStart}
      onMouseEnter={() => onHoverChange?.(true)} onMouseLeave={() => onHoverChange?.(false)}
      className="badge-item absolute select-none cursor-move z-50"
      style={{ width: `${width}px`, height: `${height}px`, left: `${x}px`, top: `${y}px`, background: finalBg, borderRadius: `${radiusVal}px`, outline: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none', backdropFilter: `blur(${blurVal}px)`, WebkitBackdropFilter: `blur(${blurVal}px)`, boxShadow: dropShadow || 'none', opacity: isObscuring ? 0.3 : 1, pointerEvents: isObscuring ? 'none' : 'auto', touchAction: 'none', transform: 'translateZ(0)' }}
    >
      {renderContent()}
      {isSelected && (
        <div className="absolute bg-[#C47C2E] border border-[#D4A245] rounded flex items-center justify-center shadow-sm z-10 pointer-events-none"
          style={{ top: `${-7 * scale * 1.15}px`, right: `${-7 * scale * 1.15}px`, width: `${14 * scale * 1.15}px`, height: `${14 * scale * 1.15}px` }}>
          <div className="bg-white" style={{ width: `${6 * scale * 1.15}px`, height: `${6 * scale * 1.15}px`, borderRadius: `${1.5 * scale * 1.15}px` }} />
        </div>
      )}
    </div>
  );
};

export default DraggableBadge;
