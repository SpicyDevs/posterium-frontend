// src/pages/dashboard/components/LiveAPIDemo.tsx
// Interactive API parameter builder — left: controls, right: live poster preview.
// Debounced: 500ms after last param change before firing the API request.
import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { API, REEL_ITEMS } from '../constants';
import { AmberTag } from './primitives';

// ── Badge config ──────────────────────────────────────────────────
interface BadgeCfg {
  id: string;
  label: string;
  short: string;
  color: string;
  borderColor: string;
  bg: string;
  x: number;
  y: number;
}

const BADGES: BadgeCfg[] = [
  { id: 'imdb', label: 'IMDb',        short: 'IMDb', color: '#D4A245', borderColor: 'rgba(196,124,46,0.55)', bg: 'rgba(196,124,46,0.12)', x: 310, y: 20  },
  { id: 'rt',   label: 'Rotten Tomatoes', short: 'RT', color: '#DC4040', borderColor: 'rgba(168,32,24,0.45)', bg: 'rgba(168,32,24,0.12)',  x: 310, y: 90  },
  { id: 'meta', label: 'Metacritic',  short: 'Meta', color: '#8aaaee', borderColor: 'rgba(60,100,200,0.38)', bg: 'rgba(60,100,200,0.12)', x: 310, y: 160 },
  { id: 'tmdb', label: 'TMDB',        short: 'TMDB', color: '#3cb371', borderColor: 'rgba(60,179,113,0.38)', bg: 'rgba(60,179,113,0.12)', x: 310, y: 230 },
];

// ── Slider sub-component ──────────────────────────────────────────
const Slider = memo<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}>(({ label, value, min, max, step, suffix = '', onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span
        className="mono-font"
        style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {label}
      </span>
      <span
        className="mono-font"
        style={{ fontSize: 9, color: 'var(--film-amber)', letterSpacing: '0.08em' }}
      >
        {value}{suffix}
      </span>
    </div>
    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
      {/* Track background */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'rgba(255,255,255,0.06)', borderRadius: 1,
        }}
      />
      {/* Filled portion */}
      <div
        style={{
          position: 'absolute', left: 0,
          width: `${((value - min) / (max - min)) * 100}%`,
          height: 2, background: 'var(--film-amber)', borderRadius: 1,
          transition: 'width 0.08s linear',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer', margin: 0,
        }}
      />
    </div>
  </div>
));
Slider.displayName = 'Slider';

// ── Main demo ─────────────────────────────────────────────────────
const LiveAPIDemo = memo(() => {
  const [movie,        setMovie]        = useState(REEL_ITEMS[0]);
  const [active,       setActive]       = useState<Set<string>>(new Set(['imdb', 'rt']));
  const [blur,         setBlur]         = useState(8);
  const [alpha,        setAlpha]        = useState(0.45);
  const [radius,       setRadius]       = useState(12);
  const [imgLoaded,    setImgLoaded]    = useState(false);
  const [imgError,     setImgError]     = useState(false);
  const [displayUrl,   setDisplayUrl]   = useState('');
  const [liveUrl,      setLiveUrl]      = useState('');
  const [copied,       setCopied]       = useState(false);
  const [loading,      setLoading]      = useState(false);

  const toggleBadge = useCallback((id: string) => {
    setActive(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setImgLoaded(false);
  }, []);

  // Build URL from current params — memoised
  const builtUrl = useMemo(() => {
    const badges = BADGES.filter(b => active.has(b.id));
    if (badges.length === 0) return `${API}/${movie.type}/${movie.id}.svg?source=tmdb`;
    const r = badges.map(b => b.id).join(',');
    const pos = badges.map(b => `${b.id}_x=${b.x}&${b.id}_y=${b.y}`).join('&');
    return `${API}/${movie.type}/${movie.id}.svg?r=${r}&source=tmdb&blur=${blur}&alpha=${alpha}&rad=${radius}&${pos}`;
  }, [movie, active, blur, alpha, radius]);

  // Keep live URL (shown in the URL bar) updated immediately
  useEffect(() => { setLiveUrl(builtUrl); }, [builtUrl]);

  // Debounce the actual image load by 500ms to avoid firing on every tick
  useEffect(() => {
    setLoading(true);
    setImgLoaded(false);
    setImgError(false);
    const t = setTimeout(() => { setDisplayUrl(builtUrl); }, 500);
    return () => clearTimeout(t);
  }, [builtUrl]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(liveUrl).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = liveUrl;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [liveUrl]);

  const handleMovieChange = useCallback((id: string) => {
    const found = REEL_ITEMS.find(r => r.id === id);
    if (found) { setMovie(found); setImgLoaded(false); }
  }, []);

  return (
    <section
      id="api"
      aria-label="Interactive API Demo"
      style={{
        background: 'var(--film-black)',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(196,124,46,0.07)',
      }}
    >
      {/* Subtle amber watermark */}
      <div
        aria-hidden="true"
        className="poster-font"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%) rotate(-8deg)',
          fontSize: 'clamp(120px,24vw,320px)',
          color: 'rgba(196,124,46,0.016)',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
        }}
      >
        DARKROOM
      </div>

      {/* Section header */}
      <div
        style={{
          padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,64px) 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 40,
          position: 'relative', zIndex: 2,
        }}
      >
        <div>
          <AmberTag style={{ marginBottom: 12 }}>Interactive Demo</AmberTag>
          <h2
            className="poster-font"
            style={{
              fontSize: 'clamp(40px,6vw,80px)',
              color: 'var(--film-cream)',
              lineHeight: 0.9, letterSpacing: '0.02em', marginTop: 10,
            }}
          >
            THE DARKROOM
          </h2>
          <p
            className="syne-font"
            style={{
              fontSize: 12, color: 'var(--film-silver)',
              marginTop: 14, lineHeight: 1.65, maxWidth: 400,
            }}
          >
            Tune every parameter. The poster preview is a live{' '}
            <code className="mono-font" style={{ color: 'var(--film-amber)', fontSize: 11 }}>GET</code>{' '}
            to the API — no mock, no screenshot.
          </p>
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(54,162,64,0.08)',
            border: '1px solid rgba(54,162,64,0.22)',
            padding: '7px 14px', borderRadius: 4,
            alignSelf: 'flex-start',
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#36A240',
              animation: 'amber-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            className="mono-font"
            style={{ fontSize: 9, color: '#36A240', letterSpacing: '0.14em', fontWeight: 700 }}
          >
            LIVE API
          </span>
        </div>
      </div>

      {/* Main split panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'clamp(260px,35%,400px) 1fr',
          position: 'relative', zIndex: 2,
        }}
      >
        {/* ── LEFT: Controls panel ── */}
        <div
          style={{
            borderRight: '1px solid rgba(196,124,46,0.1)',
            borderTop: '1px solid rgba(196,124,46,0.1)',
            background: 'rgba(14,13,11,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Panel label */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span
              className="mono-font"
              style={{ fontSize: 8, color: 'rgba(196,124,46,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              Parameter Controls
            </span>
            <span
              className="mono-font"
              style={{ fontSize: 7, color: 'rgba(122,117,110,0.4)', letterSpacing: '0.1em' }}
            >
              {active.size} badge{active.size !== 1 ? 's' : ''} active
            </span>
          </div>

          <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Movie selector */}
            <div>
              <div
                className="mono-font"
                style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9 }}
              >
                01 / TITLE
              </div>
              <select
                value={movie.id}
                onChange={e => handleMovieChange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--film-cream)',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 11, fontWeight: 600,
                  padding: '9px 12px',
                  borderRadius: 4, cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23C47C2E'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'calc(100% - 12px) center',
                  paddingRight: 30,
                }}
              >
                {REEL_ITEMS.map(r => (
                  <option key={r.id} value={r.id} style={{ background: '#0E0D0B' }}>
                    {r.title} ({r.year})
                  </option>
                ))}
              </select>
            </div>

            {/* Badge toggles */}
            <div>
              <div
                className="mono-font"
                style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 9 }}
              >
                02 / BADGES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BADGES.map(b => {
                  const on = active.has(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBadge(b.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        background: on ? b.bg : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${on ? b.borderColor : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 4, padding: '8px 12px',
                        transition: 'background 0.2s, border-color 0.2s',
                      }}
                    >
                      {/* Toggle indicator */}
                      <div
                        style={{
                          width: 14, height: 14, borderRadius: 3,
                          border: `1.5px solid ${on ? b.color : 'rgba(255,255,255,0.15)'}`,
                          background: on ? b.color : 'transparent',
                          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        {on && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3l2 2 4-4" stroke="#070706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span
                        className="syne-font"
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: on ? b.color : 'var(--film-silver)',
                          transition: 'color 0.15s',
                        }}
                      >
                        {b.label}
                      </span>
                      <span
                        className="mono-font"
                        style={{
                          marginLeft: 'auto', fontSize: 8,
                          color: on ? b.color : 'rgba(122,117,110,0.35)',
                          letterSpacing: '0.1em', opacity: 0.7,
                          transition: 'color 0.15s',
                        }}
                      >
                        ?r=…{b.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div>
              <div
                className="mono-font"
                style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}
              >
                03 / GLASS STYLE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Slider label="blur"   value={blur}   min={0}   max={24}  step={1}    suffix="px"  onChange={setBlur} />
                <Slider label="alpha"  value={alpha}  min={0}   max={1}   step={0.05} suffix=""    onChange={setAlpha} />
                <Slider label="radius" value={radius} min={0}   max={32}  step={1}    suffix="px"  onChange={setRadius} />
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Live preview ── */}
        <div
          style={{
            borderTop: '1px solid rgba(196,124,46,0.1)',
            background: '#070706',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Preview toolbar */}
          <div
            style={{
              padding: '10px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.015)',
            }}
          >
            {['#BF3028','#C47C2E','#36A240'].map((c, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
            <span
              className="mono-font"
              style={{ fontSize: 9, color: 'rgba(122,117,110,0.4)', marginLeft: 6, letterSpacing: '0.08em' }}
            >
              Preview — {movie.type}/{movie.id}.svg
            </span>
            {loading && !imgLoaded && (
              <span style={{ marginLeft: 'auto', color: 'var(--film-amber)', animation: 'reel-spin 0.8s linear infinite', display: 'inline-block' }}>
                <RefreshCw size={11} />
              </span>
            )}
          </div>

          {/* Image container */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(20px,4vw,48px)',
              minHeight: 380,
              position: 'relative',
            }}
          >
            {/* Loading shimmer behind image */}
            {!imgLoaded && !imgError && (
              <div
                style={{
                  position: 'absolute',
                  width: 'min(260px, 60%)', aspectRatio: '2/3',
                  background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.6s linear infinite',
                  borderRadius: 6,
                }}
              />
            )}

            {displayUrl && (
              <img
                key={displayUrl}
                src={displayUrl}
                alt={`Live preview: ${movie.title}`}
                onLoad={() => { setImgLoaded(true); setLoading(false); }}
                onError={() => { setImgError(true); setLoading(false); }}
                style={{
                  width: 'min(260px, 60%)', aspectRatio: '2/3',
                  objectFit: 'cover', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(196,124,46,0.06)',
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />
            )}

            {imgError && (
              <div
                style={{
                  width: 'min(260px, 60%)', aspectRatio: '2/3',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 6, background: '#151310',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 32, opacity: 0.3 }}>🎞</span>
                <span className="mono-font" style={{ fontSize: 9, color: 'rgba(122,117,110,0.5)' }}>LOAD ERROR</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URL bar */}
      <div
        style={{
          borderTop: '1px solid rgba(196,124,46,0.1)',
          background: 'rgba(9,8,6,0.95)',
          padding: '12px clamp(16px,3vw,28px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'relative', zIndex: 2,
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: 8, color: 'rgba(54,162,64,0.7)',
            letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
          }}
        >
          GET
        </span>
        <div
          style={{
            flex: 1, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 4, padding: '6px 10px',
          }}
        >
          <code
            className="mono-font"
            style={{
              fontSize: 9, color: 'var(--film-silver)',
              whiteSpace: 'nowrap', letterSpacing: '0.03em',
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: '#7a8ef0' }}>https://api.spicydevs.xyz</span>
            <span style={{ color: 'var(--film-amber)' }}>
              {liveUrl.replace('https://api.spicydevs.xyz', '')}
            </span>
          </code>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', cursor: 'pointer',
            border: '1px solid rgba(196,124,46,0.22)',
            color: copied ? '#36A240' : 'var(--film-amber)',
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '6px 12px', borderRadius: 4,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy URL'}
        </button>
      </div>
    </section>
  );
});
LiveAPIDemo.displayName = 'LiveAPIDemo';

export default LiveAPIDemo;