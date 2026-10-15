"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  exerciseSetLogs,
  foods,
  mealLogs,
  progressCheckins,
  workoutAssignments,
  workoutDays,
  workoutExercises,
  workoutLogs,
} from "@/db/schema";
import { requireClient } from "@/lib/session";
import { checkinSchema, exerciseLogSchema, mealLogSchema, workoutLogSchema } from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}

export async function logWorkoutAction(formData: FormData) {
  const { client } = await requireClient();
  const parsed = workoutLogSchema.safeParse({
    assignmentId: formData.get("assignmentId") || undefined,
    workoutDayId: formData.get("workoutDayId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  // Never trust client-supplied IDs: the assignment must belong to this client
  // and the day must belong to that assignment's program.
  const myAssignments = await db.select().from(workoutAssignments).where(eq(workoutAssignments.clientId, client.id));
  if (parsed.data.assignmentId && !myAssignments.some((a) => a.id === parsed.data.assignmentId)) {
    return fail("Assignment not found");
  }
  if (parsed.data.workoutDayId) {
    const day = await db.select().from(workoutDays).where(eq(workoutDays.id, parsed.data.workoutDayId)).limit(1);
    if (!day[0]) return fail("Workout day not found");
    if (parsed.data.assignmentId) {
      const assignment = myAssignments.find((a) => a.id === parsed.data.assignmentId)!;
      if (day[0].programId !== assignment.programId) return fail("That day is not part of this program");
    } else if (!myAssignments.some((a) => a.programId === day[0].programId)) {
      return fail("That day is not part of your assigned program");
    }
  }
  await db.insert(workoutLogs).values({
    clientId: client.id,
    assignmentId: parsed.data.assignmentId ?? null,
    workoutDayId: parsed.data.workoutDayId ?? null,
    notes: parsed.data.notes?.trim() || null,
  });
  revalidatePath("/client");
  revalidatePath("/client/workouts");
  return { ok: true as const };
}

export async function logExerciseAction(formData: FormData) {
  const { client } = await requireClient();
  let sets: unknown = [];
  try {
    sets = JSON.parse(String(formData.get("sets") ?? "[]"));
  } catch {
    return fail("Invalid sets");
  }
  const parsed = exerciseLogSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    workoutDayId: formData.get("workoutDayId") || undefined,
    notes: formData.get("notes") || undefined,
    sets,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  // Authorize: the exercise must belong to a program assigned to this client.
  const ex = await db.select().from(workoutExercises).where(eq(workoutExercises.id, parsed.data.exerciseId)).limit(1);
  if (!ex[0]) return fail("Exercise not found");
  const day = await db.select().from(workoutDays).where(eq(workoutDays.id, ex[0].workoutDayId)).limit(1);
  if (!day[0]) return fail("Workout day not found");
  const myAssignments = await db.select().from(workoutAssignments).where(eq(workoutAssignments.clientId, client.id));
  if (!myAssignments.some((a) => a.programId === day[0].programId)) return fail("Not authorized");

  const rows = parsed.data.sets.filter((s) => s.weight != null || s.reps != null);
  if (rows.length === 0) return fail("Add at least one set");
  await db.insert(exerciseSetLogs).values(
    rows.map((s, i) => ({
      clientId: client.id,
      workoutDayId: day[0].id,
      exerciseId: parsed.data.exerciseId,
      setNumber: i + 1,
      weight: s.weight ?? null,
      reps: s.reps ?? null,
    })),
  );
  // Mark the day as completed (once) so progress across the app stays in sync.
  const myAssignment = myAssignments.find((a) => a.programId === day[0].programId);
  const dayAlready = await db
    .select({ id: workoutLogs.id })
    .from(workoutLogs)
    .where(eq(workoutLogs.workoutDayId, day[0].id))
    .limit(1);
  if (dayAlready.length === 0) {
    await db.insert(workoutLogs).values({
      clientId: client.id,
      assignmentId: myAssignment?.id ?? null,
      workoutDayId: day[0].id,
      notes: parsed.data.notes?.trim() || null,
    });
  }
  revalidatePath("/client");
  revalidatePath("/client/workouts");
  revalidatePath(`/client/workouts/${day[0].id}`);
  return { ok: true as const };
}

export async function logMealAction(formData: FormData) {
  const { client } = await requireClient();
  const parsed = mealLogSchema.safeParse({
    foodName: formData.get("foodName"),
    quantity: formData.get("quantity") || undefined,
    mealType: formData.get("mealType") || undefined,
    calories: formData.get("calories") || undefined,
    protein: formData.get("protein") || undefined,
    carbs: formData.get("carbs") || undefined,
    fat: formData.get("fat") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await db.insert(mealLogs).values({
    clientId: client.id,
    foodName: parsed.data.foodName.trim(),
    quantity: parsed.data.quantity?.trim() || null,
    mealType: parsed.data.mealType ?? null,
    calories: parsed.data.calories ?? null,
    protein: parsed.data.protein ?? null,
    carbs: parsed.data.carbs ?? null,
    fat: parsed.data.fat ?? null,
  });
  revalidatePath("/client");
  revalidatePath("/client/nutrition");
  return { ok: true as const };
}

export async function logFoodAction(formData: FormData) {
  const { client } = await requireClient();
  const foodId = String(formData.get("foodId") ?? "");
  if (!foodId) return fail("Pick a food");
  const mealTypeRaw = String(formData.get("mealType") ?? "");
  const mealType = ["breakfast", "lunch", "snack", "dinner"].includes(mealTypeRaw) ? mealTypeRaw : null;
  const food = await db.select().from(foods).where(eq(foods.id, foodId)).limit(1);
  if (!food[0]) return fail("Food not found");
  await db.insert(mealLogs).values({
    clientId: client.id,
    foodName: food[0].name,
    quantity: food[0].serving,
    mealType,
    calories: food[0].calories,
    protein: food[0].protein,
    carbs: food[0].carbs,
    fat: food[0].fat,
  });
  revalidatePath("/client");
  revalidatePath("/client/nutrition");
  return { ok: true as const };
}

export async function submitCheckinAction(formData: FormData) {
  const { client } = await requireClient();
  const parsed = checkinSchema.safeParse({
    weight: formData.get("weight"),
    bodyFatPercent: formData.get("bodyFatPercent") || undefined,
    muscleMass: formData.get("muscleMass") || undefined,
    feel: formData.get("feel") || undefined,
    sleepHours: formData.get("sleepHours") || undefined,
    energyLevel: formData.get("energyLevel") || undefined,
    stressLevel: formData.get("stressLevel") || undefined,
    chest: formData.get("chest") || undefined,
    waist: formData.get("waist") || undefined,
    hips: formData.get("hips") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const measurements: Record<string, string> = {};
  if (parsed.data.chest) measurements.chest = parsed.data.chest;
  if (parsed.data.waist) measurements.waist = parsed.data.waist;
  if (parsed.data.hips) measurements.hips = parsed.data.hips;
  await db.insert(progressCheckins).values({
    clientId: client.id,
    weight: parsed.data.weight,
    bodyFatPercent: parsed.data.bodyFatPercent ?? null,
    muscleMass: parsed.data.muscleMass ?? null,
    feel: parsed.data.feel?.trim() || null,
    sleepHours: parsed.data.sleepHours ?? null,
    energyLevel: parsed.data.energyLevel?.trim() || null,
    stressLevel: parsed.data.stressLevel?.trim() || null,
    measurementsJson: Object.keys(measurements).length > 0 ? measurements : null,
    notes: parsed.data.notes?.trim() || null,
  });
  revalidatePath("/client/progress");
  revalidatePath("/client");
  return { ok: true as const };
}
