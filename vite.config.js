import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import handlebars from 'vite-plugin-handlebars';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    handlebars({
      // Указываем папку, где будут лежать шапка и футер
      partialDirectory: resolve(import.meta.dirname, 'src/partials'),
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        offer: resolve(import.meta.dirname, 'offer.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
      },
    },
  },
});