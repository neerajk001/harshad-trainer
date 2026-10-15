<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repora PWA — Coding Instructions

## Goal
Build a simple, working full-stack PWA for personal trainers to manage multiple clients. There are two roles: **Trainer** and **Client**. Use the supplied design reference as visual direction, not as a requirement to reproduce every detail.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- Auth.js or a simple, secure authentication solution compatible with the chosen Next.js setup
- Installable PWA support

Do not add a separate backend service. Next.js Server Actions and Route Handlers are the backend. Keep the architecture small.

## Build rules
1. Inspect the existing repository before changing anything. Preserve working conventions and dependencies where reasonable.
2. If the repository is empty, initialize the app with the stack above.
3. Implement real database-backed functionality. Do not leave fake buttons, placeholder pages, or hard-coded dashboard metrics as the final implementation.
4. Keep the UI responsive and mobile-first. The trainer dashboard is optimized for desktop; the client experience is optimized for mobile.
5. Use clear loading, empty, success, and error states.
6. Validate all form input on the server. Enforce authorization on every protected action and query.
7. A client must only access their own records and plans. A trainer must only access clients assigned to that trainer. Never trust a client-supplied user ID for authorization.
8. Use environment variables for secrets and database connection strings. Never commit `.env` files or credentials.
9. Add database migrations and a small seed script with clearly marked demo data if useful.
10. Run available lint, type-check, migration and build commands. Fix errors before finishing.

## Scope discipline
Build only the MVP described in `PRODUCT.md`. Do not add AI coaching, payments, wearable integrations, complex analytics, gym multi-staff management, or unnecessary abstractions.

## Required environment
Document these in `.env.example`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- Authentication secrets and URL required by the chosen auth implementation

## Done means
- A trainer can sign in, add/manage clients, create workout and diet plans, and assign plans.
- A client can sign in and see only their assigned plans, log workout completion and meals, and submit a progress check-in.
- Data persists in Neon PostgreSQL.
- Access is enforced server-side.
- The app is responsive and installable as a PWA.
- README explains setup, migrations, seed data, and running locally.
