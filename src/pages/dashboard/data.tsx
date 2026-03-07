// src/pages/dashboard/data.tsx
import {
  Zap, Globe, MousePointer2, Palette, Film, Image as ImageIcon,
  Star, RefreshCw, Shield,
} from 'lucide-react';
import type { PosterItem, BadgeData, Feature, DemoConfig, UseCase, ApiParam, Stat } from './types';

// ── Posters ──────────────────────────────────────────────────────────────────

export const POSTERS: PosterItem[] = [
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

// ── Demo configs (reference POSTERS by index) ─────────────────────────────────

export const DEMO_CONFIGS: DemoConfig[] = [
  {
    label: 'Minimal – Right aligned',
    poster: POSTERS[0],
    desc: 'Clean glass badges stacked vertically on the right edge.',
    accent: '#818cf8',
  },
  {
    label: 'Dark – Left aligned',
    poster: POSTERS[2],
    desc: 'High-opacity dark glass, left-side layout with heavy shadow.',
    accent: '#fb923c',
  },
  {
    label: 'Vibrant – Bottom row',
    poster: POSTERS[6],
    desc: 'Row layout at the bottom with larger scale badges.',
    accent: '#4ade80',
  },
];

// ── Badge showcase ────────────────────────────────────────────────────────────

export const BADGE_DATA: BadgeData[] = [
  {
    id: 'imdb', label: 'IMDb', value: '8.7', color: '#F5C518',
    bg: 'rgba(245,197,24,0.1)', border: 'rgba(245,197,24,0.2)',
    icon: (
      <svg viewBox="0 0 122.88 122.88" width="20" height="20">
        <path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/>
        <path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>
      </svg>
    ),
  },
  {
    id: 'rt', label: 'Rotten Tomatoes', value: '96%', color: '#FA320A',
    bg: 'rgba(250,50,10,0.1)', border: 'rgba(250,50,10,0.2)',
    icon: (
      <svg viewBox="0 0 80 80" width="20" height="20">
        <g transform="translate(1.33,0)">
          <g transform="translate(0,16.27)">
            <path d="M77.0137759,27.0426556 C76.2423237,14.6741909 69.9521992,5.42041494 60.4876349,0.246970954 C53.7772614,-1.91634855 43.2753527,6.84780083 35.9365975,2.25825726 C35.9917012,3.90539419 35.6700415,11.940249 24.3515353,12.4063071 C25.619917,10.2247303 27.1482158,5.85360996 24.9507054,3.5233195 C20.2446473,7.74041494 17.5117012,9.32746888 8.48829876,7.23319502 C2.71103734,13.2740249 -0.562655602,21.5419087 0.08,31.8413278 C1.39120332,52.86639 21.0848133,64.8846473 40.9165145,63.6471369 C60.746888,62.4106224 78.3253112,48.0677178 77.0137759,27.0426556" fill="#FA320A"/>
          </g>
          <path d="M40.8717012,11.4648963 C44.946722,10.49361 56.6678838,11.3702905 60.4232365,16.3518672 C53.7772614,14.3492116 43.2753527,23.113361 35.9365975,18.5238174 C35.9917012,20.1709544 35.6700415,28.2058091 24.3515353,28.6718672 C25.619917,26.4902905 27.1478838,22.1191701 24.9507054,19.7888797 C19.8243983,24.3827386 17.0453112,25.8589212 5.91900415,22.8514523 C8.16929461,21.2165975 12.933444,17.6965975 17.4406639,16.1450622 C15.02639,15.0443154 12.7893776,14.3541909 9.63286307,14.8302075 C13.5193361,8.7253112 21.3540249,7.07087137 26.1878838,9.98107884 C23.2082988,6.28912863 20.8743568,3.34473029 20.8743568,3.34473029 L26.4046473,0.203485477 C28.6894606,5.30821577 30.3518672,9.02340249 30.3518672,9.02340249 C34.4657261,2.94506224 42.119834,2.38406639 45.3536929,6.69676349 C42.3926971,7.24580913 40.9434025,9.63983402 40.833527,11.4605809 L40.8717012,11.4648963" fill="#00912D"/>
        </g>
      </svg>
    ),
  },
  {
    id: 'meta', label: 'Metacritic', value: '74', color: '#FFBD3F',
    bg: 'rgba(255,189,63,0.1)', border: 'rgba(255,189,63,0.2)',
    icon: (
      <svg viewBox="0 0 40 40" width="20" height="20">
        <path d="M36.978 19.49a17.49 17.49 0 1 1 0-.021" fill="#000"/>
        <path d="m17.209 32.937 3.41-3.41-6.567-6.567c-.276-.276-.576-.622-.737-1.014-.369-.783-.53-2.004.369-2.903 1.106-1.106 2.58-.645 4.009.784l6.313 6.313 3.41-3.41-6.59-6.59c-.276-.276-.599-.691-.76-1.037-.438-.898-.415-2.027.392-2.834 1.129-1.129 2.603-.714 4.24.922l6.128 6.129 3.41-3.41L27.6 9.274c-3.364-3.364-6.52-3.249-8.686-1.083-.83.83-1.337 1.705-1.59 2.696a6.71 6.71 0 0 0-.092 2.81l-.046.047c-1.66-.691-3.549-.277-5 1.175-1.936 1.935-1.866 3.986-1.636 5.184l-.07.07-1.681-1.36-2.95 2.949c1.037.945 2.282 2.097 3.687 3.502l7.673 7.673Z" fill="#F2F2F2"/>
        <path d="M19.982 0A20 20 0 1 0 40 20v-.024A20 20 0 0 0 19.982 0Zm-.091 4.274A15.665 15.665 0 0 1 35.57 19.921v.018A15.665 15.665 0 1 1 19.89 4.274Z" fill="#FFBD3F"/>
      </svg>
    ),
  },
  {
    id: 'tmdb', label: 'TMDB', value: '85%', color: '#01b4e4',
    bg: 'rgba(1,180,228,0.1)', border: 'rgba(1,180,228,0.2)',
    icon: (
      <svg viewBox="0 0 32 32" width="20" height="20">
        <rect width="32" height="32" rx="4" fill="#0d253f"/>
        <rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tg-data)"/>
        <defs>
          <linearGradient id="tg-data" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#90cea1"/>
            <stop offset="1" stopColor="#01b4e4"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'letterboxd', label: 'Letterboxd', value: '4.2★', color: '#00e054',
    bg: 'rgba(0,224,84,0.1)', border: 'rgba(0,224,84,0.2)',
    icon: (
      <svg viewBox="0 0 512 512" width="20" height="20">
        <rect width="512" height="512" rx="104" fill="#14181c"/>
        <circle cx="144" cy="256" r="88" fill="#ff8000"/>
        <circle cx="368" cy="256" r="88" fill="#40bcf4"/>
        <circle cx="256" cy="256" r="88" fill="#00e054"/>
      </svg>
    ),
  },
  {
    id: 'rt_popcorn', label: 'Audience Score', value: '88%', color: '#DB382A',
    bg: 'rgba(219,56,42,0.1)', border: 'rgba(219,56,42,0.2)',
    icon: <span className="text-[15px]">🍿</span>,
  },
  {
    id: 'mal', label: 'MyAnimeList', value: '8.5', color: '#2e51a2',
    bg: 'rgba(46,81,162,0.1)', border: 'rgba(46,81,162,0.25)',
    icon: <span className="text-[13px] font-bold" style={{ color: '#2e51a2' }}>M</span>,
  },
  {
    id: 'anilist', label: 'AniList', value: '87%', color: '#02a9ff',
    bg: 'rgba(2,169,255,0.1)', border: 'rgba(2,169,255,0.2)',
    icon: <span className="text-[13px] font-bold" style={{ color: '#02a9ff' }}>AL</span>,
  },
  {
    id: 'runtime', label: 'Runtime', value: '2h 22m', color: '#a1a1aa',
    bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.15)',
    icon: (
      <svg viewBox="0 0 512 512" width="20" height="20">
        <path fill="#a1a1aa" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/>
        <path fill="#a1a1aa" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>
      </svg>
    ),
  },
  {
    id: 'age', label: 'Age Rating', value: 'PG-13', color: '#a1a1aa',
    bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.15)',
    icon: <span className="text-[10px] font-bold text-zinc-500">PG</span>,
  },
];

// ── Features ──────────────────────────────────────────────────────────────────

export const FEATURES: Feature[] = [
  { icon: <Zap size={16} />, title: 'Instant API URL', desc: 'One URL that returns a complete poster image with live rating badges embedded. Embed anywhere.', accent: '#818cf8' },
  { icon: <Globe size={16} />, title: 'Multiple Sources', desc: 'TMDB, Fanart.tv, Metahub, and IMDb. Auto-selects the best available poster.', accent: '#60a5fa' },
  { icon: <MousePointer2 size={16} />, title: 'Drag & Drop Editor', desc: 'Pixel-perfect badge positioning. Multi-select, group move, undo/redo.', accent: '#a78bfa' },
  { icon: <Palette size={16} />, title: 'Deep Customization', desc: 'Glassmorphism blur, opacity, radius, shadow, border — globally or per badge.', accent: '#c084fc' },
  { icon: <Film size={16} />, title: 'Movies, TV & Anime', desc: 'Full support for all media types including MAL and AniList score badges.', accent: '#f472b6' },
  { icon: <ImageIcon size={16} />, title: 'Any Format', desc: 'SVG for crystal clarity, PNG/JPG/WebP for universal compatibility.', accent: '#fbbf24' },
  { icon: <Shield size={16} />, title: 'Textless Posters', desc: 'Strip title text from the artwork for a clean minimal look.', accent: '#34d399' },
  { icon: <RefreshCw size={16} />, title: 'Always Fresh', desc: 'Live ratings from IMDb, RT, Metacritic, TMDB, Letterboxd, and more.', accent: '#22d3ee' },
];

// ── Stats ─────────────────────────────────────────────────────────────────────

export const STATS: Stat[] = [
  { v: '10+', l: 'Rating sources', icon: <Star size={14} /> },
  { v: '4',   l: 'Export formats', icon: <ImageIcon size={14} /> },
  { v: '3',   l: 'Media types',    icon: <Film size={14} /> },
  { v: '∞',   l: 'Free API calls', icon: <Zap size={14} /> },
];

// ── Use cases ─────────────────────────────────────────────────────────────────

export const USE_CASES: UseCase[] = [
  { icon: '🎬', title: 'Plex & Jellyfin', desc: 'Set custom poster art for your media server with embedded ratings so you know what to watch at a glance.', tags: ['Media Servers', 'Plex', 'Jellyfin', 'Emby'] },
  { icon: '📱', title: 'Discord Bots',    desc: 'Rich movie recommendation embeds with live scores. Just use the API URL as an image in your bot responses.', tags: ['Discord', 'Bots', 'Embeds'] },
  { icon: '📋', title: 'Notion & Obsidian', desc: 'Embed live poster images in your watchlist databases and movie notes with fresh rating data.', tags: ['Notion', 'Obsidian', 'Databases'] },
  { icon: '🌐', title: 'Personal Websites', desc: 'Use as a dynamic image source in your movie blog, portfolio, or review site.', tags: ['Web', 'Blogs', 'Reviews'] },
  { icon: '🤖', title: 'Automation',      desc: 'Integrate with Make, Zapier, or n8n workflows to auto-generate posters for new watchlist entries.', tags: ['Make', 'Zapier', 'n8n'] },
  { icon: '🎨', title: 'Creative Projects', desc: 'Print-quality posters at any scale, or use SVG output for vector-perfect artwork.', tags: ['Print', 'Art', 'SVG', 'Design'] },
];

// ── API params ────────────────────────────────────────────────────────────────

export const API_PARAMS: ApiParam[] = [
  { p: 'r',              d: 'Comma-separated badge IDs',  e: 'imdb,rt,meta,tmdb' },
  { p: 'source',         d: 'Poster image source',        e: 'tmdb | fanart | metahub' },
  { p: 'blur / alpha / rad', d: 'Badge glass style',     e: '8 / 0.4 / 12' },
  { p: '{id}_x / {id}_y', d: 'Badge pixel position',     e: 'imdb_x=310' },
  { p: 'g_scale',        d: 'Global badge scale',         e: '1.0' },
  { p: 'textless',       d: 'Remove title text',          e: '1' },
  { p: 'ptype',          d: 'Poster selection type',      e: 'top1 | best | random' },
  { p: 'download',       d: 'Force file download',        e: '(no value)' },
];