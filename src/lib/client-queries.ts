import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
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
import { getDemoDashboard, getDemoProfile, isDemoMode } from "@/lib/demo";

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

  let workoutDaysWithEx: Array<{ id: string; name: string; dayNumber: number; exercises: typeof workoutExercises.$inferSelect[] }> = [];
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
      meals.map(async (m) => {
        const foods = await db.select().from(dietFoodItems).where(eq(dietFoodItems.mealId, m.id));
        return { ...m, foods };
      }),
    );
  }

  const recentWorkouts = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, clientId))
    .orderBy(desc(workoutLogs.completedAt))
    .limit(5);
  const recentMeals = await db
    .select()
    .from(mealLogs)
    .where(eq(mealLogs.clientId, clientId))
    .orderBy(desc(mealLogs.loggedAt))
    .limit(5);
  const checkins = await db
    .select()
    .from(progressCheckins)
    .where(eq(progressCheckins.clientId, clientId))
    .orderBy(desc(progressCheckins.createdAt))
    .limit(20);

  return { wAssign: wAssign[0] ?? null, dAssign: dAssign[0] ?? null, workoutDaysWithEx, dietMealsWithFood, recentWorkouts, recentMeals, checkins };
}

export async function getClientProfile(userId: string) {
  if (isDemoMode()) return getDemoProfile(userId);
  const cRows = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  const uRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!cRows[0]) return null;
  const tRows = await db.select().from(users).where(eq(users.id, cRows[0].trainerId)).limit(1);
  return { client: cRows[0], user: uRows[0], trainer: tRows[0] };
}
