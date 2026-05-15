// src/lib/config.ts
// Shared site-wide constants and fallback SEO defaults only. Page-specific SEO
// metadata lives with the pages/content that owns it.

export const SITE_CONFIG = {
  name: 'Posterium',
  baseUrl: 'https://posterium.xyz',
  apiBase: 'https://api.spicydevs.xyz',
  themeColor: '#0a0a0a',
  locale: 'en_US',
  twitterHandle: '',
  github: 'https://github.com/SpicyDevs',
  ogImageUrl: 'https://posterium.xyz/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  author: 'SpicyDevs',
  authorUrl: 'https://spicydevs.js.org',
} as const;

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

export const SEO_DEFAULTS: {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  og: OGMeta;
  twitter: TwitterMeta;
} = {
  title: 'Posterium - Posters with Ratings!',
  description:
    'Generate custom movie and TV show posters with rating badges ' +
    'from IMDb, Rotten Tomatoes, Metacritic and more! All from a single ' +
    'API URL. Free, open source, no account required.',
  keywords:
    'movie poster generator, rating posters, posterium, rpdb, top poster api, IMDB badge, Rotten Tomatoes badge, ' +
    'Metacritic badge, TMDB poster, free poster API, Plex custom poster, ' +
    'ratings, posters, plex, emby, stremio, kodi, jellyfin, imdb, rotten tomatoes, metacritic, letterboxd, rating poster db, movie rating overlay, poster with ratings',
  canonical: SITE_CONFIG.baseUrl,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

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
