import Link from "next/link";

import { CCard, EmptyState } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { weekProgress } from "@/lib/client-utils";

export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const tab = sp.tab === "all" ? "all" : "plan";
  const data = await getClientDashboard(client.id);

  if (!data.wAssign || data.workoutDaysWithEx.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <EmptyState title="No workout assigned" hint="Your trainer will assign a program soon." />
      </div>
    );
  }

  const days = data.workoutDaysWithEx;
  const completed = days.filter((d) => data.completedDayIds.includes(d.id)).length;
  const wp = weekProgress(data.wAssign.assignment.startDate, data.wAssign.program.durationWeeks);
  const pct = days.length ? Math.round((completed / days.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "plan", label: "Current Plan" },
          { key: "all", label: "All Workouts" },
        ]}
      />

      {tab === "plan" ? (
        <CCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Week {wp.week} · {data.wAssign.program.name}
              </p>
              <p className="text-xs text-zinc-500">
                {completed}/{days.length} days completed
              </p>
            </div>
            <span className="text-sm font-bold text-zinc-100">{pct}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-zinc-100" style={{ width: `${pct}%` }} />
          </div>
        </CCard>
      ) : null}

      <div className="space-y-3">
        {days.map((d) => {
          const done = data.completedDayIds.includes(d.id);
          return (
            <Link
              key={d.id}
              href={`/client/workouts/${d.id}`}
              className={`flex items-center gap-3 rounded-xl border px-4 py-4 transition ${
                done ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800/60"
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-800/50 text-sm font-bold text-zinc-200">
                {String(d.dayNumber).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{d.name}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {d.muscleGroups ?? `${d.exercises.length} exercises`}
                </span>
              </span>
              <span className="shrink-0 text-right text-xs text-zinc-500">
                {d.exercises.length} ex
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  done ? "bg-zinc-100 text-zinc-950" : "border border-zinc-700 text-transparent"
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
    </div>
  );
}
