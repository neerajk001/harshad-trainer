import { z } from "zod";

export const emailSchema = z.email().max(255);
export const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const addClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  password: passwordSchema,
  goal: z.string().trim().max(500).optional(),
});

export const programSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  durationWeeks: z.coerce.number().int().min(1).max(52).default(4),
});

export const workoutDaySchema = z.object({
  programId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  dayNumber: z.coerce.number().int().min(1).max(30),
});

export const exerciseSchema = z.object({
  dayId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  sets: z.coerce.number().int().min(1).max(50).default(3),
  reps: z.string().trim().min(1).max(20).default("10"),
  restSeconds: z.coerce.number().int().min(0).max(1800).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const assignWorkoutSchema = z.object({
  clientId: z.uuid(),
  programId: z.uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export const dietPlanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dailyCalories: z.coerce.number().int().min(0).max(20000).optional(),
  proteinTarget: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const dietMealSchema = z.object({
  planId: z.uuid(),
  name: z.string().trim().min(1).max(120),
});

export const foodItemSchema = z.object({
  mealId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(120).optional(),
  calories: z.coerce.number().int().min(0).max(10000).optional(),
  protein: z.coerce.number().int().min(0).max(2000).optional(),
});

export const assignDietSchema = z.object({
  clientId: z.uuid(),
  planId: z.uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export const mealLogSchema = z.object({
  foodName: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(120).optional(),
  calories: z.coerce.number().int().min(0).max(10000).optional(),
  protein: z.coerce.number().int().min(0).max(2000).optional(),
});

export const workoutLogSchema = z.object({
  assignmentId: z.uuid().optional(),
  workoutDayId: z.uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const checkinSchema = z.object({
  weight: z.coerce.number().min(20).max(500),
  bodyFatPercent: z.coerce.number().min(1).max(80).optional(),
  chest: z.string().trim().max(20).optional(),
  waist: z.string().trim().max(20).optional(),
  hips: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});
