import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Camera, Navigation, Star } from 'lucide-react';
import { venueService } from '../services/contentServices';
import { directionsUrl } from '../utils/geo';
import PageHeader from '../components/PageHeader';
import Chips from '../components/Chips';
import Modal from '../components/Modal';
import SaveButton from '../components/SaveButton';
import AddToDay from '../components/AddToDay';
import Img from '../components/Img';
import { MiniMap } from '../components/MapView';

const TYPES = [
    { value: 'all', label: 'All' },
    { value: 'nightlife', label: 'Bars', count: venueService.count('nightlife') },
    { value: 'cafe', label: 'Cafés', count: venueService.count('cafe') },
];

export default function Nightlife() {
    const [params, setParams] = useSearchParams();
    const type = params.get('type') || 'all';
    const open = venueService.byId(params.get('open'));

    useEffect(() => {
        document.title = 'Bars & Cafés · Discover Macedonia';
    }, []);

    const set = (k, v) => {
        const next = new URLSearchParams(params);
        if (!v || v === 'all') next.delete(k);
        else next.set(k, v);
        setParams(next, { replace: k !== 'open' });
    };

    const shown = useMemo(() => venueService.ofType(type), [type]);

    return (
        <>
            <PageHeader eyebrow="Кафеани · Bars &amp; cafés" title="Bars &amp; cafés" image="/images/nighlife.webp">
                Specialty coffee by day, cocktails and rock bars by night — mostly in walkable Debar Maalo and Centar.
            </PageHeader>

            <div className="container">
                <div className="toolbar">
                    <Chips label="Type" options={TYPES} value={type} onChange={(v) => set('type', v)} />
                </div>

                <div className="grid grid--cards">
                    {shown.map((v) => (
                        <article key={v.id} className="card card--link">
                            <div className="card__media">
                                <Img src={v.image} alt={v.name} className="card__img" />
                                <SaveButton id={v.id} name={v.name} />
                                <span className={`tag tag--float tag--${v.type}`}>{v.category}</span>
                            </div>
                            <div className="card__body">
                                <h3 className="card__title">
                                    <button className="stretched" onClick={() => set('open', v.id)}>{v.name}</button>
                                </h3>
                                <p className="card__meta"><MapPin size={14} /> {v.location}</p>
                                <p className="muted clamp-2">{v.description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <Modal open={Boolean(open)} onClose={() => set('open', null)} wide labelledBy="venue-title">
                {open && (
                    <article className="detail">
                        <Img src={open.image} alt={open.name} className="detail__img" eager />
                        <div className="detail__body">
                            <span className={`tag tag--${open.type}`}>{open.category}</span>
                            <h2 className="h2" id="venue-title">{open.name}</h2>
                            <ul className="meta">
                                <li><MapPin size={16} /> {open.location}</li>
                                {open.specialty && <li><Star size={16} /> {open.specialty}</li>}
                            </ul>
                            <p className="lead-sm">{open.description}</p>
                            <div className="detail__actions">
                                <SaveButton id={open.id} name={open.name} variant="button" />
                                <AddToDay id={open.id} name={open.name} />
                                <a className="btn btn--soft" href={directionsUrl(open)} target="_blank" rel="noreferrer"><Navigation size={18} /> Directions</a>
                                <a className="btn btn--soft" href={open.instagram} target="_blank" rel="noreferrer"><Camera size={18} /> Instagram</a>
                            </div>
                            <MiniMap item={{ ...open, kind: open.type }} />
                        </div>
                    </article>
                )}
            </Modal>
        </>
    );
}
