import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    // REACT_APP_ is still accepted so an existing CRA-era .env keeps working.
    envPrefix: ['VITE_', 'REACT_APP_'],
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png', 'icons/logo.svg'],
            manifest: {
                id: '/',
                name: 'Discover Macedonia',
                short_name: 'Macedonia',
                description: 'Your pocket travel companion for North Macedonia: places, food, a trip helper, essentials and nearby toilets, water and ATMs — offline.',
                lang: 'en',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#d2141c',
                background_color: '#f8fafc',
                categories: ['travel', 'navigation', 'lifestyle'],
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
                shortcuts: [
                    { name: 'Map', url: '/map', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                    { name: 'Essentials', url: '/essentials', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                    { name: 'My trip', url: '/trip', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                    { name: 'Nearby toilets & water', url: '/essentials?tab=nearby', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
                ],
            },
            workbox: {
                // App shell + fonts are precached; photos and the hero video are cached on first view.
                globPatterns: ['**/*.{js,css,html,svg,woff2,ico}', 'icons/*.png'],
                globIgnores: ['config.js'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname === '/config.js',
                        handler: 'NetworkFirst',
                        options: { cacheName: 'runtime-config' },
                    },
                    {
                        // Headlines from the API (same origin or a separate API host):
                        // show the cached list instantly, refresh in the background.
                        urlPattern: ({ url }) => url.pathname === '/api/news',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'news',
                            expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 2 },
                            cacheableResponse: { statuses: [200] },
                        },
                    },
                    {
                        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/images/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 60 },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'map-tiles',
                            expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/(en|mk)\.wikipedia\.org\/.*/,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'wikipedia',
                            networkTimeoutSeconds: 4,
                            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 14 },
                        },
                    },
                ],
            },
            devOptions: { enabled: false },
        }),
    ],
    optimizeDeps: { entries: ['index.html'] },
    server: {
        port: 3000,
        watch: { ignored: ['**/legacy/**', '**/backend/**'] },
        proxy: {
            '/api': { target: process.env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
        },
    },
    preview: { port: 3000 },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
                    if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'leaflet';
                },
            },
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.{js,jsx}'],
    },
});
