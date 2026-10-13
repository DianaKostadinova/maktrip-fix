import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUp, ArrowDown, X, Plus, CalendarPlus, Share2, Trash2, Wand2 } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { useSaved } from '../context/SavedContext';
import { useToast } from '../context/ToastContext';
import { tripService, expenseCategories } from '../services/tripService';
import { guideService } from '../services/contentServices';
import { catalogService } from '../services/catalogService';
import { weatherService } from '../services/externalServices';
import { featureService } from '../services/featureService';

const cities = guideService.cities();
const EXPENSE_CATEGORIES = expenseCategories();
import PageHeader from '../components/PageHeader';
import SavedPanel from './Saved';
import PlanText from '../components/PlanText';

const TABS = [
    ['overview', 'Overview'],
    ['days', 'Day by day'],
    ['checklist', 'Checklist'],
    ['budget', 'Budget'],
    ['saved', 'Saved'],
];

const fmtDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
function Setup() {
    const { trip, patch, dates } = useTrip();
    const toggleCity = (id) => patch((t) => ({ cities: t.cities.includes(id) ? t.cities.filter((c) => c !== id) : [...t.cities, id] }));
    return (
        <div className="panel stack">
            <h2 className="h3">Trip basics</h2>
            <div className="field-row">
                <label className="field">
                    <span>Arrive</span>
                    <input type="date" value={trip.startDate} onChange={(e) => patch({ startDate: e.target.value, endDate: trip.endDate && trip.endDate < e.target.value ? e.target.value : trip.endDate })} />
                </label>
                <label className="field">
                    <span>Leave</span>
                    <input type="date" value={trip.endDate} min={trip.startDate} onChange={(e) => patch({ endDate: e.target.value })} />
                </label>
            </div>
            <div className="field-row">
                <label className="field">
                    <span>Travellers</span>
                    <input type="number" min="1" max="20" value={trip.travelers} onChange={(e) => patch({ travelers: Number(e.target.value) })} />
                </label>
                <label className="field">
                    <span>Budget (EUR, total)</span>
                    <input type="number" min="0" step="10" value={trip.budgetEur || ''} placeholder="e.g. 600" onChange={(e) => patch({ budgetEur: Number(e.target.value) })} />
                </label>
            </div>
            <fieldset>
                <legend>Where are you going?</legend>
                <div className="chips chips--wrap">
                    {cities.map((c) => (
                        <button type="button" key={c.id} className={`chip ${trip.cities.includes(c.id) ? 'is-active' : ''}`} aria-pressed={trip.cities.includes(c.id)} onClick={() => toggleCity(c.id)}>
                            {c.name}
                        </button>
                    ))}
                </div>
            </fieldset>
            {dates.length > 0 && <p className="muted small">{dates.length} days · {trip.cities.length ? trip.cities.map((c) => cities.find((x) => x.id === c)?.name).join(' → ') : 'pick some cities'}</p>}
        </div>
    );
}

function Countdown() {
    const { trip } = useTrip();
    const countdown = tripService.countdown(trip);
    if (!countdown) return null;
    const { days, label } = countdown;
    return (
        <div className="countdown">
            <span className="countdown__num">{days > 0 ? days : '✓'}</span>
            <span>{label}</span>
        </div>
    );
}

function TripWeather() {
    const { trip, dates } = useTrip();
    const city = cities.find((c) => c.id === trip.cities[0]) ?? cities[0];
    const [w, setW] = useState(null);
    useEffect(() => {
        const ctrl = new AbortController();
        weatherService.forecast(city.coords, ctrl.signal).then(setW).catch(() => {});
        return () => ctrl.abort();
    }, [city]);
    const inRange = w?.days.filter((d) => dates.includes(d.date)) ?? [];
    const month = tripService.climate(trip);
    return (
        <div className="panel">
            <p className="kicker">Weather · {city.name}</p>
            {inRange.length ? (
                <ul className="forecast">
                    {inRange.slice(0, 7).map((d) => (
                        <li key={d.date}>
                            <strong>{fmtDay(d.date).split(',')[0]}</strong>
                            <span className="forecast__t">{d.max}° / {d.min}°</span>
                            <small>{d.text}{d.rain > 30 ? ` · ${d.rain}% rain` : ''}</small>
                        </li>
                    ))}
                </ul>
            ) : month ? (
                <p>
                    Typically <strong>{month.temp}</strong> in {month.m}. {month.note}. <span className="muted small">Live forecast appears 16 days before you go.</span>
                </p>
            ) : (
                <p className="muted">Add dates to see the forecast.</p>
            )}
        </div>
    );
}

function Overview({ go }) {
    const { trip, dates } = useTrip();
    const { ids, plan } = useSaved();
    const events = tripService.festivalsDuring(trip);
    const { total: totalChecks, done } = tripService.checklist(trip);
    const { spent } = tripService.budget(trip);
    const planned = tripService.stopsPlanned(trip);

    return (
        <div className="trip-overview">
            <div className="stack">
                <Countdown />
                <Setup />
            </div>
            <div className="stack">
                <div className="stat-grid">
                    <button className="stat" onClick={() => go('saved')}><strong>{ids.length}</strong><span>saved</span></button>
                    <button className="stat" onClick={() => go('days')}><strong>{planned}</strong><span>stops planned</span></button>
                    <button className="stat" onClick={() => go('checklist')}><strong>{done}/{totalChecks}</strong><span>checklist</span></button>
                    <button className="stat" onClick={() => go('budget')}><strong>€{Math.round(spent)}</strong><span>{trip.budgetEur ? `of €${trip.budgetEur}` : 'spent'}</span></button>
                </div>
                <TripWeather />
                {events.length > 0 && (
                    <div className="panel">
                        <p className="kicker">On during your trip</p>
                        <ul className="season__events">
                            {events.map((f) => <li key={f.name}><strong>{f.name}</strong> <span className="muted">{f.when} · {f.where}</span></li>)}
                        </ul>
                    </div>
                )}
                <div className="panel">
                    <p className="kicker">Next steps</p>
                    <ol className="steps">
                        {!dates.length && <li>Set your dates</li>}
                        {ids.length < 3 && <li><Link to="/places">Save a few places</Link> you want to see</li>}
                        {ids.length >= 3 && planned === 0 && <li><button className="link-btn" onClick={() => go('days')}>Drop saved places onto days</button></li>}
                        {!plan && featureService.plannerEnabled() && <li><Link to="/planner">Get a draft itinerary</Link> from the planner</li>}
                        {done < totalChecks && <li><button className="link-btn" onClick={() => go('checklist')}>Work through the checklist</button></li>}
                        <li><Link to="/essentials">Read the essentials</Link> — and save 112</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

function Days() {
    const { trip, dates, addToDay, removeFromDay, moveInDay } = useTrip();
    const { items, plan } = useSaved();
    const toast = useToast();
    const assigned = new Set(Object.values(trip.days).flat());
    const unassigned = items.filter((i) => !assigned.has(i.id));

    const exportIcs = () => tripService.exportCalendar(trip);

    const share = async () => {
        try {
            if ((await tripService.share(trip)) === 'copied') toast.success('Itinerary copied');
        } catch {
            /* user cancelled */
        }
    };

    if (!dates.length) {
        return <div className="panel"><p>Set your arrival and departure dates in <strong>Overview</strong> first.</p></div>;
    }

    return (
        <div className="stack-lg">
            <div className="row-gap">
                <button className="btn btn--soft btn--sm" onClick={exportIcs}><CalendarPlus size={16} /> Add to calendar</button>
                <button className="btn btn--soft btn--sm" onClick={share}><Share2 size={16} /> Share</button>
                {featureService.plannerEnabled() ? (
                    <Link className="btn btn--soft btn--sm" to="/planner"><Wand2 size={16} /> Draft with planner</Link>
                ) : (
                    <Link className="btn btn--soft btn--sm" to="/planner"><Wand2 size={16} /> AI planner · coming soon</Link>
                )}
            </div>
            <div className="days">
                {dates.map((d, i) => {
                    const list = (trip.days[d] || []).map(catalogService.byId).filter(Boolean);
                    return (
                        <section key={d} className="day">
                            <header className="day__head">
                                <span className="day__num">{String(i + 1).padStart(2, '0')}</span>
                                <span>
                                    <strong>{fmtDay(d)}</strong>
                                    <small>{list.length ? `${list.length} stop${list.length > 1 ? 's' : ''}` : 'Free day'}</small>
                                </span>
                            </header>
                            <ol className="day__list">
                                {list.map((it, idx) => (
                                    <li key={it.id}>
                                        <Link to={it.to}>{it.name}</Link>
                                        <span className="day__tools">
                                            <button className="icon-btn icon-btn--sm" aria-label="Move up" onClick={() => moveInDay(d, idx, -1)} disabled={idx === 0}><ArrowUp size={14} /></button>
                                            <button className="icon-btn icon-btn--sm" aria-label="Move down" onClick={() => moveInDay(d, idx, 1)} disabled={idx === list.length - 1}><ArrowDown size={14} /></button>
                                            <button className="icon-btn icon-btn--sm" aria-label={`Remove ${it.name}`} onClick={() => removeFromDay(d, it.id)}><X size={14} /></button>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                            {items.length > 0 && (
                                <select className="day__add" value="" onChange={(e) => e.target.value && addToDay(d, e.target.value)} aria-label={`Add a saved place to day ${i + 1}`}>
                                    <option value="">+ Add a saved place…</option>
                                    {(unassigned.length ? unassigned : items).map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                                </select>
                            )}
                        </section>
                    );
                })}
            </div>
            {!items.length && <p className="muted">Save places (bookmark button) and they’ll show up here to drop onto days.</p>}
            {plan?.text && (
                <details className="panel plan-details">
                    <summary>Planner draft{plan.meta ? ` · ${plan.meta.city}` : ''}</summary>
                    <PlanText text={plan.text} />
                </details>
            )}
        </div>
    );
}

function Checklist() {
    const { trip, toggleCheck, addCustom, removeCustom } = useTrip();
    const [text, setText] = useState('');
    const { groups, warm, total, done } = tripService.checklist(trip);

    return (
        <div className="stack-lg">
            <div className="progress" aria-label={`${done} of ${total} done`}>
                <span style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
                <small>{done} / {total} done{warm != null ? ` · packing for ${warm ? 'warm' : 'cold'} weather` : ''}</small>
            </div>
            <div className="grid grid--panels">
                {groups.map((g) => (
                    <div key={g.group} className="panel">
                        <h3 className="h4">{g.group}</h3>
                        <ul className="checks">
                            {g.items.map((it) => (
                                <li key={it.id}>
                                    <label className={`check ${trip.checked[it.id] ? 'is-done' : ''}`}>
                                        <input type="checkbox" checked={Boolean(trip.checked[it.id])} onChange={() => toggleCheck(it.id)} />
                                        <span>{it.text}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div className="panel">
                    <h3 className="h4">My own</h3>
                    <ul className="checks">
                        {trip.custom.map((it) => (
                            <li key={it.id}>
                                <label className={`check ${trip.checked[it.id] ? 'is-done' : ''}`}>
                                    <input type="checkbox" checked={Boolean(trip.checked[it.id])} onChange={() => toggleCheck(it.id)} />
                                    <span>{it.text}</span>
                                </label>
                                <button className="icon-btn icon-btn--sm" aria-label={`Delete ${it.text}`} onClick={() => removeCustom(it.id)}><X size={14} /></button>
                            </li>
                        ))}
                    </ul>
                    <form
                        className="inline-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (text.trim()) addCustom(text.trim());
                            setText('');
                        }}
                    >
                        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item…" aria-label="New checklist item" maxLength={120} />
                        <button className="btn btn--primary btn--sm" aria-label="Add"><Plus size={16} /></button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Budget() {
    const { trip, addExpense, removeExpense } = useTrip();
    const [form, setForm] = useState({ label: '', amount: '', currency: 'MKD', category: 'Food' });
    const { spent, spentMkd, byCategory: byCat, left, perDay } = useMemo(() => tripService.budget(trip), [trip]);

    const submit = (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (!form.label.trim() || !(amount > 0)) return;
        addExpense({ ...form, label: form.label.trim(), amount, date: new Date().toISOString().slice(0, 10) });
        setForm((f) => ({ ...f, label: '', amount: '' }));
    };

    return (
        <div className="trip-overview">
            <div className="stack">
                <div className="stat-grid">
                    <div className="stat"><strong>€{Math.round(spent)}</strong><span>spent · {spentMkd.toLocaleString()} MKD</span></div>
                    <div className={`stat ${left != null && left < 0 ? 'stat--warn' : ''}`}><strong>{left != null ? `€${Math.round(left)}` : '—'}</strong><span>{left != null ? 'left' : 'set a budget in Overview'}</span></div>
                    {perDay != null && <div className="stat"><strong>€{Math.round(perDay)}</strong><span>per day left</span></div>}
                </div>
                {trip.budgetEur > 0 && (
                    <div className="progress" aria-label="Budget used">
                        <span style={{ width: `${Math.min(100, (spent / trip.budgetEur) * 100)}%` }} />
                        <small>{Math.round((spent / trip.budgetEur) * 100)}% of budget</small>
                    </div>
                )}
                <form className="panel stack" onSubmit={submit}>
                    <h3 className="h4">Add expense</h3>
                    <label className="field"><span>What</span><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Burek & yoghurt" required maxLength={80} /></label>
                    <div className="field-row">
                        <label className="field"><span>Amount</span><input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
                        <label className="field"><span>Currency</span>
                            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                                <option>MKD</option><option>EUR</option>
                            </select>
                        </label>
                    </div>
                    <div className="chips chips--wrap">
                        {EXPENSE_CATEGORIES.map((c) => (
                            <button type="button" key={c} className={`chip ${form.category === c ? 'is-active' : ''}`} onClick={() => setForm({ ...form, category: c })}>{c}</button>
                        ))}
                    </div>
                    <button className="btn btn--primary">Add</button>
                </form>
            </div>
            <div className="stack">
                {byCat.length > 0 && (
                    <div className="panel">
                        <h3 className="h4">By category</h3>
                        <ul className="bars">
                            {byCat.map(([c, v]) => (
                                <li key={c}>
                                    <span>{c}</span>
                                    <span className="bars__track"><i style={{ width: `${(v / spent) * 100}%` }} /></span>
                                    <strong>€{Math.round(v)}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="panel">
                    <h3 className="h4">Expenses</h3>
                    {trip.expenses.length === 0 ? (
                        <p className="muted">Nothing yet. A burek is ~80 MKD, a taxi across Skopje ~250 MKD.</p>
                    ) : (
                        <ul className="expenses">
                            {trip.expenses.map((e) => (
                                <li key={e.id}>
                                    <span>
                                        <strong>{e.label}</strong>
                                        <small className="muted">{e.category} · {e.date}</small>
                                    </span>
                                    <span className="expenses__amt">{e.amount.toLocaleString()} {e.currency}</span>
                                    <button className="icon-btn icon-btn--sm" aria-label={`Delete ${e.label}`} onClick={() => removeExpense(e.id)}><Trash2 size={14} /></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Trip() {
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'overview';
    const go = (id) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true });
    const { reset } = useTrip();
    const toast = useToast();

    useEffect(() => {
        document.title = 'My trip · Discover Macedonia';
    }, []);

    return (
        <>
            <PageHeader eyebrow="Ранец · Trip helper" title="My trip" image="/images/places/hd/st-naum.webp">
                Dates, a day-by-day plan, a packing checklist and a budget — saved on this device, synced when you sign in.
            </PageHeader>
            <div className="container">
                <div className="tabs" role="tablist" aria-label="Trip">
                    {TABS.map(([id, label]) => (
                        <button key={id} role="tab" aria-selected={tab === id} className="tabs__tab" onClick={() => go(id)}>{label}</button>
                    ))}
                </div>
                <div role="tabpanel" key={tab} className="tab-panel">
                    {tab === 'overview' && <Overview go={go} />}
                    {tab === 'days' && <Days />}
                    {tab === 'checklist' && <Checklist />}
                    {tab === 'budget' && <Budget />}
                    {tab === 'saved' && <SavedPanel />}
                </div>
                {tab === 'overview' && (
                    <button
                        className="btn btn--ghost btn--sm reset-trip"
                        onClick={() => {
                            if (window.confirm('Start over? This clears dates, days, checklist and expenses (saved places stay).')) {
                                reset();
                                toast.show('Trip reset');
                            }
                        }}
                    >
                        Start a new trip
                    </button>
                )}
            </div>
        </>
    );
}
