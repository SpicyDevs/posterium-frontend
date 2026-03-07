import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webfontDownload from 'vite-plugin-webfont-dl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webfontDownload([
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap'
    ]),
  ],
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    // Optimize for Cloudflare Pages
    cssCodeSplit: true,
    sourcemap: false, // Disable source maps in production to reduce bundle size
    rollupOptions: {
      output: {
        // Split vendor logic from app logic for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          headlessui: ['@headlessui/react'],
        },
        // Optimize chunk naming for cache busting
        chunkFileNames: 'assets/chunk-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000, // Warn if chunks exceed 1MB
  },
  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime',
    },
  },
});
