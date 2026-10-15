import { ActionForm } from "@/components/ActionForm";
import { Badge, Card, EmptyState, SectionTitle, inputCls } from "@/components/ui";
import { logWorkoutAction } from "@/actions/client";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

function timeAgo(iso: Date | string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default async function WorkoutsPage() {
  const { client } = await requireClient();
  const data = await getClientDashboard(client.id);
  if (!data.wAssign) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <p className="mt-1 text-sm text-zinc-500">Your assigned program</p>
        <div className="mt-4">
          <EmptyState title="No workout assigned" hint="Your trainer will assign a program soon." />
        </div>
      </div>
    );
  }
  const totalExercises = data.workoutDaysWithEx.reduce((s, d) => s + d.exercises.length, 0);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{data.wAssign.program.name}</h1>
          <Badge tone="green">{data.wAssign.program.durationWeeks} weeks</Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Started {data.wAssign.assignment.startDate} · {data.workoutDaysWithEx.length} days · {totalExercises} exercises
        </p>
        {data.wAssign.program.description ? (
          <p className="mt-2 text-sm text-zinc-600">{data.wAssign.program.description}</p>
        ) : null}
      </div>

      <section aria-label="Training days" className="space-y-4">
        <SectionTitle title="Training days" hint="Log each day when you finish it" />
        {data.workoutDaysWithEx.map((d) => (
          <Card key={d.id} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white">
                  {d.dayNumber}
                </span>
                <div>
                  <h2 className="font-semibold leading-tight">{d.name}</h2>
                  <p className="text-xs text-zinc-500">{d.exercises.length} exercises</p>
                </div>
              </div>
            </div>
            <ul className="divide-y divide-zinc-100 px-2">
              {d.exercises.map((e, i) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-5 shrink-0 text-xs font-semibold text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{e.name}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {[e.restSeconds ? `${e.restSeconds}s rest` : null, e.notes].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {e.sets}×{e.reps}
                  </span>
                </li>
              ))}
              {d.exercises.length === 0 ? (
                <li className="px-3 py-3 text-sm text-zinc-500">No exercises in this day.</li>
              ) : null}
            </ul>
            <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4">
              <ActionForm action={logWorkoutAction} submitLabel={`Mark Day ${d.dayNumber} complete`}>
                <input type="hidden" name="assignmentId" value={data.wAssign!.assignment.id} />
                <input type="hidden" name="workoutDayId" value={d.id} />
                <input name="notes" placeholder="How did it feel? (optional)" maxLength={1000} className={inputCls} />
              </ActionForm>
            </div>
          </Card>
        ))}
      </section>

      {data.recentWorkouts.length > 0 ? (
        <section aria-label="History">
          <SectionTitle title="History" hint="Your recent completions" />
          <Card className="!p-2">
            <ul className="divide-y divide-zinc-100">
              {data.recentWorkouts.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-100 text-xs font-bold text-lime-800">
                      ✓
                    </span>
                    Workout completed
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">{timeAgo(w.completedAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
