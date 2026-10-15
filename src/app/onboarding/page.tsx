"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveOnboardingGoalAction } from "@/actions/onboarding";
import { goldBtn } from "@/components/client/ui";

const goals = [
  { key: "lose_fat", label: "Lose Fat", hint: "Get leaner and healthier", tone: "#f97316" },
  { key: "build_muscle", label: "Build Muscle", hint: "Gain strength and size", tone: "#60a5fa" },
  { key: "get_stronger", label: "Get Stronger", hint: "Improve overall fitness", tone: "#facc15" },
  { key: "general_fitness", label: "General Fitness", hint: "Be healthier and more active", tone: "#f472b6" },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("lose_fat");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("goal", goal);
      const res = await saveOnboardingGoalAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save your goal");
        return;
      }
      router.push("/onboarding/details");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">1 / 2</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 rounded-full bg-gold" />
        </div>
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          What&apos;s Your <span className="text-gold">Goal</span>?
        </h1>
        <p className="mt-2 text-sm text-zinc-400">This helps us create a personalized plan for you.</p>
      </div>

      <div className="mt-6 space-y-3">
        {goals.map((g) => {
          const active = goal === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setGoal(g.key)}
              className={`flex w-full items-center gap-4 rounded-3xl border px-4 py-4 text-left transition ${
                active ? "border-gold bg-gold/10" : "border-white/10 bg-zinc-900/60 hover:bg-zinc-900"
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${g.tone}22` }}>
                <span className="h-5 w-5 rounded-md" style={{ background: g.tone }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{g.label}</span>
                <span className="block text-sm text-zinc-400">{g.hint}</span>
              </span>
              {active ? (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-zinc-950">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}

      <div className="mt-auto pt-8">
        <button type="button" onClick={handleContinue} disabled={pending} className={`${goldBtn} w-full`}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
