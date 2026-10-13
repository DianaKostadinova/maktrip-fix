import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Camera, LogOut, Bookmark } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const avatarUploadEnabled = authService.avatarUploadEnabled();

function Profile({ user }) {
    const toast = useToast();
    const { ids, synced } = useSaved();
    const [name, setName] = useState(user.displayName || '');
    const [photo, setPhoto] = useState(user.photoURL || '');
    const [busy, setBusy] = useState(false);

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
            setPhoto(await authService.uploadAvatar(file));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
            e.target.value = '';
        }
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await authService.updateProfile(user, { name, photoURL: photo });
            toast.success('Profile updated');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-card panel">
            <form onSubmit={save} className="stack">
                <div className="profile-head">
                    <label className={`avatar avatar--xl ${avatarUploadEnabled ? 'is-editable' : ''}`}>
                        {photo ? <img src={photo} alt="" /> : <span>{(name || user.email)[0].toUpperCase()}</span>}
                        {avatarUploadEnabled && (
                            <>
                                <span className="avatar__edit"><Camera size={16} /></span>
                                <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="sr-only" aria-label="Change profile photo" />
                            </>
                        )}
                    </label>
                    <div>
                        <h1 className="h3">{user.displayName || 'Traveller'}</h1>
                        <p className="muted">{user.email}{!user.emailVerified && user.email && ' · not verified'}</p>
                    </div>
                </div>
                <label className="field">
                    <span>Display name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
                </label>
                <button className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </form>
            <hr />
            <Link to="/saved" className="btn btn--soft btn--block"><Bookmark size={18} /> {ids.length} saved {synced ? '· synced' : ''}</Link>
            <button className="btn btn--ghost btn--block" onClick={() => authService.signOut()}><LogOut size={18} /> Sign out</button>
        </div>
    );
}

function SignIn() {
    const toast = useToast();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const next = params.get('next') || '/';

    const done = () => navigate(next, { replace: true });

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (mode === 'signin') {
                await authService.signIn(email, password);
                toast.success('Welcome back!');
            } else {
                await authService.signUp({ email, password, name });
                toast.success('Account created — check your inbox to verify your email.');
            }
            done();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setBusy(false);
        }
    };

    const google = async () => {
        try {
            await authService.signInWithGoogle();
            done();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const reset = async () => {
        if (!email) return toast.info('Enter your email first.');
        try {
            await authService.resetPassword(email);
            toast.success('Password reset email sent.');
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="auth-card panel">
            <h1 className="h2">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="muted">Sync saved places and plans across devices, and join the community chat.</p>

            <button className="btn btn--soft btn--block" onClick={google} type="button">
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                Continue with Google
            </button>
            <div className="divider"><span>or</span></div>

            <form onSubmit={submit} className="stack">
                {mode === 'signup' && (
                    <label className="field">
                        <span>Display name</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} autoComplete="nickname" />
                    </label>
                )}
                <label className="field">
                    <span>Email</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </label>
                <label className="field">
                    <span>Password</span>
                    <span className="input-with-btn">
                        <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
                        <button type="button" className="icon-btn icon-btn--sm" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </span>
                </label>
                <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
            </form>

            <div className="auth-links">
                {mode === 'signin' && <button className="link-btn" onClick={reset}>Forgot password?</button>}
                <button className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                    {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
                </button>
            </div>
        </div>
    );
}

export default function Account() {
    const { user, ready, enabled } = useAuth();

    useEffect(() => {
        document.title = 'Account · Discover Macedonia';
    }, []);

    return (
        <div className="container auth-page">
            {!enabled ? (
                <EmptyState title="Accounts aren’t configured">Add your Firebase settings to <code>.env</code> to enable sign-in. Saving still works on this device.</EmptyState>
            ) : !ready ? (
                <div className="page-loading" />
            ) : user ? (
                <Profile user={user} />
            ) : (
                <SignIn />
            )}
        </div>
    );
}
