import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { sectionService } from '../services/contentServices';
import PageHeader from '../components/PageHeader';
import Glyph, { SectionLabel } from '../components/Glyph';
import Img from '../components/Img';

export default function Explore() {
    useEffect(() => {
        document.title = 'Explore · Discover Macedonia';
    }, []);

    return (
        <>
            <PageHeader eyebrow="Contents" title="The whole guide">
                Ten chapters — or press <kbd>/</kbd> to search anything, from “toilet” to “Kaneo”.
            </PageHeader>
            <div className="container">
                <div className="index-grid index-grid--page">
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
        </>
    );
}
