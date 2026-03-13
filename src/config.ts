// src/config.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH: all SEO metadata, site constants, and app-wide
// configuration live here. No other file should hardcode these values.
// ─────────────────────────────────────────────────────────────────────────────

// ── App-wide constants ────────────────────────────────────────────────────────
export const SITE_CONFIG = {
  name: 'Posterium',
  baseUrl: 'https://posters.spicydevs.xyz',
  apiBase: 'https://api.spicydevs.xyz',
  themeColor: '#C47C2E',
  locale: 'en_US',
  twitterHandle: '@spicydevs',
  github: 'https://github.com/xdaayush/freeposterapi',
  ogImageUrl: 'https://posters.spicydevs.xyz/og-image.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
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
// Every field is optional — missing fields fall back to SEO_DEFAULTS in the engine.
export interface RouteSEOMeta {
  title: string;
  description: string;
  canonical?: string;
  og?: Partial<OGMeta>;
  twitter?: Partial<TwitterMeta>;
  noindex?: boolean;
}

// ── Global fallback defaults ──────────────────────────────────────────────────
// Applied to any route not listed in ROUTE_SEO, or to any key not overridden.
export const SEO_DEFAULTS: {
  title: string;
  description: string;
  canonical: string;
  og: OGMeta;
  twitter: TwitterMeta;
} = {
  title: 'Posterium — Free Movie & TV Poster API with Rating Badges',
  description:
    'Generate custom movie and TV show posters with glassmorphism rating badges ' +
    'from IMDb, Rotten Tomatoes, Metacritic, TMDB, and more — all from a single ' +
    'API URL. Free, open source, no account required.',
  canonical: SITE_CONFIG.baseUrl,

  og: {
    type: 'website',
    url: SITE_CONFIG.baseUrl,
    title: 'Posterium — Free Movie & TV Poster API',
    description:
      'Generate custom posters with live rating badges from IMDb, RT, Meta, TMDB ' +
      'and more. Free API, no account needed.',
    image: SITE_CONFIG.ogImageUrl,
    imageWidth: SITE_CONFIG.ogImageWidth,
    imageHeight: SITE_CONFIG.ogImageHeight,
    imageAlt: 'Posterium — Movie & TV Poster API with Rating Badges',
  },

  twitter: {
    card: 'summary_large_image',
    creator: SITE_CONFIG.twitterHandle,
    title: 'Posterium — Free Movie & TV Poster API',
    description:
      'Generate custom posters with live rating badges from IMDb, RT, Meta, TMDB ' +
      'and more. Free API, no account needed.',
    image: SITE_CONFIG.ogImageUrl,
    imageAlt: 'Posterium — Movie & TV Poster API with Rating Badges',
  },
};

// ── Route dictionary ──────────────────────────────────────────────────────────
// Keys must exactly match window.location.pathname values used by the custom
// router in src/Router.tsx (pushState targets).
// Add new routes here — no other file needs to change.
export const ROUTE_SEO: Record<string, RouteSEOMeta> = {
  '/': {
    title: 'Posterium — Free Movie & TV Poster API with Rating Badges',
    description:
      'Generate custom movie and TV show posters with IMDb, Rotten Tomatoes, ' +
      'Metacritic, TMDB, Letterboxd, and MAL rating badges. Free API — no account ' +
      'required. Perfect for Plex, Jellyfin, Discord bots, Notion, and more.',
    canonical: `${SITE_CONFIG.baseUrl}/`,
    og: {
      type: 'website',
      url: `${SITE_CONFIG.baseUrl}/`,
      title: 'Posterium — Free Movie & TV Poster API with Rating Badges',
      description:
        'Generate custom posters with live rating badges from IMDb, RT, Metacritic, ' +
        'TMDB, and more. Free, open source, no account required.',
    },
    twitter: {
      title: 'Posterium — Free Movie & TV Poster API with Rating Badges',
      description:
        'Generate custom posters with live rating badges. Free API, no account needed. ' +
        'Perfect for Plex, Jellyfin, and Discord bots.',
    },
  },

  '/build': {
    title: 'Poster Builder — Posterium',
    description:
      'Drag-and-drop poster editor with real-time preview. Position rating badges ' +
      'pixel-perfectly on any movie or TV poster. Supports IMDb, Rotten Tomatoes, ' +
      'Metacritic, TMDB, Letterboxd, AniList, and more. Export as SVG, PNG, JPG, ' +
      'or WebP.',
    canonical: `${SITE_CONFIG.baseUrl}/build`,
    og: {
      type: 'website',
      url: `${SITE_CONFIG.baseUrl}/build`,
      title: 'Poster Builder — Posterium',
      description:
        'Drag-and-drop poster editor with real-time preview and live API URL ' +
        'generation. Export as SVG, PNG, JPG, or WebP.',
    },
    twitter: {
      title: 'Poster Builder — Posterium',
      description: 'Drag-and-drop poster editor with live API URL generation. Free, no account.',
    },
  },
};
