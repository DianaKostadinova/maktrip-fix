import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { searchService } from '../services/searchService';
import Glyph from './Glyph';

export const openSearch = () => window.dispatchEvent(new Event('open-search'));

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const onOpen = () => setOpen(true);
        const onKey = (e) => {
            const typing = /input|textarea|select/i.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
                e.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener('open-search', onOpen);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('open-search', onOpen);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    useEffect(() => {
        const el = dialogRef.current;
        if (!el) return;
        if (open && !el.open) {
            el.showModal();
            setQuery('');
            setActive(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
        if (!open && el.open) el.close();
    }, [open]);

    const results = useMemo(() => {
        return searchService.search(query);
    }, [query]);

    const go = (entry) => {
        setOpen(false);
        if (entry.href) window.location.assign(entry.href);
        else navigate(entry.to);
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter' && results[active]) {
            go(results[active]);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="palette"
            aria-label="Search"
            onClose={() => setOpen(false)}
            onClick={(e) => e.target === dialogRef.current && setOpen(false)}
        >
            <div className="palette__box" onKeyDown={onKeyDown}>
                <label className="palette__input">
                    <Search size={20} aria-hidden />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        placeholder="Search places, food, phrases, emergency…"
                        aria-label="Search"
                        aria-controls="palette-results"
                        aria-activedescendant={results[active] ? `pr-${results[active].key}` : undefined}
                    />
                    <kbd>Esc</kbd>
                </label>
                <ul className="palette__results" id="palette-results" role="listbox">
                    {!query.trim() && <li className="palette__heading">Suggested</li>}
                    {results.length === 0 && <li className="palette__empty">No results for “{query}”.</li>}
                    {results.map((r, i) => {
                        return (
                            <li
                                key={r.key}
                                id={`pr-${r.key}`}
                                role="option"
                                aria-selected={i === active}
                                className={`palette__item ${i === active ? 'is-active' : ''}`}
                                onMouseEnter={() => setActive(i)}
                                onClick={() => go(r)}
                            >
                                <span className="palette__icon">
                                    {r.section ? <Glyph id={r.section} size="sm" /> : <Glyph kind={r.kind} size="sm" />}
                                </span>
                                <span className="palette__text">
                                    <strong>{r.title}</strong>
                                    <small>{r.subtitle}</small>
                                </span>
                                <span className="palette__group">{r.group}</span>
                                {i === active && <CornerDownLeft size={16} className="palette__enter" aria-hidden />}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </dialog>
    );
}
