import Link from "next/link";

import { CCard, cInput } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { AddMealItem } from "@/components/client/add-meal-item";
import { CustomMealForm } from "@/components/client/custom-meal-form";
import { getFoodCatalog } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { mealTypeForTime, mealTypeLabel } from "@/lib/client-utils";

export default async function AddMealPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const tab = sp.tab === "popular" || sp.tab === "custom" ? sp.tab : "recent";
  const catalog = await getFoodCatalog(client.id, q || undefined);
  const mealType = mealTypeForTime();

  const recentUnique = Array.from(
    catalog.recent
      .reduce((map, m) => {
        if (!map.has(m.foodName)) map.set(m.foodName, m);
        return map;
      }, new Map<string, (typeof catalog.recent)[number]>())
      .values(),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/client/nutrition" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Add Meal</h1>
          <p className="text-xs text-zinc-500">Logging to {mealTypeLabel(mealType)}</p>
        </div>
      </div>

      <form method="get" action="/client/nutrition/add" className="relative">
        <input type="hidden" name="tab" value={tab} />
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search food (e.g. chicken, roti, banana)"
          aria-label="Search food"
          className={`${cInput} pl-11`}
        />
      </form>

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "recent", label: "Recent" },
          { key: "popular", label: "Popular" },
          { key: "custom", label: "Custom" },
        ]}
      />

      {tab === "recent" ? (
        recentUnique.length === 0 ? (
          <CCard className="text-center text-sm text-zinc-500">No recent foods yet. Try Popular or Custom.</CCard>
        ) : (
          <div className="space-y-2.5">
            {recentUnique.map((m) => (
              <AddMealItem
                key={m.id}
                mealType={mealType}
                payload={{ foodName: m.foodName, quantity: m.quantity, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }}
                subtitle={[
                  m.calories != null ? `${m.calories} kcal` : null,
                  m.protein != null ? `${m.protein}g protein` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </div>
        )
      ) : null}

      {tab === "popular" ? (
        catalog.results.length === 0 ? (
          <CCard className="text-center text-sm text-zinc-500">No foods match “{q}”.</CCard>
        ) : (
          <div className="space-y-2.5">
            {catalog.results.map((f) => (
              <AddMealItem
                key={f.id}
                mealType={mealType}
                payload={{ foodName: f.name, quantity: f.serving, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat }}
                subtitle={`${f.serving ?? ""} · ${f.calories} kcal · ${f.protein}g protein`}
              />
            ))}
          </div>
        )
      ) : null}

      {tab === "custom" ? (
        <CCard>
          <CustomMealForm mealType={mealType} />
        </CCard>
      ) : null}

      <Link
        href="/client/nutrition"
        className="flex w-full items-center justify-center rounded-2xl bg-gold px-5 py-3.5 text-base font-semibold text-zinc-950"
      >
        Done
      </Link>
    </div>
  );
}
