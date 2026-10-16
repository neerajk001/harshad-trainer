import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState, cInput } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { LineChart } from "@/components/client/line-chart";
import { addProgressEntryAction } from "@/actions/trainer";
import { getClientProgressData } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

export default async function ClientProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = ["bodyfat", "measure"].includes(sp.tab ?? "") ? (sp.tab as string) : "weight";
  const user = await requireTrainer();
  const data = await getClientProgressData(user.id, id);
  if (!data) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/clients" className="text-sm text-zinc-400">← Clients</Link>
        <EmptyState title="Client not found" />
      </div>
    );
  }
  const checkins = data.checkins;
  const ordered = [...checkins].reverse();
  const latest = checkins[0];
  const first = checkins[checkins.length - 1];
  const weightDelta = latest && first && latest.id !== first.id ? latest.weight - first.weight : null;
  const bfSeries = ordered.filter((c) => c.bodyFatPercent != null).map((c) => c.bodyFatPercent!);
  const measure = checkins.find((c) => c.measurementsJson && Object.keys(c.measurementsJson).length > 0)?.measurementsJson ?? null;

  return (
    <div className="space-y-5">
      <Link href={`/trainer/clients/${id}`} className="text-sm text-zinc-400 hover:text-zinc-100">← {data.user.name}</Link>
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
            <p className="text-3xl font-semibold tracking-tight">{latest ? `${latest.weight} kg` : "—"}</p>
            {weightDelta != null ? (
              <p className={`mt-1 text-sm font-medium ${weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                {weightDelta <= 0 ? "↓" : "↑"} {Math.abs(weightDelta).toFixed(1)} kg
              </p>
            ) : null}
            {ordered.length > 1 ? <LineChart values={ordered.map((c) => c.weight)} height={150} className="mt-4 h-36 w-full" /> : null}
          </CCard>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Body Fat" value={latest?.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"} />
            <Stat label="Muscle Mass" value={latest?.muscleMass != null ? `${latest.muscleMass} kg` : "—"} />
            <Stat label="Waist" value={measure?.waist ?? "—"} />
          </div>
        </>
      ) : null}

      {tab === "bodyfat" ? (
        <CCard>
          <p className="text-3xl font-semibold tracking-tight">{latest?.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"}</p>
          {bfSeries.length > 1 ? <LineChart values={bfSeries} height={150} className="mt-4 h-36 w-full" /> : null}
        </CCard>
      ) : null}

      {tab === "measure" ? (
        <CCard>
          <p className="text-sm font-semibold">Latest measurements</p>
          {measure ? (
            <ul className="mt-3 divide-y divide-zinc-800">
              {Object.entries(measure).map(([k, v]) => (
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

      <CCard>
        <p className="text-sm font-semibold">Add progress entry</p>
        <div className="mt-3">
          <ActionForm action={addProgressEntryAction} submitLabel="Add entry" successMessage="Entry added">
            <input type="hidden" name="clientId" value={id} />
            <div className="grid grid-cols-2 gap-3">
              <input name="weight" type="number" step="0.1" inputMode="decimal" placeholder="Weight kg *" required min={20} max={500} className={cInput} />
              <input name="bodyFatPercent" type="number" step="0.1" inputMode="decimal" placeholder="Body fat %" className={cInput} />
              <input name="muscleMass" type="number" step="0.1" inputMode="decimal" placeholder="Muscle mass kg" className={cInput} />
              <input name="waist" placeholder="Waist" maxLength={20} className={cInput} />
              <input name="chest" placeholder="Chest" maxLength={20} className={cInput} />
              <input name="hips" placeholder="Hips" maxLength={20} className={cInput} />
            </div>
            <textarea name="notes" rows={2} maxLength={2000} placeholder="Notes (optional)" className={cInput} />
          </ActionForm>
        </div>
      </CCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
