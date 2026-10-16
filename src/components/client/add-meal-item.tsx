"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logMealAction } from "@/actions/client";

export function AddMealItem({
  payload,
  mealType,
  subtitle,
  right,
}: {
  payload: { foodName: string; quantity?: string | null; calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null };
  mealType: string;
  subtitle?: string;
  right?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");

  async function add() {
    if (state !== "idle") return;
    setState("pending");
    try {
      const fd = new FormData();
      fd.set("foodName", payload.foodName);
      if (payload.quantity) fd.set("quantity", payload.quantity);
      fd.set("mealType", mealType);
      if (payload.calories != null) fd.set("calories", String(payload.calories));
      if (payload.protein != null) fd.set("protein", String(payload.protein));
      if (payload.carbs != null) fd.set("carbs", String(payload.carbs));
      if (payload.fat != null) fd.set("fat", String(payload.fat));
      const res = await logMealAction(fd);
      if (res.ok) {
        setState("done");
        router.refresh();
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zinc-800/50 text-lg">🍽️</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{payload.foodName}</span>
        <span className="block truncate text-xs text-zinc-500">{subtitle ?? right ?? ""}</span>
      </span>
      <button
        type="button"
        onClick={add}
        disabled={state !== "idle"}
        aria-label={`Add ${payload.foodName}`}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
          state === "done" ? "bg-emerald-500 text-zinc-950" : "border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
        }`}
      >
        {state === "done" ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
