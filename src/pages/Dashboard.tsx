// src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from '../Router';
import {
  Sparkles, ArrowRight, Github, ExternalLink, Code2, Layers,
  Zap, Globe, MousePointer2, Palette, Film, Image, Copy, Check,
  Star, RefreshCw, Shield,
} from 'lucide-react';

// ── Badge icons inline (subset for showcase) ──────────────────────────────
const SHOWCASE_BADGES = [
  {
    id: 'imdb', label: 'IMDb', value: '8.7', color: '#F5C518',
    bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.25)',
    icon: (
      <svg viewBox="0 0 122.88 122.88" width="22" height="22">
        <path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/>
        <path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>
      </svg>
    ),
  },
  {
    id: 'rt', label: 'Rotten Tomatoes', value: '96%', color: '#FA320A',
    bg: 'rgba(250,50,10,0.12)', border: 'rgba(250,50,10,0.25)',
    icon: (
      <svg viewBox="0 0 80 80" width="22" height="22">
        <g transform="translate(1.33, 0)"><g transform="translate(0, 16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C60.5414108,0.548381743 60.273195,0.925145228 59.9678008,0.791701245 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C24.0843154,12.4172614 23.9372614,12.1443983 24.1062241,11.9512033 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"/></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C60.6486307,16.6506224 60.3312863,17.2159336 59.9678008,17.0572614 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C24.0843154,28.6828216 23.9372614,28.4099585 24.1062241,28.2167635 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C5.55485477,22.753195 5.67900415,22.1679668 6.06639004,22.020249 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C18.2987552,15.8499585 19.1541909,15.6209129 19.9890456,15.4878008 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C9.28697095,14.8823237 9.05195021,14.479668 9.26639004,14.2034855 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C45.5455602,6.95302905 45.3450622,7.31751037 45.0247303,7.30987552 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"/></g>
      </svg>
    ),
  },
  {
    id: 'meta', label: 'Metacritic', value: '89', color: '#FFBD3F',
    bg: 'rgba(255,189,63,0.12)', border: 'rgba(255,189,63,0.25)',
    icon: (
      <svg viewBox="0 0 40 40" width="22" height="22">
        <path d="M36.978 19.49a17.49 17.49 0 1 1 0-.021" fill="#000"/>
        <path d="m17.209 32.937 3.41-3.41-6.567-6.567c-.276-.276-.576-.622-.737-1.014-.369-.783-.53-2.004.369-2.903 1.106-1.106 2.58-.645 4.009.784l6.313 6.313 3.41-3.41-6.59-6.59c-.276-.276-.599-.691-.76-1.037-.438-.898-.415-2.027.392-2.834 1.129-1.129 2.603-.714 4.24.922l6.128 6.129 3.41-3.41L27.6 9.274c-3.364-3.364-6.52-3.249-8.686-1.083-.83.83-1.337 1.705-1.59 2.696a6.71 6.71 0 0 0-.092 2.81l-.046.047c-1.66-.691-3.549-.277-5 1.175-1.936 1.935-1.866 3.986-1.636 5.184l-.07.07-1.681-1.36-2.95 2.949c1.037.945 2.282 2.097 3.687 3.502l7.673 7.673Z" fill="#F2F2F2"/>
        <path d="M19.982 0A20 20 0 1 0 40 20v-.024A20 20 0 0 0 19.982 0Zm-.091 4.274A15.665 15.665 0 0 1 35.57 19.921v.018A15.665 15.665 0 1 1 19.89 4.274Z" fill="#FFBD3F"/>
      </svg>
    ),
  },
  {
    id: 'tmdb', label: 'TMDB', value: '85%', color: '#01b4e4',
    bg: 'rgba(1,180,228,0.12)', border: 'rgba(1,180,228,0.25)',
    icon: (
      <svg viewBox="0 0 32 32" width="22" height="22">
        <rect width="32" height="32" rx="4" fill="#0d253f"/>
        <rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tg)"/>
        <defs><linearGradient id="tg" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="#90cea1"/><stop offset="1" stopColor="#01b4e4"/></linearGradient></defs>
      </svg>
    ),
  },
  {
    id: 'letterboxd', label: 'Letterboxd', value: '4.2★', color: '#00e054',
    bg: 'rgba(0,224,84,0.12)', border: 'rgba(0,224,84,0.25)',
    icon: (
      <svg viewBox="0 0 512 512" width="22" height="22">
        <rect width="512" height="512" rx="104" fill="#14181c"/>
        <circle cx="144" cy="256" r="88" fill="#ff8000"/>
        <circle cx="368" cy="256" r="88" fill="#40bcf4"/>
        <circle cx="256" cy="256" r="88" fill="#00e054"/>
      </svg>
    ),
  },
  {
    id: 'runtime', label: 'Runtime', value: '2h 22m', color: '#a1a1aa',
    bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.2)',
    icon: (
      <svg viewBox="0 0 512 512" width="22" height="22">
        <path fill="#a1a1aa" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/>
        <path fill="#a1a1aa" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>
      </svg>
    ),
  },
];

const FEATURES = [
  {
    icon: <Zap size={18} />, title: 'Instant API URL',
    desc: 'Generate a single URL that returns a complete poster with live rating badges. Embed anywhere.',
    accent: 'indigo',
  },
  {
    icon: <Globe size={18} />, title: 'Multiple Sources',
    desc: 'Pull posters from TMDB, Fanart.tv, Metahub, and IMDb. Auto-select the best available.',
    accent: 'blue',
  },
  {
    icon: <MousePointer2 size={18} />, title: 'Drag & Drop Editor',
    desc: 'Precisely position every badge with pixel-level drag controls. Multi-select and move groups.',
    accent: 'violet',
  },
  {
    icon: <Palette size={18} />, title: 'Deep Customization',
    desc: 'Control glassmorphism blur, opacity, radius, shadow, border, colors — globally or per badge.',
    accent: 'purple',
  },
  {
    icon: <Film size={18} />, title: 'Movies, TV & Anime',
    desc: 'Full support for movies, series, and anime with MAL and AniList score badges.',
    accent: 'pink',
  },
  {
    icon: <Image size={18} />, title: 'Any Format',
    desc: 'Export as SVG, PNG, JPG, or WebP. SVG for crystal clarity, raster for compatibility.',
    accent: 'amber',
  },
  {
    icon: <Shield size={18} />, title: 'Textless Posters',
    desc: 'Strip title text from the poster art for a clean, minimal aesthetic.',
    accent: 'emerald',
  },
  {
    icon: <RefreshCw size={18} />, title: 'Always Fresh',
    desc: 'Ratings are fetched live from IMDb, RT, Metacritic, TMDB, Letterboxd, and more.',
    accent: 'cyan',
  },
];

const accentMap: Record<string, string> = {
  indigo: 'rgba(99,102,241,0.15)',
  blue: 'rgba(59,130,246,0.15)',
  violet: 'rgba(139,92,246,0.15)',
  purple: 'rgba(168,85,247,0.15)',
  pink: 'rgba(236,72,153,0.15)',
  amber: 'rgba(245,158,11,0.15)',
  emerald: 'rgba(16,185,129,0.15)',
  cyan: 'rgba(6,182,212,0.15)',
};

const accentText: Record<string, string> = {
  indigo: '#818cf8', blue: '#60a5fa', violet: '#a78bfa',
  purple: '#c084fc', pink: '#f472b6', amber: '#fbbf24',
  emerald: '#34d399', cyan: '#22d3ee',
};

// ── Floating badge card ──────────────────────────────────────────────────────
const BadgeCard: React.FC<{
  badge: typeof SHOWCASE_BADGES[0];
  style?: React.CSSProperties;
  delay?: number;
}> = ({ badge, style, delay = 0 }) => (
  <div
    className="absolute flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl select-none pointer-events-none"
    style={{
      background: `rgba(13,13,15,0.85)`,
      border: `1px solid ${badge.border}`,
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${badge.border}`,
      animation: `floatBadge ${3.5 + delay * 0.4}s ease-in-out ${delay * 0.6}s infinite alternate`,
      ...style,
    }}
  >
    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">{badge.icon}</div>
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: badge.color, opacity: 0.7 }}>
        {badge.label}
      </div>
      <div className="text-[16px] font-bold leading-tight" style={{ color: badge.color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {badge.value}
      </div>
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      'https://api.spicydevs.xyz/movie/453395.png?r=imdb,rt,meta,tmdb&blur=8&alpha=0.45&rad=12'
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parallax subtle effect on hero
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const y = window.scrollY;
      heroRef.current.style.transform = `translateY(${y * 0.3}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans overflow-x-hidden">
      <style>{`
        @keyframes floatBadge {
          from { transform: translateY(0px) rotate(-0.5deg); }
          to   { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .hero-badge { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .fade-up { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .gradient-text {
          background: linear-gradient(135deg, #e4e4e7 0%, #ffffff 40%, #a5b4fc 70%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #71717a 0%, #e4e4e7 40%, #818cf8 60%, #71717a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .glow-indigo {
          box-shadow: 0 0 40px rgba(99,102,241,0.2), 0 0 80px rgba(99,102,241,0.08);
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          border-color: rgba(255,255,255,0.12);
        }
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .poster-glow {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(99,102,241,0.15);
        }
        .code-block {
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
        }
        .step-line::before {
          content: '';
          position: absolute;
          left: 19px;
          top: 40px;
          bottom: -24px;
          width: 1px;
          background: linear-gradient(to bottom, rgba(99,102,241,0.4), transparent);
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 md:px-6 border-b border-white/[0.06]"
        style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-white tracking-tight">FreePosterAPI</span>
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/20">v2</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Badges', href: '#badges' },
              { label: 'API', href: '#api' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors font-medium">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/6 transition-all border border-white/[0.06]">
              <Github size={13} />
              GitHub
            </a>
            <Link to="/build"
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              Open Builder
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-14 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 dot-grid opacity-60" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 60%)',
        }} />

        <div ref={heroRef} className="relative z-10 max-w-5xl mx-auto px-4 text-center will-change-transform">
          {/* Tag */}
          <div className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-300 mb-8" style={{ animationDelay: '0.1s' }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
            </span>
            Free &amp; Open Source
          </div>

          {/* Headline */}
          <h1 className="fade-up text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none mb-6" style={{ animationDelay: '0.2s' }}>
            <span className="gradient-text">Movie Posters</span>
            <br />
            <span className="text-zinc-600">with Live Ratings</span>
          </h1>

          <p className="fade-up max-w-xl mx-auto text-[15px] text-zinc-500 leading-relaxed mb-10" style={{ animationDelay: '0.35s' }}>
            Generate stunning movie and TV posters with glassmorphism rating badges from{' '}
            <span className="text-zinc-300">IMDb</span>,{' '}
            <span className="text-zinc-300">Rotten Tomatoes</span>,{' '}
            <span className="text-zinc-300">Metacritic</span>, and more — all from a single API URL.
          </p>

          {/* CTAs */}
          <div className="fade-up flex flex-wrap items-center justify-center gap-3 mb-16" style={{ animationDelay: '0.45s' }}>
            <Link to="/build"
              className="group flex items-center gap-2 h-11 px-6 rounded-xl text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/25 glow-indigo">
              Open Builder
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#api"
              className="flex items-center gap-2 h-11 px-6 rounded-xl text-[13px] font-semibold text-zinc-300 bg-white/5 hover:bg-white/8 transition-all border border-white/[0.08] hover:border-white/15">
              <Code2 size={14} />
              View API Docs
            </a>
          </div>

          {/* Poster + floating badges */}
          <div className="fade-up relative mx-auto" style={{ width: 280, height: 420, animationDelay: '0.55s' }}>
            {/* Poster card */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden poster-glow"
              style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
              {/* Simulated poster gradient */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%)',
              }} />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <div className="h-2 w-20 bg-white/20 rounded-full mb-2" />
                <div className="h-2 w-14 bg-white/12 rounded-full" />
              </div>
              {/* Decorative film grain */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              }} />
              {/* Simulated movie title text */}
              <div className="absolute top-6 left-5 right-5">
                <div className="h-2.5 w-16 rounded-full bg-white/8 mb-1.5" />
              </div>
            </div>

            {/* Floating badges */}
            <BadgeCard badge={SHOWCASE_BADGES[0]} style={{ right: -100, top: 30 }} delay={0} />
            <BadgeCard badge={SHOWCASE_BADGES[1]} style={{ right: -110, top: 120 }} delay={1} />
            <BadgeCard badge={SHOWCASE_BADGES[2]} style={{ right: -90, top: 210 }} delay={2} />
            <BadgeCard badge={SHOWCASE_BADGES[3]} style={{ left: -110, top: 60 }} delay={3} />
            <BadgeCard badge={SHOWCASE_BADGES[4]} style={{ left: -120, top: 160 }} delay={1.5} />
            <BadgeCard badge={SHOWCASE_BADGES[5]} style={{ left: -95, top: 260 }} delay={0.5} />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-700 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-zinc-700" />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-white/[0.06] bg-[#0d0d0f]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-white/[0.06]">
            {[
              { value: '10+', label: 'Rating sources' },
              { value: '4', label: 'Export formats' },
              { value: '3', label: 'Media types' },
              { value: '∞', label: 'Free API calls' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center text-center px-4">
                <span className="text-3xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-[11px] text-zinc-600 mt-1 font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-white">From zero to poster in seconds</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01', title: 'Pick your media',
                desc: 'Search for any movie, TV show, or anime. We fetch the best available poster from your preferred source.',
                icon: <Film size={18} />, color: '#818cf8',
              },
              {
                step: '02', title: 'Design your badges',
                desc: 'Choose which ratings to show, drag them into position, and customize every visual detail.',
                icon: <Layers size={18} />, color: '#c084fc',
              },
              {
                step: '03', title: 'Copy the URL',
                desc: 'Get a single API URL that generates your poster on the fly. Embed it anywhere — Plex, Jellyfin, Discord.',
                icon: <ExternalLink size={18} />, color: '#34d399',
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col">
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 left-full w-8 h-px bg-gradient-to-r from-white/10 to-transparent z-10" />
                )}
                <div className="p-5 rounded-2xl bg-[#0d0d0f] border border-white/[0.06] card-hover h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${item.color}20`, color: item.color }}>
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-zinc-700">{item.step}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BADGE SHOWCASE ── */}
      <section id="badges" className="py-24 px-4 bg-[#0a0a0c]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">Rating badges</p>
            <h2 className="text-3xl font-bold text-white mb-4">Every score, beautifully rendered</h2>
            <p className="text-[13px] text-zinc-600 max-w-md mx-auto">
              Glassmorphism badges with live data from the biggest rating platforms.
              Fully customizable per badge or globally.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            {SHOWCASE_BADGES.map(badge => (
              <div key={badge.id}
                className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-default"
                style={{
                  background: badge.bg,
                  borderColor: badge.border,
                  backdropFilter: 'blur(12px)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${badge.border}` }}>
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider truncate"
                    style={{ color: badge.color, opacity: 0.8 }}>{badge.label}</p>
                  <p className="text-[20px] font-bold leading-tight"
                    style={{ color: badge.color }}>{badge.value}</p>
                </div>
              </div>
            ))}

            {/* Anime specific */}
            {[
              { id: 'mal', label: 'MyAnimeList', value: '8.5', color: '#2e51a2', bg: 'rgba(46,81,162,0.12)', border: 'rgba(46,81,162,0.3)' },
              { id: 'anilist', label: 'AniList', value: '87%', color: '#02a9ff', bg: 'rgba(2,169,255,0.12)', border: 'rgba(2,169,255,0.25)' },
              { id: 'age', label: 'Age Rating', value: 'PG-13', color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.2)' },
            ].map(badge => (
              <div key={badge.id}
                className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-default"
                style={{ background: badge.bg, borderColor: badge.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${badge.border}` }}>
                  <span className="text-[13px] font-bold" style={{ color: badge.color }}>
                    {badge.id === 'age' ? 'PG' : badge.id === 'mal' ? 'M' : 'AL'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider truncate"
                    style={{ color: badge.color, opacity: 0.8 }}>{badge.label}</p>
                  <p className="text-[20px] font-bold leading-tight"
                    style={{ color: badge.color }}>{badge.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Badge controls preview */}
          <div className="mt-10 p-5 rounded-2xl bg-[#0d0d0f] border border-white/[0.06]">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">Per-badge controls</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Glass Blur', value: '8px', width: '70%' },
                { label: 'Opacity', value: '45%', width: '45%' },
                { label: 'Corner Radius', value: '12px', width: '60%' },
                { label: 'Drop Shadow', value: '5', width: '50%' },
                { label: 'Border Width', value: '0px', width: '5%' },
                { label: 'Scale', value: '1.0×', width: '50%' },
              ].map(ctrl => (
                <div key={ctrl.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-500 font-medium">{ctrl.label}</span>
                    <span className="text-[10px] font-mono text-zinc-600">{ctrl.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
                      style={{ width: ctrl.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold text-white">Built for power users</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((feat, i) => (
              <div key={i}
                className="p-4 rounded-xl border border-white/[0.06] bg-[#0d0d0f] card-hover group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: accentMap[feat.accent], color: accentText[feat.accent] }}>
                  {feat.icon}
                </div>
                <h3 className="text-[12px] font-semibold text-zinc-200 mb-1.5">{feat.title}</h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API SECTION ── */}
      <section id="api" className="py-24 px-4 bg-[#0a0a0c]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mb-3">Simple API</p>
            <h2 className="text-3xl font-bold text-white mb-4">One URL, infinite posters</h2>
            <p className="text-[13px] text-zinc-600 max-w-md mx-auto">
              No authentication required. No rate limits. Just a URL that returns a poster image.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{ background: 'rgba(13,13,15,0.95)' }}>
            {/* Code header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-[10px] text-zinc-600 font-mono ml-2">GET /movie/453395.png</span>
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-white/5">
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Code body */}
            <div className="p-5">
              <pre className="text-[12px] code-block text-zinc-400 leading-7 whitespace-pre-wrap break-all">
                <span className="text-indigo-400">https://api.spicydevs.xyz</span>
                <span className="text-violet-400">/movie/453395.png</span>
                {'\n'}
                <span className="text-zinc-700">  ?</span><span className="text-amber-400">r</span><span className="text-zinc-700">=</span><span className="text-emerald-400">imdb,rt,meta,tmdb</span>
                {'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">source</span><span className="text-zinc-700">=</span><span className="text-emerald-400">tmdb</span>
                {'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">blur</span><span className="text-zinc-700">=</span><span className="text-sky-400">8</span>
                <span className="text-zinc-700">  &</span><span className="text-amber-400">alpha</span><span className="text-zinc-700">=</span><span className="text-sky-400">0.45</span>
                <span className="text-zinc-700">  &</span><span className="text-amber-400">rad</span><span className="text-zinc-700">=</span><span className="text-sky-400">12</span>
                {'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">imdb_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">340</span>
                <span className="text-zinc-700">  &</span><span className="text-amber-400">imdb_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">20</span>
                {'\n'}
                <span className="text-zinc-700">  &</span><span className="text-amber-400">rt_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">340</span>
                <span className="text-zinc-700">  &</span><span className="text-amber-400">rt_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">90</span>
              </pre>
            </div>

            {/* Response preview */}
            <div className="border-t border-white/[0.06] px-5 py-4 flex items-center gap-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">200 OK</span>
              <span className="text-[11px] text-zinc-600 font-mono">Content-Type: image/png</span>
            </div>
          </div>

          {/* Param docs */}
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {[
              { param: 'r', desc: 'Comma-separated badge IDs to show', example: 'imdb,rt,meta,tmdb' },
              { param: 'source', desc: 'Poster image source', example: 'tmdb | fanart | metahub' },
              { param: 'blur / alpha / rad', desc: 'Badge glass style', example: '8 / 0.4 / 12' },
              { param: '{id}_x / {id}_y', desc: 'Badge pixel position on poster', example: 'imdb_x=340' },
              { param: 'g_scale', desc: 'Global badge scale multiplier', example: '1.0' },
              { param: 'textless', desc: 'Remove title text from poster', example: '1' },
            ].map(p => (
              <div key={p.param} className="flex gap-3 p-3.5 rounded-xl bg-[#0d0d0f] border border-white/[0.06]">
                <code className="text-[11px] font-mono text-amber-400 flex-shrink-0 mt-0.5">{p.param}</code>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-500">{p.desc}</p>
                  <p className="text-[10px] font-mono text-zinc-700 mt-0.5">{p.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 rounded-3xl border border-white/[0.08] overflow-hidden"
            style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 50%, transparent 100%)' }}>
            {/* Decorative orb */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
              <Sparkles size={22} className="text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">Ready to build?</h2>
            <p className="text-[14px] text-zinc-500 mb-8 max-w-md mx-auto leading-relaxed">
              Open the visual editor and design your perfect poster in minutes.
              No account required — just drag, drop, and copy your URL.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/build"
                className="group flex items-center gap-2 h-11 px-7 rounded-xl text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/25">
                Open Builder
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 h-11 px-6 rounded-xl text-[13px] font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/8 transition-all border border-white/[0.08]">
                <Github size={14} />
                Star on GitHub
                <Star size={11} className="text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={9} className="text-white" />
            </div>
            <span className="text-[12px] text-zinc-600 font-medium">
              FreePosterAPI by{' '}
              <a href="https://spicydevs.xyz" target="_blank" rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors">SpicyDevs</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Builder', href: '/build', internal: true },
              { label: 'GitHub', href: 'https://github.com/xdaayush/freeposterapi' },
              { label: 'API Docs', href: '#api' },
            ].map(link =>
              link.internal ? (
                <Link key={link.label} to={link.href!}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.href} target={link.href?.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;