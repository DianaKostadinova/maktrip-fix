import credits from './imageCredits.json' with { type: 'json' };

// Swaps in the high-resolution Wikimedia Commons photo (and its attribution)
// when one has been fetched with scripts/fetch-commons-images.js.
export const withHd = (item) => (credits[item.id] ? { ...item, image: credits[item.id].src, credit: credits[item.id] } : item);
