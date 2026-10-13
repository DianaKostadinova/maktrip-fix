import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, LocateFixed, Navigation, Share2, Maximize2, X } from 'lucide-react';
import { AMENITIES, nearbyService, deviceService } from '../services/externalServices';
import { essentialsService } from '../services/contentServices';
import { formatKm, directionsUrl } from '../utils/geo';
import { toCyrillic, toLatin, isCyrillic, ALPHABET } from '../utils/cyrillic';
import { useToast } from '../context/ToastContext';

/* ---------- Nearby: toilets, water, pharmacies, ATMs… ---------- */
export function NearbyFinder() {
    const toast = useToast();
    const [kind, setKind] = useState('toilets');
    const [pos, setPos] = useState(null);
    const [state, setState] = useState({ status: 'idle', items: [] });

    const locate = async () => {
        try {
            setState({ status: 'locating', items: [] });
            setPos(await deviceService.currentPosition());
        } catch (e) {
            setState({ status: 'idle', items: [] });
            toast.error(e.message);
        }
    };

    useEffect(() => {
        if (!pos) return undefined;
        const ctrl = new AbortController();
        let alive = true;
        nearbyService
            .find(kind, pos, kind === 'hospital' ? 5000 : 1500, ctrl.signal)
            .then((r) => alive && setState({ status: 'done', stale: r.stale, items: r.items.slice(0, 12) }))
            .catch((e) => alive && e.name !== 'AbortError' && setState({ status: 'error', items: [] }));
        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [kind, pos]);

    const loading = state.status === 'locating' || (pos && state.status !== 'done' && state.status !== 'error');

    return (
        <div className="panel panel--span nearby-finder">
            <div className="card__row">
                <h3 className="h4">Find nearby</h3>
                {!pos && (
                    <button className="btn btn--primary btn--sm" onClick={locate}>
                        <LocateFixed size={16} /> Use my location
                    </button>
                )}
            </div>
            <div className="chips chips--wrap" role="radiogroup" aria-label="What to find">
                {Object.entries(AMENITIES).map(([id, a]) => (
                    <button key={id} role="radio" aria-checked={kind === id} className={`chip ${kind === id ? 'is-active' : ''}`} onClick={() => setKind(id)}>
                        {a.label}
                    </button>
                ))}
            </div>
            {!pos && <p className="muted small">Public toilets, drinking fountains (česmi), pharmacies and ATMs from OpenStreetMap. Coverage is best in Skopje, Ohrid and Bitola — cafés will usually let you use their toilet if you buy a coffee.</p>}
            {loading && <div className="skeleton-lines"><span /><span /><span /></div>}
            {state.status === 'error' && <p className="muted">OpenStreetMap’s servers are busy. Try again in a minute — in the meantime, cafés, malls and petrol stations usually have toilets.</p>}
            {state.stale && <p className="muted small">Showing saved results — couldn’t refresh just now.</p>}
            {state.status === 'done' && state.items.length === 0 && <p className="muted">Nothing mapped within walking distance. Try a café, mall or petrol station.</p>}
            {state.items.length > 0 && (
                <ul className="nearby-list">
                    {state.items.map((i) => (
                        <li key={i.id}>
                            <span className="nearby-list__dist">{formatKm(i.distance)}</span>
                            <span className="nearby-list__text">
                                <strong>{i.name}</strong>
                                {i.details.length > 0 && <small className="muted">{i.details.join(' · ')}</small>}
                            </span>
                            <a className="btn btn--soft btn--sm" href={`${directionsUrl(i)}&travelmode=walking`} target="_blank" rel="noreferrer">
                                <Navigation size={14} /> Walk
                            </a>
                        </li>
                    ))}
                </ul>
            )}
            {pos && <p className="muted small">Data © OpenStreetMap contributors. Missing something? You can add it at openstreetmap.org.</p>}
        </div>
    );
}

/* ---------- Cyrillic <-> Latin ---------- */
export function CyrillicTool() {
    const [text, setText] = useState('Скопје, Охрид, Битола');
    const out = useMemo(() => (isCyrillic(text) ? toLatin(text) : toCyrillic(text)), [text]);
    return (
        <div className="panel">
            <h3 className="h4">Read the signs</h3>
            <p className="muted small">Type or paste Cyrillic to read it — or type Latin to see how it’s written.</p>
            <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to transliterate" />
            <div className="translit-out" aria-live="polite">
                <ArrowLeftRight size={16} aria-hidden /> {out || '…'}
            </div>
            <details className="alphabet">
                <summary>The 31 letters</summary>
                <ul>
                    {ALPHABET.map(([c, l]) => (
                        <li key={c}>
                            <b>{c.toUpperCase()}</b>
                            <span>{l}</span>
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}

/* ---------- Show-the-driver card ---------- */
export function DriverCard() {
    const [text, setText] = useState('');
    const [big, setBig] = useState(false);
    const shown = isCyrillic(text) ? text : toCyrillic(text);
    return (
        <div className="panel">
            <h3 className="h4">Show the driver</h3>
            <p className="muted small">Type an address or place name; it’s converted to Cyrillic and shown full-screen.</p>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Ulica Makedonija 12" aria-label="Destination" />
            <button className="btn btn--primary btn--sm" disabled={!text.trim()} onClick={() => setBig(true)}>
                <Maximize2 size={16} /> Show full screen
            </button>
            {big && (
                <div className="driver-card" role="dialog" aria-label="Destination for the driver" onClick={() => setBig(false)}>
                    <button className="icon-btn driver-card__close" aria-label="Close"><X size={24} /></button>
                    <p className="driver-card__ask">Ве молам, однесете ме до:</p>
                    <p className="driver-card__dest">{shown}</p>
                    <p className="driver-card__latin">{text}</p>
                    <p className="driver-card__ask">Колку ќе чини? · How much will it cost?</p>
                </div>
            )}
        </div>
    );
}

/* ---------- Tip calculator ---------- */
export function TipCalculator() {
    const [bill, setBill] = useState('1200');
    const [pct, setPct] = useState(10);
    const [people, setPeople] = useState(2);
    const { tip, total, totalEur, each } = essentialsService.tipFor(parseFloat(bill) || 0, pct, people);
    return (
        <div className="panel">
            <h3 className="h4">Tip & split</h3>
            <div className="field-row">
                <label className="field"><span>Bill (MKD)</span><input inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} /></label>
                <label className="field"><span>People</span><input type="number" min="1" max="30" value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))} /></label>
            </div>
            <div className="segmented">
                {[0, 5, 10, 15].map((p) => (
                    <button key={p} aria-pressed={pct === p} onClick={() => setPct(p)}>{p}%</button>
                ))}
            </div>
            <dl className="facts">
                <div><dt>Tip (rounded)</dt><dd>{tip} MKD</dd></div>
                <div><dt>Total</dt><dd>{total} MKD · €{totalEur.toFixed(2)}</dd></div>
                <div><dt>Each</dt><dd>{each} MKD</dd></div>
            </dl>
            <p className="muted small">10% is normal in restaurants; round up for taxis and cafés.</p>
        </div>
    );
}

/* ---------- Emergency: share location ---------- */
export function ShareLocation() {
    const toast = useToast();
    const share = async () => {
        try {
            if ((await deviceService.shareLocation()) === 'copied') toast.success('Location copied — paste it into a message');
        } catch (e) {
            if (e.name !== 'AbortError') toast.error(e.message);
        }
    };
    return (
        <button className="btn btn--soft" onClick={share}>
            <Share2 size={16} /> Share my exact location
        </button>
    );
}
