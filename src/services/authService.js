// Use case: sign in / sign up / profile, with friendly error messages.
import { authRepository } from '../repositories/authRepository';
import { uploadRepository } from '../repositories/externalRepositories';

const FRIENDLY = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account with that email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account — try signing in.',
    'auth/weak-password': 'Use at least 6 characters.',
    'auth/invalid-email': 'That email doesn’t look right.',
    'auth/too-many-requests': 'Too many attempts. Try again in a minute.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
    'auth/operation-not-allowed': 'This sign-in method isn’t enabled in Firebase.',
};
const friendly = (e) => new Error(FRIENDLY[e.code] || e.message);
const wrap = (fn) => async (...args) => {
    try {
        return await fn(...args);
    } catch (e) {
        throw friendly(e);
    }
};

export const authService = {
    enabled: authRepository.available,
    onChange: authRepository.onChange,
    signIn: wrap((email, password) => authRepository.signIn(email, password)),
    signInWithGoogle: wrap(() => authRepository.signInWithGoogle()),
    resetPassword: wrap((email) => authRepository.resetPassword(email)),
    signOut: () => authRepository.signOut(),
    signUp: wrap(async ({ email, password, name }) => {
        const cred = await authRepository.signUp(email, password);
        await authRepository.updateProfile(cred.user, { displayName: name.trim() });
        await authRepository.sendVerification(cred.user).catch(() => {});
        return cred.user;
    }),
    updateProfile: wrap(async (user, { name, photoURL }) => {
        await authRepository.updateProfile(user, { displayName: name.trim() || null, photoURL: photoURL || null });
        await authRepository.reload(user);
    }),
    avatarUploadEnabled: uploadRepository.available,
    async uploadAvatar(file) {
        if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
        if (file.size > 8 * 1024 * 1024) throw new Error('Image is too large (max 8 MB).');
        return uploadRepository.uploadImage(file);
    },
};
