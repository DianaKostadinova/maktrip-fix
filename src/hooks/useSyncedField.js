import { useCallback, useEffect, useRef, useState } from 'react';
import { userDataService } from '../services/userDataService';
import { useAuth } from '../context/AuthContext';

/**
 * One piece of user state that lives on the device for guests and in the
 * account (users/{uid}.{field}) for signed-in users. Cloud writes are debounced
 * so typing into a form doesn't spam the database. On first sign-in, a guest
 * value is copied up if the account has none.
 */
export function useSyncedField(field, localKey, initial) {
    const { user } = useAuth();
    const uid = userDataService.cloudAvailable() && user ? user.uid : null;

    const [local, setLocal] = useState(() => userDataService.readLocal(localKey, initial));
    const [cloud, setCloud] = useState({ uid: null, value: initial });
    const timer = useRef(null);

    useEffect(() => {
        if (!uid) return undefined;
        let first = true;
        return userDataService.watch(uid, (data) => {
            const value = data[field];
            if (first) {
                first = false;
                const guest = userDataService.readLocal(localKey, null);
                if (value == null && guest != null) {
                    userDataService.save(uid, { [field]: guest }).catch(() => {});
                    setCloud({ uid, value: guest });
                    return;
                }
            }
            setCloud({ uid, value: value ?? initial });
        });
        // `initial` is a constant default; re-subscribing on identity change is unwanted.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, field, localKey]);

    const value = uid ? (cloud.uid === uid ? cloud.value : initial) : local;

    const update = useCallback(
        (next) => {
            if (uid) {
                setCloud((c) => {
                    const v = typeof next === 'function' ? next(c.value) : next;
                    clearTimeout(timer.current);
                    timer.current = setTimeout(() => userDataService.save(uid, { [field]: v }).catch(() => {}), 600);
                    return { uid, value: v };
                });
            } else {
                setLocal((prev) => {
                    const v = typeof next === 'function' ? next(prev) : next;
                    userDataService.writeLocal(localKey, v);
                    return v;
                });
            }
        },
        [uid, field, localKey]
    );

    return [value, update];
}
