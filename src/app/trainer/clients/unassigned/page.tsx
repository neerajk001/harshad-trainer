import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState } from "@/components/client/ui";
import { claimClientAction } from "@/actions/trainer";
import { getUnassignedClients } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";

export default async function UnassignedPage() {
  await requireTrainer();
  const rows = await getUnassignedClients();

  return (
    <div className="space-y-5">
      <Link href="/trainer/clients" className="text-sm text-zinc-400 hover:text-zinc-100">← Clients</Link>
      <h1 className="text-2xl font-semibold tracking-tight">New signups</h1>
      <p className="text-sm text-zinc-500">Self-registered clients with no coach yet. Claim one to start coaching.</p>

      {rows.length === 0 ? (
        <EmptyState title="No unassigned clients" hint="New self-signups will appear here." />
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <CCard key={r.client.id} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5 font-semibold text-zinc-200">
                {r.user.name?.[0]?.toUpperCase() ?? "C"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.user.name}</span>
                <span className="block truncate text-xs text-zinc-500">{r.user.email}</span>
              </span>
              <ActionForm action={claimClientAction} submitLabel="Claim" pendingLabel="…" className="" hideSuccess>
                <input type="hidden" name="clientId" value={r.client.id} />
              </ActionForm>
            </CCard>
          ))}
        </div>
      )}
    </div>
  );
}
