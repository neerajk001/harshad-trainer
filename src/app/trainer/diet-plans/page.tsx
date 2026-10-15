import { ActionForm } from "@/components/ActionForm";
import { DarkCard, EmptyState, Field, PageHeader, SectionHeading, inputDarkCls } from "@/components/ui";
import {
  addDietMealAction,
  addFoodItemAction,
  createDietPlanAction,
  deleteDietMealAction,
  deleteDietPlanAction,
  deleteFoodItemAction,
  updateDietPlanAction,
} from "@/actions/trainer";
import { getTrainerDietPlans } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";
import { isDemoMode } from "@/lib/demo";

export default async function DietPlansPage() {
  const user = await requireTrainer();
  const plans = process.env.DATABASE_URL || isDemoMode() ? await getTrainerDietPlans(user.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Diet plans" subtitle="Reusable nutrition plans with meals and foods" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {plans.length === 0 ? <EmptyState title="No diet plans yet" hint="Create your first plan with the form." /> : null}
          {plans.map((p) => {
            const foodCount = p.meals.reduce((s, m) => s + m.foods.length, 0);
            return (
              <DarkCard key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <p className="text-sm text-zinc-500">
                      {[p.dailyCalories != null ? `${p.dailyCalories} kcal/day` : null, p.proteinTarget != null ? `${p.proteinTarget}g protein` : null]
                        .filter(Boolean)
                        .join(" · ") || "No targets set"}{" "}
                      · {p.meals.length} meal{p.meals.length === 1 ? "" : "s"} · {foodCount} item{foodCount === 1 ? "" : "s"}
                    </p>
                    {p.notes ? <p className="mt-1 text-sm text-zinc-400">{p.notes}</p> : null}
                  </div>
                  <ActionForm
                    action={deleteDietPlanAction}
                    submitLabel="Delete plan"
                    pendingLabel="…"
                    variant="danger"
                    className=""
                    confirmMessage={`Delete "${p.name}"? Its meals, foods and assignments are removed. This cannot be undone.`}
                  >
                    <input type="hidden" name="planId" value={p.id} />
                  </ActionForm>
                </div>

                <details className="mt-3 rounded-xl bg-white/5 p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Edit plan</summary>
                  <div className="mt-3">
                    <ActionForm action={updateDietPlanAction} submitLabel="Save changes">
                      <input type="hidden" name="planId" value={p.id} />
                      <Field label="Name">
                        <input name="name" defaultValue={p.name} required maxLength={120} className={inputDarkCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Daily calories">
                          <input name="dailyCalories" type="number" defaultValue={p.dailyCalories ?? ""} min={0} max={20000} placeholder="kcal" className={inputDarkCls} />
                        </Field>
                        <Field label="Protein (g)">
                          <input name="proteinTarget" type="number" defaultValue={p.proteinTarget ?? ""} min={0} max={2000} className={inputDarkCls} />
                        </Field>
                      </div>
                      <Field label="Notes">
                        <input name="notes" defaultValue={p.notes ?? ""} maxLength={2000} className={inputDarkCls} />
                      </Field>
                    </ActionForm>
                  </div>
                </details>

                <div className="mt-4 space-y-3">
                  {p.meals.map((m) => (
                    <div key={m.id} className="rounded-xl border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{m.name}</p>
                        <ActionForm
                          action={deleteDietMealAction}
                          submitLabel="Remove meal"
                          pendingLabel="…"
                          variant="danger"
                          className=""
                          confirmMessage={`Remove "${m.name}" and its foods from this plan?`}
                        >
                          <input type="hidden" name="mealId" value={m.id} />
                        </ActionForm>
                      </div>
                      <ul className="mt-2 divide-y divide-white/5 text-sm text-zinc-300">
                        {m.foods.map((f) => (
                          <li key={f.id} className="flex items-center justify-between gap-2 py-2">
                            <span className="min-w-0">
                              <span className="block truncate">
                                {f.name}
                                {f.quantity ? ` · ${f.quantity}` : ""}
                              </span>
                              <span className="block text-xs text-zinc-500">
                                {[f.calories != null ? `${f.calories} kcal` : null, f.protein != null ? `${f.protein}g` : null]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </span>
                            </span>
                            <ActionForm action={deleteFoodItemAction} submitLabel="Remove" pendingLabel="…" variant="danger" className="">
                              <input type="hidden" name="foodItemId" value={f.id} />
                            </ActionForm>
                          </li>
                        ))}
                        {m.foods.length === 0 ? <li className="py-2 text-xs text-zinc-500">No foods yet.</li> : null}
                      </ul>
                      <div className="mt-3">
                        <ActionForm action={addFoodItemAction} submitLabel="Add food">
                          <input type="hidden" name="mealId" value={m.id} />
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="Food name" className="col-span-2">
                              <input name="name" placeholder="e.g. Oats" required maxLength={160} className={inputDarkCls} />
                            </Field>
                            <Field label="Quantity">
                              <input name="quantity" placeholder="e.g. 80g" maxLength={120} className={inputDarkCls} />
                            </Field>
                            <Field label="Calories">
                              <input name="calories" type="number" placeholder="kcal" min={0} max={10000} className={inputDarkCls} />
                            </Field>
                            <Field label="Protein (g)" className="col-span-2">
                              <input name="protein" type="number" placeholder="Optional" min={0} max={2000} className={inputDarkCls} />
                            </Field>
                          </div>
                        </ActionForm>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-white/5 p-3">
                  <SectionHeading title="Add meal" />
                  <ActionForm action={addDietMealAction} submitLabel="Add meal">
                    <input type="hidden" name="planId" value={p.id} />
                    <Field label="Meal name">
                      <input name="name" placeholder="e.g. Breakfast" required maxLength={120} className={inputDarkCls} />
                    </Field>
                  </ActionForm>
                </div>
              </DarkCard>
            );
          })}
        </div>

        <DarkCard>
          <h2 className="font-semibold">New diet plan</h2>
          <div className="mt-3">
            <ActionForm action={createDietPlanAction} submitLabel="Create plan">
              <Field label="Plan name">
                <input name="name" placeholder="e.g. High-protein 2200" required maxLength={120} className={inputDarkCls} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Daily calories">
                  <input name="dailyCalories" type="number" placeholder="kcal" min={0} max={20000} className={inputDarkCls} />
                </Field>
                <Field label="Protein (g)">
                  <input name="proteinTarget" type="number" placeholder="Optional" min={0} max={2000} className={inputDarkCls} />
                </Field>
              </div>
              <Field label="Notes">
                <input name="notes" placeholder="Optional" maxLength={2000} className={inputDarkCls} />
              </Field>
            </ActionForm>
          </div>
        </DarkCard>
      </div>
    </div>
  );
}
