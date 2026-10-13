import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocateFixed } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { AMENITIES, nearbyService, deviceService } from '../services/externalServices';
import { distanceKm, formatKm } from '../utils/geo';
import { useSaved } from '../context/SavedContext';
import { useToast } from '../context/ToastContext';
import MapView from '../components/MapView';
import Chips from '../components/Chips';

const FILTERS = [
    { value: 'all', label: 'Everything' },
    { value: 'place', label: 'Places' },
    { value: 'nightlife', label: 'Bars' },
    { value: 'cafe', label: 'Cafés' },
    { value: 'saved', label: 'Saved' },
];

const SKOPJE = { lat: 41.9965, lng: 21.4314 };

export default function MapPage() {
    const [filter, setFilter] = useState('all');
    const [you, setYou] = useState(null);
    const [amenity, setAmenity] = useState(null);
    const [extras, setExtras] = useState({ kind: null, items: [], loading: false });
    const { isSaved } = useSaved();
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Map · Discover Macedonia';
    }, []);

    useEffect(() => {
        if (!amenity) return undefined;
        const ctrl = new AbortController();
        let alive = true;
        nearbyService
            .find(amenity, you ?? SKOPJE, 1500, ctrl.signal)
            .then((r) => alive && setExtras({ kind: amenity, items: r.items, loading: false }))
            .catch((e) => {
                if (!alive || e.name === 'AbortError') return;
                setExtras({ kind: amenity, items: [], loading: false });
                toast.error('Couldn’t load nearby places from OpenStreetMap.');
            });
        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [amenity, you, toast]);

    const items = useMemo(() => {
        const list = catalogService.mappable().filter((i) => (filter === 'all' ? true : filter === 'saved' ? isSaved(i.id) : i.kind === filter));
        if (!you) return list;
        return list.map((i) => ({ ...i, distance: distanceKm(you, i.coords) })).sort((a, b) => a.distance - b.distance);
    }, [filter, isSaved, you]);

    const shownExtras = amenity && extras.kind === amenity ? extras.items : [];
    const loadingExtras = amenity && extras.kind !== amenity;

    const locate = async () => {
        try {
            setYou(await deviceService.currentPosition());
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <div className="map-page">
            <div className="map-page__map">
                <MapView items={items} extras={shownExtras} user={you} onOpen={(i) => navigate(i.to)} />
                <button className="btn btn--primary map-page__locate" onClick={locate}>
                    <LocateFixed size={18} /> Near me
                </button>
            </div>
            <aside className="map-page__panel">
                <h1 className="h3">Map</h1>
                <Chips label="Show" options={FILTERS} value={filter} onChange={setFilter} />

                <div className="amenity-bar">
                    <p className="kicker">Nearby essentials {!you && <span className="muted">· around central Skopje until you tap “Near me”</span>}</p>
                    <div className="chips chips--wrap">
                        {Object.entries(AMENITIES).map(([id, a]) => (
                            <button key={id} className={`chip chip--amenity chip--${id} ${amenity === id ? 'is-active' : ''}`} aria-pressed={amenity === id} onClick={() => setAmenity(amenity === id ? null : id)}>
                                <span className={`amenity amenity--${id}`} aria-hidden /> {a.label}
                            </button>
                        ))}
                    </div>
                    {loadingExtras && <p className="muted small">Searching OpenStreetMap…</p>}
                    {amenity && !loadingExtras && <p className="muted small">{shownExtras.length} {AMENITIES[amenity].label.toLowerCase()} within 1.5 km</p>}
                </div>

                {items.length === 0 && filter === 'saved' ? (
                    <p className="muted">Nothing saved yet — tap the bookmark on any place.</p>
                ) : (
                    <ul className="nearby">
                        {items.slice(0, 50).map((i) => (
                            <li key={i.id}>
                                <button onClick={() => navigate(i.to)}>
                                    <span className={`dot dot--${i.kind}`} aria-hidden />
                                    <span className="nearby__text">
                                        <strong>{i.name}</strong>
                                        <small>{catalogService.label(i.kind)} · {i.location}</small>
                                    </span>
                                    {i.distance != null && <span className="nearby__dist">{formatKm(i.distance)}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
}
