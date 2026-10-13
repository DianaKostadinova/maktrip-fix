import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { places, REGIONS } from './places';
import { venues } from './venues';
import { dishes, eateries } from './food';
import { cities, festivals } from './guide';
import { sections } from './sections';
import { catalogService } from '../services/catalogService';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
const inMacedonia = ({ lat, lng }) => lat > 40.8 && lat < 42.4 && lng > 20.4 && lng < 23.1;

describe('content data', () => {
    it('has unique ids across everything that can be saved', () => {
        const ids = catalogService.all().map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('keeps every place and venue inside North Macedonia', () => {
        [...places, ...venues, ...cities].forEach((p) => expect(inMacedonia(p.coords), p.name).toBe(true));
    });

    it('uses only known regions', () => {
        places.forEach((p) => expect(REGIONS, p.name).toContain(p.region));
    });

    it('points at images that exist', () => {
        [...places, ...venues, ...dishes, ...eateries, ...cities, ...sections]
            .filter((i) => i.image)
            .forEach((i) => expect(existsSync(`${publicDir}${i.image}`), i.image).toBe(true));
    });

    it('gives each section a distinct Cyrillic initial', () => {
        const letters = sections.map((s) => s.mk[0]);
        expect(new Set(letters).size).toBe(letters.length);
    });

    it('tags festivals with valid months', () => {
        festivals.forEach((f) => f.months.forEach((m) => expect(m >= 0 && m <= 11, f.name).toBe(true)));
    });

    it('maps legacy name-only pins back to ids', () => {
        expect(catalogService.resolveSavedId({ name: 'Matka Canyon' })).toBe('matka-canyon');
        expect(catalogService.resolveSavedId({ id: 'kaneo', name: 'x' })).toBe('kaneo');
        expect(catalogService.resolveSavedId({ name: 'Nowhere' })).toBeNull();
    });
});
