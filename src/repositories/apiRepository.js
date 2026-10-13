// HTTP client for our Spring Boot API. Same origin by default (/api via nginx in
// Docker, the Vite proxy in dev); set API_BASE_URL when the API is hosted
// elsewhere. Errors follow RFC 9457 problem+json.

import { apiBaseUrl } from '../config/env';

const url = (path) => `${apiBaseUrl}${path}`;

async function problem(res) {
    try {
        const body = await res.json();
        return new Error(body.detail || body.title || `Request failed (${res.status})`);
    } catch {
        return new Error(`Request failed (${res.status})`);
    }
}

async function getJson(path, signal) {
    const res = await fetch(url(path), { signal });
    if (!res.ok) throw await problem(res);
    return res.json();
}

export const apiRepository = {
    health: (signal) => getJson('/api/health', signal),

    news: (limit, signal) => getJson(`/api/news?limit=${limit}`, signal),

    /** Streams a generated itinerary; `onText` receives the full text so far. */
    async streamPlan(request, { onText, signal }) {
        const res = await fetch(url('/api/plans/stream'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
            body: JSON.stringify(request),
            signal,
        });
        if (!res.ok || !res.body) throw await problem(res);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
            onText(text);
        }
        return text;
    },
};
