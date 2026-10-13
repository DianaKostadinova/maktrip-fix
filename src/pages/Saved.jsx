import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Cloud, Smartphone, Trash2, Map as MapIcon } from 'lucide-react';
import { useSaved } from '../context/SavedContext';
import { useAuth } from '../context/AuthContext';
import { catalogService } from '../services/catalogService';
import MapView from '../components/MapView';
import SaveButton from '../components/SaveButton';
import EmptyState from '../components/EmptyState';
import Chips from '../components/Chips';
import Img from '../components/Img';
import PlanText from '../components/PlanText';
import { featureService } from '../services/featureService';

export default function SavedPanel() {
    const { items, plan, clearPlan, synced } = useSaved();
    const { enabled } = useAuth();
    const [kind, setKind] = useState('all');
    const navigate = useNavigate();

    const kinds = useMemo(() => [...new Set(items.map((i) => i.kind))], [items]);
    const shown = kind === 'all' ? items : items.filter((i) => i.kind === kind);
    const onMap = shown.filter((i) => i.coords);

    return (
        <>
            <p className="sync-note">
                {synced ? (
                    <><Cloud size={16} /> Synced to your account across devices.</>
                ) : (
                    <><Smartphone size={16} /> Saved on this device.{enabled && <> <Link to="/account">Sign in</Link> to sync everywhere.</>}</>
                )}
            </p>

            <div className="stack-lg">
                {plan?.text && (
                    <section className="panel">
                        <div className="card__row">
                            <h2 className="h3">Planner draft</h2>
                            <div className="row-gap">
                                {featureService.plannerEnabled() && <Link to="/planner" className="btn btn--sm btn--soft">New draft</Link>}
                                <button className="btn btn--sm btn--ghost" onClick={clearPlan} aria-label="Delete plan"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        {plan.meta && <p className="muted small">{plan.meta.city} · {plan.meta.startDate} → {plan.meta.endDate}</p>}
                        <details className="plan-details">
                            <summary>Show itinerary</summary>
                            <PlanText text={plan.text} />
                        </details>
                    </section>
                )}

                {items.length === 0 ? (
                    <EmptyState
                        icon={Bookmark}
                        title="Nothing saved yet"
                        action={<div className="row-gap"><Link to="/places" className="btn btn--primary">Browse places</Link><Link to="/map" className="btn btn--soft">Open map</Link></div>}
                    >
                        Tap the bookmark on any place, dish or bar to build your shortlist. Then drop them onto days in My trip.
                    </EmptyState>
                ) : (
                    <>
                        <Chips
                            label="Filter saved"
                            options={[{ value: 'all', label: 'All', count: items.length }, ...kinds.map((k) => ({ value: k, label: catalogService.label(k), count: items.filter((i) => i.kind === k).length }))]}
                            value={kind}
                            onChange={setKind}
                        />
                        {onMap.length > 0 && (
                            <div className="saved-map">
                                <MapView items={onMap} onOpen={(i) => navigate(i.to)} />
                            </div>
                        )}
                        <ul className="saved-list">
                            {shown.map((i) => (
                                <li key={i.id} className="saved-item">
                                    <Img src={i.image} alt="" className="saved-item__img" />
                                    <Link to={i.to} className="saved-item__text">
                                        <strong>{i.name}</strong>
                                        <small className="muted">{i.subtitle}</small>
                                    </Link>
                                    {i.coords && (
                                        <a className="icon-btn" href={`https://www.google.com/maps/dir/?api=1&destination=${i.coords.lat},${i.coords.lng}`} target="_blank" rel="noreferrer" aria-label={`Directions to ${i.name}`}>
                                            <MapIcon size={18} />
                                        </a>
                                    )}
                                    <SaveButton id={i.id} name={i.name} />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    );
}
