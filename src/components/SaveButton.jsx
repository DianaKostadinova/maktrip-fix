import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSaved } from '../context/SavedContext';

export default function SaveButton({ id, name, variant = 'icon' }) {
    const { isSaved, toggle } = useSaved();
    const saved = isSaved(id);
    const Icon = saved ? BookmarkCheck : Bookmark;
    const label = saved ? `Remove ${name} from saved` : `Save ${name}`;

    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
    };

    if (variant === 'button') {
        return (
            <button className={`btn ${saved ? 'btn--soft' : 'btn--primary'}`} onClick={onClick} aria-pressed={saved}>
                <Icon size={18} aria-hidden /> {saved ? 'Saved' : 'Save'}
            </button>
        );
    }

    return (
        <button className={`save-btn ${saved ? 'is-saved' : ''}`} onClick={onClick} aria-pressed={saved} aria-label={label} title={label}>
            <Icon size={18} aria-hidden />
        </button>
    );
}
