import { ActionForm } from "@/components/ActionForm";
import { Badge, Card, SectionTitle, Stat, inputCls } from "@/components/ui";
import { submitCheckinAction } from "@/actions/client";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

export default async function ProgressPage() {
  const { client } = await requireClient();
  const data = await getClientDashboard(client.id);
  const oldestFirst = [...data.checkins].reverse();

  const latest = data.checkins[0];
  const prev = data.checkins[1];
  const delta = latest && prev ? latest.weight - prev.weight : null;
  const first = oldestFirst[0];
  const totalChange = latest && first && latest.id !== first.id ? latest.weight - first.weight : null;

  const weights = data.checkins.map((w) => w.weight);
  const min = weights.length ? Math.min(...weights) : 0;
  const max = weights.length ? Math.max(...weights) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-zinc-500">Weigh-ins and check-in history</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          label="Current"
          value={latest ? `${latest.weight}` : "—"}
          sub={latest ? `kg · ${new Date(latest.createdAt).toLocaleDateString()}` : "No data"}
          accent
        />
        <Stat
          label="Last change"
          value={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : "—"}
          sub={delta != null ? "kg vs previous" : "need 2 check-ins"}
        />
        <Stat
          label="Overall"
          value={totalChange != null ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}` : "—"}
          sub={totalChange != null ? "kg since start" : `${data.checkins.length} check-ins`}
        />
      </div>

      <section aria-label="New check-in">
        <SectionTitle title="New check-in" hint="Weight + optional measurements" />
        <Card>
          <ActionForm action={submitCheckinAction} submitLabel="Submit check-in">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Weight (kg) *</span>
                <input name="weight" type="number" step="0.1" placeholder="e.g. 75.5" required min={20} max={500} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Body fat %</span>
                <input name="bodyFatPercent" type="number" step="0.1" placeholder="Optional" min={1} max={80} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Chest</span>
                <input name="chest" placeholder="Optional" maxLength={20} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Waist</span>
                <input name="waist" placeholder="Optional" maxLength={20} className={inputCls} />
              </label>
              <label className="col-span-2 block">
                <span className="mb-1 block text-xs font-medium text-zinc-500">Hips</span>
                <input name="hips" placeholder="Optional" maxLength={20} className={inputCls} />
              </label>
            </div>
            <textarea name="notes" placeholder="How are you feeling? Sleep, energy, soreness… (optional)" maxLength={2000} rows={3} className={inputCls} />
          </ActionForm>
          <p className="mt-2 text-xs text-zinc-400">Photo upload is not part of this MVP — weight, measurements and notes only.</p>
        </Card>
      </section>

      <section aria-label="Trend">
        <SectionTitle
          title="Trend"
          hint={data.checkins.length > 1 ? `${min.toFixed(1)} – ${max.toFixed(1)} kg range` : undefined}
        />
        <Card>
          {oldestFirst.length === 0 ? (
            <div className="py-2 text-center">
              <p className="font-medium">No check-ins yet</p>
              <p className="mt-1 text-sm text-zinc-500">Your history and chart will appear here.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5" aria-hidden>
                {oldestFirst.slice(-14).map((c) => {
                  const h = max === min ? 48 : 20 + ((c.weight - min) / (max - min)) * 72;
                  const isLatest = latest && c.id === latest.id;
                  return (
                    <div key={c.id} className="flex w-full flex-col items-center gap-1">
                      <div
                        title={`${c.weight} kg`}
                        className={`w-full rounded-t-md ${isLatest ? "bg-lime-700" : "bg-lime-600/70"}`}
                        style={{ height: `${h}px` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span>{oldestFirst.slice(-14)[0] ? new Date(oldestFirst.slice(-14)[0].createdAt).toLocaleDateString() : ""}</span>
                <span>{latest ? new Date(latest.createdAt).toLocaleDateString() : ""}</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {data.checkins.map((c, idx) => {
                  const next = data.checkins[idx + 1];
                  const d = next ? c.weight - next.weight : null;
                  return (
                    <li key={c.id} className="rounded-xl bg-zinc-50 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {c.weight} kg
                          {c.bodyFatPercent ? <span className="ml-1.5 font-normal text-zinc-500">· {c.bodyFatPercent}%</span> : null}
                        </span>
                        <span className="flex items-center gap-2">
                          {d != null ? (
                            <Badge tone={d < 0 ? "green" : d > 0 ? "amber" : "neutral"}>
                              {d > 0 ? "+" : ""}{d.toFixed(1)} kg
                            </Badge>
                          ) : (
                            <Badge>start</Badge>
                          )}
                          <span className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                      {c.notes ? <p className="mt-1 text-xs text-zinc-500">{c.notes}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
