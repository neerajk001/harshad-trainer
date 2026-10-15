import { EmptyState } from "@/components/client/ui";
import { TabLinks } from "@/components/client/tab-links";
import { CheckinForm } from "@/components/client/checkin-form";
import { getClientDashboard } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";
import { weekProgress } from "@/lib/client-utils";

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { client } = await requireClient();
  const sp = await searchParams;
  const tab = sp.tab === "photos" ? "photos" : "weekly";
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

      <TabLinks
        activeKey={tab}
        tabs={[
          { key: "weekly", label: "Weekly" },
          { key: "photos", label: "Photos" },
        ]}
      />

      {tab === "weekly" ? (
        <CheckinForm defaultWeight={latest?.weight ?? null} />
      ) : (
        <EmptyState title="Photos coming soon" hint="Progress photo uploads aren't part of this MVP yet." />
      )}
    </div>
  );
}
