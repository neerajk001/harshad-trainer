import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState, cInput, goldBtn } from "@/components/client/ui";
import { assignPlansAction, unassignDietAction, unassignWorkoutAction } from "@/actions/trainer";
import { getClientDetail, getTrainerDietPlans, getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function AssignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTrainer();
  const detail = process.env.DATABASE_URL || isDemoMode() ? await getClientDetail(user.id, id) : null;
  if (!detail) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/clients" className="text-sm text-zinc-400">← Clients</Link>
        <EmptyState title="Client not found" />
      </div>
    );
  }
  const programs = await getTrainerPrograms(user.id);
  const plans = await getTrainerDietPlans(user.id);
  const currentW = detail.wAssign[0] ? programs.find((p) => p.id === detail.wAssign[0].programId) : null;
  const currentD = detail.dAssign[0] ? plans.find((p) => p.id === detail.dAssign[0].dietPlanId) : null;

  const schedule = WEEKDAYS.map((d, i) => ({ day: d, name: currentW?.days[i]?.name ?? "Rest" }));

  return (
    <div className="space-y-5">
      <Link href={`/trainer/clients/${id}`} className="text-sm text-zinc-400 hover:text-zinc-100">← {detail.user.name}</Link>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/5 font-semibold text-zinc-200">
          {detail.user.name?.[0]?.toUpperCase() ?? "C"}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Assign Plans</h1>
      </div>

      <CCard>
        <p className="text-sm font-semibold">Workout Program</p>
        {currentW ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentW.name}</p>
              <p className="text-xs text-zinc-500">{currentW.durationWeeks} weeks · {currentW.level}</p>
            </div>
            <ActionForm action={unassignWorkoutAction} submitLabel="Unassign" pendingLabel="…" variant="danger" className="" confirmMessage="Unassign this workout program?">
              <input type="hidden" name="assignmentId" value={detail.wAssign[0].id} />
            </ActionForm>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No workout program assigned.</p>
        )}
      </CCard>

      <CCard>
        <p className="text-sm font-semibold">Diet Plan</p>
        {currentD ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentD.name}</p>
              <p className="text-xs text-zinc-500">
                {[currentD.dailyCalories != null ? `${currentD.dailyCalories} kcal` : null, currentD.proteinTarget != null ? `${currentD.proteinTarget}g protein` : null]
                  .filter(Boolean)
                  .join(" · ") || "No targets"}
              </p>
            </div>
            <ActionForm action={unassignDietAction} submitLabel="Unassign" pendingLabel="…" variant="danger" className="" confirmMessage="Unassign this diet plan?">
              <input type="hidden" name="assignmentId" value={detail.dAssign[0].id} />
            </ActionForm>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No diet plan assigned.</p>
        )}
      </CCard>

      <CCard>
        <p className="text-sm font-semibold">Weekly Schedule</p>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {schedule.map((s) => (
            <div key={s.day} className="rounded-xl bg-white/5 p-2 text-center">
              <p className="text-[10px] font-medium text-zinc-500">{s.day}</p>
              <p className="mt-1 truncate text-[10px] text-zinc-300">{s.name}</p>
            </div>
          ))}
        </div>
      </CCard>

      <CCard>
        <p className="text-sm font-semibold">Assign</p>
        <div className="mt-3">
          <ActionForm action={assignPlansAction} submitLabel="Assign Plans" successMessage="Plans assigned">
            <input type="hidden" name="clientId" value={id} />
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Workout program</span>
              <select name="programId" defaultValue="" className={cInput}>
                <option value="">— None —</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.durationWeeks}w)</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Diet plan</span>
              <select name="planId" defaultValue="" className={cInput}>
                <option value="">— None —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-400">Start date</span>
              <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={cInput} />
            </label>
            <p className="text-xs text-zinc-500">The client sees assigned plans immediately. Email notifications are not part of this MVP.</p>
          </ActionForm>
        </div>
      </CCard>

      <Link href={`/trainer/clients/${id}`} className={`${goldBtn} w-full`}>
        Done
      </Link>
    </div>
  );
}
