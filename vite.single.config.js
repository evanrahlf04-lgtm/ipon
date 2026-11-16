import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file (no PWA, no separate assets): npm run build:single
export default defineConfig({
  base: './',
  define: { __FRAME_GUARD__: false },
  plugins: [viteSingleFile()],
  build: { outDir: 'dist-single', emptyOutDir: true },
});
