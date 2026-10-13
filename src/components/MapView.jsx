import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Navigation } from 'lucide-react';
import { MACEDONIA_CENTER, TILE_ATTRIBUTION, TILE_URL, directionsUrl } from '../utils/geo';
import { catalogService } from '../services/catalogService';
import SaveButton from './SaveButton';

const iconCache = {};
function pinIcon(kind, active) {
    const key = `${kind}-${active}`;
    iconCache[key] ??= L.divIcon({
        className: '',
        html: `<span class="pin pin--${kind}${active ? ' is-active' : ''}"><span></span></span>`,
        iconSize: [30, 38],
        iconAnchor: [15, 36],
        popupAnchor: [0, -32],
    });
    return iconCache[key];
}

const amenityIcons = {};
function amenityIcon(kind) {
    amenityIcons[kind] ??= L.divIcon({ className: '', html: `<span class="amenity amenity--${kind}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });
    return amenityIcons[kind];
}

const youIcon = L.divIcon({ className: '', html: '<span class="pin-you"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });

function FitBounds({ items, extras, user }) {
    const map = useMap();
    useEffect(() => {
        // Nearby amenities take focus when shown; otherwise fit the places.
        const pts = (extras.length ? extras : items).map((i) => [i.coords.lat, i.coords.lng]);
        if (user) pts.push([user.lat, user.lng]);
        if (pts.length === 1) map.setView(pts[0], 14);
        else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    }, [items, extras, user, map]);
    return null;
}

export default function MapView({ items, extras = [], user, activeId, onOpen, className = '', fit = true, zoom = 8, center = MACEDONIA_CENTER }) {
    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom className={`map ${className}`}>
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
            {fit && <FitBounds items={items} extras={extras} user={user} />}
            {user && <Marker position={[user.lat, user.lng]} icon={youIcon} />}
            {items.map((item) => (
                <Marker key={item.id} position={[item.coords.lat, item.coords.lng]} icon={pinIcon(item.kind, item.id === activeId)}>
                    <Popup>
                        <div className="map-popup">
                            <span className={`tag tag--${item.kind}`}>{catalogService.label(item.kind)}</span>
                            <strong>{item.name}</strong>
                            <span className="muted">{item.subtitle}</span>
                            <div className="map-popup__actions">
                                <SaveButton id={item.id} name={item.name} />
                                {onOpen && (
                                    <button className="btn btn--sm btn--ghost" onClick={() => onOpen(item)}>
                                        Details
                                    </button>
                                )}
                                <a className="btn btn--sm btn--ghost" href={directionsUrl(item)} target="_blank" rel="noreferrer">
                                    <Navigation size={14} /> Go
                                </a>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
            {extras.map((a) => (
                <Marker key={a.id} position={[a.coords.lat, a.coords.lng]} icon={amenityIcon(a.kind)}>
                    <Popup>
                        <div className="map-popup">
                            <strong>{a.name}</strong>
                            {a.details?.length > 0 && <span className="muted">{a.details.join(' · ')}</span>}
                            <a className="btn btn--sm btn--ghost" href={`${directionsUrl(a)}&travelmode=walking`} target="_blank" rel="noreferrer">
                                <Navigation size={14} /> Walk there
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export function MiniMap({ item }) {
    return (
        <div className="mini-map">
            <MapContainer center={[item.coords.lat, item.coords.lng]} zoom={14} scrollWheelZoom={false} className="map">
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                <Marker position={[item.coords.lat, item.coords.lng]} icon={pinIcon(item.kind ?? 'place', true)} />
            </MapContainer>
            <a className="mini-map__link" href={directionsUrl(item)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Open in Google Maps
            </a>
        </div>
    );
}
