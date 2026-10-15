import Link from "next/link";

import { ActionForm } from "@/components/ActionForm";
import { CreatePanel } from "@/components/create-panel";
import { CCard, EmptyState, cInput } from "@/components/client/ui";
import { createDietPlanAction, deleteDietPlanAction } from "@/actions/trainer";
import { getTrainerDietPlans } from "@/lib/queries";
import { requireTrainer } from "@/lib/session";

export default async function DietPlansPage() {
  const user = await requireTrainer();
  const plans = process.env.DATABASE_URL ? await getTrainerDietPlans(user.id) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diet Plans</h1>
        <p className="mt-1 text-sm text-zinc-500">Reusable nutrition plans.</p>
      </div>

      <CreatePanel label="New diet plan">
        <CCard>
          <h2 className="font-semibold">Create Diet Plan</h2>
          <div className="mt-3">
            <ActionForm action={createDietPlanAction} submitLabel="Create plan" successMessage="Plan created">
              <input name="name" placeholder="Plan name (e.g. High Protein Fat Loss)" required maxLength={120} className={cInput} />
              <div className="grid grid-cols-2 gap-3">
                <input name="dailyCalories" type="number" placeholder="Calories (kcal)" min={0} max={20000} className={cInput} />
                <input name="proteinTarget" type="number" placeholder="Protein (g)" min={0} max={2000} className={cInput} />
                <input name="carbsTarget" type="number" placeholder="Carbs (g)" min={0} max={2000} className={cInput} />
                <input name="fatTarget" type="number" placeholder="Fats (g)" min={0} max={2000} className={cInput} />
              </div>
              <input name="notes" placeholder="Notes (optional)" maxLength={2000} className={cInput} />
            </ActionForm>
          </div>
        </CCard>
      </CreatePanel>

      {plans.length === 0 ? (
        <EmptyState title="No diet plans yet" hint="Create your first plan to get started." />
      ) : (
        <div className="space-y-2.5">
          {plans.map((p) => {
            const foodCount = p.meals.reduce((s, m) => s + m.foods.length, 0);
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 px-4 py-3.5">
                <Link href={`/trainer/diet-plans/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-zinc-300">🥗</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {[p.dailyCalories != null ? `${p.dailyCalories} kcal` : null, p.proteinTarget != null ? `${p.proteinTarget}g protein` : null, `${p.meals.length} meals`]
                        .filter(Boolean)
                        .join(" · ")}
                      {foodCount ? ` · ${foodCount} items` : ""}
                    </span>
                  </span>
                </Link>
                <ActionForm action={deleteDietPlanAction} submitLabel="Delete" pendingLabel="…" variant="danger" className="" confirmMessage={`Delete "${p.name}"? This cannot be undone.`}>
                  <input type="hidden" name="planId" value={p.id} />
                </ActionForm>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
