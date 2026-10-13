import { useEffect } from 'react';
import { creditService } from '../services/contentServices';
import { catalogService } from '../services/catalogService';

const credits = creditService.images();
import PageHeader from '../components/PageHeader';
import Img from '../components/Img';

// Attribution for the Wikimedia Commons photos (required by CC BY / BY-SA).
export default function Credits() {
    useEffect(() => {
        document.title = 'Photo credits · Discover Macedonia';
    }, []);

    return (
        <>
            <PageHeader eyebrow="About" title="Photo credits">
                Landmark and food photos come from Wikimedia Commons under free licences. Thank you to every photographer.
            </PageHeader>
            <div className="container">
                <h2 className="h3">Home page monuments</h2>
                <ul className="credits">
                    {creditService.monuments().map((m) => {
                        const c = m.credit;
                        return (
                            <li key={m.id} className="credits__item">
                                <Img src={c.src} alt="" className="credits__img credits__img--contain" />
                                <div>
                                    <strong>{m.name}</strong>
                                    <p className="muted small">
                                        {c.author} · <a href={c.licenseUrl || c.page} target="_blank" rel="noreferrer">{c.license}</a> ·{' '}
                                        <a href={c.page} target="_blank" rel="noreferrer">Source</a> · {c.modified}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <h2 className="h3" style={{ marginTop: 32 }}>Places & food</h2>
                <ul className="credits">
                    {Object.entries(credits).map(([id, c]) => (
                        <li key={id} className="credits__item">
                            <Img src={c.src} alt="" className="credits__img" />
                            <div>
                                <strong>{catalogService.byId(id)?.name ?? id}</strong>
                                <p className="muted small">
                                    {c.author} · <a href={c.licenseUrl || c.page} target="_blank" rel="noreferrer">{c.license}</a> ·{' '}
                                    <a href={c.page} target="_blank" rel="noreferrer">Source</a>
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
