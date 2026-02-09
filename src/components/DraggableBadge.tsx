import React, { useState, useEffect, useRef } from 'react';
import { RatingType, PosterConfig, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import { getScale } from '../utils';

interface Props {
  badgeId: RatingType;
  config: PosterConfig;
  x: number;
  y: number;
  canvasScale: number;
  onPositionChange: (id: RatingType, x: number, y: number) => void;
  isSelected: boolean;
  onSelect: (id: RatingType, multi: boolean) => void;
}

// ... ICONS CONSTANT (Keep the one you have in your original file, it was correct) ...
const ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt_fresh: { vb: "0 0 80 80", body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g>` },
  rt_rotten: { vb: "0 0 52 52", body: `<path fill="#00912D" d="M25.7 6.4C19 13.9 6.2 16.7 6.2 27c0 8.5 12.3 8.3 12.3 18.6 0 2.2 2.3 4 5.2 4 4.5 0 5-5.9 8.2-5.9 2.5 0 3 2.1 5.3 2.1 4.5 0 8.4-5.2 8.4-11.4 0-11-13-11.9-19.9-18z"/>`},
  tmdb: { vb: "0 0 32 32", body: `<rect width="32" height="32" rx="4" fill="#0d253f"/><rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tmdbGrad)"/><defs><linearGradient id="tmdbGrad" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse"><stop stop-color="#90cea1"/><stop offset="1" stop-color="#01b4e4"/></linearGradient></defs>` },
  popcorn_fresh: { vb: "0 0 512 512", body: `<path fill="#FA320A" d="M116.5 137.8l-13.8 62.4-44.5 200.5C53.7 420.9 69 440 90.1 440h331.8c21.1 0 36.4-19.1 31.9-39.3l-44.5-200.5-13.8-62.4H116.5zM256 64c20.3 0 37.9-11.7 46.5-28.8 8.6 17.1 26.2 28.8 46.5 28.8 28.3 0 51.2-22.9 51.2-51.2 0-3.3-.3-6.5-.9-9.6C391.8 19.6 376.5 32 358.5 32c-15.1 0-28.3-8.8-35-21.8C316.8 23.2 303.6 32 288.5 32c-15.1 0-28.3-8.8-35-21.8C246.8 23.2 233.6 32 218.5 32c-18 0-33.3-12.4-40.8-28.8-.6 3.1-.9 6.3-.9 9.6 0 28.3 22.9 51.2 51.2 51.2 20.3 0 37.9-11.7 46.5-28.8 8.6 17.1 26.2 28.8 46.5 28.8z"/>` },
  popcorn_rotten: { vb: "0 0 512 512", body: `<path fill="#00912D" d="M473.6 130.6l-3.3-13.3c-4.4-17.6-22.4-28.3-40-23.9L108.7 174.2c-17.6 4.4-28.3 22.4-23.9 40l50.2 200.7c4.4 17.6 22.4 28.3 40 23.9l321.7-80.4c17.6-4.4 28.3-22.4 23.9-40l-47-187.8zM245.5 111.4c16.4-12.1 39.4-8.6 51.5 7.8 12.1 16.4 8.6 39.4-7.8 51.5-16.4 12.1-39.4 8.6-51.5-7.8-12.1-16.4-8.6-39.4 7.8-51.5zm-59.9 44.2c16.4-12.1 39.4-8.6 51.5 7.8 12.1 16.4 8.6 39.4-7.8 51.5-16.4 12.1-39.4 8.6-51.5-7.8-12.1-16.4-8.6-39.4 7.8-51.5zm-33.7-82.9c16.4-12.1 39.4-8.6 51.5 7.8 12.1 16.4 8.6 39.4-7.8 51.5-16.4 12.1-39.4 8.6-51.5-7.8-12.1-16.4-8.6-39.4 7.8-51.5zm-63.5 83.2c16.4-12.1 39.4-8.6 51.5 7.8 12.1 16.4 8.6 39.4-7.8 51.5-16.4 12.1-39.4 8.6-51.5-7.8-12.1-16.4-8.6-39.4 7.8-51.5z"/>` },
  letterboxd: { vb: "0 0 512 512", body: `<rect width="512" height="512" rx="104" fill="#14181c"/><circle cx="144" cy="256" r="88" fill="#ff8000"/><circle cx="368" cy="256" r="88" fill="#40bcf4"/><circle cx="256" cy="256" r="88" fill="#00e054"/><g clip-path="url(#lb_cut_l)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><g clip-path="url(#lb_cut_r)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><defs><clipPath id="lb_cut_l"><circle cx="144" cy="256" r="88"/></clipPath><clipPath id="lb_cut_r"><circle cx="368" cy="256" r="88"/></clipPath></defs>` },
  meta: { vb: "0 0 32 32", body: `<path d="M0 0h32v32H0V0z" fill="#333"/><path d="M24.7 10.7l-7.3 11-3.6-5.8-3.2 5.1-5-8.2H2v13.6h4.3V15l1.6 2.8 3.8-6 3.8 5.9 7.3-10.9H22v13.6h4.5V10.7h-1.8z" fill="#FFF"/>` },
  runtime: { vb: "0 0 512 512", body: `<path fill="white" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/><path fill="white" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>` }
};

const DraggableBadge: React.FC<Props> = ({ badgeId, config, x, y, canvasScale, onPositionChange, isSelected, onSelect }) => {
  const itemConfig = config.items[badgeId];
  
  // Resolve item specific props or fallbacks
  const scale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
  const width = BASE_BADGE_W * scale;
  const height = BASE_BADGE_H * scale;

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number, mouseY: number, elemX: number, elemY: number } | null>(null);
  const [currentPos, setCurrentPos] = useState({ x, y });
  const posRef = useRef({ x, y });

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
    
    const deltaX = (clientX - mouseX) / canvasScale;
    const deltaY = (clientY - mouseY) / canvasScale;

    let nextX = elemX + deltaX;
    let nextY = elemY + deltaY;

    // Boundary check
    nextX = Math.max(0, Math.min(nextX, CANVAS_WIDTH - width));
    nextY = Math.max(0, Math.min(nextY, CANVAS_HEIGHT - height));

    const newPos = { x: nextX, y: nextY };
    setCurrentPos(newPos);
    posRef.current = newPos;
  };

  const handleEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    onPositionChange(badgeId, posRef.current.x, posRef.current.y);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, canvasScale, width, height]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Select on mouse down
    onSelect(badgeId, e.shiftKey || e.ctrlKey || e.metaKey);
    handleStart(e.clientX, e.clientY);
  };

  // --- RENDERING ---
  const blurVal = itemConfig?.blur ?? config.blur;
  const alphaVal = itemConfig?.alpha ?? config.alpha;
  const radiusVal = itemConfig?.radius ?? config.radius;
  const hasShadow = itemConfig?.shadow ?? config.shadow;
  const showIcon = itemConfig?.icon ?? true;
  
  const bgRaw = itemConfig?.bg || `rgba(0,0,0, ${alphaVal})`;
  const backgroundStyle = bgRaw.startsWith('grad:') 
    ? `linear-gradient(135deg, ${bgRaw.split(':')[1]}, ${bgRaw.split(':')[2]})` 
    : bgRaw;

  const borderWidth = itemConfig?.borderW || 0;
  const borderColor = itemConfig?.borderC || 'transparent';
  const txtColor = itemConfig?.txt || '#ffffff';

  const iconSize = 36 * scale;
  const iconLeft = 10 * scale;
  const iconTop = 12 * scale;
  const textRight = 10 * scale;
  const textTop = '50%';

  const renderContent = () => {
      // (Simplified renderer for brevity - Logic remains same as your original)
      const dummyVals: Record<string, string> = { imdb: '8.7', rt: '73%', rt_popcorn: '88%', letterboxd: '4.2', meta: '74', tmdb: '85%', runtime: '2h 15m' };
      const dummyVal = dummyVals[badgeId] || '0.0';

      if (badgeId === 'age') {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txtColor }}></div>
                 <span style={{ fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor }}>PG-13</span>
            </div>
        );
      }

      if (!showIcon) {
        return <span style={{ position: 'absolute', left: '50%', top: textTop, transform: 'translate(-50%, -50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{dummyVal}</span>;
      }

      let iconKey: string = badgeId === 'rt' ? 'rt_fresh' : (badgeId === 'rt_popcorn' ? 'popcorn_fresh' : badgeId);
      const iconData = ICONS[iconKey] || ICONS[badgeId];

      return (
        <>
            {iconData && <div style={{ position: 'absolute', left: iconLeft, top: iconTop, lineHeight: 0 }}><svg viewBox={iconData.vb} width={iconSize} height={iconSize} style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: iconData.body }} /></div>}
            <span style={{ position: 'absolute', right: textRight, top: textTop, transform: 'translateY(-50%)', fontSize: `${28 * scale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txtColor, lineHeight: 1 }}>{dummyVal}</span>
        </>
      );
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className={`absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60]`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        background: backgroundStyle,
        borderRadius: `${radiusVal}px`,
        border: `${Math.max(borderWidth, isSelected ? 2 : 0)}px solid ${isSelected ? '#6366f1' : borderColor}`, // Selection Color
        backdropFilter: `blur(${blurVal}px)`,
        boxShadow: hasShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto', 
      }}
    >
      {renderContent()}
    </div>
  );
};

export default DraggableBadge;