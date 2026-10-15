import { EmptyState } from "@/components/client/ui";
import { ExerciseLogForm } from "@/components/client/exercise-log-form";
import { getExerciseData } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ exerciseId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { exerciseId } = await params;
  const { day: dayParam } = await searchParams;
  const { client } = await requireClient();
  const data = await getExerciseData(client.id, exerciseId);
  if (!data.exercise || !data.day) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Exercise</h1>
        <EmptyState title="Exercise not found" hint="It may have been removed from your plan." />
      </div>
    );
  }
  const dayId = dayParam ?? data.day.id;
  return (
    <ExerciseLogForm
      exercise={{
        id: data.exercise.id,
        name: data.exercise.name,
        sets: data.exercise.sets,
        reps: data.exercise.reps,
        notes: data.exercise.notes,
        instructions: data.exercise.instructions,
        muscleGroup: data.exercise.muscleGroup,
      }}
      dayId={dayId}
      history={data.history}
    />
  );
}
