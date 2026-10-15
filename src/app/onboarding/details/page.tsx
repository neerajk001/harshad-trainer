"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveOnboardingDetailsAction } from "@/actions/onboarding";
import { cInput, goldBtn } from "@/components/client/ui";

const activities = [
  { key: "sedentary", label: "Sedentary" },
  { key: "moderate", label: "Moderate" },
  { key: "active", label: "Active" },
];

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState("moderate");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("gender", gender);
      fd.set("activityLevel", activity);
      const res = await saveOnboardingDetailsAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save your details");
        return;
      }
      router.push("/client");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/onboarding" aria-label="Back" className="text-zinc-400 hover:text-zinc-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full rounded-full bg-gold" />
        </div>
      </div>

      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Tell Us About <span className="text-gold">Yourself</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">This helps us personalize your plan.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Gender</p>
          <div className="grid grid-cols-2 gap-2">
            {[{ k: "male", l: "Male" }, { k: "female", l: "Female" }].map((g) => (
              <button
                key={g.k}
                type="button"
                onClick={() => setGender(g.k)}
                className={`rounded-2xl border py-3 text-sm font-medium transition ${
                  gender === g.k ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-zinc-900 text-zinc-300"
                }`}
              >
                {g.l}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Age</span>
          <input name="age" type="number" inputMode="numeric" defaultValue={28} min={13} max={100} required className={cInput} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">Height (cm)</span>
          <input name="heightCm" type="number" inputMode="numeric" defaultValue={175} min={90} max={250} required className={cInput} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Current Weight (kg)</span>
            <input name="currentWeightKg" type="number" step="0.1" inputMode="decimal" defaultValue={72.4} min={30} max={400} required className={cInput} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-300">Target Weight (kg)</span>
            <input name="targetWeightKg" type="number" step="0.1" inputMode="decimal" defaultValue={68} min={30} max={400} required className={cInput} />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Activity Level</p>
          <div className="grid grid-cols-3 gap-2">
            {activities.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setActivity(a.key)}
                className={`rounded-2xl border py-3 text-sm font-medium transition ${
                  activity === a.key ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-zinc-900 text-zinc-300"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}

        <div className="mt-auto pt-6">
          <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
            {pending ? "Saving…" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
