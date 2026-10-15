"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  clients,
  dietAssignments,
  dietFoodItems,
  dietMeals,
  dietPlans,
  users,
  workoutAssignments,
  workoutDays,
  workoutExercises,
  workoutPrograms,
} from "@/db/schema";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";
import {
  addClientSchema,
  assignDietSchema,
  assignWorkoutSchema,
  dietMealSchema,
  dietPlanSchema,
  exerciseSchema,
  foodItemSchema,
  programSchema,
  workoutDaySchema,
} from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}
function ok() {
  return { ok: true as const };
}

/** Confirm a workout day belongs to a program owned by this trainer. */
async function ownsWorkoutDay(trainerId: string, dayId: string) {
  const day = await db.select().from(workoutDays).where(eq(workoutDays.id, dayId)).limit(1);
  if (!day[0]) return null;
  const prog = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(and(eq(workoutPrograms.id, day[0].programId), eq(workoutPrograms.trainerId, trainerId)))
    .limit(1);
  return prog[0] ? day[0] : null;
}

/** Confirm a diet meal belongs to a plan owned by this trainer. */
async function ownsDietMeal(trainerId: string, mealId: string) {
  const meal = await db.select().from(dietMeals).where(eq(dietMeals.id, mealId)).limit(1);
  if (!meal[0]) return null;
  const plan = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(and(eq(dietPlans.id, meal[0].dietPlanId), eq(dietPlans.trainerId, trainerId)))
    .limit(1);
  return plan[0] ? meal[0] : null;
}

export async function addClientAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = addClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    goal: formData.get("goal") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return fail("A user with this email already exists");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [created] = await db
    .insert(users)
    .values({ name: parsed.data.name.trim(), email, role: "client", passwordHash })
    .returning({ id: users.id });
  await db.insert(clients).values({
    userId: created.id,
    trainerId: user.id,
    status: "active",
    goal: parsed.data.goal?.trim() || null,
    onboardingCompleted: true,
  });
  revalidatePath("/trainer/clients");
  revalidatePath("/trainer");
  return ok();
}

export async function createProgramAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await db.insert(workoutPrograms).values({
    trainerId: user.id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    durationWeeks: parsed.data.durationWeeks,
  });
  revalidatePath("/trainer/programs");
  return ok();
}

export async function updateProgramAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const id = String(formData.get("programId") ?? "");
  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationWeeks: formData.get("durationWeeks"),
  });
  if (!id || !parsed.success) return fail("Invalid input");
  await db
    .update(workoutPrograms)
    .set({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      durationWeeks: parsed.data.durationWeeks,
    })
    .where(and(eq(workoutPrograms.id, id), eq(workoutPrograms.trainerId, user.id)));
  revalidatePath("/trainer/programs");
  return ok();
}

export async function deleteProgramAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const id = String(formData.get("programId") ?? "");
  if (!id) return fail("Missing program");
  await db
    .delete(workoutPrograms)
    .where(and(eq(workoutPrograms.id, id), eq(workoutPrograms.trainerId, user.id)));
  revalidatePath("/trainer/programs");
  return ok();
}

export async function deleteWorkoutDayAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const dayId = String(formData.get("dayId") ?? "");
  if (!dayId) return fail("Missing day");
  const day = await ownsWorkoutDay(user.id, dayId);
  if (!day) return fail("Not authorized");
  await db.delete(workoutDays).where(eq(workoutDays.id, dayId));
  revalidatePath("/trainer/programs");
  return ok();
}

export async function deleteExerciseAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const exerciseId = String(formData.get("exerciseId") ?? "");
  if (!exerciseId) return fail("Missing exercise");
  const ex = await db.select().from(workoutExercises).where(eq(workoutExercises.id, exerciseId)).limit(1);
  if (!ex[0]) return fail("Exercise not found");
  const day = await ownsWorkoutDay(user.id, ex[0].workoutDayId);
  if (!day) return fail("Not authorized");
  await db.delete(workoutExercises).where(eq(workoutExercises.id, exerciseId));
  revalidatePath("/trainer/programs");
  return ok();
}

export async function addWorkoutDayAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = workoutDaySchema.safeParse({
    programId: formData.get("programId"),
    name: formData.get("name"),
    dayNumber: formData.get("dayNumber"),
    muscleGroups: formData.get("muscleGroups") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const prog = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(and(eq(workoutPrograms.id, parsed.data.programId), eq(workoutPrograms.trainerId, user.id)))
    .limit(1);
  if (!prog[0]) return fail("Program not found");
  await db.insert(workoutDays).values({
    programId: parsed.data.programId,
    name: parsed.data.name.trim(),
    dayNumber: parsed.data.dayNumber,
    muscleGroups: parsed.data.muscleGroups?.trim() || null,
  });
  revalidatePath("/trainer/programs");
  return ok();
}

export async function addExerciseAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = exerciseSchema.safeParse({
    dayId: formData.get("dayId"),
    name: formData.get("name"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    restSeconds: formData.get("restSeconds") || undefined,
    notes: formData.get("notes") || undefined,
    muscleGroup: formData.get("muscleGroup") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  // Verify ownership through program join
  const day = await db.select().from(workoutDays).where(eq(workoutDays.id, parsed.data.dayId)).limit(1);
  if (!day[0]) return fail("Day not found");
  const prog = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(and(eq(workoutPrograms.id, day[0].programId), eq(workoutPrograms.trainerId, user.id)))
    .limit(1);
  if (!prog[0]) return fail("Not authorized");
  const existing = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutDayId, parsed.data.dayId));
  await db.insert(workoutExercises).values({
    workoutDayId: parsed.data.dayId,
    name: parsed.data.name.trim(),
    sets: parsed.data.sets,
    reps: parsed.data.reps.trim(),
    restSeconds: parsed.data.restSeconds ?? null,
    notes: parsed.data.notes?.trim() || null,
    muscleGroup: parsed.data.muscleGroup?.trim() || null,
    sortOrder: existing.length,
  });
  revalidatePath("/trainer/programs");
  return ok();
}

export async function assignWorkoutAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = assignWorkoutSchema.safeParse({
    clientId: formData.get("clientId"),
    programId: formData.get("programId"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");
  const prog = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(and(eq(workoutPrograms.id, parsed.data.programId), eq(workoutPrograms.trainerId, user.id)))
    .limit(1);
  if (!prog[0]) return fail("Program not found");
  await db.insert(workoutAssignments).values({
    clientId: parsed.data.clientId,
    programId: parsed.data.programId,
    startDate: parsed.data.startDate,
    status: "active",
  });
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  return ok();
}

export async function unassignWorkoutAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return fail("Missing assignment");
  const row = await db.select().from(workoutAssignments).where(eq(workoutAssignments.id, assignmentId)).limit(1);
  if (!row[0]) return fail("Assignment not found");
  const crow = await db.select().from(clients).where(eq(clients.id, row[0].clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Not authorized");
  await db.delete(workoutAssignments).where(eq(workoutAssignments.id, assignmentId));
  revalidatePath(`/trainer/clients/${row[0].clientId}`);
  return ok();
}

export async function createDietPlanAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = dietPlanSchema.safeParse({
    name: formData.get("name"),
    dailyCalories: formData.get("dailyCalories") || undefined,
    proteinTarget: formData.get("proteinTarget") || undefined,
    carbsTarget: formData.get("carbsTarget") || undefined,
    fatTarget: formData.get("fatTarget") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await db.insert(dietPlans).values({
    trainerId: user.id,
    name: parsed.data.name.trim(),
    dailyCalories: parsed.data.dailyCalories ?? null,
    proteinTarget: parsed.data.proteinTarget ?? null,
    carbsTarget: parsed.data.carbsTarget ?? null,
    fatTarget: parsed.data.fatTarget ?? null,
    notes: parsed.data.notes?.trim() || null,
  });
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function updateDietPlanAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const id = String(formData.get("planId") ?? "");
  const parsed = dietPlanSchema.safeParse({
    name: formData.get("name"),
    dailyCalories: formData.get("dailyCalories") || undefined,
    proteinTarget: formData.get("proteinTarget") || undefined,
    carbsTarget: formData.get("carbsTarget") || undefined,
    fatTarget: formData.get("fatTarget") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!id || !parsed.success) return fail("Invalid input");
  await db
    .update(dietPlans)
    .set({
      name: parsed.data.name.trim(),
      dailyCalories: parsed.data.dailyCalories ?? null,
      proteinTarget: parsed.data.proteinTarget ?? null,
      carbsTarget: parsed.data.carbsTarget ?? null,
      fatTarget: parsed.data.fatTarget ?? null,
      notes: parsed.data.notes?.trim() || null,
    })
    .where(and(eq(dietPlans.id, id), eq(dietPlans.trainerId, user.id)));
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function deleteDietPlanAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const id = String(formData.get("planId") ?? "");
  if (!id) return fail("Missing plan");
  await db.delete(dietPlans).where(and(eq(dietPlans.id, id), eq(dietPlans.trainerId, user.id)));
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function addDietMealAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = dietMealSchema.safeParse({ planId: formData.get("planId"), name: formData.get("name") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const plan = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(and(eq(dietPlans.id, parsed.data.planId), eq(dietPlans.trainerId, user.id)))
    .limit(1);
  if (!plan[0]) return fail("Plan not found");
  const existing = await db.select().from(dietMeals).where(eq(dietMeals.dietPlanId, parsed.data.planId));
  await db.insert(dietMeals).values({
    dietPlanId: parsed.data.planId,
    name: parsed.data.name.trim(),
    sortOrder: existing.length,
  });
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function addFoodItemAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = foodItemSchema.safeParse({
    mealId: formData.get("mealId"),
    name: formData.get("name"),
    quantity: formData.get("quantity") || undefined,
    calories: formData.get("calories") || undefined,
    protein: formData.get("protein") || undefined,
    carbs: formData.get("carbs") || undefined,
    fat: formData.get("fat") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const meal = await db.select().from(dietMeals).where(eq(dietMeals.id, parsed.data.mealId)).limit(1);
  if (!meal[0]) return fail("Meal not found");
  const plan = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(and(eq(dietPlans.id, meal[0].dietPlanId), eq(dietPlans.trainerId, user.id)))
    .limit(1);
  if (!plan[0]) return fail("Not authorized");
  await db.insert(dietFoodItems).values({
    mealId: parsed.data.mealId,
    name: parsed.data.name.trim(),
    quantity: parsed.data.quantity?.trim() || null,
    calories: parsed.data.calories ?? null,
    protein: parsed.data.protein ?? null,
    carbs: parsed.data.carbs ?? null,
    fat: parsed.data.fat ?? null,
  });
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function assignDietAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const parsed = assignDietSchema.safeParse({
    clientId: formData.get("clientId"),
    planId: formData.get("planId"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");
  const plan = await db
    .select({ id: dietPlans.id })
    .from(dietPlans)
    .where(and(eq(dietPlans.id, parsed.data.planId), eq(dietPlans.trainerId, user.id)))
    .limit(1);
  if (!plan[0]) return fail("Plan not found");
  await db.insert(dietAssignments).values({
    clientId: parsed.data.clientId,
    dietPlanId: parsed.data.planId,
    startDate: parsed.data.startDate,
    status: "active",
  });
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  return ok();
}

export async function deleteDietMealAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const mealId = String(formData.get("mealId") ?? "");
  if (!mealId) return fail("Missing meal");
  const meal = await ownsDietMeal(user.id, mealId);
  if (!meal) return fail("Not authorized");
  await db.delete(dietMeals).where(eq(dietMeals.id, mealId));
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function deleteFoodItemAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const foodId = String(formData.get("foodItemId") ?? "");
  if (!foodId) return fail("Missing food item");
  const food = await db.select().from(dietFoodItems).where(eq(dietFoodItems.id, foodId)).limit(1);
  if (!food[0]) return fail("Food item not found");
  const meal = await ownsDietMeal(user.id, food[0].mealId);
  if (!meal) return fail("Not authorized");
  await db.delete(dietFoodItems).where(eq(dietFoodItems.id, foodId));
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function unassignDietAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return fail("Missing assignment");
  const row = await db.select().from(dietAssignments).where(eq(dietAssignments.id, assignmentId)).limit(1);
  if (!row[0]) return fail("Assignment not found");
  const crow = await db.select().from(clients).where(eq(clients.id, row[0].clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Not authorized");
  await db.delete(dietAssignments).where(eq(dietAssignments.id, assignmentId));
  revalidatePath(`/trainer/clients/${row[0].clientId}`);
  return ok();
}

export async function setClientStatusAction(formData: FormData) {
  const user = await requireTrainer();
  if (isDemoMode()) return ok();
  const clientId = String(formData.get("clientId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!clientId || (status !== "active" && status !== "paused")) return fail("Invalid status");
  const crow = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");
  await db.update(clients).set({ status }).where(eq(clients.id, clientId));
  revalidatePath("/trainer/clients");
  revalidatePath(`/trainer/clients/${clientId}`);
  return ok();
}
