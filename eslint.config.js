import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// ---------------------------------------------------------------------------
// Layered architecture, enforced. Dependencies point one way:
//
//   pages / components  →  context / hooks  →  services  →  repositories  →  config, data
//                     (all layers may use utils/ — pure helpers)
//
// - UI (pages, components) and state (context, hooks) never touch Firebase,
//   HTTP, localStorage or raw data files — they ask a service.
// - services hold the business rules and never import React or do I/O
//   themselves — they call repositories.
// - repositories do I/O only (Firebase, fetch, storage, static content) and
//   never import services, React or UI.
// ---------------------------------------------------------------------------

const io = (layer) => [
    { group: ['firebase', 'firebase/*'], message: `${layer} must not use Firebase directly — call a service.` },
    { group: ['**/repositories/*', '**/repositories'], message: `${layer} must not import repositories — call a service.` },
    { group: ['**/config/firebase'], message: `${layer} must not import the Firebase client — call a service.` },
    { group: ['**/data/*', '!**/data/data.test*'], message: `${layer} must not import raw data — use a service (e.g. contentServices).` },
];
const ioGlobals = (layer) => [
    { name: 'fetch', message: `${layer} must not call fetch — add a repository method.` },
    { name: 'localStorage', message: `${layer} must not use localStorage — use a service.` },
    { name: 'sessionStorage', message: `${layer} must not use sessionStorage — use a service.` },
];

export default [
    { ignores: ['dist', 'dev-dist', 'legacy', 'node_modules', 'backend', 'public/config.js'] },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
        },
    },

    // UI layer (controllers + views) and state layer
    {
        files: ['src/pages/**/*.{js,jsx}', 'src/components/**/*.{js,jsx}', 'src/context/**/*.{js,jsx}', 'src/hooks/**/*.{js,jsx}'],
        ignores: ['**/*.test.*'],
        rules: {
            'no-restricted-imports': ['error', { patterns: io('UI/state code') }],
            'no-restricted-globals': ['error', ...ioGlobals('UI/state code')],
        },
    },

    // Service layer: business logic only
    {
        files: ['src/services/**/*.js'],
        ignores: ['**/*.test.*'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [{ name: 'react', message: 'Services must not depend on React.' }],
                    patterns: [
                        { group: ['firebase', 'firebase/*', '**/config/firebase'], message: 'Services must not use Firebase directly — use a repository.' },
                        { group: ['**/data/*'], message: 'Services read content through repositories/contentRepository.' },
                        { group: ['**/components/*', '**/pages/*', '**/context/*', '**/hooks/*'], message: 'Services must not depend on UI or state code.' },
                    ],
                },
            ],
            'no-restricted-globals': ['error', ...ioGlobals('Services')],
        },
    },

    // Repository layer: I/O only
    {
        files: ['src/repositories/**/*.js'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [{ name: 'react', message: 'Repositories must not depend on React.' }],
                    patterns: [{ group: ['**/services/*', '**/components/*', '**/pages/*', '**/context/*', '**/hooks/*'], message: 'Repositories are the bottom layer — they must not import services or UI.' }],
                },
            ],
        },
    },

    // Utils: pure helpers, no project dependencies
    {
        files: ['src/utils/**/*.js'],
        ignores: ['**/*.test.*'],
        rules: {
            'no-restricted-imports': ['error', { patterns: [{ group: ['../*'], message: 'utils/ must stay dependency-free (pure helpers).' }] }],
            'no-restricted-globals': ['error', ...ioGlobals('Utils')],
        },
    },
];
