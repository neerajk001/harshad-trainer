import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState, cInput } from "@/components/client/ui";
import {
  addExerciseAction,
  addWorkoutDayAction,
  deleteExerciseAction,
  deleteWorkoutDayAction,
  updateProgramAction,
} from "@/actions/trainer";
import { getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

export default async function ProgramBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTrainer();
  const programs = process.env.DATABASE_URL || isDemoMode() ? await getTrainerPrograms(user.id) : [];
  const p = programs.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/programs" className="text-sm text-zinc-400">← Programs</Link>
        <EmptyState title="Program not found" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/trainer/programs" className="text-sm text-zinc-400 hover:text-zinc-100">← Programs</Link>

      <CCard>
        <p className="text-sm font-semibold">Program details</p>
        <div className="mt-3">
          <ActionForm action={updateProgramAction} submitLabel="Save Program" successMessage="Saved">
            <input type="hidden" name="programId" value={p.id} />
            <input name="name" defaultValue={p.name} required maxLength={120} className={cInput} />
            <input name="description" defaultValue={p.description ?? ""} placeholder="Description" maxLength={2000} className={cInput} />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Duration (weeks)</span>
                <input name="durationWeeks" type="number" defaultValue={p.durationWeeks} min={1} max={52} className={cInput} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-zinc-400">Level</span>
                <select name="level" defaultValue={p.level} className={cInput}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
          </ActionForm>
        </div>
      </CCard>

      <div className="space-y-3">
        {p.days.map((d) => (
          <CCard key={d.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  <span className="mr-2 text-xs font-bold text-zinc-500">Day {d.dayNumber}</span>
                  {d.name}
                </p>
                {d.muscleGroups ? <p className="text-xs text-zinc-500">{d.muscleGroups}</p> : null}
              </div>
              <ActionForm action={deleteWorkoutDayAction} submitLabel="Remove day" pendingLabel="…" variant="danger" className="" confirmMessage={`Remove "${d.name}" and its exercises?`}>
                <input type="hidden" name="dayId" value={d.id} />
              </ActionForm>
            </div>

            <ul className="mt-3 divide-y divide-white/5">
              {d.exercises.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{e.name}</span>
                    <span className="block text-xs text-zinc-500">
                      {e.sets}×{e.reps}
                      {e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}
                    </span>
                  </span>
                  <ActionForm action={deleteExerciseAction} submitLabel="Remove" pendingLabel="…" variant="danger" className="">
                    <input type="hidden" name="exerciseId" value={e.id} />
                  </ActionForm>
                </li>
              ))}
              {d.exercises.length === 0 ? <li className="py-2 text-xs text-zinc-500">No exercises yet.</li> : null}
            </ul>

            <div className="mt-3 rounded-2xl bg-white/5 p-3">
              <ActionForm action={addExerciseAction} submitLabel="Add exercise" successMessage="Exercise added">
                <input type="hidden" name="dayId" value={d.id} />
                <input name="name" placeholder="Exercise name" required maxLength={160} className={cInput} />
                <div className="grid grid-cols-2 gap-3">
                  <input name="sets" type="number" defaultValue={3} min={1} max={50} placeholder="Sets" className={cInput} />
                  <input name="reps" defaultValue="10" maxLength={20} placeholder="Reps" className={cInput} />
                  <input name="restSeconds" type="number" min={0} max={1800} placeholder="Rest (sec)" className={cInput} />
                  <input name="muscleGroup" placeholder="Muscle group" maxLength={80} className={cInput} />
                </div>
                <input name="notes" placeholder="Notes (optional)" maxLength={500} className={cInput} />
              </ActionForm>
            </div>
          </CCard>
        ))}
      </div>

      <CCard>
        <p className="text-sm font-semibold">Add day</p>
        <div className="mt-3">
          <ActionForm action={addWorkoutDayAction} submitLabel="Add Day" successMessage="Day added">
            <input type="hidden" name="programId" value={p.id} />
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <input name="name" placeholder="Day name (e.g. Push)" required maxLength={120} className={cInput} />
              <input name="dayNumber" type="number" required min={1} max={30} defaultValue={p.days.length + 1} placeholder="#" className={cInput} />
            </div>
            <input name="muscleGroups" placeholder="Muscle groups (e.g. Chest, Shoulders, Triceps)" maxLength={200} className={cInput} />
          </ActionForm>
        </div>
      </CCard>
    </div>
  );
}
