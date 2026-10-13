// Pure geographic helpers (no I/O).
export const MACEDONIA_CENTER = [41.6086, 21.7453];

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function googleMapsUrl(item) {
    if (item.mapLink) return item.mapLink;
    return `https://www.google.com/maps/search/?api=1&query=${item.coords.lat},${item.coords.lng}`;
}

export function directionsUrl(item) {
    return `https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`;
}

export function distanceKm(a, b) {
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
