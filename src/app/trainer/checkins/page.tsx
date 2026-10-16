import Link from "next/link";

import { EmptyState } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { getTrainerCheckins } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

export default async function CheckinsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireTrainer();
  const sp = await searchParams;
  const status = sp.status === "reviewed" ? "reviewed" : "pending";
  const all = await getTrainerCheckins(user.id);
  const pending = all.filter((r) => r.checkin.status === "pending");
  const reviewed = all.filter((r) => r.checkin.status !== "pending");
  const rows = status === "pending" ? pending : reviewed;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Check-ins</h1>

      <TabLinks
        activeKey={status}
        param="status"
        tabs={[
          { key: "pending", label: `Pending (${pending.length})` },
          { key: "reviewed", label: `Review (${reviewed.length})` },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState title={status === "pending" ? "No pending check-ins" : "No reviewed check-ins"} hint="Client check-ins will appear here." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <Link
              key={r.checkin.id}
              href={`/trainer/checkins/${r.checkin.id}`}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition hover:bg-zinc-800/60"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-800/50 font-semibold text-zinc-200">
                {r.user.name?.[0]?.toUpperCase() ?? "C"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.user.name}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {new Date(r.checkin.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  {r.checkin.feel ? ` · feels ${r.checkin.feel.toLowerCase()}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold">{r.checkin.weight} kg</span>
                <span className={`text-xs ${r.checkin.status === "approved" ? "text-emerald-400" : r.checkin.status === "reviewed" ? "text-zinc-200" : "text-zinc-500"}`}>
                  {r.checkin.status === "approved" ? "Approved" : r.checkin.status === "reviewed" ? "Reviewed" : "Review"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
