import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { userDataService } from '../services/userDataService';
import { savedService } from '../services/savedService';
import { catalogService } from '../services/catalogService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

// Saved items work for everyone: guests keep them on the device, signed-in
// users in their account. On sign-in, guest saves are merged into the account.

const LOCAL_KEY = 'saved:v1';
const LOCAL_PLAN_KEY = 'savedPlan:v1';

const SavedContext = createContext(null);
const NONE = [];

export function SavedProvider({ children }) {
    const { user } = useAuth();
    const toast = useToast();
    const [localIds, setLocalIds] = useState(() => userDataService.readLocal(LOCAL_KEY, []));
    const [localPlan, setLocalPlan] = useState(() => userDataService.readLocal(LOCAL_PLAN_KEY, null));
    const [cloudState, setCloudState] = useState({ uid: null, ids: [], plan: null });
    const mergedFor = useRef(null);

    const uid = userDataService.cloudAvailable() && user ? user.uid : null;
    const cloud = Boolean(uid);

    // Ignore a snapshot left over from a previous account.
    const fresh = cloudState.uid === uid;
    const ids = cloud ? (fresh ? cloudState.ids : NONE) : localIds;
    const plan = cloud ? (fresh ? cloudState.plan : null) : localPlan;

    useEffect(() => {
        if (!uid) return undefined;
        return userDataService.watch(uid, (data) => {
            // First snapshot after sign-in: fold guest saves into the account.
            if (mergedFor.current !== uid) {
                mergedFor.current = uid;
                const patch = savedService.mergeGuestIntoAccount(data, userDataService.readLocal(LOCAL_KEY, []), userDataService.readLocal(LOCAL_PLAN_KEY, null));
                userDataService.writeLocal(LOCAL_KEY, null);
                userDataService.writeLocal(LOCAL_PLAN_KEY, null);
                setLocalIds([]);
                setLocalPlan(null);
                if (patch) {
                    // The local cache emits a new snapshot immediately.
                    userDataService.save(uid, patch).catch(() => {});
                    return;
                }
            }
            setCloudState({
                uid,
                ids: savedService.idsFromPins(data.pinnedPlaces),
                plan: data.travelPlan ? { text: data.travelPlan, meta: data.travelPlanMeta ?? null } : null,
            });
        });
    }, [uid]);

    // Cloud writes aren't awaited: with offline persistence they only resolve
    // once the server acknowledges, but the UI updates from the local cache.
    const saveCloud = useCallback(
        (patch) => userDataService.save(uid, patch).catch((e) => toast.error(`Couldn’t sync: ${e.message}`)),
        [uid, toast]
    );

    const persistIds = useCallback(
        (next) => {
            if (cloud) {
                setCloudState((s) => ({ ...s, ids: next }));
                saveCloud({ pinnedPlaces: savedService.pinsFromIds(next) });
            } else {
                setLocalIds(next);
                userDataService.writeLocal(LOCAL_KEY, next);
            }
        },
        [cloud, saveCloud]
    );

    const toggle = useCallback(
        (id) => {
            const item = catalogService.byId(id);
            const wasSaved = ids.includes(id);
            persistIds(savedService.toggle(ids, id));
            if (wasSaved) toast.show(`Removed ${item?.name ?? 'item'}`, { action: { label: 'Undo', onClick: () => persistIds(ids) } });
            else toast.success(cloud ? `Saved ${item?.name}` : `Saved ${item?.name} on this device`);
        },
        [ids, persistIds, toast, cloud]
    );

    const savePlan = useCallback(
        (text, meta) => {
            const value = { text, meta };
            if (cloud) {
                setCloudState((s) => ({ ...s, plan: value }));
                saveCloud({ travelPlan: text, travelPlanMeta: meta });
            } else {
                setLocalPlan(value);
                userDataService.writeLocal(LOCAL_PLAN_KEY, value);
            }
        },
        [cloud, saveCloud]
    );

    const clearPlan = useCallback(() => {
        if (cloud) {
            setCloudState((s) => ({ ...s, plan: null }));
            saveCloud({ travelPlan: '', travelPlanMeta: null });
        } else {
            setLocalPlan(null);
            userDataService.writeLocal(LOCAL_PLAN_KEY, null);
        }
    }, [cloud, saveCloud]);

    const value = useMemo(
        () => ({
            ids,
            items: ids.map(catalogService.byId).filter(Boolean),
            isSaved: (id) => ids.includes(id),
            toggle,
            plan,
            savePlan,
            clearPlan,
            synced: cloud,
        }),
        [ids, toggle, plan, savePlan, clearPlan, cloud]
    );

    return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export const useSaved = () => useContext(SavedContext);
