import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ArrowUpRight } from 'lucide-react';
import { sectionService, placeService, guideService } from '../services/contentServices';
import { openSearch } from '../components/CommandPalette';
import SaveButton from '../components/SaveButton';
import Img from '../components/Img';
import Glyph, { SectionLabel } from '../components/Glyph';
import NewsFeed from '../components/NewsFeed';
import MonumentRing from '../components/MonumentRing';
import { weatherService } from '../services/externalServices';

const featured = placeService.featured();
const didYouKnow = guideService.facts();

function SkopjeNow() {
    const [w, setW] = useState(null);
    useEffect(() => {
        const ctrl = new AbortController();
        weatherService.forecast({ lat: 41.9981, lng: 21.4254 }, ctrl.signal).then(setW).catch(() => {});
        return () => ctrl.abort();
    }, []);
    return (
        <Link to="/guide#seasons" className="fact-tile">
            <strong>{w ? `${w.now.temp}°` : '—'}</strong>
            <span>Skopje now{w ? ` · ${w.now.text}` : ''}</span>
        </Link>
    );
}

// Horizontal strip: the hovered (or focused) panel grows and reveals its story.
function Expander({ items }) {
    const [active, setActive] = useState(0);
    return (
        <div className="expander" onMouseLeave={() => setActive(0)}>
            {items.map((p, i) => (
                <Link
                    key={p.id}
                    to={`/places?open=${p.id}`}
                    className={`expander__panel ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                >
                    <Img src={p.image} alt={p.name} className="expander__img" />
                    <span className="expander__index">{String(i + 1).padStart(2, '0')}</span>
                    <div className="expander__body">
                        <span className="expander__loc">{p.location}</span>
                        <h3>{p.name}</h3>
                        <p>{p.description}</p>
                        <span className="expander__more">
                            Open <ArrowRight size={14} />
                        </span>
                    </div>
                    <SaveButton id={p.id} name={p.name} />
                </Link>
            ))}
        </div>
    );
}

function DidYouKnow() {
    const [i, setI] = useState(() => Math.floor(Math.random() * didYouKnow.length));
    return (
        <div className="dyk">
            <p className="dyk__label">Did you know?</p>
            <p key={i} className="dyk__text">{didYouKnow[i]}</p>
            <div className="dyk__foot">
                <span>
                    {String(i + 1).padStart(2, '0')} / {String(didYouKnow.length).padStart(2, '0')}
                </span>
                <button className="dyk__next" onClick={() => setI((i + 1) % didYouKnow.length)} aria-label="Next fact">
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

function ThisSeason() {
    const now = new Date().getMonth();
    const months = guideService.months();
    const month = months[now];
    const soon = guideService.festivalsIn([now, (now + 1) % 12]);
    return (
        <div className="season panel">
            <p className="kicker">Right now · {new Date().toLocaleString('en', { month: 'long' })}</p>
            <div className="season__temp">
                <strong>{month.temp}</strong>
                <span>typical low / high</span>
            </div>
            <p>{month.note}.</p>
            <div className="season__bar" aria-label={`Travel score ${month.score} of 5`}>
                {months.map((m, i) => (
                    <span key={m.m} className={i === now ? 'is-now' : ''} style={{ '--h': `${m.score * 20}%` }} title={`${m.m}: ${m.note}`}>
                        <i>{m.m[0]}</i>
                    </span>
                ))}
            </div>
            {soon.length > 0 && (
                <ul className="season__events">
                    {soon.map((f) => (
                        <li key={f.name}>
                            <strong>{f.name}</strong> <span className="muted">{f.when} · {f.where}</span>
                        </li>
                    ))}
                </ul>
            )}
            <Link to="/guide#seasons" className="link-arrow">When to go <ArrowRight size={16} /></Link>
        </div>
    );
}

export default function Home() {
    useEffect(() => {
        document.title = 'Discover Macedonia — your pocket travel companion';
    }, []);

    return (
        <>
            <section className="ring-hero">
                <div className="container">
                    <h1 className="sr-only">Discover Macedonia — lakes, ruins, rakija and burek at 3 AM</h1>
                    <MonumentRing>
                        <p className="ring__wordmark">Macedonia</p>
                        <p className="ring__title">
                            Lakes, ruins, rakija <span>&amp;</span> burek at 3&nbsp;AM.
                        </p>
                    </MonumentRing>
                    <div className="ring-hero__actions">
                        <button className="hero__search" onClick={openSearch}>
                            <Search size={20} aria-hidden />
                            <span>Try “Ohrid”, “burek”, “toilet” or “taxi”</span>
                            <kbd>/</kbd>
                        </button>
                        <Link to="/trip" className="btn btn--primary btn--lg">Start my trip</Link>
                        <Link to="/map" className="btn btn--soft btn--lg">Open the map</Link>
                    </div>
                </div>
            </section>

            <section className="container facts-strip" aria-label="At a glance">
                <a href="tel:112" className="fact-tile fact-tile--sos">
                    <strong>112</strong>
                    <span>Emergency — tap to call</span>
                </a>
                <Link to="/essentials?tab=money" className="fact-tile">
                    <strong>61.5</strong>
                    <span>Denars to €1 · cash is king</span>
                </Link>
                <Link to="/essentials?tab=language" className="fact-tile">
                    <strong>Здраво</strong>
                    <span>“Zdravo” — hello</span>
                </Link>
                <SkopjeNow />
            </section>

            <section className="container section">
                <div className="section__head">
                    <div>
                        <p className="eyebrow">Don’t miss</p>
                        <h2 className="h2">Seven places locals are proud of</h2>
                    </div>
                    <Link to="/places" className="link-arrow">
                        All {placeService.all().length} places <ArrowRight size={16} />
                    </Link>
                </div>
                <Expander items={featured} />
            </section>

            <section className="section section--tint">
                <div className="container">
                    <div className="section__head">
                        <div>
                            <p className="eyebrow">The guide</p>
                            <h2 className="h2">Everything, in ten chapters</h2>
                        </div>
                    </div>
                    <div className="index-grid">
                        {sectionService.all().map((s) => (
                            <Link key={s.id} to={s.to} className="index-tile">
                                <Img src={s.image} alt="" className="index-tile__img" />
                                <Glyph id={s.id} size="lg" numbered />
                                {s.comingSoon && <span className="soon-tag">Coming soon</span>}
                                <div className="index-tile__text">
                                    <SectionLabel id={s.id} />
                                    <p>{s.blurb}</p>
                                </div>
                                <ArrowUpRight className="index-tile__arrow" size={20} aria-hidden />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container section split">
                <DidYouKnow />
                <ThisSeason />
            </section>

            <section className="container section">
                <div className="section__head">
                    <div>
                        <p className="eyebrow">Where to base yourself</p>
                        <h2 className="h2">Cities & regions</h2>
                    </div>
                    <Link to="/guide" className="link-arrow">Full guide <ArrowRight size={16} /></Link>
                </div>
                <div className="rail" tabIndex={0} aria-label="Cities">
                    {guideService.cities().map((c) => (
                        <Link key={c.id} to={`/guide#${c.id}`} className="city-card">
                            <Img src={c.image} alt={c.name} className="city-card__img" />
                            <div className="city-card__body">
                                <span className="city-card__local">{c.local}</span>
                                <h3>{c.name}</h3>
                                <p>{c.tagline}</p>
                                <span className="tag">{c.days}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <NewsFeed />

            <section className="container section">
                <div className="cta-band">
                    <div>
                        <p className="eyebrow eyebrow--light">Trip helper</p>
                        <h2 className="h2">Dates in. Day-by-day plan, packing list and budget out.</h2>
                        <p>Save places as you browse, drop them onto days, tick off the checklist and keep spending in check — all offline, synced if you sign in.</p>
                    </div>
                    <Link to="/trip" className="btn btn--light btn--lg">Open my trip</Link>
                </div>
            </section>
        </>
    );
}
