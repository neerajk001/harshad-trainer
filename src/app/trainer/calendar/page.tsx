import { CCard } from "@/components/client/ui";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert JS Sunday-first (0) to Monday-first index.
  const leading = (firstDay.getDay() + 6) % 7;
  const cells: Array<number | null> = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = now.getDate();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

      <CCard>
        <p className="font-semibold">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
          {WEEK.map((d) => (
            <span key={d} className="text-[10px] font-medium text-zinc-500">{d}</span>
          ))}
          {cells.map((c, i) => (
            <span
              key={i}
              className={`grid h-9 place-items-center rounded-xl text-sm ${
                c === today ? "bg-gold font-bold text-zinc-950" : c ? "text-zinc-300" : ""
              }`}
            >
              {c ?? ""}
            </span>
          ))}
        </div>
      </CCard>

      <CCard className="border-dashed text-center">
        <p className="font-medium">No scheduled events</p>
        <p className="mt-1 text-sm text-zinc-500">Scheduling and availability aren&apos;t part of this MVP yet.</p>
      </CCard>
    </div>
  );
}
