// Everything a user can save or find, normalised into one shape:
// { id, kind, name, subtitle, image, coords?, to }

import { contentRepository as content } from '../repositories/contentRepository';

export const KIND_LABELS = {
    place: 'Place',
    nightlife: 'Bar',
    cafe: 'Café',
    dish: 'Dish',
    eatery: 'Eatery',
};

const mappable = [
    ...content.places().map((p) => ({ ...p, kind: 'place', subtitle: `${p.category} · ${p.location}`, to: `/places?open=${p.id}` })),
    ...content.venues().map((v) => ({ ...v, kind: v.type, subtitle: `${v.category} · ${v.location}`, to: `/nightlife?open=${v.id}` })),
];

const catalog = [
    ...mappable,
    ...content.dishes().map((d) => ({ ...d, kind: 'dish', subtitle: `${d.kind} · ${d.price}`, to: `/food#${d.id}` })),
    ...content.eateries().map((e) => ({ ...e, kind: 'eatery', subtitle: `${e.specialties} · ${e.location}`, to: `/food?tab=eat#${e.id}` })),
];

const byId = Object.fromEntries(catalog.map((item) => [item.id, item]));
const idByName = Object.fromEntries(catalog.map((item) => [item.name.toLowerCase(), item.id]));

export const catalogService = {
    all: () => catalog,
    mappable: () => mappable,
    byId: (id) => byId[id] ?? null,
    label: (kind) => KIND_LABELS[kind] ?? kind,

    /** Older saved pins were stored by name only; map them back to ids. */
    resolveSavedId(pin) {
        if (pin.id && byId[pin.id]) return pin.id;
        return idByName[pin.name?.toLowerCase()] ?? null;
    },

    /** Shape stored in Firestore for a saved item (kept compatible with v1 pins). */
    toPin(id) {
        const item = byId[id];
        if (!item) return null;
        return { id, name: item.name, type: item.kind, ...(item.coords && { coords: item.coords }) };
    },
};
