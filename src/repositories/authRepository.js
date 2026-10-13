import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Firebase Authentication.

export const authRepository = {
    available: () => Boolean(auth),
    onChange: (cb) => (auth ? onAuthStateChanged(auth, cb) : () => {}),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
    sendVerification: (user) => sendEmailVerification(user),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    updateProfile: (user, fields) => updateProfile(user, fields),
    reload: (user) => user.reload(),
    signOut: () => signOut(auth),
};
