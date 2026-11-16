import { defineConfig, loadEnv } from 'vite';
import { createHash } from 'node:crypto';
import { VitePWA } from 'vite-plugin-pwa';

// Adds a Content Security Policy to the built page: scripts only from this site (plus the one inline
// theme script, allowed by its hash), and network calls only to this site and your Supabase project.
// Inline event handlers and injected scripts are blocked, which stops a whole class of XSS.
function csp() {
  let env = {};
  return {
    name: 'ipon-csp',
    apply: 'build',
    configResolved(c) { env = loadEnv(c.mode, process.cwd(), 'VITE_'); },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        let host = '';
        try { host = new URL(env.VITE_SUPABASE_URL || '').origin; } catch (e) {}
        const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map(m => "'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'");
        const policy = [
          "default-src 'self'",
          ['script-src', "'self'", ...hashes].join(' '),
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self'",
          "img-src 'self' data:",
          "connect-src 'self' https://open.er-api.com" + (host ? ' ' + host : ''),
          "manifest-src 'self'",
          "worker-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; ');
        return html.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="' + policy + '">');
      },
    },
  };
}

export default defineConfig({
  define: { __FRAME_GUARD__: true },
  base: './',
  plugins: [
    csp(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Tally',
        short_name: 'Tally',
        description: 'Budget, bills, debts and Philippine tax estimates.',
        theme_color: '#f3eeea',
        background_color: '#ebe8fb',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the fonts with the app so it still works offline.
        globPatterns: ['**/*.{js,css,html,woff2}'],
      },
    }),
  ],
});
