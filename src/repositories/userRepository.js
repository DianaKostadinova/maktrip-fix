import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Firestore document users/{uid}: saved places, trip, planner draft.

export const userRepository = {
    available: () => Boolean(db),

    /** Calls `onData(data)` with the document (or {}) now and on every change. Returns an unsubscribe fn. */
    watch(uid, onData) {
        return onSnapshot(doc(db, 'users', uid), (snap) => onData(snap.data() || {}));
    },

    /** Merges fields into the document. Resolves when the server acknowledges. */
    update(uid, patch) {
        return setDoc(doc(db, 'users', uid), patch, { merge: true });
    },
};
