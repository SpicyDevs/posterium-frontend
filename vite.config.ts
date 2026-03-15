import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webfontDownload from 'vite-plugin-webfont-dl';

// https://vitejs.dev/config/
export default defineConfig({
  appType: 'spa',

  plugins: [
    react(),
    webfontDownload([
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap',
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

        // ── FIX: include chunk name so build output is debuggable ──
        // Old pattern `chunk-[hash].js` stripped the name, making it
        // impossible to tell which chunk was which in the build log.
        // New pattern `[name]-[hash].js` gives:
        //   react-vendor-AbCdEf.js   (react + react-dom)
        //   icons-AbCdEf.js          (lucide-react)
        //   headlessui-AbCdEf.js
        //   dnd-AbCdEf.js
        //   helmet-AbCdEf.js
        //   index-AbCdEf.js          (dashboard entry)
        // The hash still guarantees long-term cache busting.
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