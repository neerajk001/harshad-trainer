"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireClient } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";
import { onboardingDetailsSchema, onboardingGoalSchema } from "@/lib/validations";

function fail(message: string) {
  return { ok: false as const, error: message };
}

export async function saveOnboardingGoalAction(formData: FormData) {
  const { client } = await requireClient();
  const parsed = onboardingGoalSchema.safeParse({ goal: formData.get("goal") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Pick a goal");
  if (isDemoMode()) return { ok: true as const };
  await db.update(clients).set({ goal: parsed.data.goal }).where(eq(clients.id, client.id));
  revalidatePath("/onboarding");
  return { ok: true as const };
}

export async function saveOnboardingDetailsAction(formData: FormData) {
  const { client } = await requireClient();
  const parsed = onboardingDetailsSchema.safeParse({
    gender: formData.get("gender"),
    age: formData.get("age"),
    heightCm: formData.get("heightCm"),
    currentWeightKg: formData.get("currentWeightKg"),
    targetWeightKg: formData.get("targetWeightKg"),
    activityLevel: formData.get("activityLevel"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  if (isDemoMode()) return { ok: true as const };
  await db
    .update(clients)
    .set({
      gender: parsed.data.gender,
      age: parsed.data.age,
      heightCm: parsed.data.heightCm,
      currentWeightKg: parsed.data.currentWeightKg,
      targetWeightKg: parsed.data.targetWeightKg,
      activityLevel: parsed.data.activityLevel,
      onboardingCompleted: true,
    })
    .where(eq(clients.id, client.id));
  revalidatePath("/client");
  return { ok: true as const };
}
