import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Logo } from './Layout';

// Route-level error boundary. Most real-world crashes after a deploy are
// stale lazy chunks — those get a one-tap reload instead of a stack trace.
export default function RouteError({ inline = false }) {
    const error = useRouteError();
    const chunk = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(String(error?.message));
    const notFound = isRouteErrorResponse(error) && error.status === 404;
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;

    let title = 'Something broke on this page';
    let text = 'It’s not you. Try again, or head back home — your saved places and trip are safe.';
    if (chunk) {
        title = offline ? 'This page isn’t available offline yet' : 'A new version is available';
        text = offline ? 'Open it once with a connection and it will work offline after that.' : 'Reload to get the latest version of the app.';
    } else if (notFound) {
        title = 'Page not found';
        text = 'That address doesn’t exist.';
    }

    if (import.meta.env.DEV) console.error(error);

    return (
        <div className={`route-error ${inline ? 'route-error--inline' : ''}`}>
            {!inline && <Logo />}
            <div className="route-error__box">
                <p className="kicker">{chunk ? 'Update' : notFound ? '404' : 'Error'}</p>
                <h1 className="h2">{title}</h1>
                <p>{text}</p>
                <div className="row-gap">
                    <button className="btn btn--primary" onClick={() => window.location.reload()}>Reload</button>
                    <Link to="/" className="btn btn--soft" reloadDocument>Go home</Link>
                </div>
                {import.meta.env.DEV && error?.stack && <pre className="route-error__stack">{error.stack}</pre>}
            </div>
        </div>
    );
}
