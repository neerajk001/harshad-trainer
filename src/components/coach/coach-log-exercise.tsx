"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logClientExerciseAction } from "@/actions/trainer";
import { cInput, ghostBtn, goldBtn } from "@/components/client/ui";

type Exercise = { id: string; name: string; sets: number; reps: string };
type Day = { id: string; name: string; dayNumber: number; exercises: Exercise[] };
type SetRow = { weight: string; reps: string };

function defaultReps(ex?: Exercise) {
  return ex && /^\d+$/.test(ex.reps.trim()) ? ex.reps.trim() : "";
}

export function CoachLogExercise({ clientId, days }: { clientId: string; days: Day[] }) {
  const router = useRouter();
  const [dayId, setDayId] = useState(days[0]?.id ?? "");
  const day = days.find((d) => d.id === dayId) ?? days[0];
  const [exerciseId, setExerciseId] = useState(day?.exercises[0]?.id ?? "");
  const exercise = day?.exercises.find((e) => e.id === exerciseId) ?? day?.exercises[0];
  const [sets, setSets] = useState<SetRow[]>([{ weight: "", reps: defaultReps(day?.exercises[0]) }]);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (days.length === 0 || !day || !exercise) {
    return <p className="text-sm text-zinc-500">Assign a program with exercises to log lifts.</p>;
  }

  function onDayChange(id: string) {
    const d = days.find((x) => x.id === id);
    const ex = d?.exercises[0];
    setDayId(id);
    setExerciseId(ex?.id ?? "");
    setSets([{ weight: "", reps: defaultReps(ex) }]);
    setDone(false);
    setError(null);
  }

  function onExerciseChange(id: string) {
    setExerciseId(id);
    setSets([{ weight: "", reps: defaultReps(day?.exercises.find((e) => e.id === id)) }]);
  }

  function update(i: number, key: keyof SetRow, value: string) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  }

  async function submit() {
    setError(null);
    setDone(false);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      fd.set("exerciseId", exercise.id);
      fd.set("workoutDayId", day.id);
      fd.set("notes", notes);
      fd.set(
        "sets",
        JSON.stringify(
          sets.map((s) => ({
            weight: s.weight === "" ? undefined : Number(s.weight),
            reps: s.reps === "" ? undefined : Number(s.reps),
          })),
        ),
      );
      const res = await logClientExerciseAction(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save");
        return;
      }
      setDone(true);
      setNotes("");
      setSets([{ weight: "", reps: defaultReps(exercise) }]);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select value={day.id} onChange={(e) => onDayChange(e.target.value)} className={cInput} aria-label="Workout day">
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              Day {d.dayNumber} · {d.name}
            </option>
          ))}
        </select>
        <select value={exercise.id} onChange={(e) => onExerciseChange(e.target.value)} className={cInput} aria-label="Exercise">
          {day.exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div className="grid grid-cols-[40px_1fr_1fr_36px] gap-2 border-b border-zinc-800 bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-400">
          <span>Set</span>
          <span>Weight (kg)</span>
          <span>Reps</span>
          <span className="sr-only">Remove</span>
        </div>
        <ul className="divide-y divide-zinc-800">
          {sets.map((s, i) => (
            <li key={i} className="grid grid-cols-[40px_1fr_1fr_36px] items-center gap-2 px-3 py-2">
              <span className="text-sm text-zinc-400">{i + 1}</span>
              <input
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => update(i, "weight", e.target.value)}
                placeholder="0"
                className={`${cInput} !px-2 !py-1.5 text-center text-sm`}
              />
              <input
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => update(i, "reps", e.target.value)}
                placeholder="0"
                className={`${cInput} !px-2 !py-1.5 text-center text-sm`}
              />
              <button
                type="button"
                onClick={() => setSets((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                aria-label={`Remove set ${i + 1}`}
                className="grid h-7 w-7 place-items-center rounded-md border border-zinc-800 text-zinc-500 hover:bg-zinc-800"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" onClick={() => setSets((prev) => [...prev, { weight: "", reps: defaultReps(exercise) }])} className={`${ghostBtn} w-full`}>
        + Add set
      </button>

      <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Notes (optional)" className={cInput} />

      {error ? <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p> : null}
      {done ? <p role="status" className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100">Lift logged</p> : null}

      <button type="button" onClick={submit} disabled={pending} className={`${goldBtn} w-full`}>
        {pending ? "Saving…" : "Log lift"}
      </button>
    </div>
  );
}
