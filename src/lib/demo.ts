import type {
  clients,
  dietAssignments,
  dietFoodItems,
  dietMeals,
  dietPlans,
  mealLogs,
  progressCheckins,
  users,
  workoutAssignments,
  workoutDays,
  workoutExercises,
  workoutLogs,
  workoutPrograms,
} from "@/db/schema";
import raw from "./demo-data.json";

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

type User = typeof users.$inferSelect;
type Client = typeof clients.$inferSelect;

const D = (iso: string) => new Date(iso);

const demoUsers = raw.users as unknown as Array<
  Omit<User, "passwordHash" | "createdAt"> & { createdAt: string }
>;
const demoClients = raw.clients as unknown as Array<
  Omit<Client, "createdAt"> & { createdAt: string }
>;

function toUser(u: (typeof demoUsers)[number]): User {
  return { ...u, passwordHash: "demo", createdAt: D(u.createdAt) };
}
function toClient(c: (typeof demoClients)[number]): Client {
  return { ...c, createdAt: D(c.createdAt) };
}

/** Demo sign-in accounts (DEMO_MODE only, no database). */
export function checkDemoCredentials(email: string, password: string) {
  const e = email.toLowerCase().trim();
  if (e === "trainer@repora.demo" && password === "Trainer123!") {
    const u = demoUsers.find((x) => x.role === "trainer")!;
    return { id: u.id, name: u.name, email: u.email, role: "trainer" as const };
  }
  if (e === "client@repora.demo" && password === "Client123!") {
    const u = demoUsers.find((x) => x.id === "22222222-2222-4222-8222-222222222222")!;
    return { id: u.id, name: u.name, email: u.email, role: "client" as const };
  }
  return null;
}

export function demoClientForUser(userId: string): Client | null {
  const c = demoClients.find((x) => x.userId === userId);
  return c ? toClient(c) : null;
}

/** No-op success for mutations in demo mode (nothing persists). */
export function demoOk() {
  return { ok: true as const };
}

export function getDemoClients(trainerId: string, search?: string) {
  const q = (search ?? "").toLowerCase();
  return demoClients
    .filter((c) => c.trainerId === trainerId)
    .map((client) => ({ client: toClient(client), user: toUser(demoUsers.find((u) => u.id === client.userId)!) }))
    .filter(
      ({ user }) =>
        !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    );
}

export function getDemoOverview(trainerId: string) {
  const clientRows = getDemoClients(trainerId);
  const clientIds = clientRows.map((r) => r.client.id);
  const logs = raw.workoutLogs
    .filter((l) => clientIds.includes(l.clientId))
    .map((l) => ({ ...l, completedAt: D(l.completedAt) }))
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const checkins = raw.checkins
    .filter((c) => clientIds.includes(c.clientId))
    .map((c) => ({ ...c, createdAt: D(c.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeIds = new Set<string>();
  for (const l of logs) if (l.completedAt.getTime() > weekAgo) activeIds.add(l.clientId);
  for (const c of checkins) if (c.createdAt.getTime() > weekAgo) activeIds.add(c.clientId);

  return {
    totalClients: clientRows.length,
    activeClients: activeIds.size,
    recentLogs: logs.slice(0, 8),
    recentCheckins: checkins.slice(0, 8),
    needingAttention: clientRows.filter((r) => !activeIds.has(r.client.id)).slice(0, 8),
    clientRows,
  };
}

export function getDemoClientDetail(_trainerId: string, clientId: string) {
  const client = demoClients.find((c) => c.id === clientId);
  if (!client) return null;
  const user = demoUsers.find((u) => u.id === client.userId)!;
  const wAssign = raw.workoutAssignments
    .filter((a) => a.clientId === clientId)
    .map((a) => ({ ...a, createdAt: D(a.createdAt) }));
  const dAssign = raw.dietAssignments
    .filter((a) => a.clientId === clientId)
    .map((a) => ({ ...a, createdAt: D(a.createdAt) }));
  const logs = raw.workoutLogs
    .filter((l) => l.clientId === clientId)
    .map((l) => ({ ...l, completedAt: D(l.completedAt) }))
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 20);
  const meals = raw.mealLogs
    .filter((m) => m.clientId === clientId)
    .map((m) => ({ ...m, loggedAt: D(m.loggedAt) }))
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
    .slice(0, 20);
  const checkins = raw.checkins
    .filter((c) => c.clientId === clientId)
    .map((c) => ({ ...c, createdAt: D(c.createdAt) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);
  return { client: toClient(client), user: toUser(user), wAssign, dAssign, logs, meals, checkins };
}

type Program = typeof workoutPrograms.$inferSelect;
type Day = typeof workoutDays.$inferSelect;
type Exercise = typeof workoutExercises.$inferSelect;
type DietPlan = typeof dietPlans.$inferSelect;
type DietMeal = typeof dietMeals.$inferSelect;
type Food = typeof dietFoodItems.$inferSelect;

export function getDemoPrograms(trainerId: string) {
  return raw.programs
    .filter((p) => p.trainerId === trainerId)
    .map((p) => ({
      id: p.id,
      trainerId: p.trainerId,
      name: p.name,
      description: p.description,
      durationWeeks: p.durationWeeks,
      createdAt: D(p.createdAt),
    }) satisfies Program)
    .map((prog) => {
      const src = raw.programs.find((p) => p.id === prog.id)!;
      const days = src.days
        .map(
          (d) =>
            ({
              id: d.id,
              programId: prog.id,
              dayNumber: d.dayNumber,
              name: d.name,
            }) satisfies Day,
        )
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((day) => {
          const dsrc = src.days.find((d) => d.id === day.id)!;
          const exercises = dsrc.exercises.map(
            (e) =>
              ({
                id: e.id,
                workoutDayId: day.id,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                restSeconds: e.restSeconds,
                notes: e.notes,
                sortOrder: e.sortOrder,
              }) satisfies Exercise,
          );
          return { ...day, exercises };
        });
      return { ...prog, days };
    });
}

export function getDemoDietPlans(trainerId: string) {
  return raw.dietPlans
    .filter((p) => p.trainerId === trainerId)
    .map((p) => ({
      id: p.id,
      trainerId: p.trainerId,
      name: p.name,
      dailyCalories: p.dailyCalories,
      proteinTarget: p.proteinTarget,
      notes: p.notes,
      createdAt: D(p.createdAt),
    }) satisfies DietPlan)
    .map((plan) => {
      const src = raw.dietPlans.find((p) => p.id === plan.id)!;
      const meals = src.meals
        .map(
          (m) =>
            ({
              id: m.id,
              dietPlanId: plan.id,
              name: m.name,
              sortOrder: m.sortOrder,
            }) satisfies DietMeal,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((meal) => {
          const msrc = src.meals.find((m) => m.id === meal.id)!;
          const foods = msrc.foods.map(
            (f) =>
              ({
                id: f.id,
                mealId: meal.id,
                name: f.name,
                quantity: f.quantity,
                calories: f.calories,
                protein: f.protein,
              }) satisfies Food,
          );
          return { ...meal, foods };
        });
      return { ...plan, meals };
    });
}

type WorkoutAssignment = typeof workoutAssignments.$inferSelect;
type DietAssignment = typeof dietAssignments.$inferSelect;
type WorkoutLog = typeof workoutLogs.$inferSelect;
type MealLog = typeof mealLogs.$inferSelect;
type Checkin = typeof progressCheckins.$inferSelect;

export function getDemoDashboard(clientId: string) {
  const wList = raw.workoutAssignments
    .filter((a) => a.clientId === clientId)
    .map((a) => ({ ...a, createdAt: D(a.createdAt) }) satisfies WorkoutAssignment)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const dList = raw.dietAssignments
    .filter((a) => a.clientId === clientId)
    .map((a) => ({ ...a, createdAt: D(a.createdAt) }) satisfies DietAssignment)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const wAssign = wList[0]
    ? {
        assignment: wList[0],
        program: getDemoPrograms(demoClients.find((c) => c.id === clientId)!.trainerId).find(
          (p) => p.id === wList[0].programId,
        )!,
      }
    : null;
  const dAssign = dList[0]
    ? {
        assignment: dList[0],
        plan: getDemoDietPlans(demoClients.find((c) => c.id === clientId)!.trainerId).find(
          (p) => p.id === dList[0].dietPlanId,
        )!,
      }
    : null;

  const workoutDaysWithEx = wAssign ? wAssign.program.days : [];
  const dietMealsWithFood = dAssign ? dAssign.plan.meals : [];

  const recentWorkouts = raw.workoutLogs
    .filter((l) => l.clientId === clientId)
    .map((l) => ({ ...l, completedAt: D(l.completedAt) }) satisfies WorkoutLog)
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    .slice(0, 5);
  const recentMeals = raw.mealLogs
    .filter((m) => m.clientId === clientId)
    .map((m) => ({ ...m, loggedAt: D(m.loggedAt) }) satisfies MealLog)
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
    .slice(0, 5);
  const checkins = raw.checkins
    .filter((c) => c.clientId === clientId)
    .map(
      (c) =>
        ({
          ...c,
          measurementsJson: (c.measurementsJson ?? null) as Record<string, string> | null,
          createdAt: D(c.createdAt),
        }) satisfies Checkin,
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  return { wAssign, dAssign, workoutDaysWithEx, dietMealsWithFood, recentWorkouts, recentMeals, checkins };
}

export function getDemoProfile(userId: string) {
  const client = demoClients.find((c) => c.userId === userId);
  if (!client) return null;
  const user = demoUsers.find((u) => u.id === userId)!;
  const trainer = demoUsers.find((u) => u.id === client.trainerId);
  return { client: toClient(client), user: toUser(user), trainer: trainer ? toUser(trainer) : undefined };
}
