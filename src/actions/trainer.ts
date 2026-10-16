"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  clients,
  dietAssignments,
  dietFoodItems,
  dietMeals,
  dietPlans,
  exerciseSetLogs,
  inquiries,
  mealLogs,
  progressCheckins,
  users,
  workoutAssignments,
  workoutDays,
  workoutExercises,
  workoutLogs,
  workoutPrograms,
} from "@/db/schema";
import { requireTrainer } from "@/lib/session";
import {
  addClientSchema,
  assignDietSchema,
  assignPlansSchema,
  assignWorkoutSchema,
  coachExerciseLogSchema,
  coachMealLogSchema,
  dietMealSchema,
  dietPlanSchema,
  exerciseSchema,
  foodItemSchema,
  programSchema,
  progressEntrySchema,
  reviewCheckinSchema,
  workoutDaySchema,
} from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}
function ok() {
  return { ok: true as const };
}

// Sign-in is Google-only, so accounts never carry a usable password. The
// password_hash column is still required, so we store a clear marker.
const NO_PASSWORD = "google-oauth-only";

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

  const parsed = addClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    goal: formData.get("goal") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return fail("A user with this email already exists");

  const [created] = await db
    .insert(users)
    .values({ name: parsed.data.name.trim(), email, role: "client", passwordHash: NO_PASSWORD })
    .returning({ id: users.id });
  await db.insert(clients).values({
    userId: created.id,
    trainerId: user.id,
    status: "active",
    goal: parsed.data.goal?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    onboardingCompleted: true,
  });
  revalidatePath("/trainer/clients");
  revalidatePath("/trainer");
  return ok();
}

export async function createProgramAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationWeeks: formData.get("durationWeeks"),
    level: formData.get("level") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await db.insert(workoutPrograms).values({
    trainerId: user.id,
    name: parsed.data.name.trim(),
    description: parsed.data.description?.trim() || null,
    durationWeeks: parsed.data.durationWeeks,
    level: parsed.data.level,
  });
  revalidatePath("/trainer/programs");
  return ok();
}

export async function updateProgramAction(formData: FormData) {
  const user = await requireTrainer();

  const id = String(formData.get("programId") ?? "");
  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationWeeks: formData.get("durationWeeks"),
    level: formData.get("level") || undefined,
  });
  if (!id || !parsed.success) return fail("Invalid input");
  await db
    .update(workoutPrograms)
    .set({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      durationWeeks: parsed.data.durationWeeks,
      level: parsed.data.level,
    })
    .where(and(eq(workoutPrograms.id, id), eq(workoutPrograms.trainerId, user.id)));
  revalidatePath("/trainer/programs");
  return ok();
}

export async function deleteProgramAction(formData: FormData) {
  const user = await requireTrainer();

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

  const id = String(formData.get("planId") ?? "");
  if (!id) return fail("Missing plan");
  await db.delete(dietPlans).where(and(eq(dietPlans.id, id), eq(dietPlans.trainerId, user.id)));
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function addDietMealAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = dietMealSchema.safeParse({ planId: formData.get("planId"), name: formData.get("name"), time: formData.get("time") || undefined });
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
    time: parsed.data.time?.trim() || null,
    sortOrder: existing.length,
  });
  revalidatePath("/trainer/diet-plans");
  return ok();
}

export async function addFoodItemAction(formData: FormData) {
  const user = await requireTrainer();

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

export async function reviewCheckinAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = reviewCheckinSchema.safeParse({
    checkinId: formData.get("checkinId"),
    feedback: formData.get("feedback") || undefined,
    approve: formData.get("approve") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const row = await db.select().from(progressCheckins).where(eq(progressCheckins.id, parsed.data.checkinId)).limit(1);
  if (!row[0]) return fail("Check-in not found");
  const crow = await db.select().from(clients).where(eq(clients.id, row[0].clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Not authorized");
  const feedback = parsed.data.feedback?.trim();
  await db
    .update(progressCheckins)
    .set({
      status: parsed.data.approve ? "approved" : "reviewed",
      feedback: feedback || row[0].feedback,
      reviewedAt: new Date(),
    })
    .where(eq(progressCheckins.id, parsed.data.checkinId));
  revalidatePath("/trainer/checkins");
  revalidatePath(`/trainer/checkins/${parsed.data.checkinId}`);
  revalidatePath(`/trainer/clients/${row[0].clientId}`);
  return ok();
}

export async function addProgressEntryAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = progressEntrySchema.safeParse({
    clientId: formData.get("clientId"),
    weight: formData.get("weight"),
    bodyFatPercent: formData.get("bodyFatPercent") || undefined,
    muscleMass: formData.get("muscleMass") || undefined,
    chest: formData.get("chest") || undefined,
    waist: formData.get("waist") || undefined,
    hips: formData.get("hips") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");
  const measurements: Record<string, string> = {};
  if (parsed.data.chest) measurements.chest = parsed.data.chest;
  if (parsed.data.waist) measurements.waist = parsed.data.waist;
  if (parsed.data.hips) measurements.hips = parsed.data.hips;
  await db.insert(progressCheckins).values({
    clientId: parsed.data.clientId,
    weight: parsed.data.weight,
    bodyFatPercent: parsed.data.bodyFatPercent ?? null,
    muscleMass: parsed.data.muscleMass ?? null,
    measurementsJson: Object.keys(measurements).length > 0 ? measurements : null,
    notes: parsed.data.notes?.trim() || null,
    status: "approved",
  });
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  revalidatePath(`/trainer/clients/${parsed.data.clientId}/progress`);
  return ok();
}

/** Coach logs a lift (sets) on behalf of a client. */
export async function logClientExerciseAction(formData: FormData) {
  const user = await requireTrainer();

  let sets: unknown = [];
  try {
    sets = JSON.parse(String(formData.get("sets") ?? "[]"));
  } catch {
    return fail("Invalid sets");
  }
  const parsed = coachExerciseLogSchema.safeParse({
    clientId: formData.get("clientId"),
    exerciseId: formData.get("exerciseId"),
    workoutDayId: formData.get("workoutDayId") || undefined,
    notes: formData.get("notes") || undefined,
    sets,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");

  const ex = await db.select().from(workoutExercises).where(eq(workoutExercises.id, parsed.data.exerciseId)).limit(1);
  if (!ex[0]) return fail("Exercise not found");
  const day = await db.select().from(workoutDays).where(eq(workoutDays.id, ex[0].workoutDayId)).limit(1);
  if (!day[0]) return fail("Workout day not found");
  const assigns = await db.select().from(workoutAssignments).where(eq(workoutAssignments.clientId, parsed.data.clientId));
  const assignment = assigns.find((a) => a.programId === day[0].programId);
  if (!assignment) return fail("This exercise isn't in the client's assigned program");

  const rows = parsed.data.sets.filter((s) => s.weight != null || s.reps != null);
  if (rows.length === 0) return fail("Add at least one set");
  await db.insert(exerciseSetLogs).values(
    rows.map((s, i) => ({
      clientId: parsed.data.clientId,
      workoutDayId: day[0].id,
      exerciseId: parsed.data.exerciseId,
      setNumber: i + 1,
      weight: s.weight ?? null,
      reps: s.reps ?? null,
    })),
  );
  // Mark the day complete for this client (once).
  const already = await db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(and(eq(workoutLogs.clientId, parsed.data.clientId), eq(workoutLogs.workoutDayId, day[0].id)))
    .limit(1);
  if (already.length === 0) {
    await db.insert(workoutLogs).values({
      clientId: parsed.data.clientId,
      assignmentId: assignment.id,
      workoutDayId: day[0].id,
      notes: parsed.data.notes?.trim() || null,
    });
  }
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  revalidatePath("/client");
  revalidatePath("/client/workouts");
  return ok();
}

/** Coach logs a meal on behalf of a client. */
export async function logClientMealAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = coachMealLogSchema.safeParse({
    clientId: formData.get("clientId"),
    foodName: formData.get("foodName"),
    quantity: formData.get("quantity") || undefined,
    mealType: formData.get("mealType") || undefined,
    calories: formData.get("calories") || undefined,
    protein: formData.get("protein") || undefined,
    carbs: formData.get("carbs") || undefined,
    fat: formData.get("fat") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const crow = await db
    .select({ trainerId: clients.trainerId })
    .from(clients)
    .where(eq(clients.id, parsed.data.clientId))
    .limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");

  await db.insert(mealLogs).values({
    clientId: parsed.data.clientId,
    foodName: parsed.data.foodName.trim(),
    quantity: parsed.data.quantity?.trim() || null,
    mealType: parsed.data.mealType ?? null,
    calories: parsed.data.calories ?? null,
    protein: parsed.data.protein ?? null,
    carbs: parsed.data.carbs ?? null,
    fat: parsed.data.fat ?? null,
  });
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  revalidatePath("/client");
  revalidatePath("/client/nutrition");
  return ok();
}

export async function assignPlansAction(formData: FormData) {
  const user = await requireTrainer();

  const parsed = assignPlansSchema.safeParse({
    clientId: formData.get("clientId"),
    programId: formData.get("programId") || "",
    planId: formData.get("planId") || "",
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const crow = await db.select().from(clients).where(eq(clients.id, parsed.data.clientId)).limit(1);
  if (!crow[0] || crow[0].trainerId !== user.id) return fail("Client not found");
  if (parsed.data.programId) {
    const prog = await db
      .select({ id: workoutPrograms.id })
      .from(workoutPrograms)
      .where(and(eq(workoutPrograms.id, parsed.data.programId), eq(workoutPrograms.trainerId, user.id)))
      .limit(1);
    if (!prog[0]) return fail("Program not found");
    await db.insert(workoutAssignments).values({ clientId: parsed.data.clientId, programId: parsed.data.programId, startDate: parsed.data.startDate, status: "active" });
  }
  if (parsed.data.planId) {
    const plan = await db
      .select({ id: dietPlans.id })
      .from(dietPlans)
      .where(and(eq(dietPlans.id, parsed.data.planId), eq(dietPlans.trainerId, user.id)))
      .limit(1);
    if (!plan[0]) return fail("Plan not found");
    await db.insert(dietAssignments).values({ clientId: parsed.data.clientId, dietPlanId: parsed.data.planId, startDate: parsed.data.startDate, status: "active" });
  }
  revalidatePath("/trainer/clients");
  revalidatePath(`/trainer/clients/${parsed.data.clientId}`);
  revalidatePath(`/trainer/clients/${parsed.data.clientId}/assign`);
  return ok();
}

export async function declineInquiryAction(formData: FormData) {
  const user = await requireTrainer();
  void user;
  const inquiryId = String(formData.get("inquiryId") ?? "");
  if (!inquiryId) return fail("Missing inquiry");
  await db.update(inquiries).set({ status: "declined", handledAt: new Date() }).where(eq(inquiries.id, inquiryId));
  revalidatePath("/trainer/inquiries");
  revalidatePath("/trainer");
  return ok();
}

/**
 * Approve a public inquiry: register the client's email and link them to this
 * coach. They then sign in with Google using that email — there are no
 * passwords.
 */
export async function approveInquiryAction(formData: FormData) {
  const user = await requireTrainer();
  const inquiryId = String(formData.get("inquiryId") ?? "");
  if (!inquiryId) return fail("Missing inquiry");
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId)).limit(1);
  const inquiry = rows[0];
  if (!inquiry) return fail("Inquiry not found");
  if (inquiry.status === "approved") return fail("This inquiry was already approved");

  const email = inquiry.email.toLowerCase().trim();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return fail("An account with this email already exists");

  const [created] = await db
    .insert(users)
    .values({ name: inquiry.name.trim(), email, role: "client", passwordHash: NO_PASSWORD })
    .returning({ id: users.id });
  await db.insert(clients).values({
    userId: created.id,
    trainerId: user.id,
    status: "active",
    goal: inquiry.goal?.trim() || null,
    phone: inquiry.phone?.trim() || null,
    onboardingCompleted: true,
  });
  await db.update(inquiries).set({ status: "approved", handledAt: new Date() }).where(eq(inquiries.id, inquiryId));
  revalidatePath("/trainer/inquiries");
  revalidatePath("/trainer/clients");
  revalidatePath("/trainer");
  return { ok: true as const, email };
}
