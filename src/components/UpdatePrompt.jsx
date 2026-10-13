import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

// Shows a small banner when a new version is deployed, and once when the app
// becomes available offline.
export default function UpdatePrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_url, reg) {
            // Check for updates hourly while the app stays open.
            if (reg) setInterval(() => reg.update(), 60 * 60 * 1000);
        },
    });

    if (!offlineReady && !needRefresh) return null;

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <div className="update-banner" role="alert">
            <span>{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
            {needRefresh && (
                <button className="btn btn--sm btn--primary" onClick={() => updateServiceWorker(true)}>
                    <RefreshCw size={14} /> Update
                </button>
            )}
            <button className="icon-btn icon-btn--sm" onClick={close} aria-label="Dismiss">
                <X size={16} />
            </button>
        </div>
    );
}
