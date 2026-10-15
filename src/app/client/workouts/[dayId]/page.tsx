import Link from "next/link";

import { EmptyState, goldBtn } from "@/components/client/ui";
import { getWorkoutDayData } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { weekProgress } from "@/lib/client-utils";

export default async function WorkoutDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ dayId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { dayId } = await params;
  await searchParams;
  const { client } = await requireClient();
  const data = await getWorkoutDayData(client.id, dayId);
  if (!data || !data.day) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Workout</h1>
        <EmptyState title="Workout not found" hint="It may have been removed from your plan." />
      </div>
    );
  }

  const { day, program, assignment } = data;
  const wp = program && assignment ? weekProgress(assignment.startDate, program.durationWeeks) : null;
  const first = day.exercises[0];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/client/workouts" aria-label="Back" className="mb-3 inline-grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{day.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {wp ? `Week ${wp.week} · ` : ""}Day {day.dayNumber} · {day.exercises.length} exercises
          </p>
        </div>
        <button
          type="button"
          aria-label="Workout actions"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="space-y-2.5">
        {day.exercises.map((e) => {
          const done = data.loggedExerciseIds.includes(e.id);
          return (
            <Link
              key={e.id}
              href={`/client/workouts/exercise/${e.id}?day=${day.id}`}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5 transition hover:bg-zinc-900"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-zinc-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{e.name}</span>
                <span className="block text-xs text-zinc-500">
                  {e.sets} × {e.reps}
                  {e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}
                </span>
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  done ? "bg-emerald-500 text-zinc-950" : "border border-white/20 text-transparent"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>

      {first ? (
        <Link href={`/client/workouts/exercise/${first.id}?day=${day.id}`} className={`${goldBtn} w-full`}>
          {data.completed ? "Workout again" : "Start Workout"}
        </Link>
      ) : null}
    </div>
  );
}
