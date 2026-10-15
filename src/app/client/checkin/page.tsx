import { CheckinForm } from "@/components/client/checkin-form";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { weekProgress } from "@/lib/client-utils";

export default async function CheckinPage() {
  const { client } = await requireClient();
  const data = await getClientDashboard(client.id);
  const latest = data.checkins[0];
  const wp = data.wAssign ? weekProgress(data.wAssign.assignment.startDate, data.wAssign.program.durationWeeks) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {wp ? `Week ${wp.week} check-in` : "Weekly check-in"} · {new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
        </p>
      </div>
      <CheckinForm defaultWeight={latest?.weight ?? null} />
    </div>
  );
}
