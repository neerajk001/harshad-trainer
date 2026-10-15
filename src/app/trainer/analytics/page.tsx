import { CCard, SectionTitle, StatTile } from "@/components/client/ui";
import { getTrainerAnalytics } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

const GOAL_META: Record<string, { label: string; color: string }> = {
  lose_fat: { label: "Fat Loss", color: "#f5c518" },
  build_muscle: { label: "Muscle Gain", color: "#4ade80" },
  get_stronger: { label: "Strength", color: "#60a5fa" },
  general_fitness: { label: "General Fitness", color: "#f472b6" },
  other: { label: "Other", color: "#94a3b8" },
};

export default async function AnalyticsPage() {
  const user = await requireTrainer();
  const data = await getTrainerAnalytics(user.id);
  const entries = Object.entries(data.goalCounts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;

  const r = 52;
  const C = 2 * Math.PI * r;
  const segments: Array<{ key: string; n: number; color: string; label: string; len: number; offset: number }> = [];
  let acc = 0;
  for (const [key, n] of entries) {
    const meta = GOAL_META[key] ?? GOAL_META.other;
    const len = (n / total) * C;
    segments.push({ key, n, color: meta.color, label: meta.label, len, offset: acc });
    acc += len;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Clients" value={String(data.totalClients)} />
        <StatTile label="Active Clients" value={String(data.activeClients)} />
        <StatTile label="Avg. Adherence" value={`${data.adherence}%`} />
        <StatTile label="Check-ins (30d)" value={String(data.checkins30)} />
      </div>

      <section aria-label="Goal distribution">
        <SectionTitle title="Goal Distribution" />
        <CCard className="flex items-center gap-6">
          <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" />
            {segments.map((s) => (
              <circle
                key={s.key}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${s.len} ${C - s.len}`}
                strokeDashoffset={-s.offset}
              />
            ))}
          </svg>
          <ul className="flex-1 space-y-2">
            {segments.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-zinc-300">{s.label}</span>
                <span className="text-zinc-500">
                  {s.n} ({Math.round((s.n / total) * 100)}%)
                </span>
              </li>
            ))}
            {segments.length === 0 ? <li className="text-sm text-zinc-500">No clients yet.</li> : null}
          </ul>
        </CCard>
      </section>
    </div>
  );
}
