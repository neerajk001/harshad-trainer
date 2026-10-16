import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState } from "@/components/client/ui";
import { ApproveInquiryForm } from "@/components/coach/inquiry-actions";
import { declineInquiryAction } from "@/actions/trainer";
import { getInquiries } from "@/lib/coach-queries";
import { requireTrainer } from "@/lib/session";
import { goalLabel, timeAgo } from "@/lib/client-utils";

export default async function InquiriesPage() {
  await requireTrainer();
  const all = await getInquiries();
  const pending = all.filter((i) => i.status === "new");
  const handled = all.filter((i) => i.status !== "new");

  return (
    <div className="space-y-5">
      <Link href="/trainer/clients" className="text-sm text-zinc-400 hover:text-zinc-100">← Clients</Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
        <p className="mt-1 text-sm text-zinc-500">Requests to join. Approving creates the client&apos;s login.</p>
      </div>

      {pending.length === 0 ? (
        <EmptyState title="No pending inquiries" hint="New requests from the public form appear here." />
      ) : (
        <div className="space-y-3">
          {pending.map((i) => (
            <CCard key={i.id} className="border-zinc-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-zinc-500">
                    {i.email}
                    {i.phone ? ` · ${i.phone}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">{timeAgo(i.createdAt)}</span>
              </div>
              {i.goal ? <p className="mt-2 text-sm text-zinc-300">Goal: {goalLabel(i.goal) ?? i.goal}</p> : null}
              {i.message ? <p className="mt-2 rounded-lg bg-zinc-800/50 p-3 text-sm text-zinc-300">{i.message}</p> : null}
              <div className="mt-3">
                <ApproveInquiryForm inquiryId={i.id} name={i.name} />
              </div>
              <div className="mt-3">
                <ActionForm action={declineInquiryAction} submitLabel="Decline" pendingLabel="…" variant="danger" className="" confirmMessage={`Decline ${i.name}'s request?`} hideSuccess>
                  <input type="hidden" name="inquiryId" value={i.id} />
                </ActionForm>
              </div>
            </CCard>
          ))}
        </div>
      )}

      {handled.length > 0 ? (
        <section aria-label="Handled">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">Handled</h2>
          <CCard className="!p-2">
            <ul className="divide-y divide-zinc-800">
              {handled.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{i.name}</span>
                    <span className="block truncate text-xs text-zinc-500">{i.email}</span>
                  </span>
                  <span className={`shrink-0 text-xs ${i.status === "approved" ? "text-emerald-400" : "text-zinc-500"}`}>
                    {i.status === "approved" ? "Approved" : "Declined"}
                  </span>
                </li>
              ))}
            </ul>
          </CCard>
        </section>
      ) : null}
    </div>
  );
}
