import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { newsService } from '../services/plannerService';

function ago(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 60000;
    if (!Number.isFinite(diff)) return '';
    if (diff < 60) return `${Math.max(1, Math.round(diff))} min ago`;
    if (diff < 60 * 24) return `${Math.round(diff / 60)} h ago`;
    return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

// Headlines aggregated by the backend from public RSS feeds. The section hides
// itself when the API isn't running (e.g. frontend-only dev).
export default function NewsFeed({ limit = 6 }) {
    const [items, setItems] = useState(null);

    useEffect(() => {
        const ctrl = new AbortController();
        newsService
            .latest(limit, ctrl.signal)
            .then(setItems)
            .catch(() => setItems([]));
        return () => ctrl.abort();
    }, [limit]);

    if (items && items.length === 0) return null;

    return (
        <section className="section section--tint" aria-labelledby="news-title">
            <div className="container">
                <div className="section__head">
                    <div>
                        <p className="eyebrow">Latest</p>
                        <h2 className="h2" id="news-title">News from Macedonia</h2>
                    </div>
                </div>
                <div className="news">
                    {(items ?? Array.from({ length: 4 }, () => null)).map((n, i) =>
                        n ? (
                            <a key={n.link} href={n.link} target="_blank" rel="noreferrer" className={`news__item ${i === 0 ? 'news__item--lead' : ''}`}>
                                <span className="news__meta">
                                    <b>{n.source}</b> · {ago(n.publishedAt)}
                                </span>
                                <h3>{n.title}</h3>
                                {i === 0 && n.summary && <p>{n.summary}</p>}
                                <ArrowUpRight size={18} className="news__arrow" aria-hidden />
                            </a>
                        ) : (
                            <div key={i} className="news__item news__item--skeleton"><div className="skeleton-lines"><span /><span /></div></div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}
