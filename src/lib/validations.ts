import { z } from "zod";

export const emailSchema = z.email().max(255);

export const addClientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  goal: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional(),
  goal: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
});

export const exerciseLogSchema = z.object({
  exerciseId: z.uuid(),
  workoutDayId: z.uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
  sets: z
    .array(
      z.object({
        weight: z.coerce.number().min(0).max(2000).optional(),
        reps: z.coerce.number().int().min(0).max(1000).optional(),
      }),
    )
    .max(30),
});

export const programSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  durationWeeks: z.coerce.number().int().min(1).max(52).default(4),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
});

export const workoutDaySchema = z.object({
  programId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  dayNumber: z.coerce.number().int().min(1).max(30),
  muscleGroups: z.string().trim().max(200).optional(),
});

export const exerciseSchema = z.object({
  dayId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  sets: z.coerce.number().int().min(1).max(50).default(3),
  reps: z.string().trim().min(1).max(20).default("10"),
  restSeconds: z.coerce.number().int().min(0).max(1800).optional(),
  notes: z.string().trim().max(500).optional(),
  muscleGroup: z.string().trim().max(80).optional(),
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
  carbsTarget: z.coerce.number().int().min(0).max(2000).optional(),
  fatTarget: z.coerce.number().int().min(0).max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const dietMealSchema = z.object({
  planId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  time: z.string().trim().max(20).optional(),
});

export const foodItemSchema = z.object({
  mealId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(120).optional(),
  calories: z.coerce.number().int().min(0).max(10000).optional(),
  protein: z.coerce.number().int().min(0).max(2000).optional(),
  carbs: z.coerce.number().int().min(0).max(2000).optional(),
  fat: z.coerce.number().int().min(0).max(2000).optional(),
});

export const assignDietSchema = z.object({
  clientId: z.uuid(),
  planId: z.uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export const mealLogSchema = z.object({
  foodName: z.string().trim().min(1).max(160),
  quantity: z.string().trim().max(120).optional(),
  mealType: z.enum(["breakfast", "lunch", "snack", "dinner"]).optional(),
  calories: z.coerce.number().int().min(0).max(10000).optional(),
  protein: z.coerce.number().int().min(0).max(2000).optional(),
  carbs: z.coerce.number().int().min(0).max(2000).optional(),
  fat: z.coerce.number().int().min(0).max(2000).optional(),
});

export const workoutLogSchema = z.object({
  assignmentId: z.uuid().optional(),
  workoutDayId: z.uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const checkinSchema = z.object({
  weight: z.coerce.number().min(20).max(500),
  bodyFatPercent: z.coerce.number().min(1).max(80).optional(),
  muscleMass: z.coerce.number().min(1).max(300).optional(),
  feel: z.string().trim().max(60).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  energyLevel: z.string().trim().max(60).optional(),
  stressLevel: z.string().trim().max(60).optional(),
  chest: z.string().trim().max(20).optional(),
  waist: z.string().trim().max(20).optional(),
  hips: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const progressEntrySchema = z.object({
  clientId: z.uuid(),
  weight: z.coerce.number().min(20).max(500),
  bodyFatPercent: z.coerce.number().min(1).max(80).optional(),
  muscleMass: z.coerce.number().min(1).max(300).optional(),
  chest: z.string().trim().max(20).optional(),
  waist: z.string().trim().max(20).optional(),
  hips: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const reviewCheckinSchema = z.object({
  checkinId: z.uuid(),
  feedback: z.string().trim().max(2000).optional(),
  approve: z.coerce.boolean().optional(),
});

export const messageSchema = z.object({
  clientId: z.uuid(),
  body: z.string().trim().min(1, "Write a message").max(2000),
});

export const assignPlansSchema = z.object({
  clientId: z.uuid(),
  programId: z.uuid().optional().or(z.literal("")),
  planId: z.uuid().optional().or(z.literal("")),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

/** Coach logging on behalf of a client (two-way logging). */
export const coachExerciseLogSchema = exerciseLogSchema.extend({ clientId: z.uuid() });
export const coachMealLogSchema = mealLogSchema.extend({ clientId: z.uuid() });
