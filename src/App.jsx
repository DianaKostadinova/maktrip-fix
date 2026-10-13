import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SavedProvider } from './context/SavedContext';
import { TripProvider } from './context/TripContext';
import Layout from './components/Layout';
import RouteError from './components/RouteError';
import Home from './pages/Home';

// Home ships in the main bundle; everything else is split per route.
const Explore = lazy(() => import('./pages/Explore'));
const Guide = lazy(() => import('./pages/Guide'));
const Places = lazy(() => import('./pages/Places'));
const Food = lazy(() => import('./pages/Food'));
const Nightlife = lazy(() => import('./pages/Nightlife'));
const Music = lazy(() => import('./pages/Music'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Trip = lazy(() => import('./pages/Trip'));
const Planner = lazy(() => import('./pages/Planner'));
const Essentials = lazy(() => import('./pages/Essentials'));
const Community = lazy(() => import('./pages/Community'));
const Account = lazy(() => import('./pages/Account'));
const Credits = lazy(() => import('./pages/Credits'));
const NotFound = lazy(() => import('./pages/NotFound'));

const page = (Cmp) => (
    <Suspense fallback={<div className="page-loading" aria-label="Loading" />}>
        <Cmp />
    </Suspense>
);

// Old (v1) URLs keep working.
const legacyRedirects = [
    ['/traditional-food', '/food'],
    ['/cofee', '/nightlife?type=cafe'],
    ['/Transportation', '/essentials?tab=transport'],
    ['/AIPlanner', '/planner'],
    ['/SurvivalGuide', '/essentials'],
    ['/Chat', '/community'],
    ['/Login', '/account'],
    ['/saved', '/trip?tab=saved'],
].map(([from, to]) => ({ path: from, element: <Navigate to={to} replace /> }));

const router = createBrowserRouter([
    {
        element: <Layout />,
        errorElement: <RouteError />,
        children: [
            {
                // Pathless wrapper so errors inside a page keep the header and nav.
                errorElement: <RouteError inline />,
                children: [
                    { index: true, element: <Home /> },
                    { path: 'explore', element: page(Explore) },
                    { path: 'guide', element: page(Guide) },
                    { path: 'places', element: page(Places) },
                    { path: 'food', element: page(Food) },
                    { path: 'nightlife', element: page(Nightlife) },
                    { path: 'music', element: page(Music) },
                    { path: 'map', element: page(MapPage) },
                    { path: 'trip', element: page(Trip) },
                    { path: 'planner', element: page(Planner) },
                    { path: 'essentials', element: page(Essentials) },
                    { path: 'community', element: page(Community) },
                    { path: 'account', element: page(Account) },
                    { path: 'credits', element: page(Credits) },
                    ...legacyRedirects,
                    { path: '*', element: page(NotFound) },
                ],
            },
        ],
    },
]);

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <SavedProvider>
                    <TripProvider>
                        <RouterProvider router={router} />
                    </TripProvider>
                </SavedProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
