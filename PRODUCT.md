# Harsh Gorul — Product Requirements

## Product in one sentence
Harsh Gorul is a simple trainer-client PWA: trainers manage multiple clients and assign workout and diet plans; clients view their plans and log progress.

## Users and permissions

### Trainer
- Signs in to a trainer dashboard.
- Adds clients and manages their basic profile.
- Creates reusable workout programs and diet plans.
- Assigns a workout program and/or diet plan to a client.
- Reviews client workout logs, meal logs, and progress check-ins.

### Client
- Signs in to a personal mobile-friendly dashboard.
- Sees only their own profile and plans assigned by their trainer.
- Marks workout exercises or a workout as completed.
- Logs meals with food name, calories, and protein.
- Submits a check-in with weight, optional measurements, notes, and optional progress photo if file upload is configured.

A user has one role: `trainer` or `client`. For this MVP, each client belongs to one trainer.

## Pages

### Shared
- `/login` — sign in
- `/` — redirect to the correct dashboard based on role

### Trainer portal
- `/trainer` — overview: total clients, active clients, recent activity, and clients needing attention
- `/trainer/clients` — searchable client list and add-client action
- `/trainer/clients/[id]` — client profile, assigned plans, logs, and check-ins
- `/trainer/programs` — list/create/edit workout programs
- `/trainer/diet-plans` — list/create/edit diet plans

### Client portal
- `/client` — today's plan and quick actions
- `/client/workouts` — assigned workout plan and workout completion
- `/client/nutrition` — assigned diet plan and meal logging
- `/client/progress` — progress history and check-in form
- `/client/profile` — basic profile

Do not create more pages unless needed for these flows.

## Core flows

### 1. Add a client
1. Trainer opens Clients and selects Add Client.
2. Trainer enters client name and email.
3. Create or invite the client account using the chosen authentication flow.
4. Associate the client with the signed-in trainer.
5. Show the client in the trainer's list.

If email invitations are not configured, provide a safe development-only way to create a client account and document it. Do not expose passwords or credentials in production.

### 2. Create and assign a workout program
- Program fields: name, description, duration in weeks.
- A program contains ordered days.
- Each day contains exercises.
- Each exercise has name, sets, reps, and optional rest time and notes.
- Trainer can assign a program to one client with a start date.
- Client sees the assigned plan and can mark exercises/workouts complete.

### 3. Create and assign a diet plan
- Plan fields: name, daily calorie target, protein target, optional notes.
- A plan contains meals.
- Each meal has a name and food items.
- Each food item has a quantity/serving description and optional calories/protein.
- Trainer can assign a plan to one client.
- Client can view the plan and separately log actual food consumed.

### 4. Client check-in
- Client submits date, weight, optional body-fat percentage, optional measurements, and notes.
- Trainer can view check-ins for their own clients.
- Show simple history; avoid advanced analytics.

## Minimal data model
Use relational tables with IDs, timestamps, and foreign keys.

- `users`: id, name, email, role
- `clients`: id, user_id, trainer_id, status, goal, created_at
- `workout_programs`: id, trainer_id, name, description, duration_weeks, created_at
- `workout_days`: id, program_id, day_number, name
- `workout_exercises`: id, workout_day_id, name, sets, reps, rest_seconds, notes, sort_order
- `workout_assignments`: id, client_id, program_id, start_date, status
- `workout_logs`: id, client_id, assignment_id, workout_day_id, completed_at, notes
- `diet_plans`: id, trainer_id, name, daily_calories, protein_target, notes, created_at
- `diet_meals`: id, diet_plan_id, name, sort_order
- `diet_food_items`: id, meal_id, name, quantity, calories, protein
- `diet_assignments`: id, client_id, diet_plan_id, start_date, status
- `meal_logs`: id, client_id, food_name, quantity, calories, protein, logged_at
- `progress_checkins`: id, client_id, weight, body_fat_percent, measurements_json, notes, created_at

Use the ORM's appropriate JSON type for optional measurements if practical. Avoid storing sensitive data that is not needed.

## Design direction
Use the supplied reference image as visual inspiration:
- Product name: Harsh Gorul
- Premium, restrained fitness-tech aesthetic
- Trainer dashboard: dark charcoal/navy surfaces, subtle borders, muted text, restrained lime-green accent
- Client mobile UI: clean light surfaces, strong readability, green primary actions
- Compact cards, clear hierarchy, simple charts only where they help
- Consistent spacing, typography, buttons, inputs, badges, and navigation
- Avoid neon effects, excessive gradients, decorative clutter, and oversized charts
- Use accessible contrast and visible focus states

The reference image is a direction, not a mandate to reproduce every panel. Prioritize usable, coherent screens over pixel-perfect imitation.

## PWA requirements
- Include a valid web app manifest, app name, theme/background colors, and app icons or documented icon placeholders.
- Add the required metadata and service-worker setup using a maintained Next.js-compatible approach.
- The app must be installable on supported browsers.
- Do not promise full offline database editing. Offline support can be limited to the app shell unless reliable synchronization is implemented.

## Out of scope
- AI coach or AI-generated meal plans
- Payments/subscriptions
- Wearables and health-platform integrations
- Public social feed
- Gym branches or multiple trainer seats
- Video calling
- Complex reports and predictive analytics
- Barcode/food database integrations
- Native iOS/Android apps

## Acceptance criteria
- Both roles can authenticate.
- Trainer/client access boundaries are enforced server-side.
- Trainer can create clients and CRUD workout and diet plans.
- Trainer can assign plans to clients.
- Client can view assigned plans and create workout logs, meal logs, and check-ins.
- Data persists in Neon PostgreSQL and survives refresh/re-login.
- Forms have validation and useful error/success feedback.
- Main pages work on desktop and mobile.
- PWA can be installed in a supported browser.
- README and `.env.example` make local setup understandable.
