import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Info } from 'lucide-react';
import { foodService } from '../services/contentServices';
import PageHeader from '../components/PageHeader';
import Chips from '../components/Chips';
import SaveButton from '../components/SaveButton';
import Img from '../components/Img';

export default function Food() {
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'eat' ? 'eat' : 'dishes';
    const kind = params.get('kind') || 'All';

    useEffect(() => {
        document.title = 'Food · Discover Macedonia';
    }, []);

    const set = (k, v) => {
        const next = new URLSearchParams(params);
        if (!v || v === 'All' || v === 'dishes') next.delete(k);
        else next.set(k, v);
        if (k === 'tab') next.delete('kind');
        setParams(next, { replace: true });
    };

    const shownDishes = useMemo(() => foodService.dishes(kind), [kind]);

    return (
        <>
            <PageHeader eyebrow="Храна · Food &amp; drink" title="Eat like a local" image="/images/food/hd/tavche-gravche.webp">
                The dishes you have to try — and where Skopje actually goes to eat them.
            </PageHeader>

            <div className="container">
                <div className="toolbar">
                    <div className="segmented" role="tablist" aria-label="Food sections">
                        <button role="tab" aria-selected={tab === 'dishes'} onClick={() => set('tab', 'dishes')}>Must-try dishes</button>
                        <button role="tab" aria-selected={tab === 'eat'} onClick={() => set('tab', 'eat')}>Where to eat</button>
                    </div>
                    {tab === 'dishes' && <Chips label="Kind" options={['All', ...foodService.dishKinds()]} value={kind} onChange={(v) => set('kind', v)} />}
                </div>

                {tab === 'dishes' ? (
                    <div className="grid grid--cards">
                        {shownDishes.map((d) => (
                            <article key={d.id} id={d.id} className="card">
                                <div className="card__media">
                                    <Img src={d.image} alt={d.name} className="card__img" />
                                    <SaveButton id={d.id} name={d.name} />
                                    <span className="tag tag--float">{d.kind}</span>
                                </div>
                                <div className="card__body">
                                    <div className="card__row">
                                        <h3 className="card__title">{d.name}</h3>
                                        <span className="price">{d.price}</span>
                                    </div>
                                    <p className="muted">{d.description}</p>
                                    <p className="card__meta"><MapPin size={14} /> {d.where}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid--cards">
                        {foodService.eateries().map((e) => (
                            <article key={e.id} id={e.id} className="card">
                                <div className="card__media">
                                    <Img src={e.image} alt={e.name} className="card__img" />
                                    <SaveButton id={e.id} name={e.name} />
                                </div>
                                <div className="card__body">
                                    <div className="card__row">
                                        <h3 className="card__title">{e.name}</h3>
                                        <span className="price">{e.price}</span>
                                    </div>
                                    <p className="muted">{e.description}</p>
                                    <p className="card__meta"><MapPin size={14} /> {e.location}</p>
                                    <p className="card__meta">Try: {e.specialties}</p>
                                    {e.note && <p className="note"><Info size={14} /> {e.note}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
