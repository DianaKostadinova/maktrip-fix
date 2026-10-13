import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Bus, CloudSun } from 'lucide-react';
import { guideService, placeService } from '../services/contentServices';
import { weatherService } from '../services/externalServices';
import PageHeader from '../components/PageHeader';
import Img from '../components/Img';

const TOC = [
    ['cities', 'Cities'],
    ['seasons', 'When to go'],
    ['festivals', 'Festivals'],
    ['history', 'History'],
    ['culture', 'Culture'],
    ['entry', 'Entry & rules'],
];

function CityWeather({ coords }) {
    const [w, setW] = useState(null);
    useEffect(() => {
        const ctrl = new AbortController();
        weatherService.forecast(coords, ctrl.signal).then(setW).catch(() => {});
        return () => ctrl.abort();
    }, [coords]);
    if (!w) return null;
    return (
        <div className="city__weather">
            <CloudSun size={16} aria-hidden /> Now {w.now.temp}° · {w.now.text}
            <span className="muted"> — next days {w.days.slice(1, 4).map((d) => `${d.max}°`).join(' / ')}</span>
        </div>
    );
}

function City({ city }) {
    const nearby = placeService.inRegion(city.region);
    return (
        <article id={city.id} className="city">
            <Img src={city.image} alt={city.name} className="city__img" />
            <div className="city__body">
                <p className="kicker">{city.region}</p>
                <h3 className="h3">
                    {city.name} <span className="city__local">{city.local}</span>
                </h3>
                <p className="city__tagline">{city.tagline}</p>
                <p>{city.intro}</p>
                <ul className="meta">
                    <li><Clock size={16} /> {city.days}</li>
                    <li><Bus size={16} /> {city.gettingThere}</li>
                </ul>
                <CityWeather coords={city.coords} />
                <ul className="ticks ticks--cols">
                    {city.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
                {nearby.length > 0 && (
                    <div className="link-pills">
                        {nearby.map((p) => (
                            <Link key={p.id} to={`/places?open=${p.id}`}><MapPin size={12} /> {p.name}</Link>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}

export default function Guide() {
    useEffect(() => {
        document.title = 'Guide · Discover Macedonia';
    }, []);

    const now = new Date().getMonth();

    return (
        <>
            <PageHeader eyebrow="Водич · Guide" title="Know the country" image="/images/places/hd/kaneo.webp">
                Where to base yourself, when to come, what’s on, and the story behind it all.
            </PageHeader>

            <nav className="toc container" aria-label="On this page">
                {TOC.map(([id, label], i) => (
                    <a key={id} href={`#${id}`}>
                        <span>{String(i + 1).padStart(2, '0')}</span> {label}
                    </a>
                ))}
            </nav>

            <div className="container stack-xl">
                <section id="cities">
                    <h2 className="h2 barred">Cities & regions</h2>
                    <div className="cities">
                        {guideService.cities().map((c) => <City key={c.id} city={c} />)}
                    </div>
                </section>

                <section id="seasons">
                    <h2 className="h2 barred">When to go</h2>
                    <p className="lead-sm">Best overall: <strong>May–June and September</strong>. July–August is lake season (hot, busy). Winter is for skiing and cosy kafanas.</p>
                    <div className="months">
                        {guideService.months().map((m, i) => (
                            <div key={m.m} className={`month ${i === now ? 'is-now' : ''}`} style={{ '--score': m.score }}>
                                <strong>{m.m}</strong>
                                <span className="month__temp">{m.temp}</span>
                                <span className="month__bar" aria-label={`${m.score} of 5`} />
                                <small>{m.note}</small>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="festivals">
                    <h2 className="h2 barred">Festivals & events</h2>
                    <div className="grid grid--panels">
                        {guideService.festivals().map((f) => (
                            <div key={f.name} className={`panel festival ${f.months.includes(now) ? 'is-now' : ''}`}>
                                <p className="kicker">{f.when} · {f.where}</p>
                                <h3 className="h4">{f.name}</h3>
                                <p>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="history">
                    <h2 className="h2 barred">A very short history</h2>
                    <ol className="timeline">
                        {guideService.history().map((h) => (
                            <li key={h.era}>
                                <span className="timeline__era">{h.era}</span>
                                <div>
                                    <strong>{h.title}</strong>
                                    <p>{h.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="culture">
                    <h2 className="h2 barred">Culture, decoded</h2>
                    <div className="grid grid--panels">
                        {guideService.culture().map((c, i) => (
                            <div key={c.title} className="panel fact-card">
                                <span className="fact-card__num">{String(i + 1).padStart(2, '0')}</span>
                                <h3 className="h4">{c.title}</h3>
                                <p>{c.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="dyk dyk--wide">
                        <p className="dyk__label">Did you know?</p>
                        <ul className="dyk__list">
                            {guideService.facts().map((d) => <li key={d}>{d}</li>)}
                        </ul>
                    </div>
                </section>

                <section id="entry">
                    <h2 className="h2 barred">Entry & rules</h2>
                    <div className="grid grid--panels">
                        {guideService.entryRules().map((e) => (
                            <div key={e.title} className="panel">
                                <h3 className="h4">{e.title}</h3>
                                <p>{e.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="muted small">Rules change — confirm visa requirements with an official source before you travel.</p>
                </section>
            </div>
        </>
    );
}
