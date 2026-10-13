// Resolves configuration from (1) window.__APP_CONFIG__, written at container
// start in Docker, then (2) Vite env vars at build/dev time. The legacy
// REACT_APP_* names are still accepted.

const runtime = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
const env = import.meta.env;

function read(name) {
    return runtime[name] || env[`VITE_${name}`] || env[`REACT_APP_${name}`] || '';
}

export const firebaseConfig = {
    apiKey: read('FIREBASE_API_KEY'),
    authDomain: read('FIREBASE_AUTH_DOMAIN'),
    projectId: read('FIREBASE_PROJECT_ID'),
    storageBucket: read('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('FIREBASE_MESSAGING_SENDER_ID'),
    appId: read('FIREBASE_APP_ID'),
    measurementId: read('FIREBASE_MEASUREMENT_ID'),
};

export const imgbbApiKey = read('IMGBB_API_KEY');

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Feature flags. The AI trip planner is "coming soon" until PLANNER_ENABLED=true.
export const features = {
    planner: read('PLANNER_ENABLED') === 'true',
};

// Where the Spring API lives. Empty = same origin (/api via nginx or the Vite proxy).
// On free hosting the site and API are on different domains, e.g.
// VITE_API_BASE_URL=https://discover-macedonia-api.onrender.com
export const apiBaseUrl = read('API_BASE_URL').replace(/\/$/, '');
