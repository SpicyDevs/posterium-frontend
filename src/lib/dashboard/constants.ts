// src/lib/dashboard/constants.ts
export const API = 'https://api.spicydevs.xyz';

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
  /** Allow extra string-keyed properties for masonryLayout compatibility */
  [key: string]: unknown;
}


export const REEL_ITEMS: ReelItem[] = [
  {
    id: '155',
    type: 'movie',
    title: 'The Dark Knight',
    year: '2008',
    imdb: '9.0',
    rt: '94%',
    meta: '84',
    genre: 'Action / Thriller',
    director: 'Christopher Nolan',
    tagline: 'Why so serious?',
  },
  {
    id: '27205',
    type: 'movie',
    title: 'Inception',
    year: '2010',
    imdb: '8.8',
    rt: '87%',
    meta: '74',
    genre: 'Sci-Fi / Thriller',
    director: 'Christopher Nolan',
    tagline: 'Your mind is the scene of the crime.',
  },
  {
    id: '872585',
    type: 'movie',
    title: 'Oppenheimer',
    year: '2023',
    imdb: '8.4',
    rt: '93%',
    meta: '88',
    genre: 'Historical Drama',
    director: 'Christopher Nolan',
    tagline: 'The world forever changes.',
  },
  {
    id: '238',
    type: 'movie',
    title: 'The Godfather',
    year: '1972',
    imdb: '9.2',
    rt: '97%',
    meta: '100',
    genre: 'Crime Drama',
    director: 'Francis Ford Coppola',
    tagline: "An offer you can't refuse.",
  },
  {
    id: '157336',
    type: 'movie',
    title: 'Interstellar',
    year: '2014',
    imdb: '8.7',
    rt: '73%',
    meta: '74',
    genre: 'Sci-Fi Epic',
    director: 'Christopher Nolan',
    tagline: 'Mankind was born on Earth.',
  },
  {
    id: '680',
    type: 'movie',
    title: 'Pulp Fiction',
    year: '1994',
    imdb: '8.9',
    rt: '92%',
    meta: '94',
    genre: 'Crime Drama',
    director: 'Quentin Tarantino',
    tagline: "You won't know the facts until you've seen the fiction.",
  },
  {
    id: '278',
    type: 'movie',
    title: 'The Shawshank Redemption',
    year: '1994',
    imdb: '9.3',
    rt: '91%',
    meta: '80',
    genre: 'Drama',
    director: 'Frank Darabont',
    tagline: 'Fear can hold you prisoner. Hope can set you free.',
  },
  {
    id: '550',
    type: 'movie',
    title: 'Fight Club',
    year: '1999',
    imdb: '8.8',
    rt: '79%',
    meta: '66',
    genre: 'Drama / Thriller',
    director: 'David Fincher',
    tagline: 'Mischief. Mayhem. Soap.',
  },
  {
    id: '634649',
    type: 'movie',
    title: 'No Way Home',
    year: '2021',
    imdb: '8.2',
    rt: '90%',
    meta: '71',
    genre: 'Action / Superhero',
    director: 'Jon Watts',
    tagline: 'The multiverse unleashed.',
  },
  {
    id: '1396',
    type: 'tv',
    title: 'Breaking Bad',
    year: '2008',
    imdb: '9.5',
    rt: '96%',
    meta: '99',
    genre: 'Crime Drama',
    director: 'Vince Gilligan',
    tagline: 'Change the chemistry.',
  },
  {
    id: '424',
    type: 'movie',
    title: "Schindler's List",
    year: '1993',
    imdb: '9.0',
    rt: '98%',
    meta: '94',
    genre: 'Historical Drama',
    director: 'Steven Spielberg',
    tagline: 'Whoever saves one life, saves the world entire.',
  },
  {
    id: '1399',
    type: 'tv',
    title: 'Game of Thrones',
    year: '2011',
    imdb: '9.2',
    rt: '89%',
    meta: '80',
    genre: 'Fantasy Drama',
    director: 'David Benioff',
    tagline: 'Winter is coming.',
  },
  {
    id: '66732',
    type: 'tv',
    title: 'Stranger Things',
    year: '2016',
    imdb: '8.7',
    rt: '92%',
    meta: '76',
    genre: 'Sci-Fi Horror',
    director: 'The Duffer Brothers',
    tagline: 'The world is turning upside down.',
  },
  {
    id: '475557',
    type: 'movie',
    title: 'Joker',
    year: '2019',
    imdb: '8.4',
    rt: '69%',
    meta: '59',
    genre: 'Psychological Thriller',
    director: 'Todd Phillips',
    tagline: 'Put on a happy face.',
  },
  {
    id: '76341',
    type: 'movie',
    title: 'Mad Max: Fury Road',
    year: '2015',
    imdb: '8.1',
    rt: '97%',
    meta: '90',
    genre: 'Action / Sci-Fi',
    director: 'George Miller',
    tagline: 'What a lovely day.',
  },
  {
    id: '11',
    type: 'movie',
    title: 'Star Wars',
    year: '1977',
    imdb: '8.6',
    rt: '93%',
    meta: '90',
    genre: 'Sci-Fi Adventure',
    director: 'George Lucas',
    tagline: 'A long time ago in a galaxy far, far away.',
  },
  {
    id: '120',
    type: 'movie',
    title: 'The Fellowship of the Ring',
    year: '2001',
    imdb: '8.9',
    rt: '91%',
    meta: '92',
    genre: 'Fantasy Epic',
    director: 'Peter Jackson',
    tagline: 'The legend comes to life.',
  },
  {
    id: '346698',
    type: 'movie',
    title: 'Barbie',
    year: '2023',
    imdb: '6.9',
    rt: '88%',
    meta: '80',
    genre: 'Comedy Fantasy',
    director: 'Greta Gerwig',
    tagline: "She's everything. He's just Ken.",
  },
  {
    id: '98',
    type: 'movie',
    title: 'Gladiator',
    year: '2000',
    imdb: '8.5',
    rt: '77%',
    meta: '67',
    genre: 'Action / Drama',
    director: 'Ridley Scott',
    tagline: 'What we do in life echoes in eternity.',
  },
  {
    id: '315162',
    type: 'movie',
    title: 'Puss in Boots 2',
    year: '2022',
    imdb: '7.9',
    rt: '95%',
    meta: '73',
    genre: 'Animated Adventure',
    director: 'Joel Crawford',
    tagline: 'Nine lives. One legend.',
  },
  {
    id: '324857',
    type: 'movie',
    title: 'Spider-Man: Into the Spider-Verse',
    year: '2018',
    imdb: '8.4',
    rt: '97%',
    meta: '87',
    genre: 'Animated Superhero',
    director: 'Bob Persichetti',
    tagline: 'More than one wears the mask.',
  },
  {
    id: '19995',
    type: 'movie',
    title: 'Avatar',
    year: '2009',
    imdb: '7.9',
    rt: '82%',
    meta: '83',
    genre: 'Sci-Fi Adventure',
    director: 'James Cameron',
    tagline: 'Return to Pandora.',
  },
];

export interface Stat {
  value: string;
  label: string;
  sub: string;
  unit?: string;
}
export const STATS: Stat[] = [
  { value: '∞', label: 'Free API Calls', sub: 'No rate limits, ever', unit: '' },
  { value: '10+', label: 'Rating Sources', sub: 'IMDb · RT · Meta · TMDB · More', unit: 'src' },
  { value: '4', label: 'Export Formats', sub: 'SVG · PNG · JPG · WebP', unit: 'fmt' },
  { value: '0', label: 'Auth Required', sub: "Just a URL. That's it.", unit: '' },
];

export interface Feature {
  title: string;
  desc: string;
  tag: string;
  size: 'large' | 'medium' | 'small';
  icon: string;
  hint: string;
}
export const FEATURES: Feature[] = [
  {
    title: 'Drag-Drop Editor',
    tag: 'Editor',
    size: 'large',
    icon: '⌖',
    hint: '?imdb_x=310&imdb_y=20',
    desc: 'Pixel-perfect badge positioning with multi-select, group-move, keyboard shortcuts, and full undo/redo history. Adjust per-badge or globally - glassmorphism blur, opacity, corner radius, shadow, and border all editable live.',
  },
  {
    title: 'Instant API URL',
    tag: 'API',
    size: 'medium',
    icon: '⚡',
    hint: '?r=imdb,rt&source=tmdb',
    desc: 'One URL returns the complete poster with live ratings baked in. No authentication, no rate limits, no account. Paste the URL wherever an image is expected - Discord embed, Notion, HTML img tag, anything.',
  },
  {
    title: 'Multiple Sources',
    tag: 'Posters',
    size: 'medium',
    icon: '⊞',
    hint: '?source=tmdb|fanart|imdb',
    desc: 'TMDB, Fanart.tv, Metahub, and IMDb poster sources. Textless variants supported. Auto-selects best available art for any title. Falls back gracefully when a source is unavailable.',
  },
  {
    title: 'Live Ratings',
    tag: 'Data',
    size: 'small',
    icon: '◉',
    hint: '?r=imdb,rt,meta,tmdb,letterboxd',
    desc: 'IMDb, RT, Metacritic, TMDB, Letterboxd, MAL, AniList - always fetched fresh. Scores in the image reflect what the site shows right now, not cached data from months ago.',
  },
  {
    title: 'Movies, TV & Anime',
    tag: 'Content',
    size: 'small',
    icon: '▣',
    hint: '?type=movie|tv|anime',
    desc: 'Full media type support including TMDB movie/TV IDs, MAL anime IDs, and AniList IDs. Badge types auto-match media type - no manual switching needed.',
  },
  {
    title: 'Any Export Format',
    tag: 'Output',
    size: 'small',
    icon: '◫',
    hint: '/movie/155.svg|.png|.jpg|.webp',
    desc: 'SVG for lossless vector clarity at any resolution. PNG, JPG, and WebP for universal compatibility in platforms that block SVG sources.',
  },
  {
    title: 'Textless Posters',
    tag: 'Design',
    size: 'small',
    icon: '◻',
    hint: '?textless=1',
    desc: 'Strip title text from artwork using the textless=1 parameter for a clean, cinematic look - popular for Plex home screens and custom gallery setups.',
  },
  {
    title: 'Plex & Jellyfin Ready',
    tag: 'Servers',
    size: 'medium',
    icon: '▤',
    hint: 'Paste URL → Plex poster field',
    desc: 'Paste the API URL directly into Plex or Jellyfin as custom poster art. Live ratings update every time the poster is fetched - no manual refreshing required.',
  },
];

export interface UseCase {
  icon: string;
  title: string;
  desc: string;
  tags: string[];
  rotateHint: number;
  codeSnippet?: string;
  previewId: string;
  previewType: 'movie' | 'tv';
  previewBadges: string;
  previewPositions: string;
}
export const USE_CASES: UseCase[] = [
  {
    icon: '🖥️',
    rotateHint: -0.8,
    title: 'Plex & Jellyfin',
    tags: ['Media Servers', 'Plex', 'Jellyfin', 'Emby'],
    desc: 'Custom poster art with embedded live ratings for your self-hosted media server - paste the URL and forget it.',
    codeSnippet: 'https://api.spicydevs.xyz/movie/155.svg?r=imdb,rt',
    previewId: '155',
    previewType: 'movie',
    previewBadges: 'imdb,rt',
    previewPositions: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
  },
  {
    icon: '🤖',
    rotateHint: 0.6,
    title: 'Discord Bots',
    tags: ['Discord', 'Bots', 'Embeds'],
    desc: 'Rich movie embeds in any Discord bot. One image URL in the embed field - live scores in the art, no extra API calls from your bot.',
    codeSnippet: ".setImage('https://api.spicydevs.xyz/movie/27205.webp?r=imdb,rt,meta')",
    previewId: '27205',
    previewType: 'movie',
    previewBadges: 'imdb,rt,meta',
    previewPositions: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86&meta_x=10&meta_y=160',
  },
  {
    icon: '📋',
    rotateHint: -0.4,
    title: 'Notion & Obsidian',
    tags: ['Notion', 'Obsidian', 'Databases'],
    desc: 'Embed live poster images directly in watchlist databases and movie notes. Scores update in the image - no manual edits.',
    codeSnippet: '![poster](#)',
    previewId: '238',
    previewType: 'movie',
    previewBadges: 'imdb',
    previewPositions: 'imdb_x=10&imdb_y=12',
  },
  {
    icon: '🌐',
    rotateHint: 1.0,
    title: 'Personal Websites',
    tags: ['Web', 'Blogs', 'Reviews'],
    desc: 'Dynamic image source for your movie blog, portfolio, or review site - no backend needed. An img tag with a URL is all it takes.',
    codeSnippet: '<img src="https://api.spicydevs.xyz/movie/872585.webp?r=imdb,rt,meta">',
    previewId: '872585',
    previewType: 'movie',
    previewBadges: 'imdb,rt,meta',
    previewPositions: 'imdb_x=310&imdb_y=12&rt_x=310&rt_y=86&meta_x=310&meta_y=160',
  },
  {
    icon: '⚙️',
    rotateHint: -0.6,
    title: 'Make · Zapier · n8n',
    tags: ['Automation', 'Make', 'Zapier'],
    desc: 'Auto-generate posters for new watchlist entries via no-code automation workflows. Compose the URL from TMDB ID and pass it as an image field.',
    codeSnippet: '{{base}}/movie/{{tmdb_id}}.webp?r=imdb,rt&source=tmdb',
    previewId: '1396',
    previewType: 'tv',
    previewBadges: 'imdb,rt',
    previewPositions: 'imdb_x=310&imdb_y=12&rt_x=310&rt_y=86',
  },
  {
    icon: '🎨',
    rotateHint: 0.9,
    title: 'Print & Design',
    tags: ['Print', 'SVG', 'Art', 'Design'],
    desc: 'Print-quality vector at any scale. SVG output is lossless - import directly into Figma, Illustrator, or Affinity for print or merch layouts.',
    codeSnippet: 'curl https://api.spicydevs.xyz/movie/475557.svg?r=imdb > joker.svg',
    previewId: '475557',
    previewType: 'movie',
    previewBadges: 'imdb',
    previewPositions: 'imdb_x=10&imdb_y=12',
  },
];

export const API_PARAMS = [
  { p: 'r', d: 'Comma-separated badge IDs', e: 'imdb,rt,meta,tmdb' },
  { p: 'source', d: 'Poster source', e: 'tmdb | fanart | imdb' },
  { p: 'blur', d: 'Badge backdrop blur (px)', e: '8' },
  { p: 'alpha', d: 'Badge background opacity', e: '0.45' },
  { p: 'rad', d: 'Badge corner radius (px)', e: '12' },
  { p: '{id}_x / {id}_y', d: 'Per-badge pixel position', e: 'imdb_x=310&imdb_y=20' },
  { p: 'g_scale', d: 'Global badge scale multiplier', e: '1.0' },
  { p: 'textless', d: 'Remove title text from poster', e: '1' },
  { p: 'ptype', d: 'Poster selection strategy', e: 'top1 | best | random' },
  { p: 'download', d: 'Force file download header', e: '(no value)' },
] as const;

export const MARQUEE_TITLES = [
  'NOW SHOWING',
  'THE DARK KNIGHT',
  'INCEPTION',
  'OPPENHEIMER',
  'BREAKING BAD',
  "SCHINDLER'S LIST",
  'GAME OF THRONES',
  'JOKER',
  'NO WAY HOME',
  'STRANGER THINGS',
  'THE GODFATHER',
  'BARBIE',
  'FREE POSTER API',
  'POSTERIUM',
  'OPEN SOURCE',
  'NO ACCOUNT NEEDED',
  'NOW SHOWING',
];
