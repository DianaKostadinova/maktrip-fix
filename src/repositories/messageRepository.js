import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Firestore collection `messages` (community chat).

export const messageRepository = {
    available: () => Boolean(db),

    /** Messages in one room (unsorted). Single-field filter → no composite index needed. */
    watchRoom(room, onData, onError) {
        const q = query(collection(db, 'messages'), where('category', '==', room));
        return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
    },

    add(message) {
        return addDoc(collection(db, 'messages'), { ...message, timestamp: serverTimestamp() });
    },
};
