// Services wrapping third-party data: caching, fallbacks and formatting on top
// of the raw repositories.

import {
    wikipediaRepository,
    weatherRepository,
    routingRepository,
    overpassRepository,
    translationRepository,
    deviceRepository,
} from '../repositories/externalRepositories';
import { localRepository } from '../repositories/localRepository';
import { distanceKm } from '../utils/geo';

/* ---------------- Wikipedia summaries ---------------- */
const wikiCache = new Map();
export const wikiService = {
    /** Summary for a title, falling back to the best search hit near "North Macedonia". */
    async summary(title, hint = 'North Macedonia') {
        if (wikiCache.has(title)) return wikiCache.get(title);
        let result = await wikipediaRepository.summary(title);
        if (!result) {
            const found = await wikipediaRepository.searchTitle(`${title} ${hint}`);
            if (found) result = await wikipediaRepository.summary(found);
        }
        wikiCache.set(title, result);
        return result;
    },
};

/* ---------------- Weather ---------------- */
const WMO = [
    [[0], 'Clear'],
    [[1, 2], 'Partly cloudy'],
    [[3], 'Overcast'],
    [[45, 48], 'Fog'],
    [[51, 53, 55, 56, 57], 'Drizzle'],
    [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain'],
    [[71, 73, 75, 77, 85, 86], 'Snow'],
    [[95, 96, 99], 'Thunderstorms'],
];
const describe = (code) => WMO.find(([list]) => list.includes(code))?.[1] ?? '—';
const weatherCache = new Map();

export const weatherService = {
    describe,
    /** { now: {temp, text}, days: [{date, max, min, rain, text}] } — cached for an hour. */
    async forecast(coords, signal) {
        const key = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
        const hit = weatherCache.get(key);
        if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.data;
        const j = await weatherRepository.daily(coords, signal);
        const data = {
            now: { temp: Math.round(j.current.temperature_2m), text: describe(j.current.weather_code) },
            days: j.daily.time.map((date, i) => ({
                date,
                max: Math.round(j.daily.temperature_2m_max[i]),
                min: Math.round(j.daily.temperature_2m_min[i]),
                rain: j.daily.precipitation_probability_max[i],
                text: describe(j.daily.weather_code[i]),
            })),
        };
        weatherCache.set(key, { at: Date.now(), data });
        return data;
    },
};

/* ---------------- Routing ---------------- */
const routeCache = new Map();
export const routingService = {
    /** Road distance/time; falls back to a straight-line estimate when offline. */
    async drive(from, to, signal) {
        const key = `${from.lat},${from.lng}>${to.lat},${to.lng}`;
        if (routeCache.has(key)) return routeCache.get(key);
        try {
            const r = await routingRepository.drive(from, to, signal);
            const out = { km: r.meters / 1000, minutes: Math.round(r.seconds / 60), estimated: false };
            routeCache.set(key, out);
            return out;
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            const km = distanceKm(from, to) * 1.35;
            return { km, minutes: Math.round(km), estimated: true }; // ~60 km/h average
        }
    },
    formatMinutes(min) {
        if (min < 60) return `${min} min`;
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m ? `${h} h ${m} min` : `${h} h`;
    },
    transitUrl: (from, to) => `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=transit`,
    drivingUrl: (from, to) => `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`,
};

/* ---------------- Nearby amenities (OpenStreetMap) ---------------- */
export const AMENITIES = {
    toilets: { label: 'Toilets', query: 'nwr["amenity"="toilets"]' },
    water: { label: 'Drinking water', query: 'nwr["amenity"="drinking_water"]' },
    pharmacy: { label: 'Pharmacies', query: 'nwr["amenity"="pharmacy"]' },
    atm: { label: 'ATMs', query: 'nwr["amenity"="atm"];nwr["amenity"="bank"]["atm"="yes"]' },
    hospital: { label: 'Hospitals', query: 'nwr["amenity"~"^(hospital|clinic)$"]' },
    exchange: { label: 'Exchange', query: 'nwr["amenity"="bureau_de_change"]' },
};
const NEARBY_KEY = 'nearby:v1';
const FRESH_MS = 30 * 60 * 1000;
const STALE_MS = 30 * 24 * 60 * 60 * 1000;
const nearbyMemory = new Map();

function toAmenity(el, kind) {
    const c = el.type === 'node' ? { lat: el.lat, lng: el.lon } : el.center && { lat: el.center.lat, lng: el.center.lon };
    if (!c) return null;
    const t = el.tags || {};
    return {
        id: `${el.type}/${el.id}`,
        kind,
        coords: c,
        name: t.name || t['name:en'] || AMENITIES[kind].label.replace(/s$/, ''),
        details: [
            t.fee === 'no' ? 'Free' : t.fee === 'yes' ? 'Paid' : null,
            t.wheelchair === 'yes' ? 'Wheelchair accessible' : null,
            t.opening_hours ? `Hours: ${t.opening_hours}` : null,
            t.operator || t.brand || null,
        ].filter(Boolean),
    };
}

function remember(key, entry) {
    nearbyMemory.set(key, entry);
    const store = localRepository.get(NEARBY_KEY, {});
    store[key] = entry;
    Object.keys(store)
        .sort((a, b) => store[b].at - store[a].at)
        .slice(40)
        .forEach((k) => delete store[k]);
    localRepository.set(NEARBY_KEY, store);
}

export const nearbyService = {
    /**
     * Amenities of `kind` within `radius` m, nearest first. Fresh results are
     * cached 30 min; when every server fails, results up to 30 days old are
     * returned with `stale: true`.
     */
    async find(kind, at, radius = 1500, signal) {
        const key = `${kind}:${at.lat.toFixed(3)},${at.lng.toFixed(3)}:${radius}`;
        const cached = nearbyMemory.get(key) ?? localRepository.get(NEARBY_KEY, {})[key];
        const withDistance = (items, stale = false) => ({
            stale,
            items: items.map((i) => ({ ...i, distance: distanceKm(at, i.coords) })).sort((a, b) => a.distance - b.distance),
        });
        if (cached && Date.now() - cached.at < FRESH_MS) return withDistance(cached.data);

        const ql = `[out:json][timeout:15];(${AMENITIES[kind].query
            .split(';')
            .map((q) => `${q}(around:${radius},${at.lat},${at.lng});`)
            .join('')});out center 60;`;
        try {
            const data = (await overpassRepository.query(ql, signal)).map((el) => toAmenity(el, kind)).filter(Boolean);
            remember(key, { at: Date.now(), data });
            return withDistance(data);
        } catch (e) {
            if (signal?.aborted) throw e;
            if (cached && Date.now() - cached.at < STALE_MS) return withDistance(cached.data, true);
            throw e;
        }
    },
};

/* ---------------- Translation ---------------- */
export const translationService = {
    async translate(text, direction /* 'en|mk' | 'mk|en' */) {
        const [from, to] = direction.split('|');
        try {
            return (await translationRepository.translate(text, from, to)) || 'Translation unavailable — try again.';
        } catch {
            return 'You seem to be offline. The phrasebook works without internet.';
        }
    },
};

/* ---------------- Device (location, speech, sharing) ---------------- */
export const deviceService = {
    currentPosition: () => deviceRepository.currentPosition(),
    canSpeak: deviceRepository.canSpeak,
    speakEnglish: (text, onEnd) => deviceRepository.speak(text, 'en-US', { onEnd }),
    speakMacedonian: (text) => deviceRepository.speak(text, 'mk-MK', { rate: 0.85 }),
    stopSpeaking: deviceRepository.stopSpeaking,
    share: (payload) => deviceRepository.share(payload),
    copy: (text) => deviceRepository.copy(text),
    async shareLocation() {
        const p = await deviceRepository.currentPosition();
        const text = `I need help. My location: https://maps.google.com/?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
        return deviceRepository.share({ title: 'My location', text });
    },
};
