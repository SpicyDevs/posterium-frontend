// src/NotFound.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from './Router';

export default function NotFound() {
  const { navigate } = useRouter();
  const [remaining, setRemaining] = useState(5);
  const [isCancelled, setIsCancelled] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (isCancelled) return;
    if (remaining <= 0) {
      setFlash(true);
      const t = setTimeout(() => navigate('/'), 400);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, isCancelled, navigate]);

  const CIRCUMFERENCE = 119.38; // 2 * Math.PI * 19
  const pct = Math.max(remaining / 5, 0);
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setIsCancelled(true);
    navigate(path);
  };

  return (
    <div
      className="not-found-container text-zinc-200 font-sans h-[100dvh] overflow-hidden relative"
      style={{ background: '#09090b' }}
    >
      <style>{`
        .not-found-container {
          --bg: #09090b; --surface: #0d0d0f; --border: rgba(255,255,255,0.07);
          --indigo: #6366f1; --violet: #7c3aed;
          --zinc-200: #e4e4e7; --zinc-400: #a1a1aa; --zinc-500: #71717a;
          --zinc-600: #52525b; --zinc-700: #3f3f46; --zinc-800: #27272a;
        }
        .not-found-container::before {
          content: ''; position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none; z-index: 0;
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
        .orb-1 {
          width: 500px; height: 500px; top: -150px; left: -100px;
          background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%);
          animation: drift-a 8s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 400px; height: 400px; bottom: -100px; right: -80px;
          background: radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%);
          animation: drift-b 10s ease-in-out infinite alternate;
        }
        @keyframes drift-a { from { transform: translate(0,0); } to { transform: translate(40px, 30px); } }
        @keyframes drift-b { from { transform: translate(0,0); } to { transform: translate(-30px, -20px); } }
        .wrapper { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
        .error-code {
          font-size: clamp(96px, 18vw, 180px); font-weight: 800; line-height: 1; letter-spacing: -0.05em;
          background: linear-gradient(135deg, #fff 0%, #e4e4e7 30%, #a5b4fc 65%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          opacity: 0; animation: rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; position: relative;
        }
        .error-code::before, .error-code::after { content: '404'; position: absolute; inset: 0; -webkit-background-clip: text; background-clip: text; }
        .error-code::before { background: linear-gradient(135deg, rgba(99,102,241,0.6), transparent); -webkit-text-fill-color: transparent; animation: glitch-a 4s infinite; }
        .error-code::after { background: linear-gradient(135deg, rgba(167,139,250,0.4), transparent); -webkit-text-fill-color: transparent; animation: glitch-b 4s infinite; }
        @keyframes glitch-a { 0%, 90%, 100% { transform: translate(0); opacity: 0; } 92% { transform: translate(-3px, 1px); opacity: 1; } 94% { transform: translate(3px, -1px); opacity: 1; } 96% { transform: translate(-2px, 0); opacity: 1; } 98% { transform: translate(0); opacity: 0; } }
        @keyframes glitch-b { 0%, 90%, 100% { transform: translate(0); opacity: 0; } 93% { transform: translate(3px, 2px); opacity: 1; } 95% { transform: translate(-3px, -1px); opacity: 1; } 97% { transform: translate(2px, 0); opacity: 1; } 99% { transform: translate(0); opacity: 0; } }
        @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .redirect-flash { position: absolute; inset: 0; background: var(--bg); opacity: 0; pointer-events: none; z-index: 100; transition: opacity 0.4s ease; }
        .redirect-flash.active { opacity: 1; pointer-events: all; }
        .progress-bar-fill { animation: drain 5s linear 0.8s forwards; transform-origin: left; }
        .film-strip { display: flex; align-items: center; gap: 6px; margin: 12px 0 20px; opacity: 0; animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s forwards; }
        .film-hole { width: 8px; height: 8px; border-radius: 2px; background: var(--zinc-700); }
        .film-frame { width: 32px; height: 22px; border-radius: 3px; border: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; }
        .film-frame svg { opacity: 0.3; }
        .countdown-card { display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-radius: 16px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); margin-bottom: 28px; opacity: 0; animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s forwards; }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 20px; border-radius: 10px; background: var(--indigo); color: #fff; font-size: 12px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; box-shadow: 0 0 24px rgba(99,102,241,0.3); transition: background 0.15s, box-shadow 0.15s, transform 0.1s; }
        .btn-primary:hover { background: #818cf8; box-shadow: 0 0 36px rgba(99,102,241,0.5); transform: translateY(-1px); }
        .btn-secondary { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 10px; background: transparent; color: var(--zinc-400); font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid var(--border); transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.1s; }
        .btn-secondary:hover { color: var(--zinc-200); border-color: rgba(255,255,255,0.15); background: rgba(255,255,255,0.04); transform: translateY(-1px); }
        .actions { opacity: 0; animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.7s forwards; }
      `}</style>

      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className={`redirect-flash ${flash ? 'active' : ''}`}></div>

      <div className="wrapper">
        <div className="error-code" aria-label="Error 404">
          404
        </div>

        <div className="film-strip" aria-hidden="true">
          <div className="film-hole"></div>
          <div className="film-frame">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14V9H5V4.5zM5 10.5h6v9H5v-9zm7 9v-9h7v9h-7z" />
            </svg>
          </div>
          <div className="film-hole"></div>
          <div className="film-hole"></div>
          <div className="film-frame">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <div className="film-hole"></div>
          <div className="film-hole"></div>
          <div className="film-frame">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14V9H5V4.5zM5 10.5h6v9H5v-9zm7 9v-9h7v9h-7z" />
            </svg>
          </div>
          <div className="film-hole"></div>
        </div>

        <h1 className="text-[clamp(18px,3vw,22px)] font-bold text-[#e4e4e7] tracking-tight mb-2.5 opacity-0 animate-[rise_0.7s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards]">
          This reel is missing
        </h1>
        <p className="text-[13px] text-[#71717a] leading-relaxed max-w-[340px] mx-auto mb-9 opacity-0 animate-[rise_0.7s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]">
          The page you're looking for doesn't exist or was moved.
          <br />
          Redirecting you back to the poster editor.
        </p>

        <div className="countdown-card">
          <div className="relative w-11 h-11 shrink-0">
            <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="rgba(99,102,241,0.15)"
                strokeWidth="3"
              />
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="var(--indigo)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="119.38"
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-[#a5b4fc] tabular-nums">
              {remaining}
            </div>
          </div>
          <div className="text-left">
            <strong className="block text-[12px] font-semibold text-[#a5b4fc] mb-0.5">
              Redirecting automatically
            </strong>
            <span className="text-[11px] text-[#52525b]">
              Taking you home in {remaining} seconds
            </span>
          </div>
        </div>

        <div className="w-full max-w-[320px] h-[2px] bg-[#27272a] rounded-full mb-8 overflow-hidden opacity-0 animate-[rise_0.5s_cubic-bezier(0.16,1,0.3,1)_0.65s_forwards]">
          <div
            className={`h-full w-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#7c3aed] ${!isCancelled ? 'progress-bar-fill' : ''}`}
            style={isCancelled ? { transform: `scaleX(${remaining / 5})` } : {}}
          ></div>
        </div>

        <div className="actions flex flex-wrap items-center justify-center gap-2.5">
          <a href="/" onClick={(e) => handleNav(e, '/')} className="btn-primary">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home Now
          </a>
          <a href="/build" onClick={(e) => handleNav(e, '/build')} className="btn-secondary">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            Open Builder
          </a>
        </div>
      </div>
    </div>
  );
}
