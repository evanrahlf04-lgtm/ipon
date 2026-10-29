import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/icon.svg');
// maskable: shrink art into the safe zone on a full-bleed background
const maskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#dcff00"/><g transform="translate(76 76) scale(.703)">${svg.toString().replace(/^[\s\S]*?<g/, '<g').replace(/<\/svg>\s*$/, '').replace(/^<g/, '<g')}</g></svg>`);
for (const [name, size, src] of [['pwa-192.png',192,svg],['pwa-512.png',512,svg],['apple-touch-icon.png',180,svg],['pwa-maskable-512.png',512,maskable]])
  await sharp(src).resize(size, size).png().toFile('public/' + name);
