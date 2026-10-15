import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

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

/** Escape LIKE wildcards so a search for "%" or "_" matches literally. */
function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function getTrainerClients(trainerId: string, search?: string) {
  const q = search?.trim();
  const rows = await db
    .select({ client: clients, user: users })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(
      q
        ? and(
            eq(clients.trainerId, trainerId),
            or(ilike(users.name, `%${escapeLike(q)}%`), ilike(users.email, `%${escapeLike(q)}%`)),
          )
        : eq(clients.trainerId, trainerId),
    );
  return rows;
}

export async function getTrainerOverview(trainerId: string) {
  const clientRows = await db
    .select({ client: clients, user: users })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(eq(clients.trainerId, trainerId));
  const clientIds = clientRows.map((r) => r.client.id);

  // Scope activity to THIS trainer's clients. A global "latest 10" would mix in
  // other trainers' rows and wrongly flag this trainer's clients as inactive.
  const recentLogs = clientIds.length
    ? await db
        .select()
        .from(workoutLogs)
        .where(inArray(workoutLogs.clientId, clientIds))
        .orderBy(desc(workoutLogs.completedAt))
        .limit(10)
    : [];
  const recentCheckins = clientIds.length
    ? await db
        .select()
        .from(progressCheckins)
        .where(inArray(progressCheckins.clientId, clientIds))
        .orderBy(desc(progressCheckins.createdAt))
        .limit(10)
    : [];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeIds = new Set<string>();
  for (const l of recentLogs) {
    if (new Date(l.completedAt).getTime() > sevenDaysAgo) activeIds.add(l.clientId);
  }
  for (const c of recentCheckins) {
    if (new Date(c.createdAt).getTime() > sevenDaysAgo) activeIds.add(c.clientId);
  }

  const needingAttention = clientRows.filter((r) => !activeIds.has(r.client.id)).slice(0, 8);

  return {
    totalClients: clientRows.length,
    activeClients: activeIds.size,
    recentLogs: recentLogs.slice(0, 8),
    recentCheckins: recentCheckins.slice(0, 8),
    needingAttention,
    clientRows,
  };
}

export async function getClientDetail(trainerId: string, clientId: string) {
  const cRows = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const client = cRows[0];
  if (!client || client.trainerId !== trainerId) return null;
  const uRows = await db.select().from(users).where(eq(users.id, client.userId)).limit(1);
  const wAssign = await db.select().from(workoutAssignments).where(eq(workoutAssignments.clientId, clientId));
  const dAssign = await db.select().from(dietAssignments).where(eq(dietAssignments.clientId, clientId));
  const logs = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.clientId, clientId))
    .orderBy(desc(workoutLogs.completedAt))
    .limit(20);
  const meals = await db
    .select()
    .from(mealLogs)
    .where(eq(mealLogs.clientId, clientId))
    .orderBy(desc(mealLogs.loggedAt))
    .limit(20);
  const checkins = await db
    .select()
    .from(progressCheckins)
    .where(eq(progressCheckins.clientId, clientId))
    .orderBy(desc(progressCheckins.createdAt))
    .limit(20);
  return { client, user: uRows[0], wAssign, dAssign, logs, meals, checkins };
}

export async function getTrainerPrograms(trainerId: string) {
  const programs = await db
    .select()
    .from(workoutPrograms)
    .where(eq(workoutPrograms.trainerId, trainerId))
    .orderBy(desc(workoutPrograms.createdAt));
  const withDetails = await Promise.all(
    programs.map(async (p) => {
      const days = await db.select().from(workoutDays).where(eq(workoutDays.programId, p.id));
      const daysWithEx = await Promise.all(
        days
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map(async (d) => {
            const ex = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutDayId, d.id));
            return { ...d, exercises: ex.sort((a, b) => a.sortOrder - b.sortOrder) };
          }),
      );
      return { ...p, days: daysWithEx };
    }),
  );
  return withDetails;
}

export async function getTrainerDietPlans(trainerId: string) {
  const plans = await db
    .select()
    .from(dietPlans)
    .where(eq(dietPlans.trainerId, trainerId))
    .orderBy(desc(dietPlans.createdAt));
  const withDetails = await Promise.all(
    plans.map(async (p) => {
      const meals = await db.select().from(dietMeals).where(eq(dietMeals.dietPlanId, p.id));
      const mealsWithFood = await Promise.all(
        meals
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(async (m) => {
            const foods = await db.select().from(dietFoodItems).where(eq(dietFoodItems.mealId, m.id));
            return { ...m, foods };
          }),
      );
      return { ...p, meals: mealsWithFood };
    }),
  );
  return withDetails;
}
