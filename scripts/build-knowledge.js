// Exports the frontend's data (src/data) into the backend's planner knowledge
// base, so places, food and transport facts have a single source of truth.
// Usage: npm run knowledge   (commit the generated JSON)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { places } from '../src/data/places.js';
import { venues } from '../src/data/venues.js';
import { dishes, eateries } from '../src/data/food.js';
import { cities, festivals } from '../src/data/guide.js';
import { transport, prices, EUR_TO_MKD } from '../src/data/essentials.js';

const out = fileURLToPath(new URL('../backend/src/main/resources/knowledge.json', import.meta.url));

const knowledge = {
    eurToMkd: EUR_TO_MKD,
    cities: cities.map(({ id, name, region, days, tagline, highlights, gettingThere, coords }) => ({ id, name, region, days, tagline, highlights, gettingThere, lat: coords.lat, lng: coords.lng })),
    attractions: places.map(({ id, name, location, region, category, description, howToGet, cost, duration, access, coords }) => ({
        id, name, location, region, category, description, howToGet, cost: cost ?? '', duration: duration ?? '', access, lat: coords.lat, lng: coords.lng,
    })),
    venues: venues.map(({ id, name, type, category, description, location }) => ({ id, name, type, category, description, location })),
    dishes: dishes.map(({ id, name, description, where, price }) => ({ id, name, description, where, price })),
    eateries: eateries.map(({ id, name, description, specialties, price, location }) => ({ id, name, description, specialties, price, location })),
    festivals: festivals.map(({ name, months, when, where, text }) => ({ name, months, when, where, text })),
    transport: transport.map(({ title, body }) => ({ title, body })),
    prices: prices.flatMap((g) => g.items.map(([item, price]) => ({ group: g.group, item, price }))),
};

await writeFile(out, JSON.stringify(knowledge, null, 2) + '\n');
console.log(`knowledge.json: ${knowledge.attractions.length} attractions, ${knowledge.cities.length} cities, ${knowledge.dishes.length} dishes`);
