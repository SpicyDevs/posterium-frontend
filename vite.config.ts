import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webfontDownload from 'vite-plugin-webfont-dl';

// https://vitejs.dev/config/
export default defineConfig({
  // appType: 'spa' replaces server.historyApiFallback (removed in Vite 7).
  // It serves index.html for any unmatched route so /build works on direct load
  // in both dev server and `vite preview`.
  appType: 'spa',

  plugins: [
    react(),
    webfontDownload([
      // Only preload the subset we actually use (Plus Jakarta Sans is in
      // tailwind.config.js but never actually applied to any element —
      // removing it saves a font round-trip on first paint).
      // Keep only if the builder actively applies this family.
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap',
    ]),
  ],

  // ── esbuild options apply to ALL files (both dev and prod transforms) ──
  esbuild: {
    // Remove type-only code in production. This is safe because TypeScript
    // has already checked types at compile time.
    legalComments: 'none',      // strip copyright banners from vendor code → smaller bundles
    target: 'es2020',
    // Keep console.* calls — removing them would hide runtime warnings in prod
  },

  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    cssMinify: true,
    sourcemap: false,
    // Inline assets < 4 kB as base64 to save round-trips (default is 4096)
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      output: {
        // ── Smarter manual chunks ────────────────────────────────────
        // Rule: each vendor lib that is > ~30 kB gets its own chunk so
        // it can be cached independently from the app code.
        // The builder route is already lazy-imported in index.tsx, so
        // Rollup creates its own chunk automatically — we do not need to
        // list it here.
        manualChunks(id: string) {
          // React + ReactDOM — almost never change between deploys
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor';
          }
          // lucide-react is large (~200 kB unminified); own chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // headlessui is only used by the builder; bundle separately
          if (id.includes('node_modules/@headlessui')) {
            return 'headlessui';
          }
          // hello-pangea/dnd (drag-and-drop) — builder only
          if (id.includes('node_modules/@hello-pangea')) {
            return 'dnd';
          }
          // react-helmet-async — small, but changes with every helmet version
          if (id.includes('node_modules/react-helmet-async')) {
            return 'helmet';
          }
        },

        // Deterministic, content-addressed filenames for long-term caching
        chunkFileNames:  'assets/chunk-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',

        // Tree-shake module namespace imports more aggressively
        generatedCode: {
          constBindings: true,
        },
      },

      // Externalize nothing — we bundle everything for CF Pages (no CDN deps at runtime)
    },
  },

  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime',
    },
  },

  // ── Dev server ────────────────────────────────────────────────────────
  server: {
    // No historyApiFallback — appType: 'spa' handles it globally
  },

  // ── Dependency pre-bundling ───────────────────────────────────────────
  // Listing large deps speeds up cold dev-server starts by pre-bundling
  // them to ESM once instead of on every first import.
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
    // Exclude the builder entry so Vite doesn't eagerly bundle it during
    // dashboard-only dev sessions (it's code-split anyway).
    exclude: [],
  },
});