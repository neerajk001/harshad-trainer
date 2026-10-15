import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { Badge, DarkCard, EmptyState, Field, PageHeader, SectionHeading, inputDarkCls } from "@/components/ui";
import {
  assignDietAction,
  assignWorkoutAction,
  setClientStatusAction,
  unassignDietAction,
  unassignWorkoutAction,
} from "@/actions/trainer";
import { getClientDetail, getTrainerDietPlans, getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

function Card({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <DarkCard className="!p-0">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-400">{title}</h2>
        {count != null ? <span className="text-xs text-zinc-500">{count}</span> : null}
      </div>
      <div className="p-4">{children}</div>
    </DarkCard>
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTrainer();
  const detail = process.env.DATABASE_URL || isDemoMode() ? await getClientDetail(user.id, id) : null;
  if (!detail) {
    return (
      <div>
        <PageHeader title="Client not found" />
        <EmptyState title="No access or missing client" hint="Return to the client list." />
      </div>
    );
  }
  const programs = await getTrainerPrograms(user.id);
  const plans = await getTrainerDietPlans(user.id);
  const isActive = detail.client.status === "active";

  return (
    <div className="space-y-6">
      <Link href="/trainer/clients" className="inline-block text-sm text-zinc-400 hover:text-white">
        ← All clients
      </Link>

      <PageHeader
        title={detail.user.name}
        subtitle={detail.user.email}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={isActive ? "green" : "neutral"}>{detail.client.status}</Badge>
            <ActionForm
              action={setClientStatusAction}
              submitLabel={isActive ? "Pause client" : "Activate client"}
              pendingLabel="…"
              variant="danger"
              className=""
              hideSuccess
            >
              <input type="hidden" name="clientId" value={detail.client.id} />
              <input type="hidden" name="status" value={isActive ? "paused" : "active"} />
            </ActionForm>
          </div>
        }
      />

      {detail.client.goal ? (
        <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 px-4 py-3 text-sm text-lime-200">
          <span className="font-medium text-lime-400">Goal:</span> {detail.client.goal}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <DarkCard>
          <SectionHeading title="Assign workout program" />
          <ActionForm action={assignWorkoutAction} submitLabel="Assign workout">
            <input type="hidden" name="clientId" value={detail.client.id} />
            <Field label="Program">
              <select name="programId" required className={inputDarkCls} defaultValue="">
                <option value="" disabled>
                  {programs.length ? "Select program…" : "No programs yet"}
                </option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date">
              <input name="startDate" type="date" required className={inputDarkCls} />
            </Field>
          </ActionForm>
          <div className="mt-4 space-y-2">
            {detail.wAssign.length === 0 ? <p className="text-sm text-zinc-500">No workout assigned.</p> : null}
            {detail.wAssign.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {programs.find((p) => p.id === a.programId)?.name ?? "Deleted program"}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {a.startDate} · {a.status}
                  </span>
                </span>
                <ActionForm
                  action={unassignWorkoutAction}
                  submitLabel="Unassign"
                  pendingLabel="…"
                  variant="danger"
                  className=""
                  confirmMessage="Unassign this workout program? The client keeps their completion history."
                >
                  <input type="hidden" name="assignmentId" value={a.id} />
                </ActionForm>
              </div>
            ))}
          </div>
        </DarkCard>

        <DarkCard>
          <SectionHeading title="Assign diet plan" />
          <ActionForm action={assignDietAction} submitLabel="Assign diet plan">
            <input type="hidden" name="clientId" value={detail.client.id} />
            <Field label="Plan">
              <select name="planId" required className={inputDarkCls} defaultValue="">
                <option value="" disabled>
                  {plans.length ? "Select plan…" : "No plans yet"}
                </option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date">
              <input name="startDate" type="date" required className={inputDarkCls} />
            </Field>
          </ActionForm>
          <div className="mt-4 space-y-2">
            {detail.dAssign.length === 0 ? <p className="text-sm text-zinc-500">No diet plan assigned.</p> : null}
            {detail.dAssign.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {plans.find((p) => p.id === a.dietPlanId)?.name ?? "Deleted plan"}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {a.startDate} · {a.status}
                  </span>
                </span>
                <ActionForm
                  action={unassignDietAction}
                  submitLabel="Unassign"
                  pendingLabel="…"
                  variant="danger"
                  className=""
                  confirmMessage="Unassign this diet plan? The client keeps their meal history."
                >
                  <input type="hidden" name="assignmentId" value={a.id} />
                </ActionForm>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Workout logs" count={detail.logs.length}>
          <div className="space-y-2">
            {detail.logs.length === 0 ? <p className="text-sm text-zinc-500">No logs yet.</p> : null}
            {detail.logs.map((l) => (
              <div key={l.id} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-sm">{new Date(l.completedAt).toLocaleString()}</p>
                {l.notes ? <p className="text-xs text-zinc-500">{l.notes}</p> : null}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Meal logs" count={detail.meals.length}>
          <div className="space-y-2">
            {detail.meals.length === 0 ? <p className="text-sm text-zinc-500">No meals logged.</p> : null}
            {detail.meals.map((m) => (
              <div key={m.id} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-sm font-medium">{m.foodName}</p>
                <p className="text-xs text-zinc-500">
                  {[m.quantity, m.calories != null ? `${m.calories} kcal` : null, m.protein != null ? `${m.protein}g protein` : null]
                    .filter(Boolean)
                    .join(" · ") || new Date(m.loggedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Check-ins" count={detail.checkins.length}>
          <div className="space-y-2">
            {detail.checkins.length === 0 ? <p className="text-sm text-zinc-500">No check-ins yet.</p> : null}
            {detail.checkins.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-sm font-medium">
                  {c.weight} kg · {new Date(c.createdAt).toLocaleDateString()}
                </p>
                {c.notes ? <p className="text-xs text-zinc-500">{c.notes}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
