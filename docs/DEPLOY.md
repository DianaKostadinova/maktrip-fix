# Deploying Discover Macedonia — for free

| Piece | Free host | Address you get |
|---|---|---|
| Website (PWA) | **Cloudflare Pages** | `https://<name>.pages.dev` |
| Spring API (news) | **Render** (free web service, Docker) | `https://<name>.onrender.com` |
| Accounts, saved trips, chat | **Firebase** (Spark plan) | already set up |
| AI trip planner | off — shows "Coming soon" (`PLANNER_ENABLED=false`) | — |

All three are free without a credit card. What "free" costs you:

- **Render free instances sleep after ~15 minutes without traffic** and take ~1 minute
  to wake up. Only the home-page news needs the API: it shows cached headlines (or
  hides) while the API wakes, so the site never looks broken.
- Firebase Spark has daily quotas (50k document reads, 20k writes) — far more than a
  student project needs.

Total time: about 30 minutes.

---

## 0. Put the code on GitHub

Cloudflare and Render deploy straight from your GitHub repository.

```bash
git add -A
git commit -m "Revamp: PWA, Spring API, Docker, free hosting"
git push -u origin revamp/pwa-docker-ui
```

Then on GitHub, merge the branch into `main` (or point both services at the branch).

> Before pushing: **rotate your ImgBB key** — the old one is in git history.

## 1. Firebase (accounts + chat)

In https://console.firebase.google.com → your project:

1. **Authentication → Sign-in method**: enable Email/Password (and Google if you like).
2. **Firestore Database**: create it if you haven't (production mode).
3. **Security rules**: Firestore → Rules → paste the contents of
   `firebase/firestore.rules` → Publish.
4. **Project settings → Your apps → Web app**: keep this page open — you'll copy the
   config values in step 3.
   (Authorized domains are added in step 4, once you know your Pages address.)

## 2. The API on Render

1. Sign up at https://render.com with your GitHub account.
2. **New → Blueprint** → choose your repository. Render reads `render.yaml` and creates
   `discover-macedonia-api` (Docker, free plan, Frankfurt).
3. When asked for **`CORS_ORIGINS`**, enter your future website address, e.g.
   `https://discover-macedonia.pages.dev` (you can fix it later under *Environment*).
4. Wait for the first deploy (~5 min). Open
   `https://<your-api>.onrender.com/api/health` — you should see `"status":"UP"`.

Copy the API address; you need it next.

## 3. The website on Cloudflare Pages

1. Sign up at https://dash.cloudflare.com → **Workers & Pages → Create → Pages →
   Connect to Git** → choose your repository.
2. Build settings:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm ci && npm run build`
   - **Build output directory**: `dist`
3. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_VERSION` | `24` |
   | `VITE_API_BASE_URL` | `https://<your-api>.onrender.com` |
   | `VITE_PLANNER_ENABLED` | `false` |
   | `VITE_FIREBASE_API_KEY` | from Firebase |
   | `VITE_FIREBASE_AUTH_DOMAIN` | from Firebase |
   | `VITE_FIREBASE_PROJECT_ID` | from Firebase |
   | `VITE_FIREBASE_STORAGE_BUCKET` | from Firebase |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase |
   | `VITE_FIREBASE_APP_ID` | from Firebase |
   | `VITE_IMGBB_API_KEY` | optional (avatar uploads) — a **new** key |

4. **Save and Deploy**. You get `https://<project>.pages.dev`.
   Pages serves `index.html` for every route, and `public/_headers` sets caching so
   app updates reach users immediately.

## 4. Connect the pieces

1. **Firebase → Authentication → Settings → Authorized domains → Add domain**:
   `<project>.pages.dev` (and your own domain if you add one). Without this, sign-in fails.
2. **Render → your API → Environment**: make sure `CORS_ORIGINS` exactly matches the
   Pages address (no trailing slash). Save → Render redeploys.

Open the site, sign up, save a place, post in Community.

## Updating

Push to GitHub — Cloudflare and Render both rebuild automatically. Installed PWAs
show "A new version is available".

## Optional: your own domain (free on both)

- Cloudflare Pages → your project → **Custom domains**.
- Render → your service → **Settings → Custom domains** (e.g. `api.yourdomain.com`),
  then update `VITE_API_BASE_URL`, `CORS_ORIGINS` and Firebase authorized domains.

## Optional: keep the API awake

The free API sleeps when idle. A free uptime monitor (e.g. UptimeRobot) pinging
`/actuator/health` every 10 minutes keeps it warm during the day — check Render's
current free-tier terms first, as free hours are limited per month.

---

## Later: one server instead (paid, ~€5/month)

When you want no sleeping and the AI planner, everything also runs on one VPS with
Docker and automatic HTTPS:

```bash
# on the server (Ubuntu), after pointing your domain's DNS at it
curl -fsSL https://get.docker.com | sh
git clone https://github.com/DianaKostadinova/maktrip-fix.git /opt/discover-macedonia
cd /opt/discover-macedonia && cp .env.example .env && nano .env   # set DOMAIN + Firebase values
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`docker-compose.prod.yml` adds Caddy (free Let's Encrypt certificates). To switch the
planner on there: `PLANNER_ENABLED=true`, `OLLAMA_URL=http://ollama:11434`, and add
`--profile ollama` (needs ~8 GB RAM).
