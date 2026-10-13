import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, MonitorSmartphone, Download, ChevronDown, WifiOff, User } from 'lucide-react';
import { sectionService } from '../services/contentServices';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import { useTheme } from '../hooks/useTheme';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useOnline } from '../hooks/useOnline';
import CommandPalette, { openSearch } from './CommandPalette';
import UpdatePrompt from './UpdatePrompt';
import Glyph from './Glyph';

const explore = sectionService.group('explore');

export function Logo({ light = false }) {
    return (
        <Link to="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label="Discover Macedonia — home">
            <img src="/icons/logo.svg?v=3" alt="" width="40" height="40" />
            <span className="logo__text">
                <b>Discover</b>
                <span>Macedonia</span>
            </span>
        </Link>
    );
}

function ThemeToggle() {
    const { theme, cycle } = useTheme();
    const IconCmp = theme === 'dark' ? Moon : theme === 'light' ? Sun : MonitorSmartphone;
    return (
        <button className="icon-btn" onClick={cycle} aria-label={`Theme: ${theme}. Click to change.`} title={`Theme: ${theme}`}>
            <IconCmp size={20} />
        </button>
    );
}

function Avatar() {
    const { user, enabled } = useAuth();
    if (!enabled) return null;
    if (!user)
        return (
            <Link to="/account" className="btn btn--sm btn--primary nav-signin">
                Sign in
            </Link>
        );
    return (
        <Link to="/account" className="avatar" aria-label="Your account" title={user.displayName || user.email}>
            {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <User size={18} />}
        </Link>
    );
}

function ExploreMenu() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const active = explore.some((s) => location.pathname.startsWith(s.to));
    return (
        <div className="menu" onMouseLeave={() => setOpen(false)}>
            <button className={`nav-link ${active ? 'active' : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)}>
                Explore <ChevronDown size={16} aria-hidden />
            </button>
            {open && (
                <div className="menu__panel" role="menu" onClick={() => setOpen(false)}>
                    {explore.map((s) => (
                        <Link key={s.id} to={s.to} className="menu__item" role="menuitem">
                            <Glyph id={s.id} />
                            <span>
                                <strong>{s.title}</strong>
                                <small>{s.blurb}</small>
                            </span>
                        </Link>
                    ))}
                    <Link to="/explore" className="menu__all" role="menuitem">
                        All sections →
                    </Link>
                </div>
            )}
        </div>
    );
}

function TopBar() {
    const { canInstall, install } = useInstallPrompt();
    return (
        <header className="topbar">
            <div className="container topbar__inner">
                <Logo />
                <nav className="topbar__nav" aria-label="Main">
                    <ExploreMenu />
                    <NavLink to="/map" className="nav-link">Map</NavLink>
                    <NavLink to="/trip" className="nav-link">My trip</NavLink>
                    <NavLink to="/essentials" className="nav-link">Essentials</NavLink>
                    <NavLink to="/community" className="nav-link">Community</NavLink>
                </nav>
                <div className="topbar__actions">
                    <button className="search-trigger" onClick={openSearch} aria-label="Search (Ctrl+K)">
                        <Search size={18} aria-hidden />
                        <span>Search</span>
                        <kbd>⌘K</kbd>
                    </button>
                    {canInstall && (
                        <button className="icon-btn" onClick={install} aria-label="Install app" title="Install app">
                            <Download size={20} />
                        </button>
                    )}
                    <ThemeToggle />
                    <Avatar />
                </div>
            </div>
        </header>
    );
}

// Mobile tab bar: Cyrillic initials instead of stock pictograms.
function BottomNav() {
    const { ids } = useSaved();
    const tabs = [
        { to: '/', label: 'Home', letter: 'Д', end: true },
        { to: '/explore', label: 'Explore', letter: 'И' },
        { to: '/map', label: 'Map', letter: 'Т' },
        { to: '/trip', label: 'Trip', letter: 'Р', badge: ids.length || null },
        { to: '/essentials', label: 'Help', letter: 'П' },
    ];
    return (
        <nav className="bottom-nav" aria-label="Primary">
            {tabs.map(({ to, label, letter, end, badge }) => (
                <NavLink key={to} to={to} end={end} className="bottom-nav__item">
                    <span className="bottom-nav__glyph" aria-hidden>
                        {letter}
                        {badge && <span className="badge">{badge}</span>}
                    </span>
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

function Footer() {
    return (
        <footer className="footer">
            <div className="container footer__inner">
                <div className="footer__brand">
                    <Logo light />
                    <p className="muted">An independent pocket guide to North Macedonia. Works offline once installed.</p>
                    <a href="tel:112" className="footer__sos">Emergency · 112</a>
                </div>
                <div className="footer__cols">
                    <div>
                        <h4>Explore</h4>
                        {explore.map((s) => (
                            <Link key={s.id} to={s.to}>{s.title}</Link>
                        ))}
                    </div>
                    <div>
                        <h4>Plan</h4>
                        {sectionService
                            .group('plan')
                            .map((s) => (
                                <Link key={s.id} to={s.to}>
                                    {s.title}
                                    {s.comingSoon && <small className="footer__soon"> · soon</small>}
                                </Link>
                            ))}
                    </div>
                    <div>
                        <h4>About</h4>
                        <Link to="/credits">Photo credits</Link>
                        <Link to="/account">Account</Link>
                    </div>
                </div>
            </div>
            <p className="container footer__legal">
                Map data © OpenStreetMap contributors · Weather by Open-Meteo · Summaries & photos from Wikipedia / Wikimedia Commons
            </p>
        </footer>
    );
}

export default function Layout() {
    const online = useOnline();
    const { pathname } = useLocation();
    useEffect(() => {
        document.documentElement.dataset.route = pathname.split('/')[1] || 'home';
    }, [pathname]);
    return (
        <>
            <a href="#main" className="skip-link">Skip to content</a>
            <TopBar />
            {!online && (
                <div className="offline-bar" role="status">
                    <WifiOff size={16} aria-hidden /> You’re offline — saved places, your trip and essentials still work.
                </div>
            )}
            <main id="main" className="main">
                {/* keyed by path so each page plays its enter transition */}
                <div key={pathname} className="page-enter">
                    <Outlet />
                </div>
            </main>
            <Footer />
            <BottomNav />
            <CommandPalette />
            <UpdatePrompt />
            <ScrollRestoration />
        </>
    );
}

