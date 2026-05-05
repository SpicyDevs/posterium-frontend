import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import compress from 'astro-compress';
import sitemap from '@astrojs/sitemap';
import AstroPWA from '@vite-pwa/astro';
import remarkGfm from 'remark-gfm';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: 'https://posters.spicydevs.xyz',
  output: 'static',
  trailingSlash: 'never', // Enforce no trailing slashes
  build: {
    format: 'file', // Generates about.html instead of about/index.html to prevent host-level redirects
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      serialize(item) {
        // Aggressively strip trailing slash from every URL in the sitemap
        item.url = item.url.replace(/\/$/, '');

        item.lastmod = new Date().toISOString();
        item.changefreq = 'weekly';

        // Updated conditions to match the new slash-free URLs
        // Updated conditions to match the new slash-free URLs
        if (item.url === 'https://posters.spicydevs.xyz') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (item.url === 'https://posters.spicydevs.xyz/build') {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }

        return item;
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Posterium - Posters with Ratings!',
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
            urlPattern: /^https:\/\/api\.spicydevs\.xyz\/.*/i,
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
          removeAttributeQuotes: false,
          collapseWhitespace: false,
          removeComments: true,
          minifyJS: true,
          minifyCSS: true,
        },
      },
      CSS: true,
      JS: true,
      SVG: false,
      Image: false,
    }),
  ],
  vite: {
    esbuild: {
      target: 'es2020',
      legalComments: 'none',
    },
    build: {
      chunkSizeWarningLimit: 900,
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
            if (id.includes('src/components/builder/components/PreviewCanvas')) {
              return 'builder-canvas';
            }
            if (id.includes('src/components/builder/panels/')) {
              return 'builder-panels';
            }
            if (id.includes('analytics')) {
              return 'analytics';
            }
          },
        },
      },
    },
  },
});
