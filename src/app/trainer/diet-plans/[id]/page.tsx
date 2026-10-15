import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CCard, EmptyState, cInput } from "@/components/client/ui";
import {
  addDietMealAction,
  addFoodItemAction,
  deleteDietMealAction,
  deleteFoodItemAction,
  updateDietPlanAction,
} from "@/actions/trainer";
import { getTrainerDietPlans } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";

export default async function DietBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireTrainer();
  const plans = process.env.DATABASE_URL ? await getTrainerDietPlans(user.id) : [];
  const p = plans.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="space-y-5">
        <Link href="/trainer/diet-plans" className="text-sm text-zinc-400">← Diet Plans</Link>
        <EmptyState title="Plan not found" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/trainer/diet-plans" className="text-sm text-zinc-400 hover:text-zinc-100">← Diet Plans</Link>

      <CCard>
        <p className="text-sm font-semibold">Plan &amp; targets</p>
        <div className="mt-3">
          <ActionForm action={updateDietPlanAction} submitLabel="Save Plan" successMessage="Saved">
            <input type="hidden" name="planId" value={p.id} />
            <input name="name" defaultValue={p.name} required maxLength={120} className={cInput} />
            <div className="grid grid-cols-2 gap-3">
              <input name="dailyCalories" type="number" defaultValue={p.dailyCalories ?? ""} min={0} max={20000} placeholder="Calories (kcal)" className={cInput} />
              <input name="proteinTarget" type="number" defaultValue={p.proteinTarget ?? ""} min={0} max={2000} placeholder="Protein (g)" className={cInput} />
              <input name="carbsTarget" type="number" defaultValue={p.carbsTarget ?? ""} min={0} max={2000} placeholder="Carbs (g)" className={cInput} />
              <input name="fatTarget" type="number" defaultValue={p.fatTarget ?? ""} min={0} max={2000} placeholder="Fats (g)" className={cInput} />
            </div>
            <input name="notes" defaultValue={p.notes ?? ""} placeholder="Notes (optional)" maxLength={2000} className={cInput} />
          </ActionForm>
        </div>
      </CCard>

      <div className="space-y-3">
        {p.meals.map((m) => (
          <CCard key={m.id}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{m.name}</p>
                {m.time ? <p className="text-xs text-zinc-500">{m.time}</p> : null}
              </div>
              <ActionForm action={deleteDietMealAction} submitLabel="Remove meal" pendingLabel="…" variant="danger" className="" confirmMessage={`Remove "${m.name}" and its foods?`}>
                <input type="hidden" name="mealId" value={m.id} />
              </ActionForm>
            </div>
            <ul className="mt-3 divide-y divide-white/5">
              {m.foods.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm">
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
            <div className="mt-3 rounded-2xl bg-white/5 p-3">
              <ActionForm action={addFoodItemAction} submitLabel="Add food" successMessage="Food added">
                <input type="hidden" name="mealId" value={m.id} />
                <input name="name" placeholder="Food name" required maxLength={160} className={cInput} />
                <div className="grid grid-cols-2 gap-3">
                  <input name="quantity" placeholder="Quantity" maxLength={120} className={cInput} />
                  <input name="calories" type="number" placeholder="Calories" min={0} max={10000} className={cInput} />
                  <input name="protein" type="number" placeholder="Protein g" min={0} max={2000} className={cInput} />
                  <input name="carbs" type="number" placeholder="Carbs g" min={0} max={2000} className={cInput} />
                  <input name="fat" type="number" placeholder="Fats g" min={0} max={2000} className={`${cInput} col-span-2`} />
                </div>
              </ActionForm>
            </div>
          </CCard>
        ))}
      </div>

      <CCard>
        <p className="text-sm font-semibold">Add meal</p>
        <div className="mt-3">
          <ActionForm action={addDietMealAction} submitLabel="Add Meal" successMessage="Meal added">
            <input type="hidden" name="planId" value={p.id} />
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <input name="name" placeholder="Meal name (e.g. Breakfast)" required maxLength={120} className={cInput} />
              <input name="time" placeholder="08:00" maxLength={20} className={cInput} />
            </div>
          </ActionForm>
        </div>
      </CCard>
    </div>
  );
}
