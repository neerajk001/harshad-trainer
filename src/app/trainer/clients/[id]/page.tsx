import Link from "next/link";

import { CCard, EmptyState, goldBtn } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { LineChart } from "@/components/client/line-chart";
import { getClientDetail, getTrainerDietPlans, getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";
import { goalLabel } from "@/lib/client-utils";

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
  const detail = process.env.DATABASE_URL || isDemoMode() ? await getClientDetail(user.id, id) : null;
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
  const profileBits = [
    detail.client.age ? `${detail.client.age} years` : null,
    detail.client.gender ? detail.client.gender[0].toUpperCase() + detail.client.gender.slice(1) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <Link href="/trainer/clients" className="text-sm text-zinc-400 hover:text-zinc-100">← All clients</Link>

      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/5 text-xl font-semibold text-zinc-200">
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
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${detail.client.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-zinc-300"}`}>
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

          <CCard>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Progress Trend</p>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">All time</span>
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
            <Link href={`/trainer/messages/${detail.client.id}`} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-medium">
              Message
            </Link>
            <Link href={`/trainer/clients/${detail.client.id}/assign`} className={goldBtn}>
              Assign Plans
            </Link>
          </div>
        </>
      ) : null}

      {tab === "progress" ? (
        <CCard>
          <p className="text-sm text-zinc-400">Full progress, measurements and check-ins.</p>
          <Link href={`/trainer/clients/${detail.client.id}/progress`} className="mt-3 inline-block text-sm font-semibold text-gold">
            Open progress →
          </Link>
        </CCard>
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
        </div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value, delta, unit = "", goodDown }: { label: string; value: string; delta?: number | null; unit?: string; goodDown?: boolean }) {
  const good = delta != null && (goodDown ? delta <= 0 : delta >= 0);
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-3.5">
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
