import { ActionForm } from "@/components/ActionForm";
import { DarkCard, EmptyState, Field, PageHeader, SectionHeading, inputDarkCls } from "@/components/ui";
import {
  addExerciseAction,
  addWorkoutDayAction,
  createProgramAction,
  deleteExerciseAction,
  deleteProgramAction,
  deleteWorkoutDayAction,
  updateProgramAction,
} from "@/actions/trainer";
import { getTrainerPrograms } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

export default async function ProgramsPage() {
  const user = await requireTrainer();
  const programs = process.env.DATABASE_URL || isDemoMode() ? await getTrainerPrograms(user.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Workout programs" subtitle="Reusable programs with days and exercises" />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {programs.length === 0 ? (
            <EmptyState title="No programs yet" hint="Create your first program with the form." />
          ) : null}
          {programs.map((p) => (
            <DarkCard key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="text-sm text-zinc-500">
                    {p.durationWeeks} weeks
                    {p.description ? ` · ${p.description}` : ""} · {p.days.length} day{p.days.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ActionForm
                  action={deleteProgramAction}
                  submitLabel="Delete program"
                  pendingLabel="…"
                  variant="danger"
                  className=""
                  confirmMessage={`Delete "${p.name}"? Its days, exercises and assignments are removed. This cannot be undone.`}
                >
                  <input type="hidden" name="programId" value={p.id} />
                </ActionForm>
              </div>

              <details className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
                <summary className="cursor-pointer font-medium">Edit program</summary>
                <div className="mt-3">
                  <ActionForm action={updateProgramAction} submitLabel="Save changes">
                    <input type="hidden" name="programId" value={p.id} />
                    <Field label="Name">
                      <input name="name" defaultValue={p.name} required maxLength={120} className={inputDarkCls} />
                    </Field>
                    <Field label="Description">
                      <input name="description" defaultValue={p.description ?? ""} maxLength={2000} className={inputDarkCls} />
                    </Field>
                    <Field label="Duration (weeks)">
                      <input name="durationWeeks" type="number" defaultValue={p.durationWeeks} min={1} max={52} className={inputDarkCls} />
                    </Field>
                  </ActionForm>
                </div>
              </details>

              <div className="mt-4 space-y-3">
                {p.days.map((d) => (
                  <div key={d.id} className="rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        Day {d.dayNumber} · {d.name}
                      </p>
                      <ActionForm
                        action={deleteWorkoutDayAction}
                        submitLabel="Remove day"
                        pendingLabel="…"
                        variant="danger"
                        className=""
                        confirmMessage={`Remove "${d.name}" and its exercises from this program?`}
                      >
                        <input type="hidden" name="dayId" value={d.id} />
                      </ActionForm>
                    </div>
                    <ul className="mt-2 divide-y divide-white/5 text-sm text-zinc-300">
                      {d.exercises.map((e) => (
                        <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                          <span className="min-w-0">
                            <span className="block truncate">{e.name}</span>
                            <span className="block text-xs text-zinc-500">
                              {e.sets}×{e.reps}
                              {e.restSeconds ? ` · ${e.restSeconds}s rest` : ""}
                            </span>
                          </span>
                          <ActionForm
                            action={deleteExerciseAction}
                            submitLabel="Remove"
                            pendingLabel="…"
                            variant="danger"
                            className=""
                          >
                            <input type="hidden" name="exerciseId" value={e.id} />
                          </ActionForm>
                        </li>
                      ))}
                      {d.exercises.length === 0 ? <li className="py-2 text-xs text-zinc-500">No exercises yet.</li> : null}
                    </ul>
                    <div className="mt-3">
                      <ActionForm action={addExerciseAction} submitLabel="Add exercise">
                        <input type="hidden" name="dayId" value={d.id} />
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Exercise name" className="col-span-2">
                            <input name="name" placeholder="e.g. Bench press" required maxLength={160} className={inputDarkCls} />
                          </Field>
                          <Field label="Sets">
                            <input name="sets" type="number" defaultValue={3} min={1} max={50} className={inputDarkCls} />
                          </Field>
                          <Field label="Reps">
                            <input name="reps" defaultValue="10" maxLength={20} className={inputDarkCls} />
                          </Field>
                          <Field label="Rest (sec)">
                            <input name="restSeconds" type="number" min={0} max={1800} placeholder="Optional" className={inputDarkCls} />
                          </Field>
                          <Field label="Notes" className="col-span-2">
                            <input name="notes" placeholder="Optional" maxLength={500} className={inputDarkCls} />
                          </Field>
                        </div>
                      </ActionForm>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-white/5 p-3">
                <SectionHeading title="Add day" />
                <ActionForm action={addWorkoutDayAction} submitLabel="Add day">
                  <input type="hidden" name="programId" value={p.id} />
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <Field label="Day name">
                      <input name="name" placeholder="e.g. Push day" required maxLength={120} className={inputDarkCls} />
                    </Field>
                    <Field label="Day #">
                      <input name="dayNumber" type="number" required min={1} max={30} defaultValue={p.days.length + 1} className={inputDarkCls} />
                    </Field>
                  </div>
                </ActionForm>
              </div>
            </DarkCard>
          ))}
        </div>

        <DarkCard>
          <h2 className="font-semibold">New program</h2>
          <div className="mt-3">
            <ActionForm action={createProgramAction} submitLabel="Create program">
              <Field label="Program name">
                <input name="name" placeholder="e.g. Full-body strength" required maxLength={120} className={inputDarkCls} />
              </Field>
              <Field label="Description">
                <input name="description" placeholder="Optional" maxLength={2000} className={inputDarkCls} />
              </Field>
              <Field label="Duration (weeks)">
                <input name="durationWeeks" type="number" defaultValue={4} min={1} max={52} className={inputDarkCls} />
              </Field>
            </ActionForm>
          </div>
        </DarkCard>
      </div>
    </div>
  );
}
