import Link from "next/link";

import { CCard, EmptyState, MacroBar, Ring, SectionTitle } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { isToday, MEAL_TYPES, shortTime, sumMacros } from "@/lib/client-utils";

export default async function NutritionPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const tab = sp.tab === "plan" ? "plan" : "today";
  const data = await getClientDashboard(client.id);

  const mealsToday = data.recentMeals.filter((m) => isToday(m.loggedAt));
  const macros = sumMacros(mealsToday);
  const plan = data.dAssign?.plan ?? null;
  const kcalTarget = plan?.dailyCalories ?? null;
  const pct = kcalTarget ? Math.min(100, Math.round((macros.calories / kcalTarget) * 100)) : 0;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Nutrition</h1>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "today", label: "Today" },
          { key: "plan", label: "Diet Plan" },
        ]}
      />

      {tab === "today" ? (
        <>
          <CCard>
            <div className="flex items-center gap-5">
              <Ring value={macros.calories} max={kcalTarget ?? Math.max(macros.calories, 1)} size={116} stroke={11}>
                <span className="text-lg font-bold text-zinc-50">{macros.calories.toLocaleString()}</span>
                <span className="text-[10px] text-zinc-400">{kcalTarget ? `of ${kcalTarget.toLocaleString()}` : "kcal"}</span>
                <span className="text-[10px] text-zinc-500">{pct}%</span>
              </Ring>
              <div className="flex-1 space-y-3">
                <MacroBar label="Protein" value={macros.protein} max={plan?.proteinTarget ?? null} tone="emerald" />
                <MacroBar label="Carbs" value={macros.carbs} max={plan?.carbsTarget ?? null} tone="sky" />
                <MacroBar label="Fats" value={macros.fat} max={plan?.fatTarget ?? null} tone="rose" />
              </div>
            </div>
          </CCard>

          <section aria-label="Today's meals">
            <SectionTitle
              title="Today"
              action={
                <Link href="/client/nutrition/add" className="text-xs font-semibold text-gold">
                  + Add Meal
                </Link>
              }
            />
            {mealsToday.length === 0 ? (
              <EmptyState
                title="No meals logged yet"
                hint="Tap Add Meal to log what you eat."
                action={
                  <Link href="/client/nutrition/add" className="rounded-2xl bg-gold px-5 py-2.5 text-sm font-semibold text-zinc-950">
                    Log a Meal
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {MEAL_TYPES.map((mt) => {
                  const items = mealsToday.filter((m) => (m.mealType ?? "") === mt.key);
                  if (items.length === 0) return null;
                  const mtMacros = sumMacros(items);
                  return (
                    <div key={mt.key} className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-100">{mt.label}</p>
                        <p className="text-xs text-zinc-500">{shortTime(items[0].loggedAt)}</p>
                      </div>
                      <ul className="mt-2 divide-y divide-white/5">
                        {items.map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0 truncate text-sm text-zinc-200">{m.foodName}</span>
                            <span className="shrink-0 text-xs text-zinc-500">
                              {m.calories != null ? `${m.calories} kcal` : ""}
                              {m.protein != null ? ` · ${m.protein}g` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-right text-xs text-zinc-500">{mtMacros.calories} kcal</p>
                    </div>
                  );
                })}
                {mealsToday.some((m) => !m.mealType) ? (
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Other</p>
                    <ul className="mt-2 divide-y divide-white/5">
                      {mealsToday
                        .filter((m) => !m.mealType)
                        .map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                            <span className="min-w-0 truncate text-sm text-zinc-200">{m.foodName}</span>
                            <span className="shrink-0 text-xs text-zinc-500">{m.calories != null ? `${m.calories} kcal` : ""}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </>
      ) : (
        <section aria-label="Diet plan" className="space-y-3">
          {!plan ? (
            <EmptyState title="No diet plan assigned" hint="Your trainer will assign a plan soon." />
          ) : (
            <>
              <CCard>
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {[
                    plan.dailyCalories != null ? `${plan.dailyCalories} kcal` : null,
                    plan.proteinTarget != null ? `${plan.proteinTarget}g protein` : null,
                    plan.carbsTarget != null ? `${plan.carbsTarget}g carbs` : null,
                    plan.fatTarget != null ? `${plan.fatTarget}g fat` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No targets"}
                </p>
                {plan.notes ? <p className="mt-2 text-sm text-zinc-400">{plan.notes}</p> : null}
              </CCard>
              {data.dietMealsWithFood.map((m, i) => (
                <div key={m.id} className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-sm font-semibold">
                    <span className="mr-2 text-xs font-bold text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
                    {m.name}
                  </p>
                  <ul className="mt-2 divide-y divide-white/5">
                    {m.foods.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-zinc-200">{f.name}</span>
                          {f.quantity ? <span className="block text-xs text-zinc-500">{f.quantity}</span> : null}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {[f.calories != null ? `${f.calories} kcal` : null, f.protein != null ? `${f.protein}g` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </li>
                    ))}
                    {m.foods.length === 0 ? <li className="py-2 text-xs text-zinc-500">No items.</li> : null}
                  </ul>
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
}
