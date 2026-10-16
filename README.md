# Repora — Trainer & Client PWA

Repora is a trainer-client PWA: coaches manage multiple clients and assign workout + diet plans; clients view their plans, log progress and message their coach. Next.js App Router + TypeScript + Tailwind + Neon PostgreSQL + Drizzle + Auth.js (Google OAuth) + installable PWA. No separate backend — Server Actions and Route Handlers are the backend.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Neon PostgreSQL via `@neondatabase/serverless`, Drizzle ORM + drizzle-kit migrations
- Auth.js v5 (NextAuth beta) Google provider only (no passwords), JWT sessions, coach allowlist + DB-backed roles, role-based `proxy.ts` routing
- PWA via a hand-rolled service worker (`public/sw.js`, app-shell offline) + `public/manifest.webmanifest` + icons in `public/icons/`. The SW is registered in production only (`src/components/service-worker-register.tsx`) and excluded from API/auth requests.

## Setup

1. Install deps: `npm install`
2. Copy env: `cp .env.example .env.local` (Windows: `Copy-Item .env.example .env.local`) and fill in:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `AUTH_SECRET` — long random string (`npx auth secret` or `openssl rand -base64 32`)
   - `AUTH_URL` / `NEXTAUTH_URL` — e.g. `http://localhost:3000`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client (redirect URI `{AUTH_URL}/api/auth/callback/google`)
   - `COACH_EMAILS` — comma-separated coach Google emails (auto-provisioned as trainers)
3. Apply migrations: `npm run db:migrate` (requires `DATABASE_URL`)
4. Run: `npm run dev` → http://localhost:3000 and sign in with a coach Google account.
   - Coaches in `COACH_EMAILS` are created automatically on first sign-in. Optionally pre-create a row: `ADMIN_EMAIL=... npm run admin:create`.

## Accounts & access

Sign-in is **Google only** — there are no passwords and no public sign-up:

- **Coach** — any email in `COACH_EMAILS` can sign in and is provisioned as a trainer on first sign-in.
- **Client** — the coach registers the client's Google email from **Clients → Add client** (or approves an inquiry). Only registered emails are allowed in; anyone else is denied.
- **Request access (inquiry)** — a public form at `/inquiry` records a request (name, email, phone, goal, message). The coach reviews it at **Trainer → Inquiries** and either:
  - **Approve** — registers the email so they can sign in with Google, or
  - **Decline** — marks it handled.

`/login` signs in with Google. `/` redirects by role (`/trainer` or `/client`). `src/proxy.ts` blocks cross-role routes and keeps `/`, `/welcome`, `/login`, `/inquiry` public. Every protected query/action re-checks the session server-side; clients can only touch their own records, trainers only their assigned clients. Client-supplied IDs are never trusted for auth.

## Flows

- Coach app (mobile-first, dark, bottom nav Home · Clients · Programs · Messages · More):
  - `/trainer` dashboard: totals, weekly active, check-ins, multi-client progress chart, today's tasks (inquiries, pending reviews, at-risk clients).
  - `/trainer/clients` list (All/Active/At Risk tabs, search, add) · `/trainer/clients/[id]` profile (Overview/Progress/Workouts/Diet) · `/trainer/clients/[id]/progress` (+ coach "Add progress entry") · `/trainer/clients/[id]/assign` (workout + diet + weekly schedule).
  - `/trainer/inquiries` review requests and approve (creates the login) or decline.
  - `/trainer/programs` + `/trainer/programs/[id]` builder (days, exercises, level) · `/trainer/diet-plans` + `/trainer/diet-plans/[id]` builder (targets, meals with times, foods).
  - `/trainer/checkins` (Pending/Review tabs) + `/trainer/checkins/[id]` (approve / send feedback).
  - `/trainer/messages` + `/trainer/messages/[clientId]` two-way chat.
  - `/trainer/more` (menu) + `/trainer/settings`.
- Client app (mobile-first, dark): `/client` dashboard, `/client/workouts` (list + day detail + per-set exercise log), `/client/nutrition` (today + diet plan) and `/client/nutrition/add` (searchable food library), `/client/progress`, `/client/checkin`, `/client/messages`, `/client/profile`.
- Public: `/` landing (also at `/welcome` while signed in), `/login`, `/inquiry`.
- Loading, error, and 404 states are handled at the app root plus per-portal skeletons.
- PWA: manifest + theme color + icons; service worker (`public/sw.js`) registered on `npm run start`/production, not in dev. Offline covers app shell + an `/offline.html` fallback — DB reads/writes require network.

## Data model

Core tables: `users`, `clients`, `workout_programs`/`workout_days`/`workout_exercises`/`workout_assignments`/`workout_logs`, `exercise_set_logs`, `diet_plans`/`diet_meals`/`diet_food_items`/`diet_assignments`, `meal_logs`, `progress_checkins`, `messages`, `foods`, `inquiries`.

Notable fields added over the base model:
- `clients`: profile fields (gender, age, height, current/target weight, activity), `phone`, `trainer_id`.
- `progress_checkins`: `muscle_mass`, `feel`, `sleep_hours`, `energy_level`, `stress_level`, review workflow (`status`, `feedback`, `reviewed_at`).
- `meal_logs` / `diet_food_items` / `diet_plans`: carbs + fat (and meal type).
- `messages`: two-way trainer ↔ client chat.
- `inquiries`: public request-access review queue.

Photos are intentionally not implemented (out of scope).

Apply schema changes with `npm run db:generate` then `npm run db:migrate`. The `foods` library (used by the client "Add Meal" search) starts empty — insert rows into `foods` to provide a searchable catalog; clients can always log custom foods.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`, `npm run typecheck`
- `npm run db:generate`, `npm run db:migrate`
- `npm run admin:create` — optionally pre-create a coach account row from `ADMIN_EMAIL`

## Icons

`public/icons/` contains an SVG source plus generated PNG placeholders (`icon-192.png`, `icon-512.png`, `maskable-512.png`). Replace with real brand PNGs before production; keep sizes/types referenced in `public/manifest.webmanifest`.

> Note: 512px `maskable` and `any` icons are required for installability. If you regenerate icons, re-run `npm run build` so the service worker precache list stays in sync.
