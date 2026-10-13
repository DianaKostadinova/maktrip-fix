import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Clock, Ticket, Headphones, Pause, Navigation } from 'lucide-react';
import { placeService } from '../services/contentServices';
import { wikiService, deviceService } from '../services/externalServices';
import { directionsUrl } from '../utils/geo';
import PageHeader from '../components/PageHeader';
import Chips from '../components/Chips';
import Modal from '../components/Modal';
import SaveButton from '../components/SaveButton';
import AddToDay from '../components/AddToDay';
import EmptyState from '../components/EmptyState';
import Img from '../components/Img';
import { MiniMap } from '../components/MapView';
import GettingThere from '../components/GettingThere';

function useSpeech() {
    const [speakingId, setSpeakingId] = useState(null);
    useEffect(() => () => deviceService.stopSpeaking(), []);
    const speak = (id, text) => {
        deviceService.stopSpeaking();
        if (speakingId === id) return setSpeakingId(null);
        deviceService.speakEnglish(text, () => setSpeakingId(null));
        setSpeakingId(id);
    };
    return { speakingId, speak, supported: deviceService.canSpeak() };
}

function PlaceDetail({ place, speech }) {
    const [wiki, setWiki] = useState({ loading: true });

    useEffect(() => {
        let alive = true;
        wikiService.summary(place.wikiTitle || place.name)
            .then((r) => alive && setWiki({ loading: false, ...r }))
            .catch(() => alive && setWiki({ loading: false }));
        return () => {
            alive = false;
        };
    }, [place]);

    const speaking = speech.speakingId === place.id;

    return (
        <article className="detail">
            <figure className="detail__figure">
                <Img src={place.image} alt={place.name} className="detail__img" eager />
                {place.credit && (
                    <figcaption>
                        Photo: {place.credit.author} · <a href={place.credit.page} target="_blank" rel="noreferrer">{place.credit.license}</a>
                    </figcaption>
                )}
            </figure>
            <div className="detail__body">
                <span className="tag">{place.category}</span>
                <h2 className="h2" id="detail-title">{place.name}</h2>
                <ul className="meta">
                    <li><MapPin size={16} /> {place.location}</li>
                    {place.duration && <li><Clock size={16} /> {place.duration}</li>}
                    {place.cost && <li><Ticket size={16} /> {place.cost}</li>}
                </ul>
                <p className="lead-sm">{place.description}</p>

                <div className="detail__actions">
                    <SaveButton id={place.id} name={place.name} variant="button" />
                    <AddToDay id={place.id} name={place.name} />
                    <a className="btn btn--soft" href={directionsUrl(place)} target="_blank" rel="noreferrer">
                        <Navigation size={18} /> Directions
                    </a>
                    {speech.supported && wiki.text && (
                        <button className="btn btn--soft" onClick={() => speech.speak(place.id, wiki.text)} aria-pressed={speaking}>
                            {speaking ? <Pause size={18} /> : <Headphones size={18} />} {speaking ? 'Stop' : 'Listen'}
                        </button>
                    )}
                </div>

                <GettingThere place={place} />

                <h3 className="h4">About</h3>
                {wiki.loading ? (
                    <div className="skeleton-lines" aria-label="Loading summary"><span /><span /><span /></div>
                ) : wiki.text ? (
                    <p>
                        {wiki.text}{' '}
                        {wiki.url && <a href={wiki.url} target="_blank" rel="noreferrer">Wikipedia</a>}
                    </p>
                ) : (
                    <p className="muted">No summary available offline.</p>
                )}

                <MiniMap item={{ ...place, kind: 'place' }} />
            </div>
        </article>
    );
}

export default function Places() {
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const region = params.get('region') || 'All';
    const category = params.get('category') || 'All';
    const openId = params.get('open');
    const speech = useSpeech();

    useEffect(() => {
        document.title = 'Places · Discover Macedonia';
    }, []);

    const setParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (!value || value === 'All') next.delete(key);
        else next.set(key, value);
        setParams(next, { replace: key !== 'open' });
    };

    const filtered = useMemo(() => placeService.filter({ query, region, category }), [query, region, category]);
    const open = placeService.byId(openId);

    return (
        <>
            <PageHeader eyebrow="Места · Places" title="Places worth the trip" image="/images/places/hd/matka-canyon.webp">
                {placeService.all().length} landmarks, monasteries, lakes and ancient cities — from Skopje’s bazaar to Ohrid’s cliffs.
            </PageHeader>

            <div className="container">
                <div className="toolbar">
                    <label className="search-field">
                        <Search size={18} aria-hidden />
                        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places…" aria-label="Search places" />
                    </label>
                    <Chips label="Region" options={['All', ...placeService.regions()]} value={region} onChange={(v) => setParam('region', v)} />
                    <Chips label="Category" options={['All', ...placeService.categories()]} value={category} onChange={(v) => setParam('category', v)} />
                </div>

                <p className="result-count" aria-live="polite">
                    {filtered.length} {filtered.length === 1 ? 'place' : 'places'}
                </p>

                {filtered.length === 0 ? (
                    <EmptyState icon={MapPin} title="Nothing matches those filters" action={<button className="btn btn--soft" onClick={() => { setQuery(''); setParams({}); }}>Clear filters</button>} />
                ) : (
                    <div className="grid grid--cards">
                        {filtered.map((p) => (
                            <article key={p.id} className="card card--link">
                                <div className="card__media">
                                    <Img src={p.image} alt={p.name} className="card__img" />
                                    <SaveButton id={p.id} name={p.name} />
                                    <span className="tag tag--float">{p.category}</span>
                                </div>
                                <div className="card__body">
                                    <h3 className="card__title">
                                        <button className="stretched" onClick={() => setParam('open', p.id)}>{p.name}</button>
                                    </h3>
                                    <p className="card__meta"><MapPin size={14} /> {p.location}{p.duration && <> · <Clock size={14} /> {p.duration}</>}</p>
                                    <p className="muted clamp-2">{p.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={Boolean(open)} onClose={() => setParam('open', null)} wide labelledBy="detail-title">
                {open && <PlaceDetail key={open.id} place={open} speech={speech} />}
            </Modal>
        </>
    );
}
