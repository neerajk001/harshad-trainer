"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logMealAction } from "@/actions/client";
import { cInput, goldBtn } from "@/components/client/ui";

export function CustomMealForm({ mealType }: { mealType: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("mealType", mealType);
      const res = await logMealAction(fd);
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
      <input name="quantity" placeholder="Quantity / serving" maxLength={120} className={cInput} />
      <div className="grid grid-cols-2 gap-3">
        <input name="calories" type="number" inputMode="numeric" placeholder="kcal" min={0} max={10000} className={cInput} />
        <input name="protein" type="number" inputMode="numeric" placeholder="Protein g" min={0} max={2000} className={cInput} />
        <input name="carbs" type="number" inputMode="numeric" placeholder="Carbs g" min={0} max={2000} className={cInput} />
        <input name="fat" type="number" inputMode="numeric" placeholder="Fat g" min={0} max={2000} className={cInput} />
      </div>
      {error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
      {done ? <p role="status" className="rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">Meal logged</p> : null}
      <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
        {pending ? "Logging…" : "Log custom food"}
      </button>
    </form>
  );
}
