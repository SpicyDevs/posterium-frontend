// src/lib/config.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH: all SEO metadata, site constants, and app-wide
// configuration live here. No other file should hardcode these values.
// ─────────────────────────────────────────────────────────────────────────────

// ── App-wide constants ────────────────────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'Posterium',
  baseUrl: 'https://posters.spicydevs.xyz',
  apiBase: 'https://api.spicydevs.xyz',
  themeColor: '#0a0a0a',
  locale: 'en_US',
  twitterHandle: '@spicydevs',
  github: 'https://github.com/xdaayush/freeposterapi',
  ogImageUrl: 'https://posters.spicydevs.xyz/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  author: 'SpicyDevs',
  authorUrl: 'https://spicydevs.xyz',
} as const;

// ── Shared sub-types ──────────────────────────────────────────────────────────
export interface OGMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  type: 'website' | 'article';
}

export interface TwitterMeta {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  creator: string;
}

// ── Per-route override shape ──────────────────────────────────────────────────
export interface RouteSEOMeta {
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
  og?: Partial<OGMeta>;
  twitter?: Partial<TwitterMeta>;
  noindex?: boolean;
  jsonLd?: object[];
}

// ── Global fallback defaults ──────────────────────────────────────────────────
export const SEO_DEFAULTS: {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  og: OGMeta;
  twitter: TwitterMeta;
} = {
  title: 'Posterium - Posters with Ratings!',
  description:
    'Generate custom movie and TV show posters with rating badges ' +
    'from IMDb, Rotten Tomatoes, Metacritic and more! All from a single ' +
    'API URL. Free, open source, no account required.',
  keywords:
    'movie poster generator, rating posters, posterium, rpdb, top poster api,IMDB badge, Rotten Tomatoes badge, ' +
    'Metacritic badge, TMDB poster, free poster API, Plex custom poster, ' +
    'ratings, posters, plex, emby, stremio, kodi, jellyfin, imdb, rotten tomatoes, metacritic, letterboxd, rating poster db, rating poster database", movie rating overlay, poster with ratings',
  canonical: SITE_CONFIG.baseUrl,

  og: {
    type: 'website',
    url: SITE_CONFIG.baseUrl,
    title: 'Posterium - Posters with Ratings!',
    description:
      'Generate custom posters with live rating badges from IMDb, RT, Metacritic ' +
      'and more! Free API, no account needed.',
    image: SITE_CONFIG.ogImageUrl,
    imageWidth: SITE_CONFIG.ogImageWidth,
    imageHeight: SITE_CONFIG.ogImageHeight,
    imageAlt: 'Posterium - Movie & TV Poster API with Rating Badges',
  },

  twitter: {
    card: 'summary_large_image',
    creator: SITE_CONFIG.twitterHandle,
    title: 'Posterium - Posters with Ratings!',
    description:
      'Generate custom posters with live rating badges from IMDb, RT, Metacritic ' +
      'and more! Free API, no account needed.',
    image: SITE_CONFIG.ogImageUrl,
    imageAlt: 'Posterium - Movie & TV Poster API with Rating Badges',
  },
};

// ── Reusable JSON-LD schemas ──────────────────────────────────────────────────
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SpicyDevs',
  url: SITE_CONFIG.authorUrl,
  sameAs: [SITE_CONFIG.github],
};

// REPLACE YOUR SOFTWARE_APP_SCHEMA WITH THIS:
const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Posterium',
  alternateName: ['Free Poster API', 'Movie Poster Generator', 'Rating Poster Generator'],
  url: `${SITE_CONFIG.baseUrl}/`,
  applicationCategory: 'MultimediaApplication',
  applicationSubCategory: 'Photo Editing',
  operatingSystem: 'Web Browser',
  browserRequirements: 'Requires JavaScript. Requires a modern browser.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Organization', name: 'SpicyDevs', url: SITE_CONFIG.authorUrl },
  description:
    'Free online movie and TV poster generator with live rating badges from IMDb, ' +
    'Rotten Tomatoes, Metacritic, TMDB, Letterboxd, and more. No account required.',
  screenshot: SITE_CONFIG.ogImageUrl,
  softwareVersion: '2.0',
  inLanguage: 'en',
  isAccessibleForFree: true,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '128',
    bestRating: '5',
    worstRating: '1'
  },
  featureList: [
    'Live IMDb rating badges',
    'Rotten Tomatoes score overlays',
    'Metacritic score badges',
    'TMDB rating display',
    'Letterboxd rating badges',
    'MAL and AniList anime ratings',
    'Drag-and-drop poster editor',
    'SVG, PNG, JPG, WebP export',
    'Plex and Jellyfin compatible',
    'No account or API key required',
  ],
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Posterium',
  url: `${SITE_CONFIG.baseUrl}/`,
  description:
    'Free movie and TV poster generator with live IMDb, Rotten Tomatoes, and Metacritic rating badges.',
  publisher: { '@type': 'Organization', name: 'SpicyDevs', url: SITE_CONFIG.authorUrl },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_CONFIG.baseUrl}/build?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const HOME_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Posterium?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Posterium is a free, open-source API and visual editor that generates movie and TV show posters with live rating badges from IMDb, Rotten Tomatoes, Metacritic, TMDB, Letterboxd, MAL, and AniList. No account or API key is required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Posterium API free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Posterium is completely free with no rate limits. You can generate unlimited posters using a simple URL without creating an account.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I use Posterium with Plex or Jellyfin?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Paste the Posterium API URL directly into the custom poster field in Plex or Jellyfin. The poster will update automatically with live ratings each time it is fetched.',
      },
    },
    {
      '@type': 'Question',
      name: 'What rating sources does Posterium support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Posterium supports IMDb, Rotten Tomatoes, Metacritic, TMDB, Letterboxd, MyAnimeList (MAL), and AniList ratings. You can display multiple badges on a single poster.',
      },
    },
    {
      '@type': 'Question',
      name: 'What image formats can Posterium export?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Posterium can export posters in SVG (lossless vector), PNG, JPG, and WebP formats. SVG is ideal for Plex and Jellyfin, while PNG and JPG work universally.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Posterium support anime posters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Posterium supports anime posters with MAL (MyAnimeList) and AniList rating badges, in addition to standard movie and TV show posters.',
      },
    },
  ],
};

// ── Route dictionary ──────────────────────────────────────────────────────────
export const ROUTE_SEO: Record<string, RouteSEOMeta> = {
  '/': {
    title: 'Posterium - Free Movie & TV Poster Generator with Live Ratings',
    description:
      'Generate custom movie and TV show posters with IMDb, Rotten Tomatoes, ' +
      'Metacritic, TMDB, Letterboxd, and MAL rating badges. Free API - no account ' +
      'required. Perfect for Plex, Jellyfin, Discord bots, Notion, and more.',
    keywords:
    'movie poster generator, rating posters, posterium, rpdb, top poster api,IMDB badge, Rotten Tomatoes badge, ' +
    'Metacritic badge, TMDB poster, free poster API, Plex custom poster, ' +
    'ratings, posters, plex, emby, stremio, kodi, jellyfin, imdb, rotten tomatoes, metacritic, letterboxd, rating poster db, rating poster database", movie rating overlay, poster with ratings, rating poster database alternative',
    canonical: `${SITE_CONFIG.baseUrl}/`,
    og: {
      type: 'website',
      url: `${SITE_CONFIG.baseUrl}/`,
      title: 'Posterium - Free Movie & TV Poster Generator with Live Ratings',
      description:
        'Generate custom posters with live rating badges from IMDb, RT, Metacritic, ' +
        'TMDB, and more. Free, open source, no account required.',
    },
    twitter: {
      title: 'Posterium - Free Movie & TV Poster API with Rating Badges',
      description:
        'Generate custom posters with live rating badges. Free API, no account needed. ' +
        'Perfect for Plex, Jellyfin, and Discord bots.',
    },
    jsonLd: [ORGANIZATION_SCHEMA, SOFTWARE_APP_SCHEMA, WEBSITE_SCHEMA, HOME_FAQ_SCHEMA],
  },

  '/build': {
    title: 'Poster Builder - Drag & Drop Editor | Posterium',
    description:
      'Drag-and-drop poster editor with real-time preview. Position rating badges ' +
      'pixel-perfectly on any movie or TV poster. Supports IMDb, Rotten Tomatoes, ' +
      'Metacritic, TMDB, Letterboxd, AniList, and more. Export as SVG, PNG, JPG, or WebP.',
    keywords:
      'poster editor, drag drop poster builder, movie poster editor online, ' +
      'IMDb badge position, rating badge editor, custom poster builder, ' +
      'free poster editor, movie poster designer, TV poster creator, ' +
      'export poster SVG PNG, Plex poster builder, Jellyfin poster editor',
    canonical: `${SITE_CONFIG.baseUrl}/build`,
    og: {
      type: 'website',
      url: `${SITE_CONFIG.baseUrl}/build`,
      title: 'Poster Builder - Drag & Drop Editor | Posterium',
      description:
        'Drag-and-drop poster editor with real-time preview and live API URL ' +
        'generation. Export as SVG, PNG, JPG, or WebP.',
    },
    twitter: {
      title: 'Poster Builder - Drag & Drop Editor | Posterium',
      description: 'Drag-and-drop poster editor with live API URL generation. Free, no account.',
    },
    jsonLd: [
      ORGANIZATION_SCHEMA,
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Posterium Poster Builder',
        url: `${SITE_CONFIG.baseUrl}/build`,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web Browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author: { '@type': 'Organization', name: 'SpicyDevs', url: SITE_CONFIG.authorUrl },
        description:
          'Visual drag-and-drop editor for building custom movie and TV posters with ' +
          'live rating badge overlays. Real-time preview with instant API URL export.',
        isAccessibleForFree: true,
        featureList: [
          'Drag-and-drop badge positioning',
          'Real-time poster preview',
          'Per-badge styling controls',
          'Undo/redo history',
          'Keyboard shortcuts',
          'API URL generation',
          'Multiple export formats',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Posterium Home', item: `${SITE_CONFIG.baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Poster Builder', item: `${SITE_CONFIG.baseUrl}/build` },
        ],
      },
    ],
  },
};
