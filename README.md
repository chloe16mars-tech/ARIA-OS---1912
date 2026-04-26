# ARIA-OS

Voice-over script generator powered by Google Gemini, distributed as a Progressive Web App and as an Android APK packaged with Capacitor.

> **Stack** — Angular 21 (standalone, signals, zoneless) · Express 5 (Angular SSR + REST API) · Supabase (Postgres + Auth + Realtime) · Google Gemini · Capacitor 8 · Tailwind CSS 4

---

## 1. Prerequisites

| Tool                | Version |
| ------------------- | ------- |
| Node.js             | ≥ 20    |
| npm                 | ≥ 10    |
| Android Studio      | Iguana+ (only for the APK build) |
| Supabase project    | with the migrations from `supabase/migrations/` applied |
| Gemini API key      | https://aistudio.google.com/app/apikey |

---

## 2. Getting started

```bash
git clone <repo>
cd ARIA-OS---1912
npm install
cp .env.example .env          # then fill in the values
npm run set-env               # writes src/environments/* from .env
npm run dev                   # API on :4000, Angular on :3000
```

`npm run dev` runs the Express API and the Angular dev-server in parallel (`concurrently`). The dev-server proxies `/api/*` to `http://localhost:4000`.

---

## 3. Environment variables

All variables live in `.env` (never committed). See `.env.example` for the full list.

| Variable                         | Where it is used                               |
| -------------------------------- | ----------------------------------------------- |
| `NODE_ENV`                       | Toggles strict CSP and production behaviour     |
| `PORT`                           | Express listen port                             |
| `ALLOWED_ORIGINS`                | Comma-separated CORS allow-list                 |
| `TRUST_PROXY`                    | Hops Express trusts for `req.ip`                |
| `SUPABASE_URL`                   | Server (admin client)                           |
| `SUPABASE_SERVICE_ROLE_KEY`      | Server only — never exposed to the bundle      |
| `GEMINI_API_KEY`                 | Server only                                     |
| `GEMINI_MODEL`                   | Optional — defaults to `gemini-2.5-pro`         |
| `PUBLIC_SUPABASE_URL`            | Frontend bundle                                 |
| `PUBLIC_SUPABASE_ANON_KEY`       | Frontend bundle                                 |
| `PUBLIC_API_URL`                 | Absolute API URL — required for the mobile APK |

Run `npm run set-env` after editing `.env`. The script regenerates:

- `src/environments/environment.ts` (web dev)
- `src/environments/environment.prod.ts` (web prod)
- `src/environments/environment.mobile.ts` (Android APK)

---

## 4. Database

The schema, RLS policies and stored procedures consumed by the API are versioned under `supabase/migrations/`. Apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Or paste the file content into the Supabase dashboard's SQL editor.

---

## 5. Building for the web

```bash
npm run build          # production SSR build → dist/aria-os/{browser,server}
npm run start          # serve the production build (Express + Angular SSR)
```

Deploy the built bundle behind any Node host (Render, Fly.io, Vercel via the included `api/index.ts` wrapper, …). Set every variable from §3 in the host's environment.

---

## 6. Building the Android APK

```bash
# 1. Make sure PUBLIC_API_URL in .env points at your deployed API.
# 2. Build the static bundle and sync it into the Android project.
npm run build:mobile

# 3. Open Android Studio.
npm run open:android
```

`npm run build:mobile` chains:

1. `node scripts/set-env.mjs --target=mobile,prod` — bake env vars into the Angular bundle.
2. `ng build --configuration=mobile` — pure CSR build (no SSR).
3. Promote `index.csr.html` → `index.html` (Capacitor's WebView opens `index.html`).
4. Strip the SSR server bundle from `dist/aria-os/`.
5. `npx cap sync android` — copy the bundle into `android/app/src/main/assets/public/`.

Then in Android Studio:

- `Build → Generate Signed Bundle / APK` to produce the release APK.
- The Capacitor config (`capacitor.config.ts`) holds `appId = com.creator.studio`. Update it before publishing.
- `serverClientId` for `@codetrix-studio/capacitor-google-auth` must be replaced with the OAuth Web Client ID issued by Google for your Supabase project.

---

## 7. Project layout

```
src/
├── app/
│   ├── components/         standalone Angular components (one folder per page)
│   ├── services/           injectable services (auth, gemini, scripts, …)
│   ├── pipes/              custom pipes (script-format, safe-url, translate, …)
│   ├── app.config.ts       providers (router, http, zoneless change detection)
│   └── app.routes.ts       lazy-loaded routes + 404
├── server/
│   ├── api.router.ts       Express REST API
│   ├── prompt-builder.ts   pure helper, unit-tested
│   └── ssrf-guard.ts       URL safety check, unit-tested
├── environments/           generated from .env by scripts/set-env.mjs
├── server.ts               Express bootstrap (Helmet, CORS, SSR fallback)
├── supabase.ts             frontend Supabase client (anon key)
└── main.ts                 Angular bootstrap (browser)

scripts/
├── set-env.mjs             generates src/environments/*.ts from .env
└── build-mobile.mjs        ng build + cap sync, cross-platform

supabase/
└── migrations/             versioned schema, RLS and RPC functions

android/                    Capacitor Android project
api/index.ts                Vercel serverless wrapper around the Express handler
```

---

## 8. Testing & linting

```bash
npm run lint                # ESLint (Angular + TS)
npm run test:server         # Vitest — pure-Node helpers (prompt-builder, SSRF)
npm run test                # ng test — Angular component / pipe tests
```

---

## 9. Security baseline

- **Server**: Helmet with strict CSP in production, CORS allow-list driven by `ALLOWED_ORIGINS`, `trust proxy` honored for rate-limiting, request body capped at 64 kB, JWT verified server-side via `supabaseAdmin.auth.getUser`.
- **Database**: every public table has Row Level Security on; RPCs are `security definer` and granted only to `authenticated` and `service_role`.
- **SSRF**: user-supplied URLs are parsed with the WHATWG URL parser and rejected if they target loopback, private IPv4/IPv6 ranges, link-local cloud metadata or non-http(s) protocols.
- **XSS**: every byte of Gemini output goes through full HTML entity escape before any decorative HTML is layered on top of it; `bypassSecurityTrustResourceUrl` is gated by an http(s)-only allow-list.
- **Secrets**: only `PUBLIC_*` variables are baked into the frontend. The service role key and the Gemini key are server-only.

---

## 10. License

Proprietary — Mmedia Universe.
