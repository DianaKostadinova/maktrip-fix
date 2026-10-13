// Read models for the content pages (places, venues, food, guide, essentials,
// sections, music). Pages ask these services; only they talk to the content
// repository, so filtering/derivation rules live in one place.

import { contentRepository as content } from '../repositories/contentRepository';
import { featureService } from './featureService';

/* ---------------- Places ---------------- */
export const placeService = {
    all: () => content.places(),
    byId: (id) => content.places().find((p) => p.id === id) ?? null,
    featured: () => content.places().filter((p) => p.featured),
    regions: () => content.regions(),
    categories: () => [...new Set(content.places().map((p) => p.category))],
    inRegion: (region, limit = 4) => content.places().filter((p) => p.region === region).slice(0, limit),
    accessLabel: (access) => content.accessLabels()[access],

    filter({ query = '', region = 'All', category = 'All' }) {
        const q = query.trim().toLowerCase();
        return content.places().filter(
            (p) =>
                (region === 'All' || p.region === region) &&
                (category === 'All' || p.category === category) &&
                (!q || `${p.name} ${p.location} ${p.description} ${p.category}`.toLowerCase().includes(q))
        );
    },
};

/* ---------------- Bars & cafés ---------------- */
export const venueService = {
    all: () => content.venues(),
    byId: (id) => content.venues().find((v) => v.id === id) ?? null,
    ofType: (type) => (type === 'all' ? content.venues() : content.venues().filter((v) => v.type === type)),
    count: (type) => content.venues().filter((v) => v.type === type).length,
};

/* ---------------- Food ---------------- */
export const foodService = {
    dishes: (kind = 'All') => (kind === 'All' ? content.dishes() : content.dishes().filter((d) => d.kind === kind)),
    dishKinds: () => [...new Set(content.dishes().map((d) => d.kind))],
    eateries: () => content.eateries(),
};

/* ---------------- Guide ---------------- */
export const guideService = {
    cities: () => content.cities(),
    cityById: (id) => content.cities().find((c) => c.id === id) ?? null,
    months: () => content.months(),
    month: (index) => content.months()[index],
    festivals: () => content.festivals(),
    /** Festivals happening in any of the given month indexes (0–11). */
    festivalsIn: (monthIndexes) => content.festivals().filter((f) => f.months.some((m) => monthIndexes.includes(m))),
    history: () => content.history(),
    culture: () => content.culture(),
    facts: () => content.didYouKnow(),
    entryRules: () => content.entryRules(),
    monuments: () => content.monuments(),
    spotifyTracks: () => content.spotifyTracks(),
};

/* ---------------- Essentials ---------------- */
export const essentialsService = {
    ...content.essentials(),
    eurToMkd: content.eurToMkd(),
    toMkd: (eur) => Math.round(eur * content.eurToMkd()),
    toEur: (mkd) => mkd / content.eurToMkd(),
    tipFor(bill, percent, people) {
        const tip = Math.round((bill * percent) / 100 / 10) * 10;
        const total = bill + tip;
        return { tip, total, totalEur: total / content.eurToMkd(), each: Math.ceil(total / Math.max(1, people) / 10) * 10 };
    },
    tipsById: (id) => content.essentials().tips.find((t) => t.id === id),
};

/* ---------------- Sections (navigation) ---------------- */
// Sections behind a disabled feature flag stay listed, marked "coming soon".
const sections = content.sections().map((s) => ({ ...s, comingSoon: s.id === 'planner' && !featureService.plannerEnabled() }));
export const sectionService = {
    all: () => sections,
    group: (group) => sections.filter((s) => s.group === group),
    byId: (id) => sections.find((s) => s.id === id) ?? null,
    number: (id) => String(sections.findIndex((s) => s.id === id) + 1).padStart(2, '0'),
};

/* ---------------- Photo credits ---------------- */
export const creditService = {
    images: () => content.imageCredits(),
    monuments: () => content.monuments(),
};
