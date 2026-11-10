import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import handlebars from 'vite-plugin-handlebars';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    handlebars({
      // Указываем папку, где будут лежать шапка и футер
      partialDirectory: resolve(__dirname, 'src/partials'),
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        offer: resolve(__dirname, 'offer.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
});