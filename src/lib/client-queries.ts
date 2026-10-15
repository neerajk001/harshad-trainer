import { and, desc, eq, ilike } from "drizzle-orm";

import { db } from "@/db";
import {
  clients,
  dietAssignments,
  dietFoodItems,
  dietMeals,
  dietPlans,
  exerciseSetLogs,
  foods,
  mealLogs,
  progressCheckins,
  users,
  workoutAssignments,
  workoutDays,
  workoutExercises,
  workoutLogs,
  workoutPrograms,
} from "@/db/schema";
import {
  demoClientForUser,
  getDemoDashboard,
  getDemoExerciseHistory,
  getDemoFoodCatalog,
  getDemoProfile,
  isDemoMode,
} from "@/lib/demo";

export async function getClientDashboard(clientId: string) {
  if (isDemoMode()) return getDemoDashboard(clientId);
  const wAssign = await db
    .select({ assignment: workoutAssignments, program: workoutPrograms })
    .from(workoutAssignments)
    .innerJoin(workoutPrograms, eq(workoutPrograms.id, workoutAssignments.programId))
    .where(eq(workoutAssignments.clientId, clientId))
    .orderBy(desc(workoutAssignments.createdAt))
    .limit(1);

  const dAssign = await db
    .select({ assignment: dietAssignments, plan: dietPlans })
    .from(dietAssignments)
    .innerJoin(dietPlans, eq(dietPlans.id, dietAssignments.dietPlanId))
    .where(eq(dietAssignments.clientId, clientId))
    .orderBy(desc(dietAssignments.createdAt))
    .limit(1);

  let workoutDaysWithEx: Array<{ id: string; name: string; dayNumber: number; muscleGroups: string | null; exercises: typeof workoutExercises.$inferSelect[] }> = [];
  if (wAssign[0]) {
    const days = await db.select().from(workoutDays).where(eq(workoutDays.programId, wAssign[0].program.id));
    workoutDaysWithEx = await Promise.all(
      days
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map(async (d) => {
          const ex = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutDayId, d.id));
          return { ...d, exercises: ex.sort((a, b) => a.sortOrder - b.sortOrder) };
        }),
    );
  }

  let dietMealsWithFood: Array<{ id: string; name: string; foods: typeof dietFoodItems.$inferSelect[] }> = [];
  if (dAssign[0]) {
    const meals = await db.select().from(dietMeals).where(eq(dietMeals.dietPlanId, dAssign[0].plan.id));
    dietMealsWithFood = await Promise.all(
      meals
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(async (m) => {
          const food = await db.select().from(dietFoodItems).where(eq(dietFoodItems.mealId, m.id));
          return { ...m, foods: food };
        }),
    );
  }

  const recentWorkouts = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, clientId))
    .orderBy(desc(workoutLogs.completedAt))
    .limit(20);
  const recentMeals = await db
    .select()
    .from(mealLogs)
    .where(eq(mealLogs.clientId, clientId))
    .orderBy(desc(mealLogs.loggedAt))
    .limit(40);
  const checkins = await db
    .select()
    .from(progressCheckins)
    .where(eq(progressCheckins.clientId, clientId))
    .orderBy(desc(progressCheckins.createdAt))
    .limit(20);

  const logRows = await db
    .select({ workoutDayId: workoutLogs.workoutDayId })
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, clientId));
  const completedDayIds = Array.from(
    new Set(logRows.map((r) => r.workoutDayId).filter((v): v is string => Boolean(v))),
  );

  return { wAssign: wAssign[0] ?? null, dAssign: dAssign[0] ?? null, workoutDaysWithEx, dietMealsWithFood, recentWorkouts, recentMeals, checkins, completedDayIds };
}

export async function getClientProfile(userId: string) {
  if (isDemoMode()) return getDemoProfile(userId);
  const cRows = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  const uRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!cRows[0]) return null;
  const tRows = cRows[0].trainerId
    ? await db.select().from(users).where(eq(users.id, cRows[0].trainerId)).limit(1)
    : [];
  return { client: cRows[0], user: uRows[0], trainer: tRows[0] };
}

export async function getClientRecord(userId: string) {
  if (isDemoMode()) return demoClientForUser(userId);
  const rows = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getWorkoutDayData(clientId: string, dayId: string) {
  const data = await getClientDashboard(clientId);
  const day = data.workoutDaysWithEx.find((d) => d.id === dayId) ?? null;
  if (!day) return null;
  const loggedExerciseIds = isDemoMode()
    ? []
    : Array.from(
        new Set(
          (
            await db
              .select({ exerciseId: exerciseSetLogs.exerciseId })
              .from(exerciseSetLogs)
              .where(and(eq(exerciseSetLogs.clientId, clientId), eq(exerciseSetLogs.workoutDayId, dayId)))
          ).map((r) => r.exerciseId),
        ),
      );
  const completed = data.completedDayIds.includes(dayId);
  return { day, program: data.wAssign?.program ?? null, assignment: data.wAssign?.assignment ?? null, completed, loggedExerciseIds };
}

export async function getExerciseData(clientId: string, exerciseId: string) {
  const data = await getClientDashboard(clientId);
  let day: (typeof data.workoutDaysWithEx)[number] | null = null;
  let exercise: (typeof data.workoutDaysWithEx)[number]["exercises"][number] | null = null;
  for (const d of data.workoutDaysWithEx) {
    const found = d.exercises.find((e) => e.id === exerciseId);
    if (found) {
      day = d;
      exercise = found;
      break;
    }
  }
  const history = isDemoMode()
    ? getDemoExerciseHistory(clientId, exerciseId)
    : await db
        .select()
        .from(exerciseSetLogs)
        .where(and(eq(exerciseSetLogs.clientId, clientId), eq(exerciseSetLogs.exerciseId, exerciseId)))
        .orderBy(desc(exerciseSetLogs.loggedAt))
        .limit(60);
  return { exercise, day, history, program: data.wAssign?.program ?? null };
}

export async function getFoodCatalog(clientId: string, search?: string) {
  if (isDemoMode()) return getDemoFoodCatalog(clientId, search);
  const q = (search ?? "").trim();
  const results = q
    ? await db.select().from(foods).where(ilike(foods.name, `%${q}%`)).limit(30)
    : await db.select().from(foods).where(eq(foods.isPopular, true)).limit(20);
  const popular = await db.select().from(foods).where(eq(foods.isPopular, true)).limit(20);
  const recent = await db
    .select()
    .from(mealLogs)
    .where(eq(mealLogs.clientId, clientId))
    .orderBy(desc(mealLogs.loggedAt))
    .limit(20);
  return { results, popular, recent };
}
