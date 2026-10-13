import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Volume2, ArrowLeftRight, ExternalLink, Languages } from 'lucide-react';
import { essentialsService } from '../services/contentServices';
import { translationService, deviceService } from '../services/externalServices';

const { emergencyNumbers, quickFacts, phrases, prices, transport, tips, holidays, eurToMkd: EUR_TO_MKD } = essentialsService;
import PageHeader from '../components/PageHeader';
import { NearbyFinder, CyrillicTool, DriverCard, TipCalculator, ShareLocation } from '../components/EssentialsTools';

const TABS = [
    { id: 'basics', label: 'Basics' },
    { id: 'nearby', label: 'Nearby' },
    { id: 'money', label: 'Money & prices' },
    { id: 'transport', label: 'Getting around' },
    { id: 'language', label: 'Language' },
    { id: 'tips', label: 'Tips & safety' },
];

const speakMk = (text) => deviceService.speakMacedonian(text);

function Converter() {
    const [eur, setEur] = useState('10');
    const [mkd, setMkd] = useState(String(10 * EUR_TO_MKD));
    return (
        <div className="panel">
            <h3 className="h4">Currency converter</h3>
            <div className="converter">
                <label>
                    <span>EUR</span>
                    <input inputMode="decimal" value={eur} onChange={(e) => { setEur(e.target.value); setMkd(e.target.value ? String(Math.round(parseFloat(e.target.value) * EUR_TO_MKD) || '') : ''); }} />
                </label>
                <ArrowLeftRight size={20} aria-hidden />
                <label>
                    <span>MKD</span>
                    <input inputMode="decimal" value={mkd} onChange={(e) => { setMkd(e.target.value); setEur(e.target.value ? (parseFloat(e.target.value) / EUR_TO_MKD).toFixed(2) : ''); }} />
                </label>
            </div>
            <p className="muted small">Fixed rate €1 = {EUR_TO_MKD} MKD (the denar is pegged to the euro).</p>
        </div>
    );
}

function Translator() {
    const [text, setText] = useState('');
    const [dir, setDir] = useState('en|mk');
    const [out, setOut] = useState('');
    const [busy, setBusy] = useState(false);

    const translate = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        setOut('');
        setOut(await translationService.translate(text, dir));
        setBusy(false);
    };

    const [from, to] = dir === 'en|mk' ? ['English', 'Macedonian'] : ['Macedonian', 'English'];

    return (
        <form className="panel" onSubmit={translate}>
            <h3 className="h4"><Languages size={18} /> Quick translator</h3>
            <div className="translator__dir">
                <span>{from}</span>
                <button type="button" className="icon-btn" aria-label="Swap languages" onClick={() => setDir(dir === 'en|mk' ? 'mk|en' : 'en|mk')}>
                    <ArrowLeftRight size={18} />
                </button>
                <span>{to}</span>
            </div>
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Type in ${from}…`} aria-label="Text to translate" />
            <button className="btn btn--primary" disabled={busy || !text.trim()}>{busy ? 'Translating…' : 'Translate'}</button>
            {out && (
                <div className="translator__out">
                    <p>{out}</p>
                    {dir === 'en|mk' && <button type="button" className="icon-btn" onClick={() => speakMk(out)} aria-label="Hear it"><Volume2 size={18} /></button>}
                </div>
            )}
        </form>
    );
}

function ListPanel({ title, items }) {
    return (
        <div className="panel">
            <h3 className="h4">{title}</h3>
            <ul className="ticks">{items.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
    );
}

export default function Essentials() {
    const [params, setParams] = useSearchParams();
    const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'basics';

    useEffect(() => {
        document.title = 'Essentials · Discover Macedonia';
    }, []);

    return (
        <>
            <PageHeader eyebrow="Помош · Essentials" title="Travel essentials" image="/images/survival.webp">
                The practical stuff — available offline once you’ve opened it.
            </PageHeader>

            <div className="container">
                <section className="sos" aria-label="Emergency numbers">
                    {emergencyNumbers.map((e) => (
                        <a key={e.number} href={`tel:${e.number}`} className={`sos__item ${e.number === '112' ? 'is-main' : ''}`}>
                            <Phone size={18} aria-hidden />
                            <strong>{e.number}</strong>
                            <span>{e.label}</span>
                        </a>
                    ))}
                </section>
                <div className="sos-extra">
                    <ShareLocation />
                    <span className="muted small">Lost passport? Contact your embassy in Skopje and report it to police (192) for a certificate.</span>
                </div>

                <div className="tabs" role="tablist" aria-label="Essentials">
                    {TABS.map((t) => (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} className="tabs__tab" onClick={() => setParams(t.id === 'basics' ? {} : { tab: t.id }, { replace: true })}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="tab-panel" role="tabpanel">
                    {tab === 'basics' && (
                        <div className="grid grid--panels">
                            <div className="panel">
                                <h3 className="h4">Quick facts</h3>
                                <dl className="facts">
                                    {quickFacts.map((f) => (
                                        <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
                                    ))}
                                </dl>
                            </div>
                            <div className="panel">
                                <h3 className="h4">Public holidays</h3>
                                <dl className="facts">
                                    {holidays.map(([d, n]) => (
                                        <div key={n}><dt>{d}</dt><dd>{n}</dd></div>
                                    ))}
                                </dl>
                                <p className="muted small">Banks and offices close; shops may too.</p>
                            </div>
                            <ListPanel {...tips.find((t) => t.id === 'connectivity')} />
                        </div>
                    )}

                    {tab === 'nearby' && (
                        <div className="grid grid--panels">
                            <NearbyFinder />
                        </div>
                    )}

                    {tab === 'money' && (
                        <div className="grid grid--panels">
                            <Converter />
                            <TipCalculator />
                            <ListPanel {...tips.find((t) => t.id === 'money')} />
                            {prices.map((g) => (
                                <div key={g.group} className="panel">
                                    <h3 className="h4">Typical prices · {g.group}</h3>
                                    <dl className="facts">
                                        {g.items.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                                    </dl>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'transport' && (
                        <div className="grid grid--panels">
                            <DriverCard />
                            {transport.map((t) => (
                                <div key={t.id} className="panel">
                                    <h3 className="h4">{t.title}</h3>
                                    <p>{t.body}</p>
                                    {t.phones && (
                                        <ul className="phone-list">
                                            {t.phones.map((p) => (
                                                <li key={p.number}><a href={`tel:${p.number}`}><Phone size={14} /> {p.number}</a> <span className="muted">{p.label}</span></li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="link-pills">
                                        {t.links.map((l) => (
                                            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} <ExternalLink size={12} /></a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'language' && (
                        <div className="grid grid--panels">
                            <div className="panel panel--span">
                                <h3 className="h4">Phrasebook</h3>
                                <ul className="phrases">
                                    {phrases.map((p) => (
                                        <li key={p.latin}>
                                            <button className="phrase" onClick={() => speakMk(p.mk)} aria-label={`Hear “${p.en}” in Macedonian`}>
                                                <span className="phrase__en">{p.en}</span>
                                                <span className="phrase__mk">{p.mk}</span>
                                                <span className="phrase__latin">{p.latin}</span>
                                                <Volume2 size={16} className="phrase__icon" aria-hidden />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Translator />
                            <CyrillicTool />
                        </div>
                    )}

                    {tab === 'tips' && (
                        <div className="grid grid--panels">
                            {tips.filter((t) => !['money', 'connectivity'].includes(t.id)).map((t) => <ListPanel key={t.id} {...t} />)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
