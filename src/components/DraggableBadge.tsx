import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { GripVertical, Clock } from 'lucide-react';

interface Props {
  badgeId: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  canvasScale: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
}

const ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt_fresh: { vb: "0 0 80 80", body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g>` },
  meta: { vb: "0 0 32 32", body: `<path d="M0 0h32v32H0V0z" fill="#333"/><path d="M24.7 10.7l-7.3 11-3.6-5.8-3.2 5.1-5-8.2H2v13.6h4.3V15l1.6 2.8 3.8-6 3.8 5.9 7.3-10.9H22v13.6h4.5V10.7h-1.8z" fill="#FFF"/>` },
  tmdb: { vb: "0 0 32 32", body: `<path d="M3.7 27.6h24.6V4.4H3.7v23.2z" fill="#0d253f"/><path d="M12.6 18.6c0-3.3 2.1-5.7 5.6-5.7 1.8 0 3.2.7 4.1 1.8v-1.6h2.7v10.9h-2.7v-1.6c-.9 1.1-2.3 1.8-4.1 1.8-3.5 0-5.6-2.4-5.6-5.6zm8.1 0c0-1.9-1-3.4-2.7-3.4-1.8 0-2.8 1.5-2.8 3.4 0 1.9 1 3.4 2.8 3.4 1.7 0 2.7-1.5 2.7-3.4z" fill="#01b4e4"/>` }
};

const DraggableBadge: React.FC<Props> = ({ badgeId, config, x, y, canvasScale, onPositionChange }) => {
  const scale = getScale(config.size);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;
  const itemConfig = config.items[badgeId];

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number, mouseY: number, elemX: number, elemY: number } | null>(null);
  
  // Local Visual Position
  const [currentPos, setCurrentPos] = useState({ x, y });

  // Ref to hold the Latest Position (Solves Stale Closure Issue)
  const posRef = useRef({ x, y });

  // Sync state/ref when props change (only if NOT dragging)
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x, y });
      posRef.current = { x, y };
    }
  }, [x, y, isDragging]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
        mouseX: clientX,
        mouseY: clientY,
        elemX: currentPos.x,
        elemY: currentPos.y
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;

    const { mouseX, mouseY, elemX, elemY } = dragStartRef.current;
    
    // Calculate raw delta scaled to canvas
    const deltaX = (clientX - mouseX) / canvasScale;
    const deltaY = (clientY - mouseY) / canvasScale;

    // Proposed new position (Raw)
    let nextX = elemX + deltaX;
    let nextY = elemY + deltaY;

    // Canvas Boundaries
    const w = width;
    const h = height;
    nextX = Math.max(0, Math.min(nextX, CANVAS_WIDTH - w));
    nextY = Math.max(0, Math.min(nextY, CANVAS_HEIGHT - h));

    const newPos = { x: nextX, y: nextY };
    
    // Update both State (for visual) and Ref (for logic)
    setCurrentPos(newPos);
    posRef.current = newPos;
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    
    // Use the Ref to get the true latest position
    onPositionChange(badgeId, posRef.current.x, posRef.current.y);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    
    // Touch support
    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault(); 
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, canvasScale, width, height]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const blurVal = itemConfig?.blur ?? config.blur;
  const alphaVal = itemConfig?.alpha ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;
  const hasShadow = itemConfig?.shadow ?? config.shadow;
  const showIcon = itemConfig?.icon ?? true;
  const bgColor = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
    if (badgeId === 'age') {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txtColor }}></div>
                 <span style={{ 
                     fontSize: `${28 * scale}px`, 
                     fontFamily: "'Plus Jakarta Sans', sans-serif", 
                     fontWeight: 'bold',
                     color: txtColor
                 }}>PG-13</span>
            </div>
        );
    }
    
    if (!showIcon) {
        const dummyVal = { imdb: '8.7', rt: '73%', meta: '74', tmdb: '85%', runtime: '2h 15m' }[badgeId] || '0.0';
        return (
            <span style={{ 
                position: 'absolute',
                left: '50%',
                top: textTop,
                transform: 'translate(-50%, -50%)',
                fontSize: `${28 * scale}px`, 
                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                fontWeight: 'bold',
                color: txtColor,
                lineHeight: 1 
            }}>
                {dummyVal}
            </span>
        );
    }

    if (badgeId === 'runtime') {
        return (
             <>
                <div style={{ position: 'absolute', left: iconLeft, top: 14 * scale }}>
                    <Clock size={32 * scale} color={txtColor} strokeWidth={2.5} />
                </div>
                <span style={{ 
                    position: 'absolute',
                    right: textRight,
                    top: textTop,
                    transform: 'translateY(-50%)',
                    fontSize: `${28 * scale}px`, 
                    fontFamily: "'Plus Jakarta Sans', sans-serif", 
                    fontWeight: 'bold',
                    color: txtColor,
                    lineHeight: 1 
                }}>
                    2h 15m
                </span>
             </>
        );
    }

    const iconKey = badgeId === 'rt' ? 'rt_fresh' : badgeId;
    const iconData = ICONS[iconKey];
    const dummyVal = { imdb: '8.7', rt: '73%', meta: '74', tmdb: '85%' }[badgeId] || '0.0';

    return (
        <>
            {iconData && (
                <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}>
                    <svg 
                        viewBox={iconData.vb} 
                        width={iconSize} 
                        height={iconSize}
                        style={{ display: 'block' }}
                        dangerouslySetInnerHTML={{ __html: iconData.body }}
                    />
                </div>
            )}
            <span style={{ 
                position: 'absolute',
                right: textRight,
                top: textTop,
                transform: 'translateY(-50%)',
                fontSize: `${28 * scale}px`, 
                fontFamily: "'Plus Jakarta Sans', sans-serif", 
                fontWeight: 'bold',
                color: txtColor,
                lineHeight: 1 
            }}>
                {dummyVal}
            </span>
        </>
    );
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60]"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        backgroundColor: bgColor,
        borderRadius: `${radiusVal}px`,
        backdropFilter: `blur(${blurVal}px)`,
        boxShadow: hasShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto', 
        touchAction: 'none' 
      }}
    >
      <div className="opacity-0 group-hover:opacity-100 absolute -left-8 top-1/2 -translate-y-1/2 bg-blue-600/90 backdrop-blur rounded-full p-2 text-white transition-opacity shadow-lg">
           <GripVertical size={20} />
      </div>
      {renderContent()}
    </div>
  );
};

export default DraggableBadge;