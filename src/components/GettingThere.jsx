import { useEffect, useState } from 'react';
import { Car, TrainFront, Footprints } from 'lucide-react';
import { guideService, placeService } from '../services/contentServices';
import { routingService, deviceService } from '../services/externalServices';
import { useTrip } from '../context/TripContext';
import { directionsUrl, distanceKm } from '../utils/geo';

const cities = guideService.cities();

// "How do I get there from where I'm staying?" — real road time via OSRM,
// public-transport directions via Google Maps, and an honest access rating.
export default function GettingThere({ place }) {
    const { trip } = useTrip();
    const defaultBase = trip.cities[0] && cities.some((c) => c.id === trip.cities[0]) ? trip.cities[0] : 'skopje';
    const [baseId, setBaseId] = useState(defaultBase);
    const [here, setHere] = useState(null);
    const [route, setRoute] = useState(null);

    const from = baseId === 'here' ? here : cities.find((c) => c.id === baseId)?.coords;

    useEffect(() => {
        if (!from) return undefined;
        const ctrl = new AbortController();
        let alive = true;
        routingService.drive(from, place.coords, ctrl.signal)
            .then((r) => alive && setRoute(r))
            .catch(() => {});
        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [from, place.coords]);

    const pickHere = async () => {
        try {
            setHere(await deviceService.currentPosition());
            setBaseId('here');
        } catch {
            /* stay on current base */
        }
    };

    const walkable = from && distanceKm(from, place.coords) < 3;
    const fresh = route && from;

    return (
        <section className="getting-there">
            <div className="card__row">
                <h3 className="h4">Getting there</h3>
                <span className={`access access--${place.access}`}>{placeService.accessLabel(place.access)}</span>
            </div>
            <div className="getting-there__from">
                <label>
                    From
                    <select value={baseId} onChange={(e) => (e.target.value === 'here' ? pickHere() : setBaseId(e.target.value))}>
                        {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="here">My location</option>
                    </select>
                </label>
            </div>
            <div className="getting-there__modes">
                <a className="mode" href={from ? routingService.drivingUrl(from, place.coords) : directionsUrl(place)} target="_blank" rel="noreferrer">
                    <Car size={18} aria-hidden />
                    <strong>{fresh ? routingService.formatMinutes(route.minutes) : '…'}</strong>
                    <small>{fresh ? `${Math.round(route.km)} km by car${route.estimated ? ' (est.)' : ''}` : 'by car'}</small>
                </a>
                {from && (
                    <a className="mode" href={routingService.transitUrl(from, place.coords)} target="_blank" rel="noreferrer">
                        <TrainFront size={18} aria-hidden />
                        <strong>Bus / train</strong>
                        <small>Live options</small>
                    </a>
                )}
                {walkable && (
                    <a className="mode" href={`${directionsUrl(place)}&travelmode=walking`} target="_blank" rel="noreferrer">
                        <Footprints size={18} aria-hidden />
                        <strong>Walk</strong>
                        <small>Under 3 km</small>
                    </a>
                )}
            </div>
            <p>{place.howToGet}</p>
        </section>
    );
}
