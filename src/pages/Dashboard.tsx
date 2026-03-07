// src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Link } from '../Router';
import {
  Sparkles, ArrowRight, Github, Code2, Layers,
  Zap, Globe, MousePointer2, Palette, Film, Image as ImageIcon,
  Copy, Check, Star, RefreshCw, Shield, ChevronRight,
  PlayCircle, Tv, Clapperboard, Menu, X, ExternalLink,
} from 'lucide-react';

// ── API base ─────────────────────────────────────────────────────────────────
const API = 'https://api.spicydevs.xyz';

// ── Real poster configurations ───────────────────────────────────────────────
interface PosterItem {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  year: string;
  badges: string;
  badgeConfig?: string;
  accent: string;
}

const POSTERS: PosterItem[] = [
  {
    id: '155', type: 'movie', title: 'The Dark Knight', year: '2008',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=10&alpha=0.5&rad=14&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&v=2&g_scale=1.000',
    accent: '#818cf8',
  },
  {
    id: '27205', type: 'movie', title: 'Inception', year: '2010',
    badges: 'imdb,tmdb',
    badgeConfig: '&blur=8&alpha=0.45&rad=12&imdb_x=310&imdb_y=20&tmdb_x=310&tmdb_y=90&v=2&g_scale=1.000',
    accent: '#38bdf8',
  },
  {
    id: '872585', type: 'movie', title: 'Oppenheimer', year: '2023',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=12&alpha=0.4&rad=16&imdb_x=8&imdb_y=20&rt_x=8&rt_y=90&meta_x=8&meta_y=160&v=2&g_scale=1.000',
    accent: '#fb923c',
  },
  {
    id: '346698', type: 'movie', title: 'Barbie', year: '2023',
    badges: 'imdb,rt',
    badgeConfig: '&blur=8&alpha=0.5&rad=20&imdb_x=310&imdb_y=650&rt_x=310&rt_y=680&v=2&g_scale=1.000',
    accent: '#f472b6',
  },
  {
    id: '238', type: 'movie', title: 'The Godfather', year: '1972',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=6&alpha=0.55&rad=10&imdb_x=8&imdb_y=20&rt_x=8&rt_y=90&meta_x=8&meta_y=160&v=2&g_scale=1.000',
    accent: '#fbbf24',
  },
  {
    id: '634649', type: 'movie', title: 'Spider-Man: No Way Home', year: '2021',
    badges: 'imdb,rt,tmdb',
    badgeConfig: '&blur=10&alpha=0.4&rad=14&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&tmdb_x=310&tmdb_y=160&v=2&g_scale=1.000',
    accent: '#f87171',
  },
  {
    id: '1396', type: 'tv', title: 'Breaking Bad', year: '2008',
    badges: 'imdb,rt,tmdb',
    badgeConfig: '&blur=10&alpha=0.5&rad=14&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&tmdb_x=310&tmdb_y=160&v=2&g_scale=1.000',
    accent: '#4ade80',
  },
  {
    id: '66732', type: 'tv', title: 'Stranger Things', year: '2016',
    badges: 'imdb,rt',
    badgeConfig: '&blur=8&alpha=0.45&rad=12&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&v=2&g_scale=1.000',
    accent: '#c084fc',
  },
  {
    id: '1399', type: 'tv', title: 'Game of Thrones', year: '2011',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=8&alpha=0.5&rad=12&imdb_x=8&imdb_y=600&rt_x=8&rt_y=670&meta_x=8&meta_y=683&v=2&g_scale=0.900',
    accent: '#94a3b8',
  },
  {
    id: '315162', type: 'movie', title: 'Puss in Boots', year: '2022',
    badges: 'imdb,rt,tmdb',
    badgeConfig: '&blur=8&alpha=0.45&rad=14&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&tmdb_x=310&tmdb_y=160&v=2&g_scale=1.000',
    accent: '#fde68a',
  },
  {
    id: '424', type: 'movie', title: "Schindler's List", year: '1993',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=6&alpha=0.5&rad=10&imdb_x=8&imdb_y=20&rt_x=8&rt_y=90&meta_x=8&meta_y=160&v=2&g_scale=1.000',
    accent: '#a1a1aa',
  },
  {
    id: '475557', type: 'movie', title: 'Joker', year: '2019',
    badges: 'imdb,rt,meta',
    badgeConfig: '&blur=10&alpha=0.45&rad=14&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&v=2&g_scale=1.000',
    accent: '#facc15',
  },
];

// URL builder
const buildPosterUrl = (p: PosterItem, size: 'sm' | 'full' = 'sm') => {
  const ext = size === 'sm' ? 'svg' : 'png';
  return `${API}/${p.type}/${p.id}.${ext}?source=tmdb&r=${p.badges}${p.badgeConfig || ''}`;
};

// ── Intersection observer hook ────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// ── Poster Card component ─────────────────────────────────────────────────────
const PosterCard = memo<{
  poster: PosterItem;
  index: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}>(({ poster, index, size = 'md', showLabel = true }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const url = buildPosterUrl(poster, 'sm');

  const heights: Record<string, string> = { sm: 'h-40', md: 'h-52 sm:h-60', lg: 'h-64 sm:h-80' };

  return (
    <div
      className={`group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.07] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-default`}
      style={{
        animationDelay: `${index * 0.07}s`,
        boxShadow: loaded ? `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)` : undefined,
      }}
    >
      <div className={`relative w-full ${heights[size]} overflow-hidden`}>
        {!loaded && !error && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse"
            style={{
              background: `linear-gradient(135deg, #111113 0%, ${poster.accent}18 100%)`,
            }} />
        )}
        {!error ? (
          <img
            src={url}
            alt={poster.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
            className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, #111113, ${poster.accent}20)` }}>
            <Film size={24} className="text-zinc-700" />
            <span className="text-[10px] text-zinc-700">{poster.title}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
      </div>
      {showLabel && (
        <div className="absolute bottom-0 inset-x-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <p className="text-[11px] font-semibold text-white truncate">{poster.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-mono text-zinc-500">{poster.year}</span>
            <span className="text-[9px] px-1.5 py-px rounded-full font-semibold uppercase"
              style={{ background: `${poster.accent}20`, color: poster.accent }}>
              {poster.type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
PosterCard.displayName = 'PosterCard';

// ── Animated section wrapper ──────────────────────────────────────────────────
const FadeSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children, className = '', delay = 0
}) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}>
      {children}
    </div>
  );
};

// ── Badge showcase data ───────────────────────────────────────────────────────
const BADGE_DATA = [
  { id: 'imdb', label: 'IMDb', value: '8.7', color: '#F5C518', bg: 'rgba(245,197,24,0.1)', border: 'rgba(245,197,24,0.2)',
    icon: <svg viewBox="0 0 122.88 122.88" width="20" height="20"><path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/></svg> },
  { id: 'rt', label: 'Rotten Tomatoes', value: '96%', color: '#FA320A', bg: 'rgba(250,50,10,0.1)', border: 'rgba(250,50,10,0.2)',
    icon: <svg viewBox="0 0 80 80" width="20" height="20"><g transform="translate(1.33,0)"><g transform="translate(0,16.27)"><path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"/></g><path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C26.4046473,0.203485477 28.6894606,5.30821577 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"/></g></svg> },
  { id: 'meta', label: 'Metacritic', value: '74', color: '#FFBD3F', bg: 'rgba(255,189,63,0.1)', border: 'rgba(255,189,63,0.2)',
    icon: <svg viewBox="0 0 40 40" width="20" height="20"><path d="M36.978 19.49a17.49 17.49 0 1 1 0-.021" fill="#000"/><path d="m17.209 32.937 3.41-3.41-6.567-6.567c-.276-.276-.576-.622-.737-1.014-.369-.783-.53-2.004.369-2.903 1.106-1.106 2.58-.645 4.009.784l6.313 6.313 3.41-3.41-6.59-6.59c-.276-.276-.599-.691-.76-1.037-.438-.898-.415-2.027.392-2.834 1.129-1.129 2.603-.714 4.24.922l6.128 6.129 3.41-3.41L27.6 9.274c-3.364-3.364-6.52-3.249-8.686-1.083-.83.83-1.337 1.705-1.59 2.696a6.71 6.71 0 0 0-.092 2.81l-.046.047c-1.66-.691-3.549-.277-5 1.175-1.936 1.935-1.866 3.986-1.636 5.184l-.07.07-1.681-1.36-2.95 2.949c1.037.945 2.282 2.097 3.687 3.502l7.673 7.673Z" fill="#F2F2F2"/><path d="M19.982 0A20 20 0 1 0 40 20v-.024A20 20 0 0 0 19.982 0Zm-.091 4.274A15.665 15.665 0 0 1 35.57 19.921v.018A15.665 15.665 0 1 1 19.89 4.274Z" fill="#FFBD3F"/></svg> },
  { id: 'tmdb', label: 'TMDB', value: '85%', color: '#01b4e4', bg: 'rgba(1,180,228,0.1)', border: 'rgba(1,180,228,0.2)',
    icon: <svg viewBox="0 0 32 32" width="20" height="20"><rect width="32" height="32" rx="4" fill="#0d253f"/><rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tg2)"/><defs><linearGradient id="tg2" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="#90cea1"/><stop offset="1" stopColor="#01b4e4"/></linearGradient></defs></svg> },
  { id: 'letterboxd', label: 'Letterboxd', value: '4.2★', color: '#00e054', bg: 'rgba(0,224,84,0.1)', border: 'rgba(0,224,84,0.2)',
    icon: <svg viewBox="0 0 512 512" width="20" height="20"><rect width="512" height="512" rx="104" fill="#14181c"/><circle cx="144" cy="256" r="88" fill="#ff8000"/><circle cx="368" cy="256" r="88" fill="#40bcf4"/><circle cx="256" cy="256" r="88" fill="#00e054"/></svg> },
  { id: 'rt_popcorn', label: 'Audience Score', value: '88%', color: '#DB382A', bg: 'rgba(219,56,42,0.1)', border: 'rgba(219,56,42,0.2)',
    icon: <span className="text-[15px]">🍿</span> },
  { id: 'mal', label: 'MyAnimeList', value: '8.5', color: '#2e51a2', bg: 'rgba(46,81,162,0.1)', border: 'rgba(46,81,162,0.25)',
    icon: <span className="text-[13px] font-bold" style={{ color: '#2e51a2' }}>M</span> },
  { id: 'anilist', label: 'AniList', value: '87%', color: '#02a9ff', bg: 'rgba(2,169,255,0.1)', border: 'rgba(2,169,255,0.2)',
    icon: <span className="text-[13px] font-bold" style={{ color: '#02a9ff' }}>AL</span> },
  { id: 'runtime', label: 'Runtime', value: '2h 22m', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.15)',
    icon: <svg viewBox="0 0 512 512" width="20" height="20"><path fill="#a1a1aa" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/><path fill="#a1a1aa" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/></svg> },
  { id: 'age', label: 'Age Rating', value: 'PG-13', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.15)',
    icon: <span className="text-[10px] font-bold text-zinc-500">PG</span> },
];

const FEATURES = [
  { icon: <Zap size={16} />, title: 'Instant API URL', desc: 'One URL that returns a complete poster image with live rating badges embedded. Embed anywhere.', accent: '#818cf8' },
  { icon: <Globe size={16} />, title: 'Multiple Sources', desc: 'TMDB, Fanart.tv, Metahub, and IMDb. Auto-selects the best available poster.', accent: '#60a5fa' },
  { icon: <MousePointer2 size={16} />, title: 'Drag & Drop Editor', desc: 'Pixel-perfect badge positioning. Multi-select, group move, undo/redo.', accent: '#a78bfa' },
  { icon: <Palette size={16} />, title: 'Deep Customization', desc: 'Glassmorphism blur, opacity, radius, shadow, border — globally or per badge.', accent: '#c084fc' },
  { icon: <Film size={16} />, title: 'Movies, TV & Anime', desc: 'Full support for all media types including MAL and AniList score badges.', accent: '#f472b6' },
  { icon: <ImageIcon size={16} />, title: 'Any Format', desc: 'SVG for crystal clarity, PNG/JPG/WebP for universal compatibility.', accent: '#fbbf24' },
  { icon: <Shield size={16} />, title: 'Textless Posters', desc: 'Strip title text from the artwork for a clean minimal look.', accent: '#34d399' },
  { icon: <RefreshCw size={16} />, title: 'Always Fresh', desc: 'Live ratings from IMDb, RT, Metacritic, TMDB, Letterboxd, and more.', accent: '#22d3ee' },
];

const DEMO_CONFIGS = [
  {
    label: 'Minimal – Right aligned',
    poster: POSTERS[0], // Dark Knight
    desc: 'Clean glass badges stacked vertically on the right edge.',
    accent: '#818cf8',
  },
  {
    label: 'Dark – Left aligned',
    poster: POSTERS[2], // Oppenheimer
    desc: 'High-opacity dark glass, left-side layout with heavy shadow.',
    accent: '#fb923c',
  },
  {
    label: 'Vibrant – Bottom row',
    poster: POSTERS[6], // Breaking Bad
    desc: 'Row layout at the bottom with larger scale badges.',
    accent: '#4ade80',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const [posterWallLoaded, setPosterWallLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const sampleUrl = `${API}/movie/453395.png?r=imdb,rt,meta,tmdb&blur=8&alpha=0.45&rad=12&v=2&g_scale=1.000&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&tmdb_x=310&tmdb_y=230`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Smooth parallax with rAF
  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      lastY = window.scrollY;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (heroRef.current) {
            heroRef.current.style.transform = `translateY(${lastY * 0.25}px)`;
          }
          rafRef.current = 0;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPosterWallLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 overflow-x-hidden" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{`
        @keyframes floatA { 0%,100% { transform: translateY(0) rotate(-0.5deg); } 50% { transform: translateY(-14px) rotate(0.5deg); } }
        @keyframes floatB { 0%,100% { transform: translateY(-6px) rotate(0.3deg); } 50% { transform: translateY(8px) rotate(-0.3deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes posterReveal { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes ping-slow { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0; } }
        .hero-anim { animation: slideUp 0.75s cubic-bezier(0.16,1,0.3,1) both; }
        .gradient-text { background: linear-gradient(135deg, #fff 0%, #e4e4e7 35%, #a5b4fc 65%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .shimmer-text { background: linear-gradient(90deg, #52525b 0%, #d4d4d8 40%, #818cf8 60%, #52525b 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
        .dot-grid { background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 28px 28px; }
        .poster-reveal { animation: posterReveal 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .card-3d { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-3d:hover { transform: translateY(-3px) scale(1.01); }
        .glow-btn { box-shadow: 0 0 30px rgba(99,102,241,0.25), 0 4px 20px rgba(0,0,0,0.4); }
        .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.5); }
        .nav-blur { backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
        .poster-wall-item { animation: posterReveal 0.6s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 nav-blur border-b border-white/[0.06]"
        style={{ background: 'rgba(9,9,11,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-bold text-white tracking-tight">FreePosterAPI</span>
            <span className="hidden sm:flex text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-wider">v2</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {[['Features', '#features'], ['Badges', '#badges'], ['Demo', '#demo'], ['API', '#api']].map(([l, h]) => (
              <a key={l} href={h} className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all font-medium">{l}</a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/6 transition-all border border-white/[0.07]">
              <Github size={12} /> GitHub
            </a>
            <Link to="/build"
              className="glow-btn flex items-center gap-1.5 h-8 px-4 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all">
              Open Builder <ArrowRight size={11} />
            </Link>
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-all">
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#09090b] px-4 py-3 space-y-1">
            {[['Features', '#features'], ['Badges', '#badges'], ['Demo', '#demo'], ['API', '#api']].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium">
                <ChevronRight size={12} className="text-zinc-700" />{l}
              </a>
            ))}
            <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium">
              <Github size={12} className="text-zinc-700" /> GitHub
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden pt-14">
        {/* Dot grid bg */}
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        {/* Gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)' }} />
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)' }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)' }} />
        </div>

        {/* Poster wall background */}
        <div ref={heroRef} className="absolute inset-0 pointer-events-none will-change-transform" aria-hidden>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.5) 50%, rgba(9,9,11,0.95) 100%)' }} />
          {posterWallLoaded && (
            <div className="absolute inset-0 grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1 opacity-30 scale-110 -rotate-2">
              {[...POSTERS, ...POSTERS, ...POSTERS].slice(0, 36).map((p, i) => (
                <div key={`${p.id}-${i}`}
                  className="rounded overflow-hidden aspect-[2/3] bg-zinc-900 poster-wall-item"
                  style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}>
                  <img src={`${API}/${p.type}/${p.id}.svg?source=tmdb`} alt="" loading="lazy"
                    className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="hero-anim" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[11px] font-semibold text-indigo-300 mb-8">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" style={{ animation: 'ping-slow 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
              </span>
              Free & Open Source
            </div>
          </div>

          <h1 className="hero-anim text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6" style={{ animationDelay: '0.2s' }}>
            <span className="gradient-text">Movie Posters</span><br />
            <span className="text-zinc-500 font-light">with Live Ratings</span>
          </h1>

          <p className="hero-anim max-w-lg mx-auto text-[14px] sm:text-[16px] text-zinc-500 leading-relaxed mb-10" style={{ animationDelay: '0.32s' }}>
            Generate stunning posters with glassmorphism rating badges from{' '}
            <span className="text-zinc-300 font-medium">IMDb</span>,{' '}
            <span className="text-zinc-300 font-medium">Rotten Tomatoes</span>,{' '}
            <span className="text-zinc-300 font-medium">Metacritic</span>, and more — all from one API URL.
          </p>

          <div className="hero-anim flex flex-wrap items-center justify-center gap-3 mb-14" style={{ animationDelay: '0.44s' }}>
            <Link to="/build"
              className="glow-btn group flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-8 rounded-xl text-[13px] sm:text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all">
              Open Builder
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#demo"
              className="flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-[13px] sm:text-[14px] font-semibold text-zinc-300 bg-white/5 hover:bg-white/8 transition-all border border-white/[0.09] hover:border-white/15">
              <PlayCircle size={14} /> See Examples
            </a>
          </div>

          {/* Hero poster showcase row */}
          <div className="hero-anim" style={{ animationDelay: '0.55s' }}>
            <div className="flex items-end justify-center gap-2 sm:gap-3 overflow-hidden">
              {POSTERS.slice(0, 5).map((p, i) => {
                const isCenter = i === 2;
                const offsets = [-16, -8, 0, -8, -16];
                return (
                  <div key={p.id}
                    className="relative flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-105 hover:z-10"
                    style={{
                      width: isCenter ? 140 : i === 1 || i === 3 ? 110 : 80,
                      height: isCenter ? 210 : i === 1 || i === 3 ? 165 : 120,
                      marginBottom: offsets[i],
                      boxShadow: isCenter ? '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.2)' : '0 12px 40px rgba(0,0,0,0.6)',
                      animation: `${i % 2 === 0 ? 'floatA' : 'floatB'} ${3.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
                      zIndex: isCenter ? 5 : 3 - Math.abs(i - 2),
                    }}>
                    <img src={buildPosterUrl(p, 'sm')} alt={p.title} loading="lazy"
                      className="w-full h-full object-cover" />
                    {isCenter && (
                      <div className="absolute inset-0 ring-2 ring-indigo-500/40 rounded-xl pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-700">
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-zinc-700 animate-bounce" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-white/[0.05] bg-[#0d0d0f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <FadeSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-white/[0.06]">
              {[
                { v: '10+', l: 'Rating sources', icon: <Star size={14} /> },
                { v: '4', l: 'Export formats', icon: <ImageIcon size={14} /> },
                { v: '3', l: 'Media types', icon: <Film size={14} /> },
                { v: '∞', l: 'Free API calls', icon: <Zap size={14} /> },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center px-4 sm:px-6 gap-1">
                  <span className="text-zinc-700 mb-1">{s.icon}</span>
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{s.v}</span>
                  <span className="text-[11px] text-zinc-600 font-medium">{s.l}</span>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Live Previews</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Real posters. Real ratings.</h2>
              <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
                Every image below is generated by the API in real-time with live rating data.
              </p>
            </div>
          </FadeSection>

          {/* Demo tabs */}
          <FadeSection delay={100}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {DEMO_CONFIGS.map((cfg, i) => (
                <button key={i} onClick={() => setActiveDemo(i)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-[12px] font-semibold transition-all border ${activeDemo === i
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'text-zinc-600 border-white/[0.06] hover:text-zinc-300 hover:bg-white/5'}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </FadeSection>

          {/* Featured demo poster */}
          <FadeSection delay={150}>
            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">
              <div className="relative flex-shrink-0" key={`demo-${activeDemo}`}
                style={{ animation: 'posterReveal 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                  style={{ width: 'min(280px, 80vw)', aspectRatio: '2/3',
                    boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${DEMO_CONFIGS[activeDemo].poster.accent}20, 0 0 0 1px rgba(255,255,255,0.06)` }}>
                  <img
                    key={buildPosterUrl(DEMO_CONFIGS[activeDemo].poster)}
                    src={buildPosterUrl(DEMO_CONFIGS[activeDemo].poster)}
                    alt={DEMO_CONFIGS[activeDemo].poster.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Glow */}
                <div className="absolute -inset-4 rounded-3xl blur-2xl -z-10 opacity-20"
                  style={{ background: DEMO_CONFIGS[activeDemo].poster.accent }} />
              </div>

              <div className="flex-1 min-w-0 w-full">
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: DEMO_CONFIGS[activeDemo].poster.accent }}>
                    {DEMO_CONFIGS[activeDemo].label}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{DEMO_CONFIGS[activeDemo].poster.title}</h3>
                  <p className="text-[12px] text-zinc-600 mt-1">{DEMO_CONFIGS[activeDemo].desc}</p>
                </div>

                {/* Badge list */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {DEMO_CONFIGS[activeDemo].poster.badges.split(',').map(b => {
                    const bd = BADGE_DATA.find(x => x.id === b);
                    return bd ? (
                      <span key={b} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border"
                        style={{ background: bd.bg, borderColor: bd.border, color: bd.color }}>
                        <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">{bd.icon}</span>
                        {bd.label}
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Other posters */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 mb-2">More posters</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {POSTERS.slice(0, 6).filter(p => p.id !== DEMO_CONFIGS[activeDemo].poster.id).slice(0, 5).map((p, i) => (
                    <div key={p.id} className="relative rounded-lg overflow-hidden aspect-[2/3] bg-zinc-900 border border-white/[0.06] hover:scale-105 transition-transform cursor-default"
                      style={{ animationDelay: `${i * 0.06}s` }}>
                      <img src={buildPosterUrl(p, 'sm')} alt={p.title} loading="lazy"
                        className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── POSTER GALLERY GRID ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Gallery</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Endless possibilities</h2>
              <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
                Each poster is customized with different badge placements, styles, and data sources.
              </p>
            </div>
          </FadeSection>

          {/* Responsive masonry-ish grid */}
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {POSTERS.map((poster, i) => (
              <FadeSection key={poster.id} delay={i * 50} className="break-inside-avoid mb-3">
                <div className="relative rounded-xl overflow-hidden border border-white/[0.07] group card-3d"
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  }}>
                  <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                    <div className="absolute inset-0 animate-pulse"
                      style={{ background: `linear-gradient(135deg, #0d0d0f, ${poster.accent}15)` }} />
                    <img
                      src={buildPosterUrl(poster, 'sm')}
                      alt={poster.title}
                      loading="lazy"
                      className="relative w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    />
                    {/* Overlay info */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}>
                      <div className="absolute bottom-0 inset-x-0 p-3">
                        <p className="text-[11px] font-bold text-white truncate">{poster.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] text-zinc-400 font-mono">{poster.year}</span>
                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                            style={{ background: `${poster.accent}20`, color: poster.accent }}>
                            {poster.type === 'movie' ? <Film size={8} /> : <Tv size={8} />} {poster.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {poster.badges.split(',').map(b => (
                            <span key={b} className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono uppercase">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          <FadeSection delay={200}>
            <div className="mt-10 text-center">
              <Link to="/build"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-[12px] font-semibold text-indigo-300 hover:text-white border border-indigo-500/25 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all">
                Create your own poster <ArrowRight size={12} />
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Zero to poster in seconds</h2>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 20%, rgba(99,102,241,0.3) 80%, transparent)' }} />

            {[
              { step: '01', title: 'Search & Pick', desc: 'Find any movie, TV show, or anime. Posters are pulled automatically from your preferred source.', icon: <Film size={20} />, color: '#818cf8' },
              { step: '02', title: 'Design Badges', desc: 'Drag badges to position, customize glassmorphism effects, colors, and choose which ratings to show.', icon: <Layers size={20} />, color: '#c084fc' },
              { step: '03', title: 'Copy URL', desc: 'Get a single embed URL that works anywhere — Plex, Jellyfin, Notion, Discord, anywhere.', icon: <ExternalLink size={20} />, color: '#34d399' },
            ].map((item, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className="relative p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06] card-3d h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15`, color: item.color }}>
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-black font-mono text-zinc-700 tracking-wider">{item.step}</span>
                  </div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-zinc-100 mb-2">{item.title}</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed">{item.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── BADGE SHOWCASE ── */}
      <section id="badges" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Rating badges</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Every score, beautifully rendered</h2>
              <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
                Glassmorphism badges with live data. Fully customizable per badge or globally.
              </p>
            </div>
          </FadeSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {BADGE_DATA.map((badge, i) => (
              <FadeSection key={badge.id} delay={i * 40}>
                <div className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border card-3d cursor-default"
                  style={{ background: badge.bg, borderColor: badge.border }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${badge.border}` }}>
                    {badge.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-[18px] sm:text-[22px] font-black leading-tight"
                      style={{ color: badge.color }}>{badge.value}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 truncate"
                      style={{ color: badge.color, opacity: 0.7 }}>{badge.label}</p>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Controls preview */}
          <FadeSection delay={200}>
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-5">
                <Palette size={13} className="text-indigo-400" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Per-badge controls</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Glass Blur', value: '8px', pct: 70 },
                  { label: 'Opacity', value: '45%', pct: 45 },
                  { label: 'Radius', value: '12px', pct: 60 },
                  { label: 'Shadow', value: '5', pct: 50 },
                  { label: 'Border', value: '0px', pct: 5 },
                  { label: 'Scale', value: '1.0×', pct: 50 },
                ].map(ctrl => (
                  <div key={ctrl.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-zinc-600 font-medium">{ctrl.label}</span>
                      <span className="text-[10px] font-mono text-zinc-700">{ctrl.value}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800">
                      <div className="h-full rounded-full" style={{ width: `${ctrl.pct}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Everything you need</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Built for power users</h2>
            </div>
          </FadeSection>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((feat, i) => (
              <FadeSection key={i} delay={i * 40}>
                <div className="p-4 sm:p-5 rounded-xl border border-white/[0.06] bg-[#0d0d0f] card-3d group h-full">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ background: `${feat.accent}18`, color: feat.accent }}>
                    {feat.icon}
                  </div>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-zinc-200 mb-1.5">{feat.title}</h3>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{feat.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── API SECTION ── */}
      <section id="api" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
        <div className="max-w-4xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Simple API</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">One URL, infinite posters</h2>
              <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
                No auth. No rate limits. Just a URL that returns a poster with live ratings baked in.
              </p>
            </div>
          </FadeSection>

          <FadeSection delay={100}>
            <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={{ background: '#0d0d0f' }}>
              {/* Terminal header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono ml-1">GET /movie/453395.png</span>
                </div>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-white/5">
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Code */}
              <div className="p-4 sm:p-6 overflow-x-auto">
                <pre className="text-[11px] sm:text-[12px] font-mono text-zinc-400 leading-7 whitespace-pre-wrap break-all sm:break-normal">
                  <span className="text-indigo-400">https://api.spicydevs.xyz</span>
                  <span className="text-violet-400">/movie/453395.png</span>{'\n'}
                  <span className="text-zinc-700">  ?</span><span className="text-amber-400">r</span><span className="text-zinc-700">=</span><span className="text-emerald-400">imdb,rt,meta,tmdb</span>{'\n'}
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">source</span><span className="text-zinc-700">=</span><span className="text-emerald-400">tmdb</span>{'\n'}
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">blur</span><span className="text-zinc-700">=</span><span className="text-sky-400">8</span>
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">alpha</span><span className="text-zinc-700">=</span><span className="text-sky-400">0.45</span>
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">rad</span><span className="text-zinc-700">=</span><span className="text-sky-400">12</span>{'\n'}
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">imdb_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">310</span>
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">imdb_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">20</span>{'\n'}
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">rt_x</span><span className="text-zinc-700">=</span><span className="text-sky-400">310</span>
                  <span className="text-zinc-700">  &</span><span className="text-amber-400">rt_y</span><span className="text-zinc-700">=</span><span className="text-sky-400">90</span>
                </pre>
              </div>

              {/* Response */}
              <div className="border-t border-white/[0.06] px-4 sm:px-5 py-3 flex items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">200 OK</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono">Content-Type: image/png</span>
              </div>
            </div>
          </FadeSection>

          {/* Params */}
          <FadeSection delay={150}>
            <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
              {[
                { p: 'r', d: 'Comma-separated badge IDs', e: 'imdb,rt,meta,tmdb' },
                { p: 'source', d: 'Poster image source', e: 'tmdb | fanart | metahub' },
                { p: 'blur / alpha / rad', d: 'Badge glass style', e: '8 / 0.4 / 12' },
                { p: '{id}_x / {id}_y', d: 'Badge pixel position', e: 'imdb_x=310' },
                { p: 'g_scale', d: 'Global badge scale', e: '1.0' },
                { p: 'textless', d: 'Remove title text', e: '1' },
                { p: 'ptype', d: 'Poster selection type', e: 'top1 | best | random' },
                { p: 'download', d: 'Force file download', e: '(no value)' },
              ].map(p => (
                <div key={p.p} className="flex gap-3 p-3 rounded-xl bg-[#0d0d0f] border border-white/[0.06]">
                  <code className="text-[10px] sm:text-[11px] font-mono text-amber-400 flex-shrink-0 mt-0.5 leading-tight">{p.p}</code>
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500">{p.d}</p>
                    <p className="text-[10px] font-mono text-zinc-700 mt-0.5">{p.e}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection>
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Use cases</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Where people use it</h2>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: '🎬', title: 'Plex & Jellyfin', desc: 'Set custom poster art for your media server with embedded ratings so you know what to watch at a glance.', tags: ['Media Servers', 'Plex', 'Jellyfin', 'Emby'] },
              { icon: '📱', title: 'Discord Bots', desc: 'Rich movie recommendation embeds with live scores. Just use the API URL as an image in your bot responses.', tags: ['Discord', 'Bots', 'Embeds'] },
              { icon: '📋', title: 'Notion & Obsidian', desc: 'Embed live poster images in your watchlist databases and movie notes with fresh rating data.', tags: ['Notion', 'Obsidian', 'Databases'] },
              { icon: '🌐', title: 'Personal Websites', desc: "Use as a dynamic image source in your movie blog, portfolio, or review site.", tags: ['Web', 'Blogs', 'Reviews'] },
              { icon: '🤖', title: 'Automation', desc: 'Integrate with Make, Zapier, or n8n workflows to auto-generate posters for new watchlist entries.', tags: ['Make', 'Zapier', 'n8n'] },
              { icon: '🎨', title: 'Creative Projects', desc: 'Print-quality posters at any scale, or use SVG output for vector-perfect artwork.', tags: ['Print', 'Art', 'SVG', 'Design'] },
            ].map((uc, i) => (
              <FadeSection key={i} delay={i * 60}>
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06] card-3d h-full">
                  <div className="text-3xl mb-3">{uc.icon}</div>
                  <h3 className="text-[14px] font-bold text-zinc-100 mb-2">{uc.title}</h3>
                  <p className="text-[12px] text-zinc-600 leading-relaxed mb-3">{uc.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {uc.tags.map(t => (
                      <span key={t} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-600 border border-white/[0.04]">{t}</span>
                    ))}
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
        <div className="max-w-3xl mx-auto text-center">
          <FadeSection>
            <div className="relative p-8 sm:p-12 rounded-3xl border border-white/[0.08] overflow-hidden"
              style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, transparent 100%)' }}>
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent 70%)' }} />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)' }} />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/40">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to build?</h2>
                <p className="text-[13px] sm:text-[14px] text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  Design your perfect poster in the visual editor. No account required — drag, drop, and copy your URL.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/build"
                    className="glow-btn group flex items-center gap-2 h-11 sm:h-12 px-7 sm:px-8 rounded-xl text-[13px] sm:text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all">
                    Open Builder
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-[13px] sm:text-[14px] font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/8 transition-all border border-white/[0.09]">
                    <Github size={14} /> Star on GitHub <Star size={11} className="text-amber-400" />
                  </a>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.05] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={9} className="text-white" />
            </div>
            <span className="text-[12px] text-zinc-600">FreePosterAPI by{' '}
              <a href="https://spicydevs.xyz" target="_blank" rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-300 transition-colors">SpicyDevs</a>
            </span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {[
              { l: 'Builder', h: '/build', i: true },
              { l: 'GitHub', h: 'https://github.com/xdaayush/freeposterapi', i: false },
              { l: 'API Docs', h: '#api', i: false },
              { l: 'Badges', h: '#badges', i: false },
            ].map(link => link.i ? (
              <Link key={link.l} to={link.h!} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">{link.l}</Link>
            ) : (
              <a key={link.l} href={link.h} target={link.h.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">{link.l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;