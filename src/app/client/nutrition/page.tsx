import { ActionForm } from "@/components/ActionForm";
import { Card, EmptyState, ProgressBar, SectionTitle, Stat, inputCls } from "@/components/ui";
import { logMealAction } from "@/actions/client";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

export default async function NutritionPage() {
  const { client } = await requireClient();
  const data = await getClientDashboard(client.id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const mealsToday = data.recentMeals.filter((m) => new Date(m.loggedAt).getTime() >= todayStart.getTime());
  const kcalToday = mealsToday.reduce((s, m) => s + (m.calories ?? 0), 0);
  const proteinToday = mealsToday.reduce((s, m) => s + (m.protein ?? 0), 0);
  const kcalTarget = data.dAssign?.plan.dailyCalories ?? null;
  const proteinTarget = data.dAssign?.plan.proteinTarget ?? null;
  const planFoodCount = data.dietMealsWithFood.reduce((s, m) => s + m.foods.length, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nutrition</h1>
        <p className="mt-1 text-sm text-zinc-500">{data.dAssign ? data.dAssign.plan.name : "Meal logging"}</p>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Today" value={kcalToday > 0 ? `${kcalToday}` : "—"} sub={kcalTarget ? `of ${kcalTarget} kcal` : "kcal eaten"} accent />
        <Stat label="Protein" value={proteinToday > 0 ? `${proteinToday}g` : "—"} sub={proteinTarget ? `of ${proteinTarget}g` : "today"} />
        <Stat label="Meals" value={String(mealsToday.length)} sub="logged today" />
      </div>

      {kcalTarget ? (
        <Card>
          <div className="flex items-baseline justify-between text-sm">
            <p className="font-medium">Daily target</p>
            <p className="text-xs text-zinc-500">
              {kcalToday} / {kcalTarget} kcal
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar value={kcalToday} max={kcalTarget} />
          </div>
          {proteinTarget ? (
            <>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <p className="font-medium">Protein</p>
                <p className="text-xs text-zinc-500">
                  {proteinToday} / {proteinTarget}g
                </p>
              </div>
              <div className="mt-2">
                <ProgressBar value={proteinToday} max={proteinTarget} tone="amber" />
              </div>
            </>
          ) : null}
        </Card>
      ) : null}

      {!data.dAssign ? (
        <EmptyState title="No diet plan assigned" hint="You can still log meals below." />
      ) : (
        <section aria-label="Your plan">
          <SectionTitle title="Your plan" hint={`${data.dietMealsWithFood.length} meals · ${planFoodCount} items`} />
          <div className="space-y-3">
            <Card className="!p-4">
              {data.dAssign.plan.notes ? <p className="text-sm text-zinc-700">{data.dAssign.plan.notes}</p> : null}
              <div className="mt-1 space-y-3">
                {data.dietMealsWithFood.map((m, i) => (
                  <div key={m.id} className="rounded-2xl bg-zinc-50 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        <span className="mr-2 text-xs font-bold text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                        {m.name}
                      </p>
                      <span className="text-xs text-zinc-500">{m.foods.length} items</span>
                    </div>
                    <ul className="mt-2 divide-y divide-zinc-200/60">
                      {m.foods.map((f) => (
                        <li key={f.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{f.name}</span>
                            {f.quantity ? <span className="block text-xs text-zinc-500">{f.quantity}</span> : null}
                          </span>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {[f.calories != null ? `${f.calories} kcal` : null, f.protein != null ? `${f.protein}g` : null]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </span>
                        </li>
                      ))}
                      {m.foods.length === 0 ? <li className="py-1 text-xs text-zinc-500">No items.</li> : null}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}

      <section aria-label="Log food">
        <SectionTitle title="Log food" hint="What you actually ate" />
        <Card>
          <ActionForm action={logMealAction} submitLabel="Log meal">
            <input name="foodName" placeholder="Food name" required maxLength={160} className={inputCls} />
            <div className="grid grid-cols-3 gap-2">
              <input name="quantity" placeholder="Qty / serving" maxLength={120} className={inputCls} />
              <input name="calories" type="number" inputMode="numeric" placeholder="kcal" min={0} max={10000} className={inputCls} />
              <input name="protein" type="number" inputMode="numeric" placeholder="Protein g" min={0} max={2000} className={inputCls} />
            </div>
          </ActionForm>
        </Card>
      </section>

      {data.recentMeals.length > 0 ? (
        <section aria-label="Recent meals">
          <SectionTitle title="Recent" hint="Your latest logs" />
          <Card className="!p-2">
            <ul className="divide-y divide-zinc-100">
              {data.recentMeals.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{m.foodName}</span>
                    <span className="block text-xs text-zinc-500">
                      {new Date(m.loggedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {m.quantity ? ` · ${m.quantity}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {[m.calories != null ? `${m.calories}` : null].filter(Boolean).join("") || "—"}
                    {m.calories != null ? <span className="font-normal text-zinc-500"> kcal</span> : ""}
                    {m.protein != null ? ` · ${m.protein}g` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
