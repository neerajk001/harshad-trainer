"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitCheckinAction } from "@/actions/client";
import { cInput, goldBtn } from "@/components/client/ui";

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <select name={name} defaultValue={defaultValue} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckinForm({ defaultWeight }: { defaultWeight: number | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await submitCheckinAction(new FormData(e.currentTarget));
      if (!res.ok) {
        setError(res.error ?? "Could not submit check-in");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm text-zinc-400">Current Weight (kg) *</span>
        <input
          name="weight"
          type="number"
          step="0.1"
          inputMode="decimal"
          required
          min={20}
          max={500}
          defaultValue={defaultWeight ?? undefined}
          placeholder="e.g. 72.4"
          className={cInput}
        />
      </label>

      <Select name="feel" label="How do you feel?" options={["Great", "Good", "Okay", "Tired", "Sore"]} defaultValue="Good" />
      <Select name="sleepHours" label="Sleep Quality" options={["5", "6", "7", "8", "9"]} defaultValue="7" />
      <Select name="energyLevel" label="Energy Level" options={["High", "Good", "Low"]} defaultValue="Good" />
      <Select name="stressLevel" label="Stress Level" options={["Low", "Moderate", "High"]} defaultValue="Moderate" />

      <details className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-300">Add body fat &amp; measurements (optional)</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input name="bodyFatPercent" type="number" step="0.1" inputMode="decimal" placeholder="Body fat %" className={cInput} />
          <input name="muscleMass" type="number" step="0.1" inputMode="decimal" placeholder="Muscle mass kg" className={cInput} />
          <input name="chest" placeholder="Chest" maxLength={20} className={cInput} />
          <input name="waist" placeholder="Waist" maxLength={20} className={cInput} />
          <input name="hips" placeholder="Hips" maxLength={20} className={`${cInput} col-span-2`} />
        </div>
      </details>

      <label className="block">
        <span className="mb-1.5 block text-sm text-zinc-400">Notes</span>
        <textarea name="notes" rows={3} maxLength={2000} placeholder="Anything to share with your trainer?" className={cInput} />
      </label>

      {error ? <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
      {done ? <p role="status" className="rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">Check-in submitted</p> : null}

      <button type="submit" disabled={pending} className={`${goldBtn} w-full`}>
        {pending ? "Submitting…" : "Submit Check-in"}
      </button>
    </form>
  );
}
