"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logClientMealAction } from "@/actions/trainer";
import { cInput, goldBtn } from "@/components/client/ui";
import { MEAL_TYPES } from "@/lib/client-utils";

export function CoachLogMeal({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("clientId", clientId);
      const res = await logClientMealAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not log meal");
        return;
      }
      setDone(true);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="foodName" placeholder="Food name" required maxLength={160} className={cInput} />
      <div className="grid grid-cols-2 gap-3">
        <input name="quantity" placeholder="Quantity / serving" maxLength={120} className={cInput} />
        <select name="mealType" defaultValue="lunch" className={cInput} aria-label="Meal type">
          {MEAL_TYPES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="calories" type="number" inputMode="numeric" placeholder="kcal" min={0} max={10000} className={cInput} />
        <input name="protein" type="number" inputMode="numeric" placeholder="Protein g" min={0} max={2000} className={cInput} />
        <input name="carbs" type="number" inputMode="numeric" placeholder="Carbs g" min={0} max={2000} className={cInput} />
        <input name="fat" type="number" inputMode="numeric" placeholder="Fat g" min={0} max={2000} className={cInput} />
      </div>
      {error ? <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
      {done ? <p role="status" className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100">Meal logged</p> : null}
      <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
        {pending ? "Logging…" : "Log meal"}
      </button>
    </form>
  );
}
