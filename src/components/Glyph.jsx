import { sectionService } from '../services/contentServices';

// The app's visual signature instead of stock icons: a red block holding the
// Cyrillic initial of the section's Macedonian name (М for Места, Х for Храна…).

export const KIND_GLYPHS = {
    place: { letter: 'М', word: 'Место' },
    nightlife: { letter: 'Б', word: 'Бар' },
    cafe: { letter: 'К', word: 'Кафе' },
    dish: { letter: 'Х', word: 'Храна' },
    eatery: { letter: 'Р', word: 'Ресторан' },
    section: { letter: '→', word: '' },
    phrase: { letter: 'Ж', word: 'Збор' },
    sos: { letter: '!', word: '' },
};

export default function Glyph({ id, kind, size = 'md', numbered = false, className = '' }) {
    const section = id ? sectionService.byId(id) : null;
    const letter = section ? section.mk[0] : (KIND_GLYPHS[kind]?.letter ?? '•');
    return (
        <span className={`glyph glyph--${size} ${kind ? `glyph--${kind}` : ''} ${className}`} aria-hidden>
            {numbered && section && <span className="glyph__num">{sectionService.number(id)}</span>}
            <span className="glyph__letter">{letter}</span>
        </span>
    );
}

export function SectionLabel({ id }) {
    const s = sectionService.byId(id);
    return (
        <span className="section-label">
            <span className="section-label__num">{sectionService.number(id)}</span>
            <span className="section-label__mk">{s.mk}</span>
            <span className="section-label__sep">/</span>
            <span>{s.title}</span>
        </span>
    );
}
