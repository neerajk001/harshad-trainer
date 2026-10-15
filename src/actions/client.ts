"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { mealLogs, progressCheckins, workoutAssignments, workoutDays, workoutLogs } from "@/db/schema";
import { requireClient } from "@/lib/session";
import { demoOk, isDemoMode } from "@/lib/demo";
import { checkinSchema, mealLogSchema, workoutLogSchema } from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}

export async function logWorkoutAction(formData: FormData) {
  const { client } = await requireClient();
  if (isDemoMode()) return demoOk();
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

export async function logMealAction(formData: FormData) {
  const { client } = await requireClient();
  if (isDemoMode()) return demoOk();
  const parsed = mealLogSchema.safeParse({
    foodName: formData.get("foodName"),
    quantity: formData.get("quantity") || undefined,
    calories: formData.get("calories") || undefined,
    protein: formData.get("protein") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  await db.insert(mealLogs).values({
    clientId: client.id,
    foodName: parsed.data.foodName.trim(),
    quantity: parsed.data.quantity?.trim() || null,
    calories: parsed.data.calories ?? null,
    protein: parsed.data.protein ?? null,
  });
  revalidatePath("/client");
  revalidatePath("/client/nutrition");
  return { ok: true as const };
}

export async function submitCheckinAction(formData: FormData) {
  const { client } = await requireClient();
  if (isDemoMode()) return demoOk();
  const parsed = checkinSchema.safeParse({
    weight: formData.get("weight"),
    bodyFatPercent: formData.get("bodyFatPercent") || undefined,
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
    measurementsJson: Object.keys(measurements).length > 0 ? measurements : null,
    notes: parsed.data.notes?.trim() || null,
  });
  revalidatePath("/client/progress");
  revalidatePath("/client");
  return { ok: true as const };
}
