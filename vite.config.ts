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
  // Enable SPA history fallback so /build works on direct load
  server: {
    historyApiFallback: true,
  },
  build: {
    target: 'ES2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          headlessui: ['@headlessui/react'],
        },
        chunkFileNames: 'assets/chunk-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      'react/jsx-runtime': 'react/jsx-runtime',
    },
  },
});