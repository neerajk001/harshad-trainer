import Link from "next/link";

import { CCard, EmptyState, MacroBar, Ring, SectionTitle } from "@/components/client/ui";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import {
  fmtDelta,
  isToday,
  mealTypeLabel,
  shortTime,
  sumMacros,
  todayWorkoutIndex,
  weekProgress,
} from "@/lib/client-utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function ClientHome() {
  const { user, client } = await requireClient();
  if (!process.env.DATABASE_URL) {
    return <EmptyState title="Database not configured" hint="Ask your trainer/admin to configure the database." />;
  }
  const data = await getClientDashboard(client.id);
  const firstName = user.name?.split(" ")[0] ?? "there";
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

  const days = data.workoutDaysWithEx;
  const totalDays = days.length;
  const completedCount = data.completedDayIds.filter((id) => days.some((d) => d.id === id)).length;
  const pct = totalDays ? Math.round((completedCount / totalDays) * 100) : 0;
  const wp = data.wAssign ? weekProgress(data.wAssign.assignment.startDate, data.wAssign.program.durationWeeks) : null;

  const todaysWorkout = days.length ? days[todayWorkoutIndex(days.length)] : null;

  const mealsToday = data.recentMeals.filter((m) => isToday(m.loggedAt));
  const macros = sumMacros(mealsToday);
  const kcalTarget = data.dAssign?.plan.dailyCalories ?? null;

  const latest = data.checkins[0];
  const prev = data.checkins[1];
  const weightDelta = latest && prev ? latest.weight - prev.weight : null;
  const bfDelta = latest?.bodyFatPercent != null && prev?.bodyFatPercent != null ? latest.bodyFatPercent - prev.bodyFatPercent : null;
  const mmDelta = latest?.muscleMass != null && prev?.muscleMass != null ? latest.muscleMass - prev.muscleMass : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{todayLabel}</p>
      </div>

      {/* Your progress */}
      <Card className="overflow-hidden !p-0">
        <div className="relative px-5 pb-5 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Your Progress</p>
              <p className="text-xs text-zinc-500">
                {wp ? `Week ${wp.week} of ${wp.totalWeeks}` : "No active plan"}
              </p>
            </div>
            {wp ? (
              <Ring value={completedCount} max={totalDays || 1} size={88}>
                <span className="text-lg font-bold text-zinc-50">{pct}%</span>
                <span className="text-[10px] text-zinc-500">complete</span>
              </Ring>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800">
          <div className="p-3">
            <p className="text-xs text-zinc-500">Weight</p>
            <p className="mt-0.5 text-sm font-semibold">{latest ? `${latest.weight} kg` : "—"}</p>
            {weightDelta != null ? (
              <p className={`text-xs ${weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>{fmtDelta(weightDelta, " kg")}</p>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-xs text-zinc-500">Body Fat</p>
            <p className="mt-0.5 text-sm font-semibold">{latest?.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"}</p>
            {bfDelta != null ? (
              <p className={`text-xs ${bfDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>{fmtDelta(bfDelta, "%")}</p>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-xs text-zinc-500">Muscle</p>
            <p className="mt-0.5 text-sm font-semibold">{latest?.muscleMass != null ? `${latest.muscleMass} kg` : "—"}</p>
            {mmDelta != null ? (
              <p className={`text-xs ${mmDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>{fmtDelta(mmDelta, " kg")}</p>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Today's plan */}
      <section aria-label="Today's plan">
        <SectionTitle
          title="Today's Plan"
          action={
            <Link href="/client/workouts" className="text-xs font-semibold text-zinc-400 hover:text-zinc-100">
              View All
            </Link>
          }
        />
        <div className="space-y-2.5">
          <PlanRow
            href="/client/workouts"
            title="Workout"
            sub={todaysWorkout ? `${todaysWorkout.name} (${todaysWorkout.exercises.length} exercises)` : "No workout assigned"}
          />
          <PlanRow
            href="/client/nutrition"
            title="Nutrition"
            sub={
              kcalTarget
                ? `Log your meals (${macros.calories}/${kcalTarget} kcal)`
                : `${mealsToday.length} meal${mealsToday.length === 1 ? "" : "s"} logged`
            }
          />
          <PlanRow
            href="/client/checkin"
            title="Check-in"
            sub={
              latest ? `Last weigh-in ${new Date(latest.createdAt).toLocaleDateString()}` : "Add today's weight"
            }
          />
        </div>
      </section>

      {/* Nutrition snapshot */}
      {data.dAssign ? (
        <section aria-label="Nutrition">
          <SectionTitle title="Nutrition Today" action={<Link href="/client/nutrition" className="text-xs font-semibold text-zinc-400 hover:text-zinc-100">Open</Link>} />
          <CCard>
            <div className="space-y-3">
              <MacroBar label="Calories" value={macros.calories} max={kcalTarget} unit=" kcal" />
              <MacroBar label="Protein" value={macros.protein} max={data.dAssign.plan.proteinTarget} tone="dark" />
              <MacroBar label="Carbs" value={macros.carbs} max={data.dAssign.plan.carbsTarget} tone="mid" />
              <MacroBar label="Fats" value={macros.fat} max={data.dAssign.plan.fatTarget} tone="darker" />
            </div>
          </CCard>
        </section>
      ) : null}

      {/* Recent meals */}
      {mealsToday.length > 0 ? (
        <section aria-label="Logged today">
          <SectionTitle title="Logged Today" />
          <CCard className="!p-2">
            <ul className="divide-y divide-zinc-800">
              {mealsToday.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.foodName}</span>
                    <span className="block text-xs text-zinc-500">
                      {mealTypeLabel(m.mealType) ? `${mealTypeLabel(m.mealType)} · ` : ""}
                      {shortTime(m.loggedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-zinc-400">{m.calories != null ? `${m.calories} kcal` : "—"}</span>
                </li>
              ))}
            </ul>
          </CCard>
        </section>
      ) : null}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-900 ${className}`}>{children}</div>;
}

function PlanRow({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition hover:bg-zinc-800/60">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-800/50">
        <span className="h-4 w-4 rounded-sm bg-zinc-400" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-zinc-500">{sub}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
