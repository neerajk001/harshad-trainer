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
  foods,
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
    (await db.insert(clients).values({ userId: clientUser.id, trainerId: trainer.id, status: "active", goal: "DEMO: build consistency", onboardingCompleted: true }).returning())[0];

  // Food library for the client "Add Meal" search.
  const foodCount = await db.select({ id: foods.id }).from(foods).limit(1);
  if (foodCount.length === 0) {
    await db.insert(foods).values([
      { name: "Chicken Breast", serving: "100g", calories: 165, protein: 31, carbs: 0, fat: 4, isPopular: true },
      { name: "Egg", serving: "1 large", calories: 72, protein: 6, carbs: 0, fat: 5, isPopular: true },
      { name: "Roti", serving: "1 medium", calories: 104, protein: 3, carbs: 22, fat: 0, isPopular: true },
      { name: "Cooked Rice", serving: "130g", calories: 130, protein: 3, carbs: 28, fat: 0, isPopular: true },
      { name: "Oats", serving: "40g", calories: 150, protein: 5, carbs: 27, fat: 3, isPopular: true },
      { name: "Paneer", serving: "100g", calories: 265, protein: 18, carbs: 3, fat: 21, isPopular: true },
      { name: "Banana", serving: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0, isPopular: true },
      { name: "Dal", serving: "1 bowl", calories: 180, protein: 12, carbs: 30, fat: 1, isPopular: true },
      { name: "Whey Protein", serving: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1, isPopular: true },
      { name: "Curd", serving: "100g", calories: 60, protein: 3, carbs: 5, fat: 3, isPopular: false },
      { name: "Almonds", serving: "10 pcs", calories: 70, protein: 3, carbs: 3, fat: 6, isPopular: false },
      { name: "Salmon", serving: "100g", calories: 208, protein: 20, carbs: 0, fat: 13, isPopular: false },
    ]);
  }

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
    .values({ trainerId: trainer.id, name: "DEMO Balanced 2200", dailyCalories: 2200, proteinTarget: 140, carbsTarget: 250, fatTarget: 65, notes: "DEMO seed plan" })
    .returning();
  const [breakfast] = await db.insert(dietMeals).values({ dietPlanId: plan.id, name: "Breakfast", sortOrder: 0 }).returning();
  await db.insert(dietFoodItems).values([
    { mealId: breakfast.id, name: "Oats", quantity: "80g", calories: 300, protein: 10, carbs: 50, fat: 6 },
    { mealId: breakfast.id, name: "Whey + milk", quantity: "1 serving", calories: 250, protein: 30, carbs: 12, fat: 5 },
  ]);
  await db.insert(dietAssignments).values({ clientId: client.id, dietPlanId: plan.id, startDate: new Date().toISOString().slice(0, 10), status: "active" });

  await db.insert(mealLogs).values({ clientId: client.id, foodName: "DEMO lunch: rice + chicken", quantity: "1 plate", mealType: "lunch", calories: 650, protein: 40, carbs: 70, fat: 15 });
  await db.insert(workoutLogs).values({ clientId: client.id, assignmentId: wAssign.id, notes: "DEMO seed workout" });
  await db
    .insert(progressCheckins)
    .values({ clientId: client.id, weight: 78.5, bodyFatPercent: 22.1, muscleMass: 56.4, feel: "Good", sleepHours: 7, energyLevel: "Good", stressLevel: "Moderate", notes: "DEMO seed check-in" });

  console.log("Done. Trainer: trainer@repora.demo / Trainer123! | Client: client@repora.demo / Client123!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
