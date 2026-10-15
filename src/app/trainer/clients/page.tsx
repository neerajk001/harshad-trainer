import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CreatePanel } from "@/components/create-panel";
import { Avatar, Badge, DarkCard, EmptyState, Field, PageHeader, inputDarkCls } from "@/components/ui";
import { addClientAction, setClientStatusAction } from "@/actions/trainer";
import { getTrainerClients } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireTrainer();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const rows = process.env.DATABASE_URL || isDemoMode() ? await getTrainerClients(user.id, q || undefined) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle={`${rows.length} client${rows.length === 1 ? "" : "s"}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <form method="get" className="mb-4 flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or email…"
              aria-label="Search clients"
              className={inputDarkCls}
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Search
            </button>
            {q ? (
              <Link
                href="/trainer/clients"
                className="shrink-0 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <div className="space-y-2">
            {rows.length === 0 ? (
              <EmptyState title={q ? "No matching clients" : "No clients yet"} hint={q ? "Try a different name or email." : "Add your first client with the form."} />
            ) : (
              rows.map(({ client, user: u }) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3"
                >
                  <Link href={`/trainer/clients/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={u.name} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{u.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {u.email}
                        {client.goal ? ` · ${client.goal}` : ""}
                      </span>
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={client.status === "active" ? "green" : "neutral"}>{client.status}</Badge>
                    <ActionForm
                      action={setClientStatusAction}
                      submitLabel={client.status === "active" ? "Pause" : "Activate"}
                      pendingLabel="…"
                      variant="danger"
                      className=""
                      confirmMessage={
                        client.status === "active"
                          ? `Pause ${u.name}? They keep their plans and history.`
                          : `Activate ${u.name}?`
                      }
                    >
                      <input type="hidden" name="clientId" value={client.id} />
                      <input type="hidden" name="status" value={client.status === "active" ? "paused" : "active"} />
                    </ActionForm>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <CreatePanel label="Add client" className="order-1 lg:order-2">
          <DarkCard>
            <h2 className="font-semibold">Add client</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Development flow: creates the client login immediately. Share the credentials securely; do not email passwords in production.
            </p>
            <div className="mt-4">
              <ActionForm action={addClientAction} submitLabel="Create client">
                <Field label="Full name">
                  <input name="name" placeholder="e.g. Rohan Mehta" required maxLength={120} className={inputDarkCls} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" placeholder="client@example.com" required maxLength={255} className={inputDarkCls} />
                </Field>
                <Field label="Temporary password" hint="Minimum 8 characters.">
                  <input name="password" type="password" placeholder="Min 8 chars" required minLength={8} className={inputDarkCls} />
                </Field>
                <Field label="Goal">
                  <input name="goal" placeholder="Optional, e.g. Lose 5 kg" maxLength={500} className={inputDarkCls} />
                </Field>
              </ActionForm>
            </div>
          </DarkCard>
        </CreatePanel>
      </div>
    </div>
  );
}
