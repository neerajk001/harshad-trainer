import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { Badge, Card, EmptyState, ProgressBar, SectionTitle, Stat, inputCls } from "@/components/ui";
import { logMealAction, logWorkoutAction } from "@/actions/client";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default async function ClientHome() {
  const { user, client } = await requireClient();
  if (!process.env.DATABASE_URL && !isDemoMode()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <div className="mt-4">
          <EmptyState title="DATABASE_URL is not configured" hint="Ask your trainer / admin to configure the database." />
        </div>
      </div>
    );
  }
  const data = await getClientDashboard(client.id);
  const now = new Date();
  const todayLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const todayIndex = now.getDay(); // 0-6
  const todaysWorkout = data.workoutDaysWithEx.length
    ? data.workoutDaysWithEx[todayIndex % data.workoutDaysWithEx.length]
    : null;

  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const workoutsThisWeek = data.recentWorkouts.filter((w) => new Date(w.completedAt).getTime() > weekAgo).length;
  const todayStart = startOfDay(now).getTime();
  const mealsToday = data.recentMeals.filter((m) => new Date(m.loggedAt).getTime() >= todayStart);
  const kcalToday = mealsToday.reduce((s, m) => s + (m.calories ?? 0), 0);
  const proteinToday = mealsToday.reduce((s, m) => s + (m.protein ?? 0), 0);

  const latest = data.checkins[0];
  const previous = data.checkins[1];
  const weightDelta = latest && previous ? latest.weight - previous.weight : null;

  const firstName = user.name?.split(" ")[0] ?? "there";
  const calorieTarget = data.dAssign?.plan.dailyCalories ?? null;
  const proteinTarget = data.dAssign?.plan.proteinTarget ?? null;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{todayLabel}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Hi, {firstName}</h1>
          {client.goal ? <Badge tone="green">{client.goal}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-zinc-500">Today&apos;s plan and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          label="Workouts 7d"
          value={String(workoutsThisWeek)}
          sub={data.wAssign ? data.wAssign.program.name : "No program"}
        />
        <Stat
          label="Eaten today"
          value={kcalToday > 0 ? `${kcalToday}` : "—"}
          sub={calorieTarget ? `of ${calorieTarget} kcal` : `${mealsToday.length} meal${mealsToday.length === 1 ? "" : "s"}`}
          accent
        />
        <Stat
          label="Weight"
          value={latest ? `${latest.weight}` : "—"}
          sub={
            latest
              ? `kg${weightDelta != null && previous ? ` (${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)})` : ""}`
              : "No check-ins"
          }
        />
      </div>

      {/* Today's workout */}
      <section aria-label="Today's workout">
        <SectionTitle
          title="Today's workout"
          hint={data.wAssign ? `${data.wAssign.program.name} · started ${data.wAssign.assignment.startDate}` : undefined}
          action={
            <Link href="/client/workouts" className="text-xs font-semibold text-lime-700 hover:underline">
              Full plan →
            </Link>
          }
        />
        <Card className="overflow-hidden !p-0">
          {!data.wAssign || !todaysWorkout ? (
            <div className="p-5">
              <EmptyState title="No workout assigned yet" hint="Check back later — your trainer will assign a program." />
            </div>
          ) : (
            <>
              <div className="bg-zinc-950 px-5 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-lime-400">
                      Day {todaysWorkout.dayNumber} of {data.workoutDaysWithEx.length}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold">{todaysWorkout.name}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                    {todaysWorkout.exercises.length} exercises
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-zinc-100 px-2">
                {todaysWorkout.exercises.slice(0, 5).map((e, i) => (
                  <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.name}</span>
                      <span className="block text-xs text-zinc-500">
                        {[e.restSeconds ? `${e.restSeconds}s rest` : null, e.notes].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-800">
                      {e.sets}×{e.reps}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4">
                <ActionForm action={logWorkoutAction} submitLabel="Mark workout complete">
                  <input type="hidden" name="assignmentId" value={data.wAssign.assignment.id} />
                  <input type="hidden" name="workoutDayId" value={todaysWorkout.id} />
                </ActionForm>
              </div>
            </>
          )}
        </Card>
      </section>

      {/* Nutrition */}
      <section aria-label="Nutrition">
        <SectionTitle
          title="Nutrition"
          hint={data.dAssign ? data.dAssign.plan.name : "Meal logging"}
          action={
            <Link href="/client/nutrition" className="text-xs font-semibold text-lime-700 hover:underline">
              Meals + log →
            </Link>
          }
        />
        <Card>
          {!data.dAssign ? (
            <p className="text-sm text-zinc-500">No diet plan assigned yet. You can still log meals below.</p>
          ) : (
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <p className="font-medium">{data.dAssign.plan.name}</p>
                <p className="text-xs text-zinc-500">
                  {kcalToday} / {calorieTarget ?? "—"} kcal
                </p>
              </div>
              <div className="mt-2">
                <ProgressBar value={kcalToday} max={calorieTarget ?? Math.max(kcalToday, 1)} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {proteinToday}g protein today
                {proteinTarget ? ` · ${proteinTarget}g target` : ""}
                {data.dAssign.plan.notes ? ` · ${data.dAssign.plan.notes}` : ""}
              </p>
            </div>
          )}
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-2 text-sm font-medium">Quick meal log</p>
            <ActionForm action={logMealAction} submitLabel="Log meal">
              <input name="foodName" placeholder="What did you eat?" required maxLength={160} className={inputCls} />
              <div className="grid grid-cols-3 gap-2">
                <input name="quantity" placeholder="Qty" maxLength={120} className={inputCls} />
                <input name="calories" type="number" inputMode="numeric" placeholder="kcal" min={0} max={10000} className={inputCls} />
                <input name="protein" type="number" inputMode="numeric" placeholder="Protein g" min={0} max={2000} className={inputCls} />
              </div>
            </ActionForm>
          </div>
        </Card>
      </section>

      {/* Progress teaser */}
      <section aria-label="Progress">
        <SectionTitle
          title="Progress"
          hint={latest ? `Last check-in ${new Date(latest.createdAt).toLocaleDateString()}` : "Weigh-ins"}
          action={
            <Link href="/client/progress" className="text-xs font-semibold text-lime-700 hover:underline">
              Check in →
            </Link>
          }
        />
        <Card>
          {data.checkins.length === 0 ? (
            <EmptyState title="No check-ins yet" hint="Submit your first weigh-in to start your trend." />
          ) : (
            <>
              <div className="flex items-end gap-1.5" aria-hidden>
                {[...data.checkins].reverse().slice(-10).map((c) => {
                  const weights = data.checkins.map((w) => w.weight);
                  const min = Math.min(...weights);
                  const max = Math.max(...weights);
                  const h = max === min ? 44 : 16 + ((c.weight - min) / (max - min)) * 56;
                  return (
                    <div key={c.id} title={`${c.weight} kg`} className="w-full rounded-t-md bg-lime-600/80" style={{ height: `${h}px` }} />
                  );
                })}
              </div>
              <div className="mt-3 space-y-1.5">
                {data.checkins.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                    <span className="font-medium">{c.weight} kg</span>
                    <span className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
