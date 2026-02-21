import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Use modern JS features (smaller bundle size)
    minify: 'esbuild', // Faster build time
    rollupOptions: {
      output: {
        // Split vendor logic from app logic for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
