import Link from "next/link";

import { CCard, EmptyState, goldBtn } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { LineChart } from "@/components/client/line-chart";
import { CoachLogExercise } from "@/components/coach/coach-log-exercise";
import { CoachLogMeal } from "@/components/coach/coach-log-meal";
import { getClientDetail, getTrainerDietPlans, getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { goalLabel, mealTypeLabel, shortTime } from "@/lib/client-utils";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = ["progress", "workouts", "diet"].includes(sp.tab ?? "") ? (sp.tab as string) : "overview";
  const user = await requireTrainer();
  const detail = process.env.DATABASE_URL ? await getClientDetail(user.id, id) : null;
  if (!detail) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/clients" className="text-sm text-zinc-400 hover:text-zinc-100">← All clients</Link>
        <EmptyState title="Client not found" hint="No access or missing client." />
      </div>
    );
  }
  const programs = await getTrainerPrograms(user.id);
  const plans = await getTrainerDietPlans(user.id);
  const latest = detail.checkins[0];
  const first = detail.checkins[detail.checkins.length - 1];
  const weightDelta = latest && first && latest.id !== first.id ? latest.weight - first.weight : null;
  const weightSeries = [...detail.checkins].reverse().map((c) => c.weight);
  const activeProgram = detail.wAssign[0] ? programs.find((p) => p.id === detail.wAssign[0].programId) : null;
  const activePlan = detail.dAssign[0] ? plans.find((p) => p.id === detail.dAssign[0].dietPlanId) : null;
  const firstName = detail.user.name?.split(" ")[0] ?? "the client";
  const profileBits = [
    detail.client.age ? `${detail.client.age} years` : null,
    detail.client.gender ? detail.client.gender[0].toUpperCase() + detail.client.gender.slice(1) : null,
  ].filter(Boolean);

  const dayNameById = new Map<string, string>();
  const exerciseNameById = new Map<string, string>();
  for (const p of programs) {
    for (const d of p.days) {
      dayNameById.set(d.id, d.name);
      for (const e of d.exercises) exerciseNameById.set(e.id, e.name);
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/trainer/clients" className="text-sm text-zinc-400 hover:text-zinc-100">← All clients</Link>

      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-zinc-800/50 text-xl font-semibold text-zinc-200">
          {detail.user.name?.[0]?.toUpperCase() ?? "C"}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{detail.user.name}</h1>
          <p className="truncate text-xs text-zinc-500">
            {[profileBits.join(" · "), goalLabel(detail.client.goal), activeProgram ? `${activeProgram.durationWeeks} weeks` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${detail.client.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-300"}`}>
          {detail.client.status === "active" ? "Active" : "Paused"}
        </span>
      </div>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "progress", label: "Progress" },
          { key: "workouts", label: "Workouts" },
          { key: "diet", label: "Diet" },
        ]}
      />

      {tab === "overview" ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Weight" value={latest ? `${latest.weight} kg` : "—"} delta={weightDelta} unit=" kg" goodDown />
            <MiniStat label="Body Fat" value={latest?.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"} />
            <MiniStat label="Muscle Mass" value={latest?.muscleMass != null ? `${latest.muscleMass} kg` : "—"} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Workouts" value={String(detail.logs.length)} />
            <MiniStat label="Meals" value={String(detail.meals.length)} />
            <MiniStat label="Check-ins" value={String(detail.checkins.length)} />
          </div>

          <CCard>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Progress Trend</p>
              <span className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">All time</span>
            </div>
            {weightSeries.length > 1 ? (
              <LineChart values={weightSeries} height={150} className="mt-3 h-36 w-full" />
            ) : (
              <p className="py-6 text-center text-sm text-zinc-500">Not enough check-ins yet.</p>
            )}
          </CCard>

          <CCard>
            <p className="text-sm font-semibold">Client Details</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500">✉</span> {detail.user.email}
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <span className="text-zinc-500">☎</span> {detail.client.phone ?? "No phone on file"}
              </li>
            </ul>
          </CCard>

          <div className="grid grid-cols-2 gap-3">
            <Link href={`/trainer/messages/${detail.client.id}`} className="rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3 text-center text-sm font-medium">
              Message
            </Link>
            <Link href={`/trainer/clients/${detail.client.id}/assign`} className={goldBtn}>
              Assign Plans
            </Link>
          </div>
        </>
      ) : null}

      {tab === "progress" ? (
        <div className="space-y-3">
          <CCard>
            <p className="text-sm text-zinc-400">Full progress, measurements and check-ins.</p>
            <Link href={`/trainer/clients/${detail.client.id}/progress`} className="mt-3 inline-block text-sm font-semibold text-zinc-200">
              Open progress →
            </Link>
          </CCard>

          <CCard className="!p-0">
            <div className="border-b border-zinc-800 px-5 py-3.5">
              <p className="text-sm font-semibold">Check-ins</p>
              <p className="text-xs text-zinc-500">Everything {firstName} submitted</p>
            </div>
            {detail.checkins.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-zinc-500">No check-ins yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {detail.checkins.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {[
                          `${c.weight} kg`,
                          c.bodyFatPercent != null ? `${c.bodyFatPercent}% body fat` : null,
                          c.muscleMass != null ? `${c.muscleMass} kg muscle` : null,
                          c.notes,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className={`shrink-0 text-xs ${c.status === "approved" ? "text-emerald-400" : c.status === "reviewed" ? "text-zinc-300" : "text-zinc-500"}`}>
                      {c.status === "approved" ? "Approved" : c.status === "reviewed" ? "Reviewed" : "Pending"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CCard>
        </div>
      ) : null}

      {tab === "workouts" ? (
        <div className="space-y-3">
          {detail.wAssign.length === 0 ? (
            <EmptyState title="No workout assigned" action={<Link href={`/trainer/clients/${detail.client.id}/assign`} className={goldBtn}>Assign a program</Link>} />
          ) : (
            detail.wAssign.map((a) => {
              const p = programs.find((x) => x.id === a.programId);
              return (
                <CCard key={a.id}>
                  <p className="font-semibold">{p?.name ?? "Deleted program"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {(p?.days.length ?? 0)} days · {p?.durationWeeks ?? "—"} weeks · started {a.startDate}
                  </p>
                </CCard>
              );
            })
          )}

          <CCard className="!p-0">
            <div className="border-b border-zinc-800 px-5 py-3.5">
              <p className="text-sm font-semibold">Completed workouts</p>
              <p className="text-xs text-zinc-500">What {firstName} has completed</p>
            </div>
            {detail.logs.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-zinc-500">No workouts logged yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {detail.logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {l.workoutDayId ? dayNameById.get(l.workoutDayId) ?? "Workout" : "Workout"}
                      </span>
                      {l.notes ? <span className="block truncate text-xs text-zinc-500">{l.notes}</span> : null}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">{new Date(l.completedAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CCard>

          <CCard className="!p-0">
            <div className="border-b border-zinc-800 px-5 py-3.5">
              <p className="text-sm font-semibold">Exercise log</p>
              <p className="text-xs text-zinc-500">Sets, weight and reps</p>
            </div>
            {detail.setLogs.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-zinc-500">No sets logged yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {detail.setLogs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{exerciseNameById.get(s.exerciseId) ?? "Exercise"}</span>
                      <span className="block text-xs text-zinc-500">
                        Set {s.setNumber} · {new Date(s.loggedAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {s.weight != null ? `${s.weight} kg` : "—"} × {s.reps ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CCard>

          <CCard>
            <p className="text-sm font-semibold">Log a lift for {firstName}</p>
            <p className="mt-1 text-xs text-zinc-500">Record sets on their behalf — it shows up in their app too.</p>
            <div className="mt-3">
              <CoachLogExercise
                clientId={detail.client.id}
                days={(activeProgram?.days ?? []).map((d) => ({
                  id: d.id,
                  name: d.name,
                  dayNumber: d.dayNumber,
                  exercises: d.exercises.map((e) => ({ id: e.id, name: e.name, sets: e.sets, reps: e.reps })),
                }))}
              />
            </div>
          </CCard>
        </div>
      ) : null}

      {tab === "diet" ? (
        <div className="space-y-3">
          {!activePlan ? (
            <EmptyState title="No diet plan assigned" action={<Link href={`/trainer/clients/${detail.client.id}/assign`} className={goldBtn}>Assign a plan</Link>} />
          ) : (
            <CCard>
              <p className="font-semibold">{activePlan.name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {[
                  activePlan.dailyCalories != null ? `${activePlan.dailyCalories} kcal` : null,
                  activePlan.proteinTarget != null ? `${activePlan.proteinTarget}g protein` : null,
                  activePlan.carbsTarget != null ? `${activePlan.carbsTarget}g carbs` : null,
                  activePlan.fatTarget != null ? `${activePlan.fatTarget}g fat` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No targets"}
              </p>
              {activePlan.notes ? <p className="mt-2 text-sm text-zinc-400">{activePlan.notes}</p> : null}
            </CCard>
          )}

          <CCard className="!p-0">
            <div className="border-b border-zinc-800 px-5 py-3.5">
              <p className="text-sm font-semibold">Meals logged</p>
              <p className="text-xs text-zinc-500">What {firstName} has eaten</p>
            </div>
            {detail.meals.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-zinc-500">No meals logged yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {detail.meals.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.foodName}</span>
                      <span className="block text-xs text-zinc-500">
                        {[mealTypeLabel(m.mealType), m.quantity, shortTime(m.loggedAt)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {[m.calories != null ? `${m.calories} kcal` : null, m.protein != null ? `${m.protein}g protein` : null]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CCard>

          <CCard>
            <p className="text-sm font-semibold">Log a meal for {firstName}</p>
            <p className="mt-1 text-xs text-zinc-500">Record food on their behalf — it shows up in their app too.</p>
            <div className="mt-3">
              <CoachLogMeal clientId={detail.client.id} />
            </div>
          </CCard>
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value, delta, unit = "", goodDown }: { label: string; value: string; delta?: number | null; unit?: string; goodDown?: boolean }) {
  const good = delta != null && (goodDown ? delta <= 0 : delta >= 0);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
      {delta != null ? (
        <p className={`text-xs ${good ? "text-emerald-400" : "text-amber-400"}`}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}
          {unit}
        </p>
      ) : null}
    </div>
  );
}
