import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import compress from 'astro-compress';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';
import remarkGfm from 'remark-gfm';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import remarkRequireImageAlt from './src/lib/remark-require-image-alt.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONTENT_DIR = path.join(__dirname, 'src/content');
const COLLECTION_ROUTE_MAP = {
  install: '/installation',
  examples: '/examples',
  faq: '/faq',
  docs: '/docs',
};
const COLLECTION_PRIORITY_MAP = {
  install: 0.8,
  examples: 0.7,
  faq: 0.6,
  docs: 0.65,
};

const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|webp|avif|gif|svg)$/i;

const walkMarkdownFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath);
    return fullPath.endsWith('.md') ? [fullPath] : [];
  });
};

const extractFrontmatterAndBody = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return {
    frontmatter: match?.[1] ?? '',
    body: match?.[2] ?? content,
  };
};

const extractImagePaths = (content) => {
  const imagePaths = new Set();
  const markdownImageRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  const rawPathRegex = /\/[^\s'"`)]+\.(?:png|jpe?g|webp|avif|gif|svg)/gi;

  for (const match of content.matchAll(markdownImageRegex)) {
    const image = match[1]?.trim();
    if (image && IMAGE_EXTENSIONS.test(image)) imagePaths.add(image);
  }

  for (const match of content.matchAll(rawPathRegex)) {
    if (match[0]) imagePaths.add(match[0]);
  }

  return [...imagePaths];
};

const buildCollectionData = () => {
  return Object.keys(COLLECTION_ROUTE_MAP).reduce((acc, collection) => {
    const collectionDir = path.join(CONTENT_DIR, collection);
    const files = walkMarkdownFiles(collectionDir);
    const images = new Set(['/og-image.png']);

    files.forEach((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = extractFrontmatterAndBody(raw);
      extractImagePaths(frontmatter).forEach((image) => images.add(image));
      extractImagePaths(body).forEach((image) => images.add(image));
    });

    acc[collection] = {
      route: COLLECTION_ROUTE_MAP[collection],
      priority: COLLECTION_PRIORITY_MAP[collection],
      count: files.length,
      images: [...images],
      lastmod: undefined,
    };
    return acc;
  }, {});
};

const collectionSitemapData = buildCollectionData();

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const imageSitemapEnhancer = () => ({
  name: 'image-sitemap',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const sitemapPath = new URL('sitemap-0.xml', dir);
      if (!fs.existsSync(sitemapPath)) return;

      const xml = fs.readFileSync(sitemapPath, 'utf-8');
      const updated = xml.replace(/<url>([\s\S]*?)<\/url>/g, (fullBlock, block) => {
        const locMatch = block.match(/<loc>([^<]+)<\/loc>/);
        if (!locMatch?.[1]) return fullBlock;

        const pathname = new URL(locMatch[1]).pathname || '/';
        const collectionEntry = Object.values(collectionSitemapData).find(
          (entry) => pathname === entry.route || (pathname.startsWith(entry.route + '/'))
        );
        const images = new Set(['/og-image.png', ...(collectionEntry?.images ?? [])]);
        const imageNodes = [...images]
          .filter(Boolean)
          .map((imagePath) =>
            imagePath.startsWith('http') ? imagePath : `https://posterium.xyz${imagePath}`
          )
          .map((url) => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`)
          .join('');

        return imageNodes ? fullBlock.replace('</url>', `${imageNodes}</url>`) : fullBlock;
      });

      fs.writeFileSync(sitemapPath, updated, 'utf-8');
    },
  },
});

export default defineConfig({
  site: 'https://posterium.xyz',
  output: 'static',
  trailingSlash: 'never', // Enforce no trailing slashes
  build: {
    format: 'file', // Generates about.html instead of about/index.html to prevent host-level redirects
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  markdown: {
    remarkPlugins: [remarkGfm, remarkRequireImageAlt],
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      serialize(item) {
        // Aggressively strip trailing slash from every URL in the sitemap
        item.url = item.url.replace(/\/$/, '');
        const pathname = new URL(item.url).pathname || '/';
        const collectionEntry = Object.values(collectionSitemapData).find(
          (entry) => pathname === entry.route || (pathname.startsWith(entry.route + '/'))
        );

        item.lastmod = collectionEntry?.lastmod ?? new Date().toISOString();
        item.changefreq = 'weekly';

        if (pathname === '/') {
          item.priority = 1.0;
        } else if (pathname === '/build') {
          item.priority = 0.9;
        } else if (collectionEntry && collectionEntry.count > 0) {
          item.priority = collectionEntry.priority;
          item.changefreq = collectionEntry.route === '/faq' ? 'monthly' : 'weekly';
        } else {
          item.priority = 0.55;
          item.changefreq = 'monthly';
        }

        return item;
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Posterium: Dynamic Posters with Ratings, Genres & Cast Info',
        short_name: 'Posterium',
        description:
          'Generate custom movie and TV posters with live rating badges from IMDb, Rotten Tomatoes, Metacritic, and MORE!.',
        start_url: '/build', // Removed trailing slash here as well
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
        ],
        shortcuts: [
          {
            name: 'Try Builder',
            short_name: 'Builder',
            description: 'Open the Posterium drag-and-drop poster builder.',
            url: '/build',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Examples',
            short_name: 'Examples',
            description: 'Browse Posterium poster examples and presets.',
            url: '/examples',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'FAQ',
            short_name: 'FAQ',
            description: 'Read frequently asked questions about Posterium.',
            url: '/faq',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-image-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.posterium\.xyz\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'posterium-api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    compress({
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      },
      CSS: true,
      JS: true,
      SVG: true,
      Image: false,
    }),
    imageSitemapEnhancer(),
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    esbuild: {
      target: 'es2022',
      legalComments: 'none',
    },
    build: {
      chunkSizeWarningLimit: 400,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            if (id.includes('node_modules/@headlessui')) {
              return 'headlessui';
            }
            if (id.includes('node_modules/@hello-pangea')) {
              return 'dnd';
            }
          },
        },
      },
    },
  },
});
