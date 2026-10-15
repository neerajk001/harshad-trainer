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

- Trainer / coach app (mobile-first, dark + gold, bottom nav Home · Clients · Programs · Messages · More):
  - `/trainer` dashboard: totals, weekly active, avg adherence, check-ins, multi-client progress chart, today's tasks.
  - `/trainer/clients` list (All/Active/At Risk tabs, search, add) · `/trainer/clients/[id]` profile (Overview/Progress/Workouts/Diet) · `/trainer/clients/[id]/progress` (+ trainer "Add progress entry") · `/trainer/clients/[id]/assign` (workout + diet + weekly schedule) · `/trainer/clients/unassigned` (claim self-signups).
  - `/trainer/programs` + `/trainer/programs/[id]` builder (days, exercises, level) · `/trainer/diet-plans` + `/trainer/diet-plans/[id]` builder (targets, meals with times, foods).
  - `/trainer/checkins` (Pending/Review tabs) + `/trainer/checkins/[id]` (approve / send feedback).
  - `/trainer/messages` + `/trainer/messages/[clientId]` two-way chat.
  - `/trainer/analytics`, `/trainer/notifications` (derived from real data), `/trainer/calendar` (placeholder — no scheduling model), `/trainer/more`, `/trainer/settings`.
- Client app (mobile-first, dark + gold): `/client` dashboard, `/client/workouts` (list + day detail + per-set exercise log), `/client/nutrition` (today + diet plan) and `/client/nutrition/add` (searchable food library), `/client/progress`, `/client/checkin`, `/client/messages`, `/client/profile`.
- Public: `/` landing, `/signup` (email self-sign-up), `/onboarding` + `/onboarding/details` (goal + metrics captured on first login). Trainer-created clients skip onboarding.
- Loading, error, and 404 states are handled at the app root plus per-portal skeletons.
- PWA: manifest + theme color + icons; service worker (`public/sw.js`) registered on `npm run start`/production, not in dev. Offline covers app shell + an `/offline.html` fallback — DB reads/writes require network.

## Data model additions

Migration `0001`:
- `clients`: `gender`, `age`, `height_cm`, `current_weight_kg`, `target_weight_kg`, `activity_level`, `onboarding_completed`; `trainer_id` nullable (self-registered clients).
- `exercise_set_logs`: per-set weight/reps logged from the exercise screen.
- `foods`: seeded food library used by "Add Meal" search.
- `progress_checkins`: `muscle_mass`, `feel`, `sleep_hours`, `energy_level`, `stress_level`.
- `meal_logs` / `diet_food_items` / `diet_plans`: carbs + fat (and meal type).

Migration `0002`:
- `workout_programs.level`; `clients.phone`; `diet_meals.time`.
- `progress_checkins` review workflow: `status`, `feedback`, `reviewed_at`.
- `messages`: two-way trainer ↔ client chat.

Photos are intentionally not implemented (out of scope); the UI shows a placeholder.

Run `npm run db:migrate` to apply, and `npm run db:seed` to seed demo data + the food library.



## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`, `npm run typecheck`
- `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`

## Icons

`public/icons/` contains an SVG source plus generated PNG placeholders (`icon-192.png`, `icon-512.png`, `maskable-512.png`). Replace with real brand PNGs before production; keep sizes/types referenced in `public/manifest.webmanifest`.

> Note: 512px `maskable` and `any` icons are required for installability. If you regenerate icons, re-run `npm run build` so the service worker precache list stays in sync.
