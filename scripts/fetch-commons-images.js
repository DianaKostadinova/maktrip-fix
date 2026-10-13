// Fetches high-resolution, freely licensed photos from Wikimedia Commons for
// places and dishes, converts them to WebP and records attribution in
// src/data/imageCredits.json (required by CC BY / CC BY-SA licences).
//
// Usage: node scripts/fetch-commons-images.js [--only id1,id2] [--force]
// Review the results before committing — Wikipedia's lead image is not always
// the best photo of a place. Override a pick via COMMONS_FILES below.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { places } from '../src/data/places.js';
import { dishes } from '../src/data/food.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const creditsFile = `${root}src/data/imageCredits.json`;
const UA = 'DiscoverMacedonia/2.0 (travel guide; image attribution bot)';

// Explicit Commons file names where the article's lead image is a poor fit.
const COMMONS_FILES = {
    // id: 'File:Something.jpg'
};

// Article titles for dishes (places use their own wikiTitle).
const DISH_TITLES = {
    pastrmajlija: 'Pastrmajlija',
    'tavche-gravche': 'Tavče gravče',
    ajvar: 'Ajvar',
    simit: 'Simit',
    sharska: 'Pljeskavica',
    sarma: 'Sarma (food)',
    burek: 'Burek',
    mekica: 'Mekitsa',
    kebapi: 'Ćevapi',
    'selsko-meso': 'Selsko meso',
    'turli-tava': 'Turli tava',
    'polneti-piperki': 'Stuffed peppers',
    'ohrid-trout': 'Ohrid trout',
    shopska: 'Shopska salad',
    pindjur: 'Pindjur',
    malidzano: 'Malidžano',
    baklava: 'Baklava',
    tulumba: 'Tulumba',
    boza: 'Boza',
    rakija: 'Rakia',
    vranec: 'Vranec',
};

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const force = args.includes('--force');
const minWidth = args.includes('--min') ? Number(args[args.indexOf('--min') + 1]) : 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retries politely when Wikimedia rate-limits (HTTP 429).
async function get(url, tries = 5) {
    for (let i = 0; ; i++) {
        const res = await fetch(url, { headers: { 'User-Agent': UA } });
        if (res.status !== 429 || i >= tries) return res;
        await sleep(Number(res.headers.get('retry-after')) * 1000 || 4000 * 2 ** i);
    }
}

async function api(params) {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    Object.entries({ format: 'json', origin: '*', ...params }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await get(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

async function leadImage(title) {
    const data = await api({ action: 'query', prop: 'pageimages', piprop: 'name', redirects: 1, titles: title });
    const page = Object.values(data.query.pages)[0];
    return page?.pageimage ? `File:${page.pageimage}` : null;
}

async function fileInfo(file) {
    const data = await api({ action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: 1800, titles: file });
    const info = Object.values(data.query.pages)[0]?.imageinfo?.[0];
    if (!info) return null;
    const meta = info.extmetadata || {};
    const strip = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return {
        url: info.thumburl || info.url,
        width: info.width,
        page: info.descriptionurl,
        author: strip(meta.Artist?.value) || 'Unknown',
        license: strip(meta.LicenseShortName?.value) || 'See source',
        licenseUrl: meta.LicenseUrl?.value || null,
    };
}

const credits = existsSync(creditsFile) ? JSON.parse(await readFile(creditsFile, 'utf8')) : {};
const jobs = [
    ...places.map((p) => ({ id: p.id, title: p.wikiTitle || p.name, out: `public/images/places/hd/${p.id}.webp` })),
    ...dishes.map((d) => ({ id: d.id, title: DISH_TITLES[d.id], out: `public/images/food/hd/${d.id}.webp` })),
].filter((j) => (!only || only.includes(j.id)) && j.title);

for (const job of jobs) {
    if (credits[job.id] && !force) continue;
    try {
        const file = COMMONS_FILES[job.id] || (await leadImage(job.title));
        if (!file || /\.svg$/i.test(file)) {
            console.log(`- ${job.id}: no usable lead image`);
            continue;
        }
        const info = await fileInfo(file);
        if (!info || info.width < minWidth) {
            console.log(`- ${job.id}: ${file} too small (${info?.width}px)`);
            continue;
        }
        const res = await get(info.url);
        if (!res.ok) throw new Error(`download ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await mkdir(`${root}${job.out.replace(/[^/]+$/, '')}`, { recursive: true });
        await sharp(buf).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${root}${job.out}`);
        credits[job.id] = { src: `/${job.out.replace(/^public\//, '')}`, file, page: info.page, author: info.author, license: info.license, licenseUrl: info.licenseUrl };
        console.log(`+ ${job.id}: ${file}`);
        await sleep(1500); // be polite to the API
    } catch (e) {
        console.log(`! ${job.id}: ${e.message}`);
    }
}

await writeFile(creditsFile, JSON.stringify(credits, null, 2) + '\n');
console.log(`\n${Object.keys(credits).length} credited images → src/data/imageCredits.json`);
