import "dotenv/config";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { db } from "../src/db";
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
} from "../src/db/schema";

async function upsertUser(email: string, name: string, role: "trainer" | "client", password: string) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) return existing[0];
  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db.insert(users).values({ email, name, role, passwordHash }).returning();
  return row;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first (see .env.example)");
  console.log("Seeding demo data (clearly marked DEMO)…");

  const trainer = await upsertUser("trainer@repora.demo", "DEMO Trainer", "trainer", "Trainer123!");
  const clientUser = await upsertUser("client@repora.demo", "DEMO Client", "client", "Client123!");

  const cExisting = await db.select().from(clients).where(eq(clients.userId, clientUser.id)).limit(1);
  const client =
    cExisting[0] ??
    (await db.insert(clients).values({ userId: clientUser.id, trainerId: trainer.id, status: "active", goal: "DEMO: build consistency" }).returning())[0];

  // Re-runs must not duplicate seed data.
  const alreadySeeded = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(and(eq(workoutPrograms.trainerId, trainer.id), eq(workoutPrograms.name, "DEMO Full-Body Starter")))
    .limit(1);
  if (alreadySeeded[0]) {
    console.log("DEMO seed data already present, skipping.");
    return;
  }

  const [program] = await db
    .insert(workoutPrograms)
    .values({ trainerId: trainer.id, name: "DEMO Full-Body Starter", description: "DEMO seed program", durationWeeks: 4 })
    .returning();
  const dayNames = ["Push", "Pull", "Legs"];
  for (let i = 0; i < dayNames.length; i++) {
    const [day] = await db.insert(workoutDays).values({ programId: program.id, dayNumber: i + 1, name: `DEMO ${dayNames[i]}` }).returning();
    const exs = [
      { name: "Goblet Squat", sets: 3, reps: "10" },
      { name: "Push-Up", sets: 3, reps: "12" },
      { name: "One-Arm Row", sets: 3, reps: "10" },
    ];
    for (let j = 0; j < exs.length; j++) {
      await db.insert(workoutExercises).values({ workoutDayId: day.id, ...exs[j], restSeconds: 60, sortOrder: j });
    }
  }
  const [wAssign] = await db
    .insert(workoutAssignments)
    .values({ clientId: client.id, programId: program.id, startDate: new Date().toISOString().slice(0, 10), status: "active" })
    .returning();

  const [plan] = await db
    .insert(dietPlans)
    .values({ trainerId: trainer.id, name: "DEMO Balanced 2200", dailyCalories: 2200, proteinTarget: 140, notes: "DEMO seed plan" })
    .returning();
  const [breakfast] = await db.insert(dietMeals).values({ dietPlanId: plan.id, name: "Breakfast", sortOrder: 0 }).returning();
  await db.insert(dietFoodItems).values([
    { mealId: breakfast.id, name: "Oats", quantity: "80g", calories: 300, protein: 10 },
    { mealId: breakfast.id, name: "Whey + milk", quantity: "1 serving", calories: 250, protein: 30 },
  ]);
  await db.insert(dietAssignments).values({ clientId: client.id, dietPlanId: plan.id, startDate: new Date().toISOString().slice(0, 10), status: "active" });

  await db.insert(mealLogs).values({ clientId: client.id, foodName: "DEMO lunch: rice + chicken", quantity: "1 plate", calories: 650, protein: 40 });
  await db.insert(workoutLogs).values({ clientId: client.id, assignmentId: wAssign.id, notes: "DEMO seed workout" });
  await db.insert(progressCheckins).values({ clientId: client.id, weight: 78.5, notes: "DEMO seed check-in" });

  console.log("Done. Trainer: trainer@repora.demo / Trainer123! | Client: client@repora.demo / Client123!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
