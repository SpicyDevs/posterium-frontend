import React, { useRef, useState, useEffect } from 'react';
import { RatingType, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { GripVertical } from 'lucide-react';

const ICONS: Record<string, { vb: string, body: string }> = {
  imdb: { vb: "0 0 122.88 122.88", body: `<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>` },
  rt_fresh: { vb: "0 0 80 80", body: `<g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><mask id="mask-rt-fresh" fill="white"><polygon points="0.000109100102 0.246970954 77.0827837 0.246970954 77.0827837 63.7145228 0.000109100102 63.7145228"></polygon></mask><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A" mask="url(#mask-rt-fresh)"></path></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"></path></g><path d="M45.4780328,39.6152131 C45.9506885,38.4445902 47.6259672,37.7314098 48.8288525,37.8148197 C50.114623,37.904 51.4803934,39.2556066 51.719082,40.584918 C51.7634098,40.5366557 51.8098361,40.4910164 51.8570492,40.4461639 C52.2699016,40.0516721 52.7871475,39.7899016 53.3531803,39.7177705 C53.266623,39.3342951 53.2459016,38.9238033 53.3051803,38.5028197 C53.5142295,37.0205902 54.7034754,35.9092459 56.0650492,35.9202623 C56.9437377,35.9273443 57.714623,36.376918 58.216918,37.067541 C58.2617705,37.0114098 58.3113443,36.96 58.3596066,36.907541 C58.9340328,33.9152787 59.2980984,30.5345574 59.3809836,26.9468852 C59.6655738,14.6103607 56.5356066,4.53193443 52.3902951,4.43645902 C48.2447213,4.34072131 44.653377,14.2638689 44.3687869,26.6003934 C44.3687869,26.6003934 44.1492459,31.1000656 45.4780328,39.6152131" id="Fill-1" fill="#185A30"></path><path d="M73.5446557,53.1058361 C73.7896393,52.696918 73.9265574,52.2066885 73.9171148,51.6857705 C73.9965902,50.002623 72.8411803,48.4768525 71.2335738,48.6457705 C71.28,48.4532459 71.3104262,48.2531148 71.3222295,48.0466885 C71.4184918,46.3606557 70.2557377,44.907541 68.7249836,44.8013115 C68.6914098,44.7992131 68.6583607,44.7981639 68.6250492,44.7971148 C68.7842623,44.3787541 68.8632131,43.9116066 68.8351475,43.4166557 C68.7559344,42.0139016 67.7885902,40.832 66.5300984,40.5993443 C66.075541,40.5154098 65.634623,40.5571148 65.2309508,40.696918 C64.8495738,39.757377 64.0487869,39.060459 63.074623,38.9133115 C62.9975082,37.3878033 61.8956066,36.1321967 60.4768525,36.0338361 C59.5847869,35.9719344 58.7651148,36.3816393 58.216918,37.067541 C57.714623,36.376918 56.9437377,35.9276066 56.0650492,35.9204395 C54.7034754,35.9092459 53.5142295,37.0205902 53.3051803,38.5028197 C53.2459016,38.9238033 53.266623,39.3342951 53.3531803,39.7180328 C52.7871475,39.7899016 52.2699016,40.0519344 51.8570492,40.4461639 C51.8098361,40.4910164 51.7634098,40.5366557 51.719082,40.584918 C51.4803934,39.2556066 50.114623,37.9042623 48.8288525,37.8148197 C47.6259672,37.7314098 45.928918,38.4621639 45.4780328,39.6152131 C45.6758033,41.6259672 46.9327213,47.1071475 51.4788197,52.0241311 L51.5192131,52.0270164 C51.9575082,52.4236066 52.5298361,52.6420984 53.1399344,52.5878033 C53.5181639,52.5539672 53.8664918,52.418623 54.1665574,52.2098361 L54.2397377,52.2148197 C54.6397377,52.4925902 55.1205246,52.6379016 55.6285902,52.5927869 C55.8226885,52.5754754 56.0078689,52.5287869 56.1838689,52.4621639 C56.6192787,53.3623607 57.5902951,53.9441311 58.6740984,53.8486557 C59.5134426,53.7746885 60.2268852,53.3104262 60.6462951,52.6570492 L60.7821639,52.6664918 C61.2010492,53.0817049 61.7579016,53.323541 62.3585574,53.3054426 C62.855082,54.0566557 63.767082,54.5188197 64.7735082,54.4304262 C65.1525246,54.3971148 65.5063607,54.2874754 65.8219016,54.1214426 C66.3483279,54.7690492 67.2123279,55.1540984 68.1602623,55.0706885 C69.0974426,54.9885902 69.8890492,54.4689836 70.3197377,53.7505574 C70.7428197,54.0902295 71.272918,54.2725246 71.8358033,54.2224262 C72.3819016,54.1736393 72.8671475,53.9158033 73.2317377,53.5257705 L73.2925902,53.5299672 C73.3754754,53.4098361 73.4462951,53.2868197 73.5121311,53.1627541 C73.5137049,53.1603934 73.5150164,53.1577705 73.5163279,53.1554098 C73.5252459,53.1388852 73.5362623,53.122623 73.5446557,53.1058361" fill="#F9D320"></path><path d="M42.2090492,9.21232787 L6.56209836,12.7268197 C7.62203279,10.6709508 9.21206557,8.70662295 10.7472787,7.6957377 L45.2440656,3.18662295 C43.8793443,4.79422951 42.9272131,6.9762623 42.2090492,9.21232787 Z M45.2440656,49.5517377 L10.7472787,45.042623 C9.21206557,44.032 7.62203279,42.0674098 6.56209836,40.0118033 L42.2090492,43.5262951 C42.9272131,45.7620984 43.8793443,47.9443934 45.2440656,49.5517377 Z M5.07514754,36.5143607 C3.94885246,33.1108197 3.6,31.1323279 3.32170492,28.2992787 L39.9527869,28.7409836 C40.0427541,31.8701639 40.4668852,35.9202623 41.2031475,39.3707541 L5.07514754,36.5143607 Z M5.07514754,16.224 L41.2031475,13.3676066 C40.4668852,16.8180984 40.0427541,20.8681967 39.9527869,23.9976393 L3.32170492,24.439082 C3.6,21.6062951 3.94885246,19.627541 5.07514754,16.224 Z M56.7186885,3.84865574 C54.4333115,1.18767213 52.7926557,-0.0616393443 51.3872787,0.100721311 C51.1252459,0.134032787 11.4032787,5.67213115 11.4032787,5.67213115 C5.10006557,6.31318033 0.0624262295,15.4659672 0,26.3693115 C0.0624262295,37.2723934 5.10006557,46.4251803 11.4032787,47.0664918 C11.4032787,47.0664918 51.1997377,52.6247869 51.3872787,52.6376393 C51.7196066,52.635541 52.0477377,52.5909508 52.3711475,52.5080656 C52.0563934,52.4144262 51.7660328,52.2504918 51.5192131,52.0270164 L51.4788197,52.0241311 C46.9327213,47.1074098 45.6758033,41.6259672 45.4780328,39.6152131 C45.4785574,39.6136393 45.4796066,39.6123279 45.4801311,39.6107541 C45.4796066,39.6123279 45.4785574,39.6136393 45.4780328,39.6152131 C44.1492459,31.1000656 44.3687869,26.6003934 44.3687869,26.6003934 C44.653377,14.2638689 48.2447213,4.34072131 52.3902951,4.43619672 C56.5356066,4.53193443 59.6655738,14.6103607 59.3809836,26.9468852 C59.2980984,30.5345574 58.9340328,33.9152787 58.3596066,36.907541 C58.9497705,36.2562623 59.741377,35.9819016 60.4768525,36.0338361 C60.6121967,36.043541 60.7438689,36.0663607 60.872918,36.096 C63.3904262,22.3210492 60.7512131,8.87029508 56.7186885,3.84865574 L56.7186885,3.84865574 Z" fill="#129B47"></path></g><path d="M41.2031475,13.3676066 L5.07514754,16.224 C3.94885246,19.627541 3.6,21.6062951 3.32170492,24.439082 L39.9527869,23.997377 C40.0427541,20.8681967 40.4668852,16.8180984 41.2031475,13.3676066" fill="#FFFFFE"></path><path d="M45.2440656,3.18662295 L10.7472787,7.6957377 C9.21206557,8.70662295 7.62203279,10.6709508 6.56209836,12.7268197 L42.2090492,9.21232787 C42.9272131,6.9762623 43.8793443,4.79422951 45.2440656,3.18662295" fill="#FFFFFE"></path><path d="M6.56209836,40.011541 C7.62203279,42.0674098 9.21206557,44.032 10.7472787,45.042623 L45.2440656,49.5517377 C43.8793443,47.9443934 42.9272131,45.7620984 42.2090492,43.5262951 L6.56209836,40.011541" fill="#FFFFFE"></path><g transform="translate(3.15, 28)"><path d="M36.8052459,0.675409836 L0.174163934,0.233704918 C0.452459016,3.0664918 0.801311475,5.0452459 1.92760656,8.44878689 L38.0556066,11.3051803 C37.3193443,7.85468852 36.8952131,3.80459016 36.8052459,0.675409836" fill="#FFFFFE"></path></g></g>` },
  letterboxd: { vb: "0 0 512 512", body: `<rect width="512" height="512" rx="104" fill="#14181c"/><circle cx="144" cy="256" r="88" fill="#ff8000"/><circle cx="368" cy="256" r="88" fill="#40bcf4"/><circle cx="256" cy="256" r="88" fill="#00e054"/><g clip-path="url(#lb_cut_l)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><g clip-path="url(#lb_cut_r)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><defs><clipPath id="lb_cut_l"><circle cx="144" cy="256" r="88"/></clipPath><clipPath id="lb_cut_r"><circle cx="368" cy="256" r="88"/></clipPath></defs>` },
  runtime: { vb: "0 0 512 512", body: `<path fill="white" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/><path fill="white" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>` }
};

interface Props {
  id: RatingType;
  x: number;
  y: number;
  w: number;
  h: number;
  canvasScale: number;
  
  bg: string;
  txt: string;
  blur: number;
  alpha: number;
  radius: number;
  shadow: boolean;
  scale: number;
  borderW: number;
  borderC: string;
  icon: boolean;

  onPositionChange: (id: RatingType, x: number, y: number) => void;
}

const DraggableBadge: React.FC<Props> = ({ id, x, y, w, h, canvasScale, bg, txt, blur, radius, shadow, scale, borderW, borderC, icon, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number, mouseY: number, elemX: number, elemY: number } | null>(null);
  
  const [currentPos, setCurrentPos] = useState({ x, y });
  
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x, y });
    }
  }, [x, y, isDragging]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = { mouseX: clientX, mouseY: clientY, elemX: currentPos.x, elemY: currentPos.y };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    const { mouseX, mouseY, elemX, elemY } = dragStartRef.current;
    
    // Safety check for scale to avoid division by zero or negative
    const safeScale = Math.max(0.1, canvasScale);
    const badgeScale = scale || 1; // Default to 1 if undefined

    // Calculate delta in "canvas pixels"
    const deltaX = (clientX - mouseX) / safeScale;
    const deltaY = (clientY - mouseY) / safeScale;

    // Use badgeScale for boundary calculation
    const nextX = Math.round(Math.max(0, Math.min(elemX + deltaX, CANVAS_WIDTH - (w * badgeScale))));
    const nextY = Math.round(Math.max(0, Math.min(elemY + deltaY, CANVAS_HEIGHT - (h * badgeScale))));

    setCurrentPos({ x: nextX, y: nextY });
  };

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(id, currentPos.x, currentPos.y);
      dragStartRef.current = null;
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
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
  }, [isDragging, canvasScale, w, h, scale]);

  const onMouseDown = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); handleStart(e.clientX, e.clientY); };
  const onTouchStart = (e: React.TouchEvent) => { e.stopPropagation(); handleStart(e.touches[0].clientX, e.touches[0].clientY); };

  const renderContent = () => {
    const badgeScale = scale || 1; // Default to 1
    if (id === 'age') {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="absolute inset-0 m-2.5 border-2 rounded opacity-50" style={{ borderColor: txt }}></div>
                 <span style={{ fontSize: `${28 * badgeScale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txt }}>PG-13</span>
            </div>
        );
    }
    
    const dummyVals: Record<string, string> = { imdb: '8.7', rt: '73%', rt_popcorn: '88%', letterboxd: '4.2', meta: '74', tmdb: '85%', runtime: '2h 15m' };
    const val = dummyVals[id] || '0.0';

    if (!icon) return (
        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: `${28 * badgeScale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txt, lineHeight: 1 }}>{val}</span>
    );

    if (id === 'runtime') {
        const iconSize = 32 * badgeScale;
        const spacing = 12 * badgeScale; 
        return (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: `${spacing}px` }}>
                <svg viewBox={ICONS.runtime.vb} width={iconSize} height={iconSize} style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: ICONS.runtime.body }} color={txt}/>
                <span style={{ fontSize: `${24 * badgeScale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txt, lineHeight: 1 }}>2h 15m</span>
             </div>
        );
    }

    let iconKey: string = id;
    if (id === 'rt') iconKey = 'rt_fresh';
    if (id === 'rt_popcorn') iconKey = 'popcorn_fresh';
    
    const iconData = ICONS[iconKey] || ICONS[id];
    const iconSize = 36 * badgeScale;
    const iconLeft = 10 * badgeScale;
    const textRight = 10 * badgeScale;

    return (
        <>
            {iconData && (
                <div style={{ position: 'absolute', left: iconLeft, top: 12 * badgeScale, lineHeight: 0 }}>
                    <svg viewBox={iconData.vb} width={iconSize} height={iconSize} style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: iconData.body }} />
                </div>
            )}
            <span style={{ position: 'absolute', right: textRight, top: '50%', transform: 'translateY(-50%)', fontSize: `${28 * badgeScale}px`, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold', color: txt, lineHeight: 1 }}>{val}</span>
        </>
    );
  };

  const backgroundStyle = bg.startsWith('grad:') ? `linear-gradient(135deg, ${bg.split(':')[1]}, ${bg.split(':')[2]})` : bg;
  const badgeScale = scale || 1;

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="absolute top-0 left-0 select-none cursor-move group z-50 hover:z-[60] pointer-events-auto"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate(${currentPos.x}px, ${currentPos.y}px) scale(${badgeScale})`, 
        background: backgroundStyle,
        borderRadius: `${radius}px`,
        border: borderW > 0 ? `${borderW}px solid ${borderC}` : 'none',
        backdropFilter: `blur(${blur}px)`,
        boxShadow: shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : 'none',
        willChange: isDragging ? 'transform' : 'auto',
        touchAction: 'none',
        transformOrigin: 'top left' 
      }}
    >
      <div className="opacity-0 group-hover:opacity-100 absolute -left-8 top-1/2 -translate-y-1/2 bg-blue-600 rounded-full p-1.5 text-white transition-opacity shadow-lg" style={{ transform: `scale(${1/badgeScale})` }}>
           <GripVertical size={16} />
      </div>
      {renderContent()}
    </div>
  );
};

export default React.memo(DraggableBadge);