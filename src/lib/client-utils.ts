export const GOAL_LABELS: Record<string, string> = {
  lose_fat: "Fat Loss",
  build_muscle: "Build Muscle",
  get_stronger: "Get Stronger",
  general_fitness: "General Fitness",
};

export function goalLabel(goal?: string | null) {
  if (!goal) return null;
  return GOAL_LABELS[goal] ?? goal;
}

export function goalOptions() {
  return [
    { key: "lose_fat", label: "Lose Fat" },
    { key: "build_muscle", label: "Build Muscle" },
    { key: "get_stronger", label: "Get Stronger" },
    { key: "general_fitness", label: "General Fitness" },
  ];
}

export const MEAL_TYPES: Array<{ key: string; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Snack" },
  { key: "dinner", label: "Dinner" },
];

export function mealTypeForTime(date = new Date()): string {
  const h = date.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snack";
  return "dinner";
}

export function mealTypeLabel(type?: string | null) {
  return MEAL_TYPES.find((m) => m.key === type)?.label ?? null;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isToday(value: Date | string) {
  return new Date(value).getTime() >= startOfToday().getTime();
}

export function sumMacros(
  meals: Array<{ calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null }>,
) {
  return meals.reduce<{ calories: number; protein: number; carbs: number; fat: number }>(
    (acc, m) => {
      acc.calories += m.calories ?? 0;
      acc.protein += m.protein ?? 0;
      acc.carbs += m.carbs ?? 0;
      acc.fat += m.fat ?? 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function weekProgress(startDate: string, durationWeeks: number) {
  const start = new Date(`${startDate}T00:00:00`);
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  const week = Math.min(Math.max(Math.floor(days / 7) + 1, 1), durationWeeks);
  return { week, totalWeeks: durationWeeks };
}

export function todayWorkoutIndex(total: number) {
  if (total <= 0) return 0;
  return new Date().getDay() % total;
}

export function timeAgo(value: Date | string) {
  const ms = Date.now() - new Date(value).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function fmtDelta(n: number | null, unit = "") {
  if (n == null) return null;
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}${unit}`;
}

export function shortTime(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
