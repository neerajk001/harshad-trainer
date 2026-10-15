import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CreatePanel } from "@/components/create-panel";
import { Badge, CCard, EmptyState, cInput, goldBtn } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { addClientAction } from "@/actions/trainer";
import { getTrainerClientsMeta } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";
import { goalLabel } from "@/lib/client-utils";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const user = await requireTrainer();
  const sp = await searchParams;
  const tab = ["active", "atrisk"].includes(sp.tab ?? "") ? (sp.tab as string) : "all";
  const q = (sp.q ?? "").trim().toLowerCase();

  const data = process.env.DATABASE_URL ? await getTrainerClientsMeta(user.id) : { rows: [], counts: { all: 0, active: 0, atRisk: 0 } };

  let rows = data.rows;
  if (tab === "active") rows = rows.filter((r) => !r.meta.atRisk && r.client.status === "active");
  if (tab === "atrisk") rows = rows.filter((r) => r.meta.atRisk);
  if (q) rows = rows.filter((r) => r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all your clients.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trainer/inquiries" className="rounded-2xl border border-gold/40 px-4 py-2.5 text-sm font-medium text-gold hover:bg-gold/10">
            Inquiries
          </Link>
          <a href="#add-client" className={`${goldBtn} !px-4 !py-2.5 text-sm`}>
            + Add Client
          </a>
        </div>
      </div>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "all", label: `All (${data.counts.all})` },
          { key: "active", label: `Active (${data.counts.active})` },
          { key: "atrisk", label: `At Risk (${data.counts.atRisk})` },
        ]}
      />

      <form method="get" action="/trainer/clients">
        <input type="hidden" name="tab" value={tab} />
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search clients…" aria-label="Search clients" className={cInput} />
      </form>

      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <EmptyState title={q ? "No matching clients" : "No clients yet"} hint={q ? "Try a different name or email." : "Add your first client below."} />
        ) : (
          rows.map((r) => (
            <Link
              key={r.client.id}
              href={`/trainer/clients/${r.client.id}`}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5 transition hover:bg-zinc-900"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5 font-semibold text-zinc-200">
                {r.user.name?.[0]?.toUpperCase() ?? "C"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.user.name}</span>
                <span className="block truncate text-xs text-zinc-500">
                  {[goalLabel(r.client.goal) ?? "No goal", r.meta.durationWeeks ? `${r.meta.durationWeeks} weeks` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              {r.client.status !== "active" ? (
                <Badge>Paused</Badge>
              ) : r.meta.atRisk ? (
                <Badge tone="amber">At Risk</Badge>
              ) : (
                <Badge tone="green">Active</Badge>
              )}
            </Link>
          ))
        )}
      </div>

      <div id="add-client">
        <CreatePanel label="Add client" className="">
          <CCard>
            <h2 className="font-semibold">Add client</h2>
            <p className="mt-1 text-xs text-zinc-500">Creates the client login immediately. Share credentials securely.</p>
            <div className="mt-4">
              <ActionForm action={addClientAction} submitLabel="Create client" successMessage="Client created">
                <input name="name" placeholder="Full name" required maxLength={120} className={cInput} />
                <input name="email" type="email" placeholder="Email" required maxLength={255} className={cInput} />
                <input name="password" type="password" placeholder="Temporary password (min 8)" required minLength={8} className={cInput} />
                <input name="phone" placeholder="Phone (optional)" maxLength={40} className={cInput} />
                <input name="goal" placeholder="Goal (optional)" maxLength={500} className={cInput} />
              </ActionForm>
            </div>
          </CCard>
        </CreatePanel>
      </div>
    </div>
  );
}
