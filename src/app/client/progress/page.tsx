import Link from "next/link";

import { CCard, EmptyState, goldBtn, StatTile } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { LineChart } from "@/components/client/line-chart";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const tab = ["bodyfat", "measure"].includes(sp.tab ?? "") ? (sp.tab as string) : "weight";
  const data = await getClientDashboard(client.id);
  const checkins = data.checkins;

  const ordered = [...checkins].reverse();
  const latest = checkins[0];
  const first = checkins[checkins.length - 1];

  const weightDelta = latest && first && latest.id !== first.id ? latest.weight - first.weight : null;
  const weightPct = latest && first && first.weight ? (weightDelta! / first.weight) * 100 : null;
  const weightSeries = ordered.map((c) => c.weight);

  const bfOrdered = ordered.filter((c) => c.bodyFatPercent != null);
  const bfLatest = checkins.find((c) => c.bodyFatPercent != null);
  const bfFirst = [...checkins].reverse().find((c) => c.bodyFatPercent != null);
  const bfDelta = bfLatest && bfFirst && bfLatest.id !== bfFirst.id ? (bfLatest.bodyFatPercent! - bfFirst.bodyFatPercent!) : null;

  const latestWithMeasure = checkins.find((c) => c.measurementsJson && Object.keys(c.measurementsJson).length > 0);

  if (checkins.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <EmptyState
          title="No data yet"
          hint="Add your first check-in to start tracking."
          action={
            <Link href="/client/checkin" className={goldBtn}>
              Add New Entry
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "weight", label: "Weight" },
          { key: "bodyfat", label: "Body Fat" },
          { key: "measure", label: "Measure" },
        ]}
      />

      {tab === "weight" ? (
        <>
          <CCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{latest?.weight} kg</p>
                {weightDelta != null ? (
                  <p className={`mt-1 text-sm font-medium ${weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    {weightDelta <= 0 ? "↓" : "↑"} {Math.abs(weightDelta).toFixed(1)} kg
                    {weightPct != null ? ` (${Math.abs(weightPct).toFixed(1)}%)` : ""}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">All time</span>
            </div>
            <div className="mt-4">
              <LineChart values={weightSeries} className="h-40 w-full" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-zinc-500">
              <span>{first ? new Date(first.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
              <span>{latest ? new Date(latest.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
            </div>
          </CCard>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Body Fat"
              value={latest?.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"}
              delta={bfDelta != null ? `${bfDelta <= 0 ? "↓" : "↑"} ${Math.abs(bfDelta).toFixed(1)}%` : undefined}
              positive={bfDelta != null && bfDelta <= 0}
            />
            <StatTile
              label="Muscle Mass"
              value={latest?.muscleMass != null ? `${latest.muscleMass} kg` : "—"}
            />
            <StatTile label="Chest" value={latestWithMeasure?.measurementsJson?.chest ?? "—"} />
            <StatTile label="Waist" value={latestWithMeasure?.measurementsJson?.waist ?? "—"} />
          </div>
        </>
      ) : null}

      {tab === "bodyfat" ? (
        <CCard>
          <p className="text-3xl font-semibold tracking-tight">{bfLatest?.bodyFatPercent != null ? `${bfLatest.bodyFatPercent}%` : "—"}</p>
          {bfDelta != null ? (
            <p className={`mt-1 text-sm font-medium ${bfDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {bfDelta <= 0 ? "↓" : "↑"} {Math.abs(bfDelta).toFixed(1)}%
            </p>
          ) : null}
          <div className="mt-4">
            <LineChart values={bfOrdered.map((c) => c.bodyFatPercent!)} className="h-40 w-full" />
          </div>
        </CCard>
      ) : null}

      {tab === "measure" ? (
        <CCard>
          <p className="text-sm font-semibold text-zinc-100">Latest measurements</p>
          {latestWithMeasure?.measurementsJson ? (
            <ul className="mt-3 divide-y divide-zinc-800">
              {Object.entries(latestWithMeasure.measurementsJson).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="capitalize text-zinc-400">{k}</span>
                  <span className="font-medium text-zinc-100">{v}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No measurements recorded yet.</p>
          )}
        </CCard>
      ) : null}

      <Link href="/client/checkin" className={`${goldBtn} w-full`}>
        Add New Entry
      </Link>
    </div>
  );
}
