// src/components/NotFound.tsx
// Router references replaced: navigate() → window.location.href
import React, { useState, useEffect, useRef } from 'react';

const DURATION = 5;
const CIRCUMFERENCE = 119.38;

const NotFound: React.FC = () => {
  const [remaining, setRemaining] = useState(DURATION);
  const [isCancelled, setIsCancelled] = useState(false);
  const circleRef = useRef<SVGCircleElement>(null);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setIsCancelled(true);
    window.location.href = path;
  };

  useEffect(() => {
    if (isCancelled) return;
    if (remaining <= 0) {
      const t = setTimeout(() => {
        window.location.href = '/';
      }, 400);
      return () => clearTimeout(t);
    }
    const timer = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, isCancelled]);

  useEffect(() => {
    if (circleRef.current) {
      const pct = Math.max(remaining / DURATION, 0);
      circleRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
    }
  }, [remaining]);

  return (
    <main
      id="main-content"
      style={{
        background: '#09090b',
        color: '#e4e4e7',
        fontFamily: 'sans-serif',
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@700;800&display=swap');
        .nf-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
        }
        .nf-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .nf-orb-1 {
          width: 500px; height: 500px;
          top: -150px; left: -100px;
          background: radial-gradient(circle, rgba(196,124,46,0.2), transparent 70%);
          animation: drift-a 8s ease-in-out infinite alternate;
        }
        .nf-orb-2 {
          width: 400px; height: 400px;
          bottom: -100px; right: -80px;
          background: radial-gradient(circle, rgba(212,162,69,0.15), transparent 70%);
          animation: drift-b 10s ease-in-out infinite alternate;
        }
        @keyframes drift-a {
          from { transform: translate(0,0); }
          to { transform: translate(40px,30px); }
        }
        @keyframes drift-b {
          from { transform: translate(0,0); }
          to { transform: translate(-30px,-20px); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nf-code  { animation: rise 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .nf-h1    { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .nf-p     { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .nf-card  { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
        .nf-acts  { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) 0.7s both; }
        .nf-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          height: 40px; padding: 0 20px; border-radius: 10px;
          background: #c47c2e; color: #070706;
          font-size: 12px; font-weight: 700; text-decoration: none;
          border: none; cursor: pointer;
          box-shadow: 0 0 24px rgba(196,124,46,0.3);
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .nf-btn-primary:hover {
          background: #d4a245;
          box-shadow: 0 0 36px rgba(196,124,46,0.5);
          transform: translateY(-1px);
        }
        .nf-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          height: 40px; padding: 0 16px; border-radius: 10px;
          background: transparent; color: #a1a1aa;
          font-size: 12px; font-weight: 600; text-decoration: none;
          border: 1px solid rgba(255,255,255,0.07);
          transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.1s;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .nf-btn-secondary:hover {
          color: #e4e4e7;
          border-color: rgba(196,124,46,0.3);
          background: rgba(196,124,46,0.05);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="nf-orb nf-orb-1" />
      <div className="nf-orb nf-orb-2" />

      <div
        className="nf-container"
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        {/* Error code */}
        <div
          className="nf-code"
          style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(96px,18vw,180px)',
            lineHeight: 1,
            letterSpacing: '0.04em',
            color: '#f0e6cc',
            position: 'relative',
          }}
          aria-label="Error 404"
        >
          <span>4</span>
          <span style={{ color: 'transparent', WebkitTextStroke: '2px #c47c2e' }}>0</span>
          <span>4</span>
        </div>

        <h1
          className="nf-h1"
          style={{
            fontSize: 'clamp(18px,3vw,22px)',
            fontWeight: 700,
            color: '#e4e4e7',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}
        >
          This reel is missing
        </h1>

        <p
          className="nf-p"
          style={{
            fontSize: 13,
            color: '#71717a',
            lineHeight: 1.6,
            maxWidth: 340,
            margin: '0 auto 36px',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or was moved.
          <br />
          Redirecting you back to the homepage.
        </p>

        {/* Countdown card */}
        <div
          className="nf-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '14px 20px',
            borderRadius: 16,
            background: 'rgba(196,124,46,0.06)',
            border: '1px solid rgba(196,124,46,0.18)',
            marginBottom: 28,
          }}
        >
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="rgba(196,124,46,0.15)"
                strokeWidth="3"
              />
              <circle
                ref={circleRef}
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="#C47C2E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset="0"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 800,
                color: '#D4A245',
              }}
            >
              {remaining}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <strong
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#D4A245',
                marginBottom: 2,
              }}
            >
              Redirecting automatically
            </strong>
            <span style={{ fontSize: 11, color: '#52525b' }}>
              Taking you home in {remaining} second{remaining !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div
          className="nf-acts"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <a href="/" className="nf-btn-primary" onClick={(e) => handleNav(e, '/')}>
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
            Go Home
          </a>
          <a href="/build" className="nf-btn-secondary" onClick={(e) => handleNav(e, '/build')}>
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
    </main>
  );
};

export default NotFound;
