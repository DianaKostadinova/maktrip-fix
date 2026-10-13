import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Square, Save, Copy, Bookmark, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { plannerService } from '../services/plannerService';
import { featureService } from '../services/featureService';
import { deviceService } from '../services/externalServices';
import { useSaved } from '../context/SavedContext';
import { useTrip } from '../context/TripContext';
import { guideService } from '../services/contentServices';

const CITIES = [...guideService.cities().map((c) => c.name.split(' ')[0]), 'Tetovo'];
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import PlanText from '../components/PlanText';


const INTERESTS = ['History', 'Nature & hiking', 'Food', 'Nightlife', 'Monasteries', 'Lakes & swimming', 'Wine', 'Photography', 'Coffee culture', 'Budget hacks'];
const PACES = [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'packed', label: 'Packed' },
];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso, n) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

function AiStatus({ health }) {
    if (health.state === 'checking') return <span className="status">Checking planner…</span>;
    if (health.state === 'ok') return <span className="status status--ok"><CheckCircle2 size={14} /> Planner online</span>;
    return <span className="status status--warn"><AlertTriangle size={14} /> Planner offline</span>;
}

function PlannerForm() {
    const { items, savePlan } = useSaved();
    const { trip } = useTrip();
    const toast = useToast();
    const navigate = useNavigate();
    const savedPlaces = items.filter((i) => i.coords).map((i) => i.name);

    // Pre-fill from the trip helper when the traveller has set one up.
    const [form, setForm] = useState(() => ({
        city: guideService.cityById(trip.cities[0])?.name.split(' ')[0] ?? 'Skopje',
        startDate: trip.startDate || addDays(today(), 7),
        endDate: trip.endDate || addDays(today(), 9),
        budgetEur: trip.budgetEur || 300,
        travelers: trip.travelers || 2,
        pace: 'balanced',
        interests: ['History', 'Food'],
        useSaved: true,
        notes: '',
    }));
    const [health, setHealth] = useState({ state: 'checking' });
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState('idle'); // idle | streaming | done | error
    const abortRef = useRef(null);
    const resultRef = useRef(null);

    useEffect(() => {
        document.title = 'Trip planner · Discover Macedonia';
        const ctrl = new AbortController();
        plannerService
            .status(ctrl.signal)
            .then((st) => setHealth(st.state === 'ok' ? st : { ...st, reason: st.state, state: 'down' }))
            .catch(() => {});
        return () => ctrl.abort();
    }, []);

    const days = form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
    const toggleInterest = (i) => setForm((f) => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i] }));

    const generate = async (e) => {
        e.preventDefault();
        const invalid = plannerService.validate(form);
        if (invalid) return toast.error(invalid);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setOutput('');
        setStatus('streaming');
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        try {
            await plannerService.generate(form, savedPlaces, { onText: setOutput, signal: ctrl.signal });
            setStatus('done');
        } catch (err) {
            if (err.name === 'AbortError') {
                setStatus('done');
                return;
            }
            setStatus('error');
            toast.error(err.message);
        }
    };

    const save = async () => {
        try {
            await savePlan(output, { city: form.city, startDate: form.startDate, endDate: form.endDate });
            toast.success('Plan saved', { action: { label: 'View', onClick: () => navigate('/saved') } });
        } catch (err) {
            toast.error(err.message);
        }
    };

    const offline = health.state === 'down';

    return (
        <>
            <PageHeader eyebrow="Нацрт · Planner" title="Trip planner" image="/images/planner.webp" actions={<AiStatus health={health} />}>
                Tell it your dates, base and interests; it drafts a day-by-day plan with timings, buses and prices in denars. Treat it as a starting point, then refine it in My trip.
            </PageHeader>

            <div className="container planner">
                <form className="panel planner__form" onSubmit={generate}>
                    <fieldset>
                        <legend>Base city</legend>
                        <div className="chips">
                            {CITIES.map((c) => (
                                <button type="button" key={c} className={`chip ${form.city === c ? 'is-active' : ''}`} aria-pressed={form.city === c} onClick={() => set('city')(c)}>{c}</button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="field-row">
                        <label className="field">
                            <span>From</span>
                            <input type="date" value={form.startDate} min={today()} onChange={set('startDate')} required />
                        </label>
                        <label className="field">
                            <span>To</span>
                            <input type="date" value={form.endDate} min={form.startDate} onChange={set('endDate')} required />
                        </label>
                    </div>
                    <p className="muted small">{days > 0 ? `${days} day${days > 1 ? 's' : ''}` : 'Pick valid dates'}{days > 14 && ' — max 14'}</p>

                    <div className="field-row">
                        <label className="field">
                            <span>Budget (EUR, total)</span>
                            <input type="number" min="30" step="10" value={form.budgetEur} onChange={set('budgetEur')} required />
                        </label>
                        <label className="field">
                            <span>Travellers</span>
                            <input type="number" min="1" max="12" value={form.travelers} onChange={set('travelers')} required />
                        </label>
                    </div>

                    <fieldset>
                        <legend>Pace</legend>
                        <div className="segmented">
                            {PACES.map((p) => (
                                <button type="button" key={p.value} aria-pressed={form.pace === p.value} onClick={() => set('pace')(p.value)}>{p.label}</button>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Interests</legend>
                        <div className="chips">
                            {INTERESTS.map((i) => (
                                <button type="button" key={i} className={`chip ${form.interests.includes(i) ? 'is-active' : ''}`} aria-pressed={form.interests.includes(i)} onClick={() => toggleInterest(i)}>{i}</button>
                            ))}
                        </div>
                    </fieldset>

                    <label className="check">
                        <input type="checkbox" checked={form.useSaved} onChange={(e) => setForm((f) => ({ ...f, useSaved: e.target.checked }))} disabled={!savedPlaces.length} />
                        <span>
                            <Bookmark size={14} /> Include my saved places ({savedPlaces.length})
                            {!savedPlaces.length && <> — <Link to="/places">save some</Link></>}
                        </span>
                    </label>

                    <label className="field">
                        <span>Anything else? (optional)</span>
                        <textarea rows={2} maxLength={500} value={form.notes} onChange={set('notes')} placeholder="Vegetarian, travelling with kids, no car…" />
                    </label>

                    {status === 'streaming' ? (
                        <button type="button" className="btn btn--soft btn--lg btn--block" onClick={() => abortRef.current?.abort()}><Square size={18} /> Stop</button>
                    ) : (
                        <button className="btn btn--primary btn--lg btn--block" disabled={offline || days < 1 || days > 14}>Draft my itinerary</button>
                    )}

                    {offline && (
                        <div className="callout callout--warn">
                            <strong>The planner isn’t reachable.</strong>
                            {health.reason === 'api-down' ? (
                                <p>Start the backend: <code>docker compose up</code> (or <code>cd backend && ./gradlew bootRun</code>).</p>
                            ) : health.reason === 'model-down' ? (
                                <p>Start Ollama (<code>ollama serve</code>) and reload.</p>
                            ) : (
                                <p>Download the model: <code>ollama pull {health.model}</code></p>
                            )}
                        </div>
                    )}
                </form>

                <section className="planner__result" ref={resultRef} aria-live="polite" aria-busy={status === 'streaming'}>
                    {!output && status === 'idle' && (
                        <div className="planner__placeholder">
                            <span className="planner__glyph" aria-hidden>П</span>
                            <h2 className="h3">Your itinerary appears here</h2>
                            <p className="muted">It writes live, day by day — usually 20–60 seconds.</p>
                        </div>
                    )}
                    {status === 'streaming' && !output && <div className="skeleton-lines skeleton-lines--lg"><span /><span /><span /><span /><span /></div>}
                    {output && (
                        <div className="panel">
                            <div className="card__row">
                                <h2 className="h3">{form.city} · {days} day{days > 1 ? 's' : ''}</h2>
                                {status !== 'streaming' && (
                                    <div className="row-gap">
                                        <button className="btn btn--sm btn--primary" onClick={save}><Save size={16} /> Save</button>
                                        <button className="btn btn--sm btn--ghost" onClick={() => deviceService.copy(output).then(() => toast.success('Copied'))} aria-label="Copy plan"><Copy size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <PlanText text={output} />
                            {status === 'streaming' && <span className="cursor" aria-hidden />}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

// Shown while PLANNER_ENABLED is off. The full planner above is kept intact —
// flip the flag (and run Ollama) to switch it on.
function ComingSoon() {
    useEffect(() => {
        document.title = 'Trip planner — coming soon · Discover Macedonia';
    }, []);
    return (
        <>
            <PageHeader eyebrow="Нацрт · Planner" title="Trip planner" image="/images/planner.webp" actions={<span className="status">Coming soon</span>}>
                A day-by-day itinerary drafted for your dates, base city and interests — with timings, buses and prices in denars.
            </PageHeader>
            <div className="container">
                <div className="soon panel">
                    <span className="planner__glyph" aria-hidden>Н</span>
                    <div className="soon__text">
                        <p className="kicker">Coming soon</p>
                        <h2 className="h2">We’re teaching it the country first.</h2>
                        <p>
                            The planner will turn your dates, interests and saved places into a realistic plan — grouped by area, timed around
                            opening hours and bus schedules, priced in denars. Until then, you can build the same plan by hand.
                        </p>
                        <ul className="ticks">
                            <li>Save places as you browse (the bookmark on every card)</li>
                            <li>Drop them onto days in My trip</li>
                            <li>Use the checklist and budget to finish the plan</li>
                        </ul>
                        <div className="row-gap">
                            <Link to="/trip" className="btn btn--primary">Open My trip</Link>
                            <Link to="/places" className="btn btn--soft">Browse places</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Planner() {
    return featureService.plannerEnabled() ? <PlannerForm /> : <ComingSoon />;
}
