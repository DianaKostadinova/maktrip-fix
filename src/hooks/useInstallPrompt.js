import { useEffect, useState } from 'react';

// Captures the browser's install prompt so we can offer our own "Install app" button.
export function useInstallPrompt() {
    const [event, setEvent] = useState(null);
    const [installed, setInstalled] = useState(
        () => typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
    );

    useEffect(() => {
        const onPrompt = (e) => {
            e.preventDefault();
            setEvent(e);
        };
        const onInstalled = () => {
            setInstalled(true);
            setEvent(null);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        if (!event) return false;
        event.prompt();
        const { outcome } = await event.userChoice;
        setEvent(null);
        return outcome === 'accepted';
    };

    return { canInstall: Boolean(event) && !installed, install, installed };
}
