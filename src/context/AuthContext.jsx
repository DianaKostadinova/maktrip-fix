import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext({ user: null, ready: true, enabled: false });

export function AuthProvider({ children }) {
    const enabled = authService.enabled();
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(!enabled);

    useEffect(
        () =>
            authService.onChange((u) => {
                setUser(u);
                setReady(true);
            }),
        []
    );

    return <AuthContext.Provider value={{ user, ready, enabled }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
