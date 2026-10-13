// Renders favicon and PWA icons from public/icons/logo.svg (transparent emblem).
// Usage: npm run icons
//
// - icon-192 / icon-512: transparent, for browsers and the install dialog.
// - maskable-512 / apple-touch-icon: the emblem on a solid tile, because
//   Android adaptive icons and iOS home screens need an opaque background.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = new URL('../public/icons/', import.meta.url);
const path = (name) => fileURLToPath(new URL(name, dir));
const svg = await readFile(path('logo.svg'));
const TILE = '#ffffff';

const render = (size) => sharp(svg, { density: 384 }).resize(size, size).png();

async function onTile(size, scale) {
    const inner = Math.round(size * scale);
    const art = await render(inner).toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: TILE } })
        .composite([{ input: art, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
        .png();
}

await render(192).toFile(path('icon-192.png'));
await render(512).toFile(path('icon-512.png'));
// maskable safe zone is the inner 80% circle
await (await onTile(512, 0.72)).toFile(path('maskable-512.png'));
await (await onTile(180, 0.82)).toFile(path('apple-touch-icon.png'));
// keep the old name pointing at the new artwork for anything still referencing it
await copyFile(path('logo.svg'), path('icon.svg'));
console.log('wrote icon-192, icon-512, maskable-512, apple-touch-icon, icon.svg');

const ico = await render(48).toBuffer();
// A single-image PNG-in-ICO container is accepted by every modern browser.
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(48, 6);
header.writeUInt8(48, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(ico.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(fileURLToPath(new URL('../favicon.ico', dir)), Buffer.concat([header, ico]));
console.log('wrote favicon.ico');
