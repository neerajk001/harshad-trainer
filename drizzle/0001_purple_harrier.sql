CREATE TABLE "exercise_set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"workout_day_id" uuid,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight" real,
	"reps" integer,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"serving" text,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" integer DEFAULT 0 NOT NULL,
	"carbs" integer DEFAULT 0 NOT NULL,
	"fat" integer DEFAULT 0 NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_trainer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "trainer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "height_cm" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "current_weight_kg" real;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "target_weight_kg" real;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "activity_level" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "diet_food_items" ADD COLUMN "carbs" integer;--> statement-breakpoint
ALTER TABLE "diet_food_items" ADD COLUMN "fat" integer;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD COLUMN "carbs_target" integer;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD COLUMN "fat_target" integer;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD COLUMN "meal_type" text;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD COLUMN "carbs" integer;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD COLUMN "fat" integer;--> statement-breakpoint
ALTER TABLE "progress_checkins" ADD COLUMN "muscle_mass" real;--> statement-breakpoint
ALTER TABLE "progress_checkins" ADD COLUMN "feel" text;--> statement-breakpoint
ALTER TABLE "progress_checkins" ADD COLUMN "sleep_hours" real;--> statement-breakpoint
ALTER TABLE "progress_checkins" ADD COLUMN "energy_level" text;--> statement-breakpoint
ALTER TABLE "progress_checkins" ADD COLUMN "stress_level" text;--> statement-breakpoint
ALTER TABLE "workout_days" ADD COLUMN "muscle_groups" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "instructions" text;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "muscle_group" text;--> statement-breakpoint
ALTER TABLE "exercise_set_logs" ADD CONSTRAINT "exercise_set_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_set_logs" ADD CONSTRAINT "exercise_set_logs_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_set_logs" ADD CONSTRAINT "exercise_set_logs_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;