import Link from "next/link";

import { CCard, EmptyState } from "@/components/client/ui";
import { CheckinReviewForm } from "@/components/coach/checkin-review-form";
import { getCheckinDetail, getClientProgressData } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

export default async function CheckinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTrainer();
  const detail = await getCheckinDetail(user.id, id);
  if (!detail) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/checkins" className="text-sm text-zinc-400">← Check-ins</Link>
        <EmptyState title="Check-in not found" />
      </div>
    );
  }
  const progress = await getClientProgressData(user.id, detail.client.id);
  const list = progress?.checkins ?? [];
  const idx = list.findIndex((c) => c.id === detail.checkin.id);
  const prev = idx >= 0 ? list[idx + 1] : undefined;
  const c = detail.checkin;
  const d = (cur?: number | null, old?: number | null) => (cur != null && old != null ? cur - old : null);

  return (
    <div className="space-y-5">
      <Link href="/trainer/checkins" className="text-sm text-zinc-400 hover:text-zinc-100">← Check-ins</Link>

      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-zinc-800/50 font-semibold text-zinc-200">
          {detail.user.name?.[0]?.toUpperCase() ?? "C"}
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{detail.user.name}</h1>
          <p className="text-xs text-zinc-500">
            Check-in · {new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${c.status === "approved" ? "bg-emerald-500/15 text-emerald-400" : c.status === "reviewed" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-800 text-zinc-300"}`}>
          {c.status === "approved" ? "Approved" : c.status === "reviewed" ? "Reviewed" : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Weight" value={`${c.weight} kg`} delta={d(c.weight, prev?.weight)} unit=" kg" goodDown />
        <Stat label="Body Fat" value={c.bodyFatPercent != null ? `${c.bodyFatPercent}%` : "—"} delta={d(c.bodyFatPercent, prev?.bodyFatPercent)} unit="%" goodDown />
        <Stat label="Muscle Mass" value={c.muscleMass != null ? `${c.muscleMass} kg` : "—"} delta={d(c.muscleMass, prev?.muscleMass)} unit=" kg" />
      </div>

      <CCard>
        <p className="text-sm font-semibold">Wellbeing</p>
        <ul className="mt-2 divide-y divide-zinc-800 text-sm">
          <Row k="How do you feel?" v={c.feel ?? "—"} />
          <Row k="Sleep quality" v={c.sleepHours != null ? `${c.sleepHours} hours` : "—"} />
          <Row k="Energy level" v={c.energyLevel ?? "—"} />
          <Row k="Stress level" v={c.stressLevel ?? "—"} />
        </ul>
        {c.notes ? <p className="mt-3 rounded-lg bg-zinc-800/50 p-3 text-sm text-zinc-300">{c.notes}</p> : null}
      </CCard>

      <CCard>
        <p className="text-sm font-semibold">Review</p>
        <div className="mt-3">
          <CheckinReviewForm checkinId={c.id} defaultFeedback={c.feedback} />
        </div>
      </CCard>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-zinc-400">{k}</span>
      <span className="font-medium text-zinc-100">{v}</span>
    </li>
  );
}

function Stat({ label, value, delta, unit = "", goodDown }: { label: string; value: string; delta?: number | null; unit?: string; goodDown?: boolean }) {
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
