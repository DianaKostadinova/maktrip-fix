// Per-user data store: device storage for guests, Firestore for signed-in users.
import { userRepository } from '../repositories/userRepository';
import { localRepository } from '../repositories/localRepository';

export const userDataService = {
    cloudAvailable: userRepository.available,
    watch: (uid, onData) => userRepository.watch(uid, onData),
    save: (uid, patch) => userRepository.update(uid, patch),
    readLocal: (key, fallback) => localRepository.get(key, fallback),
    writeLocal: (key, value) => localRepository.set(key, value),
};

// Display preferences. Stored as plain strings because index.html reads the
// theme before the app loads, to avoid a flash of the wrong theme.
export const preferenceService = {
    theme: () => localRepository.getRaw('theme') || 'system',
    setTheme: (theme) => localRepository.setRaw('theme', theme === 'system' ? null : theme),
};
