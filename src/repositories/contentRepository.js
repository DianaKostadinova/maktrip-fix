// Static content (src/data). The only module outside tests/scripts allowed to
// import from data/, so the source of content can change (e.g. to a CMS or the
// API) without touching services or UI.

import { places, REGIONS, ACCESS_LABELS } from '../data/places';
import { venues } from '../data/venues';
import { dishes, eateries } from '../data/food';
import { cities, months, festivals, history, culture, didYouKnow, entry } from '../data/guide';
import { emergencyNumbers, quickFacts, phrases, prices, transport, tips, holidays, EUR_TO_MKD } from '../data/essentials';
import { sections } from '../data/sections';
import { spotifyTracks } from '../data/music';
import { monuments } from '../data/ring';
import { CHECKLIST, EXPENSE_CATEGORIES } from '../data/checklist';
import imageCredits from '../data/imageCredits.json' with { type: 'json' };

export const contentRepository = {
    places: () => places,
    regions: () => REGIONS,
    accessLabels: () => ACCESS_LABELS,
    venues: () => venues,
    dishes: () => dishes,
    eateries: () => eateries,
    cities: () => cities,
    months: () => months,
    festivals: () => festivals,
    history: () => history,
    culture: () => culture,
    didYouKnow: () => didYouKnow,
    entryRules: () => entry,
    essentials: () => ({ emergencyNumbers, quickFacts, phrases, prices, transport, tips, holidays }),
    eurToMkd: () => EUR_TO_MKD,
    sections: () => sections,
    spotifyTracks: () => spotifyTracks,
    monuments: () => monuments,
    checklist: () => CHECKLIST,
    expenseCategories: () => EXPENSE_CATEGORIES,
    imageCredits: () => imageCredits,
};
