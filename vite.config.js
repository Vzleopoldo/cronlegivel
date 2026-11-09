import { defineConfig } from 'vite';

// base './' (caminhos relativos) permite publicar o MESMO build em
// /<repositorio>/staging/ e depois em /<repositorio>/ sem recompilar.
export default defineConfig({
  base: './',
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/main.js'],
      thresholds: { lines: 80 },
    },
  },
});
