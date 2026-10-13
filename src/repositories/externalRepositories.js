// Third-party HTTP APIs and device APIs. Raw I/O only — caching, fallbacks and
// formatting live in the services that use them.

import { imgbbApiKey } from '../config/env';

/* ---------------- Wikipedia ---------------- */
export const wikipediaRepository = {
    async summary(title) {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!res.ok) return null;
        const d = await res.json();
        if (d.type === 'disambiguation' || !d.extract) return null;
        return { title: d.title, text: d.extract, url: d.content_urls?.desktop?.page };
    },
    async searchTitle(query) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return (await res.json()).query?.search?.[0]?.title ?? null;
    },
};

/* ---------------- Open-Meteo (weather) ---------------- */
export const weatherRepository = {
    async daily({ lat, lng }, signal) {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
            '&current=temperature_2m,weather_code&timezone=Europe%2FSkopje&forecast_days=16';
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Weather unavailable (${res.status})`);
        return res.json();
    },
};

/* ---------------- OSRM (road routing) ---------------- */
export const routingRepository = {
    async drive(from, to, signal) {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
        const res = await fetch(url, { signal });
        const route = (await res.json()).routes?.[0];
        if (!route) throw new Error('No route');
        return { meters: route.distance, seconds: route.duration };
    },
};

/* ---------------- Overpass (OpenStreetMap amenities) ---------------- */
const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export const overpassRepository = {
    /** Runs an Overpass QL query, trying each mirror with a 12 s timeout. Returns raw elements. */
    async query(ql, signal) {
        const body = new URLSearchParams({ data: ql });
        let lastError;
        for (const url of OVERPASS_MIRRORS) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            const timeout = AbortSignal.timeout(12000);
            try {
                const res = await fetch(url, { method: 'POST', body, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
                if (!res.ok) throw new Error(`Overpass ${res.status}`);
                return (await res.json()).elements; // busy servers answer 200 + XML → throws here
            } catch (e) {
                if (signal?.aborted) throw e;
                lastError = e;
            }
        }
        throw lastError ?? new Error('Overpass unavailable');
    },
};

/* ---------------- MyMemory (translation) ---------------- */
export const translationRepository = {
    async translate(text, from, to) {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
        if (!res.ok) throw new Error(`Translation failed (${res.status})`);
        return (await res.json()).responseData?.translatedText ?? null;
    },
};

/* ---------------- ImgBB (avatar uploads) ---------------- */
export const uploadRepository = {
    available: () => Boolean(imgbbApiKey),
    async uploadImage(file) {
        const body = new FormData();
        body.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, { method: 'POST', body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error?.message || 'Upload failed.');
        return data.data.url;
    },
};

/* ---------------- Device: geolocation & speech ---------------- */
export const deviceRepository = {
    currentPosition() {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) return reject(new Error('Location is not supported on this device.'));
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => reject(new Error('Couldn’t get your location. Check location permissions.')),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    },
    canSpeak: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    speak(text, lang, { rate = 1, onEnd } = {}) {
        const synth = window.speechSynthesis;
        if (!synth) return;
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = rate;
        if (onEnd) u.onend = onEnd;
        synth.speak(u);
    },
    stopSpeaking: () => window.speechSynthesis?.cancel(),
    async share({ title, text }) {
        if (navigator.share) {
            await navigator.share({ title, text });
            return 'shared';
        }
        await navigator.clipboard.writeText(text);
        return 'copied';
    },
    copy: (text) => navigator.clipboard.writeText(text),
    downloadFile(name, content, type) {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const a = Object.assign(document.createElement('a'), { href: url, download: name });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
};
