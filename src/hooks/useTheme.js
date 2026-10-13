import { useCallback, useEffect, useState } from 'react';
import { preferenceService } from '../services/userDataService';

// 'system' follows the OS; 'light' / 'dark' are explicit overrides.
export function useTheme() {
    const [theme, setTheme] = useState(preferenceService.theme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system') delete root.dataset.theme;
        else root.dataset.theme = theme;
        preferenceService.setTheme(theme);
    }, [theme]);

    const cycle = useCallback(() => setTheme((t) => (t === 'system' ? 'dark' : t === 'dark' ? 'light' : 'system')), []);

    return { theme, setTheme, cycle };
}
