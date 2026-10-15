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
  return { ...c, onboardingCompleted: c.onboardingCompleted ?? true, createdAt: D(c.createdAt) };
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
    .map((m) => ({ ...m, mealType: null as string | null, carbs: null as number | null, fat: null as number | null, loggedAt: D(m.loggedAt) }))
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
    .slice(0, 20);
  const checkins = raw.checkins
    .filter((c) => c.clientId === clientId)
    .map((c) => ({
      ...c,
      muscleMass: null as number | null,
      feel: null as string | null,
      sleepHours: null as number | null,
      energyLevel: null as string | null,
      stressLevel: null as string | null,
      status: "approved",
      feedback: null as string | null,
      reviewedAt: null as Date | null,
      createdAt: D(c.createdAt),
    }))
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
      level: "intermediate",
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
              muscleGroups: null,
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
                instructions: null,
                muscleGroup: null,
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
      carbsTarget: null,
      fatTarget: null,
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
              time: null,
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
                carbs: null,
                fat: null,
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

  const trainerId = demoClients.find((c) => c.id === clientId)?.trainerId ?? "";
  const wAssign = wList[0]
    ? {
        assignment: wList[0],
        program: getDemoPrograms(trainerId).find((p) => p.id === wList[0].programId)!,
      }
    : null;
  const dAssign = dList[0]
    ? {
        assignment: dList[0],
        plan: getDemoDietPlans(trainerId).find((p) => p.id === dList[0].dietPlanId)!,
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
    .map(
      (m) =>
        ({ ...m, mealType: null, carbs: null, fat: null, loggedAt: D(m.loggedAt) }) satisfies MealLog,
    )
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime())
    .slice(0, 40);
  const checkins = raw.checkins
    .filter((c) => c.clientId === clientId)
    .map(
      (c) =>
        ({
          ...c,
          muscleMass: null,
          feel: null,
          sleepHours: null,
          energyLevel: null,
          stressLevel: null,
          measurementsJson: (c.measurementsJson ?? null) as Record<string, string> | null,
          status: "approved",
          feedback: null,
          reviewedAt: null,
          createdAt: D(c.createdAt),
        }) satisfies Checkin,
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  const completedDayIds = Array.from(
    new Set(
      raw.workoutLogs
        .filter((l) => l.clientId === clientId && l.workoutDayId)
        .map((l) => l.workoutDayId as string),
    ),
  );

  return { wAssign, dAssign, workoutDaysWithEx, dietMealsWithFood, recentWorkouts, recentMeals, checkins, completedDayIds };
}

export function getDemoProfile(userId: string) {
  const client = demoClients.find((c) => c.userId === userId);
  if (!client) return null;
  const user = demoUsers.find((u) => u.id === userId)!;
  const trainer = demoUsers.find((u) => u.id === client.trainerId);
  return { client: toClient(client), user: toUser(user), trainer: trainer ? toUser(trainer) : undefined };
}

export type FoodRow = typeof import("@/db/schema").foods.$inferSelect;
type MealLogRow = typeof mealLogs.$inferSelect;

const DEMO_FOODS: FoodRow[] = [
  { id: "food-chicken", name: "Chicken Breast", serving: "100g", calories: 165, protein: 31, carbs: 0, fat: 4, isPopular: true },
  { id: "food-egg", name: "Egg", serving: "1 large", calories: 72, protein: 6, carbs: 0, fat: 5, isPopular: true },
  { id: "food-roti", name: "Roti", serving: "1 medium", calories: 104, protein: 3, carbs: 22, fat: 0, isPopular: true },
  { id: "food-rice", name: "Cooked Rice", serving: "130g", calories: 130, protein: 3, carbs: 28, fat: 0, isPopular: true },
  { id: "food-oatmeal", name: "Oats", serving: "40g", calories: 150, protein: 5, carbs: 27, fat: 3, isPopular: true },
  { id: "food-paneer", name: "Paneer", serving: "100g", calories: 265, protein: 18, carbs: 3, fat: 21, isPopular: true },
  { id: "food-banana", name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0, isPopular: true },
  { id: "food-dal", name: "Dal", serving: "1 bowl", calories: 180, protein: 12, carbs: 30, fat: 1, isPopular: true },
  { id: "food-whey", name: "Whey Protein", serving: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1, isPopular: true },
  { id: "food-curd", name: "Curd", serving: "100g", calories: 60, protein: 3, carbs: 5, fat: 3, isPopular: false },
  { id: "food-almonds", name: "Almonds", serving: "10 pcs", calories: 70, protein: 3, carbs: 3, fat: 6, isPopular: false },
  { id: "food-salmon", name: "Salmon", serving: "100g", calories: 208, protein: 20, carbs: 0, fat: 13, isPopular: false },
];

export function getDemoExerciseHistory(_clientId: string, _exerciseId: string) {
  void _clientId;
  void _exerciseId;
  return [] as Array<{
    id: string;
    clientId: string;
    workoutDayId: string | null;
    exerciseId: string;
    setNumber: number;
    weight: number | null;
    reps: number | null;
    loggedAt: Date;
  }>;
}

export function getDemoFoodCatalog(clientId: string, search?: string) {
  const q = (search ?? "").trim().toLowerCase();
  const results = q ? DEMO_FOODS.filter((f) => f.name.toLowerCase().includes(q)) : DEMO_FOODS.filter((f) => f.isPopular);
  const popular = DEMO_FOODS.filter((f) => f.isPopular);
  const recent: MealLogRow[] = raw.mealLogs
    .filter((m) => m.clientId === clientId)
    .map(
      (m) =>
        ({ ...m, mealType: null, carbs: null, fat: null, loggedAt: D(m.loggedAt) }) satisfies MealLogRow,
    )
    .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
  return { results, popular, recent };
}
