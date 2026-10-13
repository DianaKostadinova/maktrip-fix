import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { openSearch } from '../components/CommandPalette';

export default function NotFound() {
    return (
        <div className="container section">
            <EmptyState
                icon={Compass}
                title="Looks like you took a wrong turn"
                action={
                    <div className="row-gap">
                        <Link to="/" className="btn btn--primary">Back home</Link>
                        <button className="btn btn--soft" onClick={openSearch}>Search</button>
                    </div>
                }
            >
                That page doesn’t exist — even Kokino’s astronomers couldn’t find it.
            </EmptyState>
        </div>
    );
}
