// Device storage (localStorage) with JSON encoding. Every call is best-effort:
// private mode, full quota or blocked storage never break the app.

export const localRepository = {
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            if (value == null) localStorage.removeItem(key);
            else localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* best-effort */
        }
    },
    getRaw(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setRaw(key, value) {
        try {
            if (value == null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        } catch {
            /* best-effort */
        }
    },
};
