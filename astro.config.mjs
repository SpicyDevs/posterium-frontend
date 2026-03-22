import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import compress from 'astro-compress';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    compress({
      HTML: false,
      CSS: true,
      JS: true,
      SVG: false,
      Image: false,
    })
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
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
          },
        },
      },
    },
  },
});