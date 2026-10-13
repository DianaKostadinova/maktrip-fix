import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSyncedField } from '../hooks/useSyncedField';
import { EMPTY_TRIP, tripService } from '../services/tripService';

// The trip helper's state: dates, cities, day-by-day itinerary, checklist
// and expenses. Synced to the account when signed in, local otherwise.

const TripContext = createContext(null);

export function TripProvider({ children }) {
    const [stored, setTrip] = useSyncedField('trip', 'trip:v1', EMPTY_TRIP);
    const trip = useMemo(() => tripService.normalise(stored), [stored]);

    const patch = useCallback((p) => setTrip((t) => ({ ...EMPTY_TRIP, ...t, ...(typeof p === 'function' ? p({ ...EMPTY_TRIP, ...t }) : p) })), [setTrip]);

    const addToDay = useCallback(
        (date, id) => patch((t) => ({ days: { ...t.days, [date]: [...(t.days[date] || []).filter((x) => x !== id), id] } })),
        [patch]
    );
    const removeFromDay = useCallback((date, id) => patch((t) => ({ days: { ...t.days, [date]: (t.days[date] || []).filter((x) => x !== id) } })), [patch]);
    const moveInDay = useCallback(
        (date, index, dir) =>
            patch((t) => {
                const list = [...(t.days[date] || [])];
                const j = index + dir;
                if (j < 0 || j >= list.length) return {};
                [list[index], list[j]] = [list[j], list[index]];
                return { days: { ...t.days, [date]: list } };
            }),
        [patch]
    );
    const toggleCheck = useCallback((id) => patch((t) => ({ checked: { ...t.checked, [id]: !t.checked[id] } })), [patch]);
    const addCustom = useCallback((text) => patch((t) => ({ custom: [...t.custom, { id: `c-${Date.now()}`, text }] })), [patch]);
    const removeCustom = useCallback((id) => patch((t) => ({ custom: t.custom.filter((c) => c.id !== id) })), [patch]);
    const addExpense = useCallback((e) => patch((t) => ({ expenses: [{ id: `e-${Date.now()}`, ...e }, ...t.expenses] })), [patch]);
    const removeExpense = useCallback((id) => patch((t) => ({ expenses: t.expenses.filter((e) => e.id !== id) })), [patch]);
    const reset = useCallback(() => setTrip(EMPTY_TRIP), [setTrip]);

    const value = useMemo(
        () => ({ trip, dates: tripService.dates(trip), patch, addToDay, removeFromDay, moveInDay, toggleCheck, addCustom, removeCustom, addExpense, removeExpense, reset }),
        [trip, patch, addToDay, removeFromDay, moveInDay, toggleCheck, addCustom, removeCustom, addExpense, removeExpense, reset]
    );

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => useContext(TripContext);
