"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logExerciseAction } from "@/actions/client";
import { ghostBtn, goldBtn } from "@/components/client/ui";

type SetRow = { weight: string; reps: string };
type HistoryRow = { id: string; setNumber: number; weight: number | null; reps: number | null; loggedAt: Date | string };

const tabs = [
  { key: "log", label: "Log" },
  { key: "history", label: "History" },
  { key: "instructions", label: "Instructions" },
] as const;

export function ExerciseLogForm({
  exercise,
  dayId,
  history,
}: {
  exercise: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    notes: string | null;
    instructions: string | null;
    muscleGroup: string | null;
  };
  dayId: string;
  history: HistoryRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("log");
  const [notes, setNotes] = useState("");
  const defaultReps = /^\d+$/.test(exercise.reps.trim()) ? exercise.reps.trim() : "";
  const [sets, setSets] = useState<SetRow[]>(
    Array.from({ length: Math.max(1, Math.min(exercise.sets, 10)) }, () => ({ weight: "", reps: defaultReps })),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update(i: number, key: keyof SetRow, value: string) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  }

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const payload = sets.map((s) => ({
        weight: s.weight === "" ? undefined : Number(s.weight),
        reps: s.reps === "" ? undefined : Number(s.reps),
      }));
      const fd = new FormData();
      fd.set("exerciseId", exercise.id);
      fd.set("workoutDayId", dayId);
      fd.set("notes", notes);
      fd.set("sets", JSON.stringify(payload));
      const res = await logExerciseAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/client/workouts/${dayId}`} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{exercise.name}</h1>
          <p className="text-xs text-zinc-500">{[exercise.muscleGroup, exercise.notes].filter(Boolean).join(" · ") || "Exercise"}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl bg-zinc-900 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
              tab === t.key ? "bg-gold text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "log" ? (
        <>
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <div className="grid grid-cols-[44px_1fr_1fr_40px] gap-2 border-b border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-400">
              <span>Set</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span className="sr-only">Done</span>
            </div>
            <ul className="divide-y divide-white/5">
              {sets.map((s, i) => (
                <li key={i} className="grid grid-cols-[44px_1fr_1fr_40px] items-center gap-2 px-3 py-2.5">
                  <span className="text-sm font-medium text-zinc-400">{i + 1}</span>
                  <input
                    inputMode="decimal"
                    value={s.weight}
                    onChange={(e) => update(i, "weight", e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-center text-sm text-zinc-100 outline-none focus:border-gold/60 [color-scheme:dark]"
                  />
                  <input
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => update(i, "reps", e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-center text-sm text-zinc-100 outline-none focus:border-gold/60 [color-scheme:dark]"
                  />
                  <span className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-zinc-500">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setSets((prev) => [...prev, { weight: "", reps: defaultReps }])}
            className={`${ghostBtn} w-full`}
          >
            + Add Set
          </button>

          <label className="block">
            <span className="mb-1.5 block text-sm text-zinc-400">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="How did it feel?"
              className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-gold/60 [color-scheme:dark]"
            />
          </label>

          {error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
          {done ? <p role="status" className="rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">Saved. Nice work!</p> : null}

          <button type="button" onClick={submit} disabled={pending} className={`${goldBtn} w-full`}>
            {pending ? "Saving…" : "Complete Exercise"}
          </button>
        </>
      ) : null}

      {tab === "history" ? (
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">
              No history yet. Log a set to see it here.
            </p>
          ) : (
            Object.entries(
              history.reduce<Record<string, HistoryRow[]>>((acc, row) => {
                const key = new Date(row.loggedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
                (acc[key] ??= []).push(row);
                return acc;
              }, {}),
            ).map(([date, rows]) => (
              <div key={date} className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-zinc-200">{date}</p>
                <ul className="mt-2 divide-y divide-white/5">
                  {rows
                    .sort((a, b) => a.setNumber - b.setNumber)
                    .map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-zinc-400">Set {r.setNumber}</span>
                        <span className="text-zinc-100">
                          {r.weight ?? "—"} kg × {r.reps ?? "—"}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "instructions" ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 text-sm leading-relaxed text-zinc-300">
          {exercise.instructions ?? exercise.notes ?? "No instructions provided. Ask your trainer for form cues."}
        </div>
      ) : null}
    </div>
  );
}
