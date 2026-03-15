import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webfontDownload from 'vite-plugin-webfont-dl';

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',

  plugins: [
    react(),
    // Both font URLs are downloaded at build time (and proxied in dev mode)
    // so all fonts are served from the same origin — no Google CDN round-trip,
    // no DNS lookup, no TLS negotiation, and no FOUT even on slow connections.
    //
    // The plugin rewrites the <link> in index.html to point at local /assets/
    // paths automatically; no manual changes to index.html are needed.
    webfontDownload([
      // Builder fonts (Plus Jakarta Sans)
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap',
      // Dashboard fonts — display=block keeps the existing no-swap contract;
      // serving locally means the block period is essentially zero on cache.
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=block',
    ]),
  ],

  esbuild: {
    legalComments: 'none',
    target: 'es2020',
  },

  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    cssMinify: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      output: {
        manualChunks(id: string) {
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
          if (id.includes('node_modules/react-helmet-async')) {
            return 'helmet';
          }
        },

        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',

        generatedCode: { constBindings: true },
      },
    },
  },

  server: {},

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'lucide-react',
      '@headlessui/react',
      '@hello-pangea/dnd',
      'react-helmet-async',
      'clsx',
    ],
    exclude: [],
  },

  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime',
    },
  },
});