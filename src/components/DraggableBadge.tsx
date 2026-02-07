import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';
import { GripVertical, Clock } from 'lucide-react';

interface Rect {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Props {
  badgeId: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  canvasScale: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
  obstacles: Rect[];
}

const ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt_fresh: { vb: "0 0 80 80", body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g>` },
  rt_rotten: { vb: "0 0 85 85", body: `<g transform="translate(0, 1.23)"><path d="M71.4638596,70.225614 C56.3459649,71.0192982 53.2568421,53.7203509 47.325614,53.8435088 C44.7982456,53.8964912 42.8063158,56.5389474 43.6810526,59.6185965 C44.1621053,61.3115789 45.4964912,63.794386 46.337193,65.3350877 C49.302807,70.7719298 44.9185965,76.9245614 39.7880702,77.4449123 C31.2621053,78.3098246 27.705614,73.3638596 27.925614,68.3007018 C28.1729825,62.6168421 32.9922807,56.8091228 28.0494737,54.3378947 C22.8694737,51.7480702 18.6585965,61.8754386 13.7017544,64.1357895 C9.2154386,66.1817544 2.9877193,64.5954386 0.773684211,59.6136842 C-0.781403509,56.1129825 -0.498596491,49.3722807 6.42526316,46.8003509 C10.7501754,45.1940351 20.3880702,48.9010526 20.8824561,44.205614 C21.4522807,38.7929825 10.7575439,38.3364912 7.53754386,37.0385965 C1.84,34.7424561 -1.52280702,29.8291228 1.11192982,24.5582456 C3.08877193,20.6045614 8.90526316,18.9957895 13.3449123,20.7277193 C18.6635088,22.8024561 19.517193,28.3189474 22.2421053,30.6129825 C24.5894737,32.5901754 27.8021053,32.8375439 29.9031579,31.4782456 C31.4526316,30.4754386 31.9684211,28.2729825 31.3838596,26.2610526 C30.6084211,23.5901754 28.5505263,21.9235088 26.542807,20.2905263 C22.9698246,17.3859649 17.925614,14.8884211 20.9768421,6.96035088 C23.4778947,0.463157895 30.8133333,0.229122807 30.8133333,0.229122807 C33.7277193,-0.0985964912 36.3375439,0.781403509 38.4642105,2.68140351 C41.3073684,5.22140351 41.8610526,8.61649123 41.3852632,12.2385965 C40.9505263,15.5449123 39.7803509,18.4407018 39.1701754,21.7164912 C38.4621053,25.5196491 40.4947368,29.3519298 44.3603509,29.5010526 C49.4449123,29.6975439 50.9694737,25.7894737 51.5915789,23.3122807 C52.5024561,19.6877193 53.6978947,16.322807 57.0617544,14.2035088 C61.8894737,11.1617544 68.5954386,11.8284211 71.7066667,17.674386 C74.1677193,22.3 73.3775439,28.6677193 69.6024561,32.1449123 C67.9087719,33.7045614 65.8722807,34.254386 63.6694737,34.2698246 C60.5105263,34.2922807 57.3529825,34.2147368 54.4207018,35.6929825 C52.4245614,36.6989474 51.5547368,38.3382456 51.5550877,40.5354386 C51.5550877,42.6768421 52.6698246,44.0754386 54.4761404,44.985614 C57.8782456,46.7003509 61.6336842,47.0508772 65.3087719,47.694386 C70.6382456,48.6277193 75.3242105,50.5049123 78.3326316,55.4505263 C78.3596491,55.4940351 78.3859649,55.5378947 78.4115789,55.5821053 C81.8666667,61.4375439 78.2533333,69.8687719 71.4638596,70.225614" fill="#0AC855"></path></g>` },
  meta: { vb: "0 0 32 32", body: `<path d="M0 0h32v32H0V0z" fill="#333"/><path d="M24.7 10.7l-7.3 11-3.6-5.8-3.2 5.1-5-8.2H2v13.6h4.3V15l1.6 2.8 3.8-6 3.8 5.9 7.3-10.9H22v13.6h4.5V10.7h-1.8z" fill="#FFF"/>` },
  tmdb: { vb: "0 0 32 32", body: `<path d="M3.7 27.6h24.6V4.4H3.7v23.2z" fill="#0d253f"/><path d="M12.6 18.6c0-3.3 2.1-5.7 5.6-5.7 1.8 0 3.2.7 4.1 1.8v-1.6h2.7v10.9h-2.7v-1.6c-.9 1.1-2.3 1.8-4.1 1.8-3.5 0-5.6-2.4-5.6-5.6zm8.1 0c0-1.9-1-3.4-2.7-3.4-1.8 0-2.8 1.5-2.8 3.4 0 1.9 1 3.4 2.8 3.4 1.7 0 2.7-1.5 2.7-3.4z" fill="#01b4e4"/>` }
};

const DraggableBadge: React.FC<Props> = ({ badgeId, config, x, y, canvasScale, onPositionChange, obstacles }) => {
  const scale = getScale(config.size);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;
  const itemConfig = config.items[badgeId];

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number, mouseY: number, elemX: number, elemY: number } | null>(null);
  
  // Local Visual Position (separate from config to prevent lag)
  const [currentPos, setCurrentPos] = useState({ x, y });

  // Sync with prop updates when NOT dragging
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x, y });
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

  const checkCollision = (cx: number, cy: number, w: number, h: number): boolean => {
      for (const ob of obstacles) {
          // Simple AABB Collision
          if (cx < ob.x + ob.w &&
              cx + w > ob.x &&
              cy < ob.y + ob.h &&
              cy + h > ob.y) {
              return true;
          }
      }
      return false;
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

    // Dimensions
    const w = width;
    const h = height;

    // 1. Canvas Boundaries
    nextX = Math.max(0, Math.min(nextX, CANVAS_WIDTH - w));
    nextY = Math.max(0, Math.min(nextY, CANVAS_HEIGHT - h));

    // 2. Collision Detection
    if (checkCollision(nextX, elemY, w, h)) {
        nextX = currentPos.x; 
    } 
    if (checkCollision(nextX, nextY, w, h)) {
        nextY = currentPos.y; 
    }

    // 3. Grid Snapping
    const snapThreshold = 10;
    const vSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_WIDTH);
    const hSnaps = [0, 0.25, 0.5, 0.75, 1].map(f => f * CANVAS_HEIGHT);
    const centerX = nextX + w / 2;
    const centerY = nextY + h / 2;

    for (const line of vSnaps) {
        if (Math.abs(centerX - line) < snapThreshold) {
            const snappedX = line - w / 2;
            if (!checkCollision(snappedX, nextY, w, h)) {
                nextX = snappedX;
            }
        }
    }
    for (const line of hSnaps) {
        if (Math.abs(centerY - line) < snapThreshold) {
            const snappedY = line - h / 2;
            if (!checkCollision(nextX, snappedY, w, h)) {
                nextY = snappedY;
            }
        }
    }

    setCurrentPos({ x: nextX, y: nextY });
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    onPositionChange(badgeId, currentPos.x, currentPos.y);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    
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
  }, [isDragging, canvasScale, width, height, obstacles]);

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
  const showIcon = itemConfig?.icon ?? true; // Default true
  const bgColor = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
    if (badgeId === 'age') {
        // Updated Age Style (Font 28)
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txtColor }}></div>
                 <span style={{ 
                     fontSize: `${28 * scale}px`, // Increased from 24
                     fontFamily: "'Plus Jakarta Sans', sans-serif", 
                     fontWeight: 'bold',
                     color: txtColor
                 }}>PG-13</span>
            </div>
        );
    }
    
    // Check for explicit icon disable
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

    const dummyVal = {
        imdb: '8.7',
        rt: '73%',
        meta: '74',
        tmdb: '85%'
    }[badgeId] || '0.0';

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