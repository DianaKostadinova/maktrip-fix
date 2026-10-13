import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig, firebaseEnabled } from './env';

// When Firebase isn't configured the app still runs: browsing, saving (locally),
// essentials and the planner all work; only accounts and community chat are off.
export const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app
    ? initializeFirestore(app, {
          // Offline-first: cached reads + queued writes survive reloads and work offline.
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      })
    : null;

export { firebaseEnabled };
