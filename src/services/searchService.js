// Command-palette search across sections, everything savable, emergency
// numbers and phrases.

import Fuse from 'fuse.js';
import { catalogService } from './catalogService';
import { essentialsService, sectionService } from './contentServices';

const entries = [
    ...sectionService.all().map((s) => ({ key: `s-${s.id}`, group: 'Sections', title: s.title, subtitle: s.comingSoon ? `Coming soon — ${s.blurb}` : s.blurb, to: s.to, keywords: [...s.keywords, s.mk], section: s.id })),
    ...catalogService.all().map((c) => ({
        key: `c-${c.id}`,
        group: catalogService.label(c.kind),
        title: c.name,
        subtitle: c.subtitle,
        to: c.to,
        keywords: [c.category, c.location, c.kind].filter(Boolean),
        kind: c.kind,
    })),
    ...essentialsService.emergencyNumbers.map((e) => ({ key: `e-${e.number}`, group: 'Emergency', title: `${e.label}: ${e.number}`, subtitle: 'Tap to call', href: `tel:${e.number}`, keywords: ['emergency', 'help', 'call', 'sos'], kind: 'sos' })),
    ...essentialsService.phrases.map((p) => ({ key: `p-${p.latin}`, group: 'Phrases', title: `${p.en} → ${p.mk}`, subtitle: p.latin, to: '/essentials?tab=language', keywords: ['phrase', 'say', 'translate', p.latin], kind: 'phrase' })),
];

const fuse = new Fuse(entries, { keys: [{ name: 'title', weight: 3 }, 'subtitle', 'keywords', 'group'], threshold: 0.38, ignoreLocation: true });

const SUGGESTED = ['s-trip', 's-essentials', 's-map', 'c-matka-canyon', 'c-tavche-gravche', 'e-112'];

export const searchService = {
    search(query, limit = 12) {
        if (!query.trim()) return SUGGESTED.map((k) => entries.find((e) => e.key === k)).filter(Boolean);
        return fuse.search(query, { limit }).map((r) => r.item);
    },
};
