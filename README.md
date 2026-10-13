# Discover Macedonia

A pocket travel companion for North Macedonia, built as an installable, offline-first **PWA** (React + Vite) with a **Spring Boot** API.

- **Explore:** 44 places, a country guide (cities, seasons, festivals, history, culture), food & drink, bars & cafés, music.
- **Plan:** *My trip* gives you dates, a day-by-day itinerary from your saved places, a seasonal packing checklist, a budget tracker, calendar (.ics) export and sharing. A trip planner drafts itineraries with a local LLM via Ollama, streamed live.
- **On the ground:**
  - A map of everything, plus **public toilets, drinking water, pharmacies, ATMs and hospitals near you** (OpenStreetMap).
  - Real drive times from your base city to each place.
  - Emergency numbers and sharing your location.
  - A Cyrillic converter for reading signs, a "show the driver" card, a phrasebook with audio, a currency converter and a tip calculator.
- **Works for guests:** saving, the trip helper and essentials work without an account (stored on the device). Signing in syncs everything through Firebase.

## Quick start (Docker)

```bash
cp .env.example .env        # add your Firebase web config (optional)
docker compose up --build   # http://localhost:8080
```

The trip planner needs [Ollama](https://ollama.com). By default the API connects to Ollama on your machine:

```bash
ollama pull llama3.2:3b
ollama serve
```

…or run it inside Docker instead: set `OLLAMA_URL=http://ollama:11434` in `.env`, then

```bash
docker compose --profile ollama up --build
```

Everything except the planner and news works without the API, and everything except accounts and chat works without Firebase.

## Deploying

**Free:** website on Vercel, API on Render, accounts and chat on Firebase. Step-by-step guide: **[docs/DEPLOY.md](docs/DEPLOY.md)**. A one-server Docker setup with automatic HTTPS is there too, for later.

## Local development

| What | Command | URL |
|---|---|---|
| Frontend (Vite, hot reload) | `npm install && npm run dev` | http://localhost:3000 |
| API (Spring Boot, JDK 21+) | `cd backend && ./gradlew bootRun` | http://localhost:8080 |
| Both | `npm run dev:all` | |
| Tests | `npm test` · `cd backend && ./gradlew test` | |
| Lint | `npm run lint` | |

Vite proxies `/api` to `localhost:8080` (override with `API_PROXY_TARGET`).

## Architecture

Both halves follow the same layering. Each layer only calls the one below it:

| Role | Frontend (`src/`) | Backend (`backend/…/api/`) |
|---|---|---|
| Entry points ("controllers") | `pages/` (one per route) + `components/` (UI pieces) | `controller/` (REST endpoints) + `dto/` |
| State | `context/`, `hooks/` | — |
| Business logic | `services/` | `service/` |
| Data access / I/O | `repositories/` (Firebase, HTTP APIs, localStorage, static content) | `repository/` (knowledge base, RSS) + `client/` (Ollama) |
| Plain data | `data/` (content), `utils/` (pure helpers) | `model/` |
| Setup | `config/` (env, Firebase client) | `config/`, `exception/` |

On the frontend, ESLint enforces the rules (`eslint.config.js`):
- Pages, components and state code can't import Firebase, repositories or raw data, and can't call `fetch` or `localStorage`.
- Services can't import React or do I/O.
- Repositories can't import services or UI.

`npm run lint` fails if a layer is skipped.

```
browser (PWA)                                            api (Spring Boot)
pages → context/hooks → services → repositories ──/api──▶ controller → service → repository / client
                                     │                                               │          │
                         Firebase · Wikipedia · OSM                          knowledge.json   Ollama, RSS
```

## Repository layout

| Folder | What it is |
|---|---|
| `src/` | The React app (PWA). Layers described above. |
| `public/` | Static files served as-is: images, icons, the PWA icon set, `config.js` (runtime settings). |
| `backend/` | Spring Boot API (Java, Gradle). `./gradlew bootRun` to run, `./gradlew test` to test. |
| `docker/web/` | How the frontend is packaged: `Dockerfile` (build with Node, serve with nginx), `nginx.conf.template` (caching, `/api` proxy, SPA routing), `40-runtime-config.sh` (writes Firebase settings into `config.js` when the container starts). |
| `docker-compose.yml` | Runs the whole stack (web + API, optionally Ollama) with one command. |
| `firebase/` | `firestore.rules` — security rules for the Firestore database (who can read/write users' data and chat). Deploy with the Firebase CLI. |
| `scripts/` | Developer tools: regenerate icons, fetch Commons photos, export content to the backend knowledge base. |
| `.github/workflows/` | CI: lint, test and build the frontend, backend and Docker images on every push. |
| `legacy/` | The old Create-React-App version and assets, kept for reference. Safe to delete. |

## Content & credits

- Landmark and food photos come from Wikimedia Commons under CC licences. Attribution is shown in the app (`/credits`) and stored in `src/data/imageCredits.json`. To fetch more, run `node scripts/fetch-commons-images.js` and review the results.
- Map data © OpenStreetMap contributors. Weather by Open-Meteo. Summaries from Wikipedia.
- Regenerate icons with `npm run icons`, from `public/icons/icon.svg`.

## Firebase

Create a web app in Firebase, enable Email/Password and (optionally) Google sign-in, and put the config in `.env`. Suggested security rules are in `firebase/firestore.rules`.
