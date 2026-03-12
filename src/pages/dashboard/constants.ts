// src/pages/dashboard/constants.ts

export const API = 'https://api.spicydevs.xyz';

// ── Film reel items ───────────────────────────────────────────────
export interface ReelItem {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  year: string;
  imdb: string;
  rt: string;
  meta: string;
  genre: string;
  director: string;
  tagline: string;
}

export const REEL_ITEMS: ReelItem[] = [
  { id: '155',    type: 'movie', title: 'The Dark Knight',        year: '2008', imdb: '9.0', rt: '94%', meta: '84',  genre: 'Action / Thriller',    director: 'Christopher Nolan',    tagline: 'Why so serious?' },
  { id: '27205',  type: 'movie', title: 'Inception',              year: '2010', imdb: '8.8', rt: '87%', meta: '74',  genre: 'Sci-Fi / Thriller',    director: 'Christopher Nolan',    tagline: 'Your mind is the scene of the crime.' },
  { id: '872585', type: 'movie', title: 'Oppenheimer',            year: '2023', imdb: '8.4', rt: '93%', meta: '88',  genre: 'Historical Drama',     director: 'Christopher Nolan',    tagline: 'The world forever changes.' },
  { id: '238',    type: 'movie', title: 'The Godfather',          year: '1972', imdb: '9.2', rt: '97%', meta: '100', genre: 'Crime Drama',           director: 'Francis Ford Coppola', tagline: 'An offer you can\'t refuse.' },
  { id: '634649', type: 'movie', title: 'No Way Home',            year: '2021', imdb: '8.2', rt: '90%', meta: '71',  genre: 'Action / Superhero',   director: 'Jon Watts',            tagline: 'The multiverse unleashed.' },
  { id: '1396',   type: 'tv',    title: 'Breaking Bad',           year: '2008', imdb: '9.5', rt: '96%', meta: '99',  genre: 'Crime Drama',           director: 'Vince Gilligan',       tagline: 'Change the chemistry.' },
  { id: '424',    type: 'movie', title: "Schindler's List",       year: '1993', imdb: '9.0', rt: '98%', meta: '94',  genre: 'Historical Drama',     director: 'Steven Spielberg',     tagline: 'Whoever saves one life, saves the world entire.' },
  { id: '1399',   type: 'tv',    title: 'Game of Thrones',        year: '2011', imdb: '9.2', rt: '89%', meta: '80',  genre: 'Fantasy Drama',        director: 'David Benioff',        tagline: 'Winter is coming.' },
  { id: '66732',  type: 'tv',    title: 'Stranger Things',        year: '2016', imdb: '8.7', rt: '92%', meta: '76',  genre: 'Sci-Fi Horror',        director: 'The Duffer Brothers',  tagline: 'The world is turning upside down.' },
  { id: '475557', type: 'movie', title: 'Joker',                  year: '2019', imdb: '8.4', rt: '69%', meta: '59',  genre: 'Psychological Thriller', director: 'Todd Phillips',       tagline: 'Put on a happy face.' },
  { id: '346698', type: 'movie', title: 'Barbie',                 year: '2023', imdb: '6.9', rt: '88%', meta: '80',  genre: 'Comedy Fantasy',       director: 'Greta Gerwig',         tagline: 'She\'s everything. He\'s just Ken.' },
  { id: '315162', type: 'movie', title: 'Puss in Boots 2',        year: '2022', imdb: '7.9', rt: '95%', meta: '73',  genre: 'Animated Adventure',   director: 'Joel Crawford',        tagline: 'Nine lives. One legend.' },
];

// ── Stats ─────────────────────────────────────────────────────────
export interface Stat {
  value: string;
  label: string;
  sub: string;
}

export const STATS: Stat[] = [
  { value: '10+',  label: 'Rating Sources',      sub: 'IMDb · RT · Meta · TMDB · Letterboxd' },
  { value: '4',    label: 'Export Formats',      sub: 'SVG · PNG · JPG · WebP'               },
  { value: '∞',    label: 'Free API Calls',      sub: 'No rate limits ever'                  },
  { value: '0',    label: 'Account Required',    sub: 'Just a URL — that\'s it'              },
];

// ── Features ──────────────────────────────────────────────────────
export interface Feature {
  title: string;
  desc: string;
  tag: string;
  size: 'large' | 'medium' | 'small';
}

export const FEATURES: Feature[] = [
  { title: 'Drag-Drop Editor',     tag: 'Editor',     size: 'large',  desc: 'Pixel-perfect badge positioning with multi-select, group-move, keyboard shortcuts, and full undo/redo history. Adjust per-badge or globally — glassmorphism blur, opacity, corner radius, shadow, and border all editable live.' },
  { title: 'Instant API URL',      tag: 'API',        size: 'medium', desc: 'One URL returns the complete poster with live ratings baked in. No authentication, no rate limits, no account. Just paste the URL wherever an image is expected.' },
  { title: 'Multiple Sources',     tag: 'Posters',    size: 'medium', desc: 'TMDB, Fanart.tv, Metahub, and IMDb poster sources. Textless variants supported. Auto-selects best available art.' },
  { title: 'Live Ratings',         tag: 'Data',       size: 'small',  desc: 'IMDb, RT, Metacritic, TMDB, Letterboxd, MAL, AniList — always fresh.' },
  { title: 'Movies, TV & Anime',   tag: 'Content',    size: 'small',  desc: 'Full media type support including MAL and AniList badge types.' },
  { title: 'Any Export Format',    tag: 'Output',     size: 'small',  desc: 'SVG for lossless clarity, PNG/JPG/WebP for universal compatibility.' },
  { title: 'Textless Posters',     tag: 'Design',     size: 'small',  desc: 'Strip title text from artwork for a clean, minimal look.' },
  { title: 'Plex & Jellyfin Ready', tag: 'Servers',   size: 'medium', desc: 'Copy your API URL straight into Plex or Jellyfin as custom poster art. Live ratings update automatically.' },
];

// ── Use Cases ─────────────────────────────────────────────────────
export interface UseCase {
  icon: string;
  title: string;
  desc: string;
  tags: string[];
  rotateHint: number; // slight rotation for non-AI look
}

export const USE_CASES: UseCase[] = [
  { icon: '🖥️', rotateHint: -0.8,  title: 'Plex & Jellyfin',       tags: ['Media Servers', 'Plex', 'Jellyfin', 'Emby'],  desc: 'Custom poster art with embedded live ratings for your self-hosted media server — paste the URL and forget it.' },
  { icon: '🤖', rotateHint: 0.6,   title: 'Discord Bots',           tags: ['Discord', 'Bots', 'Embeds'],                  desc: 'Rich movie embeds in any Discord bot. One image URL in the embed field — done.' },
  { icon: '📋', rotateHint: -0.4,  title: 'Notion & Obsidian',      tags: ['Notion', 'Obsidian', 'Databases'],            desc: 'Embed live poster images directly in watchlist databases and movie notes.' },
  { icon: '🌐', rotateHint: 1.0,   title: 'Personal Websites',      tags: ['Web', 'Blogs', 'Reviews'],                    desc: 'Dynamic image source for your movie blog, portfolio, or review site — no backend needed.' },
  { icon: '⚙️', rotateHint: -0.6,  title: 'Make · Zapier · n8n',   tags: ['Automation', 'Make', 'Zapier'],               desc: 'Auto-generate posters for new watchlist entries via no-code workflows. URL as image, done.' },
  { icon: '🎨', rotateHint: 0.9,   title: 'Print & Design',         tags: ['Print', 'SVG', 'Art', 'Design'],             desc: 'Print-quality vector at any scale. SVG output is lossless, crisp at any DPI.' },
];

// ── API params ────────────────────────────────────────────────────
export const API_PARAMS = [
  { p: 'r',                  d: 'Comma-separated badge IDs',      e: 'imdb,rt,meta,tmdb'    },
  { p: 'source',             d: 'Poster source',                  e: 'tmdb | fanart | imdb' },
  { p: 'blur',               d: 'Badge backdrop blur (px)',        e: '8'                    },
  { p: 'alpha',              d: 'Badge background opacity',        e: '0.45'                 },
  { p: 'rad',                d: 'Badge corner radius (px)',        e: '12'                   },
  { p: '{id}_x / {id}_y',   d: 'Per-badge pixel position',       e: 'imdb_x=310&imdb_y=20' },
  { p: 'g_scale',            d: 'Global badge scale multiplier',  e: '1.0'                  },
  { p: 'textless',           d: 'Remove title text from poster',  e: '1'                    },
  { p: 'ptype',              d: 'Poster selection strategy',      e: 'top1 | best | random' },
  { p: 'download',           d: 'Force file download header',     e: '(no value)'           },
] as const;

// ── Marquee titles ────────────────────────────────────────────────
export const MARQUEE_TITLES = [
  'NOW SHOWING', 'THE DARK KNIGHT', 'INCEPTION', 'OPPENHEIMER',
  'BREAKING BAD', "SCHINDLER'S LIST", 'GAME OF THRONES', 'JOKER',
  'NO WAY HOME', 'STRANGER THINGS', 'THE GODFATHER', 'BARBIE',
  'FREE POSTER API', 'POSTERIUM', 'OPEN SOURCE', 'NO ACCOUNT NEEDED',
  'NOW SHOWING',
];