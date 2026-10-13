import { useState } from 'react';

// Lazy image with a shimmer placeholder and a graceful broken-image state.
export default function Img({ src, alt, className = '', eager = false }) {
    const [state, setState] = useState('loading');
    return (
        <div className={`img ${className} is-${src ? state : 'error'}`}>
            {state === 'error' || !src ? (
                <span className="img__fallback" aria-hidden />
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={() => setState('loaded')}
                    onError={() => setState('error')}
                />
            )}
        </div>
    );
}
