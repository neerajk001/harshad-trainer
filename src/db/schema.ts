import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const id = () =>
  uuid("id").primaryKey().defaultRandom().$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["trainer", "client"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

export const clients = pgTable("clients", {
  id: id(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Nullable: a self-registered client has no trainer until one links them.
  trainerId: uuid("trainer_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  goal: text("goal"),
  gender: text("gender"),
  age: integer("age"),
  heightCm: integer("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  targetWeightKg: real("target_weight_kg"),
  activityLevel: text("activity_level"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: createdAt(),
});

export const workoutPrograms = pgTable("workout_programs", {
  id: id(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  durationWeeks: integer("duration_weeks").notNull().default(4),
  createdAt: createdAt(),
});

export const workoutDays = pgTable("workout_days", {
  id: id(),
  programId: uuid("program_id")
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  name: text("name").notNull(),
  muscleGroups: text("muscle_groups"),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: id(),
  workoutDayId: uuid("workout_day_id")
    .notNull()
    .references(() => workoutDays.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sets: integer("sets").notNull().default(3),
  reps: text("reps").notNull().default("10"),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  instructions: text("instructions"),
  muscleGroup: text("muscle_group"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const workoutAssignments = pgTable("workout_assignments", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  programId: uuid("program_id")
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id").references(() => workoutAssignments.id, {
    onDelete: "set null",
  }),
  workoutDayId: uuid("workout_day_id").references(() => workoutDays.id, {
    onDelete: "set null",
  }),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});

export const exerciseSetLogs = pgTable("exercise_set_logs", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  workoutDayId: uuid("workout_day_id").references(() => workoutDays.id, {
    onDelete: "set null",
  }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dietPlans = pgTable("diet_plans", {
  id: id(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dailyCalories: integer("daily_calories"),
  proteinTarget: integer("protein_target"),
  carbsTarget: integer("carbs_target"),
  fatTarget: integer("fat_target"),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const dietMeals = pgTable("diet_meals", {
  id: id(),
  dietPlanId: uuid("diet_plan_id")
    .notNull()
    .references(() => dietPlans.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const dietFoodItems = pgTable("diet_food_items", {
  id: id(),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => dietMeals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity"),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
});

export const dietAssignments = pgTable("diet_assignments", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  dietPlanId: uuid("diet_plan_id")
    .notNull()
    .references(() => dietPlans.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
});

export const mealLogs = pgTable("meal_logs", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  foodName: text("food_name").notNull(),
  quantity: text("quantity"),
  mealType: text("meal_type"),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});

export const progressCheckins = pgTable("progress_checkins", {
  id: id(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  bodyFatPercent: real("body_fat_percent"),
  muscleMass: real("muscle_mass"),
  feel: text("feel"),
  sleepHours: real("sleep_hours"),
  energyLevel: text("energy_level"),
  stressLevel: text("stress_level"),
  measurementsJson: jsonb("measurements_json").$type<Record<string, string> | null>(),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const foods = pgTable("foods", {
  id: id(),
  name: text("name").notNull(),
  serving: text("serving"),
  calories: integer("calories").notNull().default(0),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  fat: integer("fat").notNull().default(0),
  isPopular: boolean("is_popular").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Food = typeof foods.$inferSelect;
