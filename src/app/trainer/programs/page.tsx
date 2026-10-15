import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CreatePanel } from "@/components/create-panel";
import { CCard, EmptyState, cInput } from "@/components/client/ui";
import { createProgramAction, deleteProgramAction } from "@/actions/trainer";
import { getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

export default async function ProgramsPage() {
  const user = await requireTrainer();
  const programs = process.env.DATABASE_URL || isDemoMode() ? await getTrainerPrograms(user.id) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
        <p className="mt-1 text-sm text-zinc-500">Reusable workout programs.</p>
      </div>

      <CreatePanel label="New program">
        <CCard>
          <h2 className="font-semibold">Create Program</h2>
          <div className="mt-3">
            <ActionForm action={createProgramAction} submitLabel="Create program" successMessage="Program created">
              <input name="name" placeholder="Program name (e.g. Push Pull Legs)" required maxLength={120} className={cInput} />
              <input name="description" placeholder="Description (optional)" maxLength={2000} className={cInput} />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">Duration (weeks)</span>
                  <input name="durationWeeks" type="number" defaultValue={4} min={1} max={52} className={cInput} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">Level</span>
                  <select name="level" defaultValue="intermediate" className={cInput}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </div>
            </ActionForm>
          </div>
        </CCard>
      </CreatePanel>

      {programs.length === 0 ? (
        <EmptyState title="No programs yet" hint="Create your first program to get started." />
      ) : (
        <div className="space-y-2.5">
          {programs.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5">
              <Link href={`/trainer/programs/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-zinc-300">🏋️</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-zinc-500 capitalize">
                    {p.level} · {p.durationWeeks} weeks · {p.days.length} day{p.days.length === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
              <ActionForm action={deleteProgramAction} submitLabel="Delete" pendingLabel="…" variant="danger" className="" confirmMessage={`Delete "${p.name}"? This cannot be undone.`}>
                <input type="hidden" name="programId" value={p.id} />
              </ActionForm>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
