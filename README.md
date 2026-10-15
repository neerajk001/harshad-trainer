# Repora — Trainer & Client PWA

Repora is a simple trainer-client PWA (MVP per `PRODUCT.md`): trainers manage multiple clients and assign workout + diet plans; clients view their plans and log progress. Next.js App Router + TypeScript + Tailwind + Neon PostgreSQL + Drizzle + Auth.js (credentials) + installable PWA. No separate backend — Server Actions and Route Handlers are the backend.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Neon PostgreSQL via `@neondatabase/serverless`, Drizzle ORM + drizzle-kit migrations
- Auth.js v5 (NextAuth beta) credentials provider, JWT sessions, bcrypt password hashes, role-based `proxy.ts` routing
- PWA via a hand-rolled service worker (`public/sw.js`, app-shell offline) + `public/manifest.webmanifest` + icons in `public/icons/`. Chosen over `@ducanh2912/next-pwa` because that plugin's webpack hooks don't run under Next 16's default Turbopack build, so it silently produced no service worker. The SW is registered in production only (`src/components/service-worker-register.tsx`) and excluded from API/auth requests.

## Setup

1. Install deps: `npm install`
2. Copy env: `cp .env.example .env.local` (Windows: `Copy-Item .env.example .env.local`) and fill in:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `AUTH_SECRET` — long random string (`npx auth secret` or `openssl rand -base64 32`)
   - `AUTH_URL` / `NEXTAUTH_URL` — e.g. `http://localhost:3000`
3. Generate + apply migrations:
   - `npm run db:generate` (creates `drizzle/` SQL from `src/db/schema.ts`)
   - `npm run db:migrate` (requires `DATABASE_URL`)
4. Seed clearly-marked demo data (optional): `npm run db:seed`
   - Trainer: `trainer@repora.demo` / `Trainer123!`
   - Client: `client@repora.demo` / `Client123!`
5. Run: `npm run dev` → http://localhost:3000

## Demo mode vs real database

The app has two read paths, selected by `DEMO_MODE`:

- **Real database (default for production/dev):** set `DATABASE_URL` and leave `DEMO_MODE=false` (or unset). All reads/writes hit Neon; seed with `npm run db:seed`.
- **Demo JSON mode:** set `DEMO_MODE=true` (and `NEXT_PUBLIC_DEMO_MODE=true` so the login page shows the banner). Reads come from `src/lib/demo-data.json`; **no database is required** and creates/edits are no-ops that don't persist. Useful for quick UI previews.

Both modes use the same credentials (`trainer@repora.demo` / `Trainer123!`, `client@repora.demo` / `Client123!`), so you can switch without re-learning logins. **Never enable demo mode in production** — it bypasses the database and is read-only.

See `.env.example` for the exact variables. `.env.local` is gitignored — never commit real credentials.

## Auth + roles

- `/login` signs in with email + password. `/` redirects by role (`/trainer` or `/client`). `src/proxy.ts` blocks cross-role routes.
- Trainer creates clients via **Clients → Add client** (name, email, temporary password ≥ 8 chars). This is the dev-safe invite flow: credentials must be shared securely out-of-band; do not expose passwords in production.
- First trainer account: create via `npm run db:seed`, or insert a `users` row with role `trainer` + bcrypt hash manually.
- Every protected query/action re-checks the session server-side; clients can only touch their own `clients` row, trainers only their assigned clients. Client-supplied IDs are never trusted for auth.

## MVP flows

- Trainer `/trainer`: totals, active-this-week, needing-attention (no log/check-in in 7d), recent activity — all from real DB queries (scoped to the signed-in trainer's clients).
- Trainer `/trainer/clients`: search + add client, pause/activate a client; `/trainer/clients/[id]`: profile, assign/unassign workout + diet plans, view logs + check-ins.
- Trainer `/trainer/programs`: CRUD programs, days, exercises (including delete day/exercise). `/trainer/diet-plans`: CRUD plans, meals, food items (including delete meal/food).
- Client `/client`: today's workout (rotates by weekday), quick meal log, recent progress. `/client/workouts`, `/client/nutrition`, `/client/progress` (weight history + check-in form), `/client/profile`.
- Loading, error, and 404 states are handled at the app root plus per-portal skeletons.
- PWA: manifest + theme color + icons; service worker (`public/sw.js`) registered on `npm run start`/production, not in dev. Offline covers app shell + an `/offline.html` fallback — DB reads/writes require network.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`, `npm run typecheck`
- `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`

## Icons

`public/icons/` contains an SVG source plus generated PNG placeholders (`icon-192.png`, `icon-512.png`, `maskable-512.png`). Replace with real brand PNGs before production; keep sizes/types referenced in `public/manifest.webmanifest`.

> Note: 512px `maskable` and `any` icons are required for installability. If you regenerate icons, re-run `npm run build` so the service worker precache list stays in sync.
