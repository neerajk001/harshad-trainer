import { Avatar, Badge, Card, SectionTitle } from "@/components/ui";
import { getClientProfile } from "@/lib/client-queries";
import { requireClient } from "@/lib/session";

export default async function ProfilePage() {
  const { user } = await requireClient();
  const profile = await getClientProfile(user.id);
  if (!profile) return <p className="p-4 text-sm">Profile not found.</p>;
  const since = new Date(profile.client.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <Card className="flex items-center gap-4">
        <Avatar name={profile.user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{profile.user.name}</h1>
          <p className="truncate text-sm text-zinc-500">{profile.user.email}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="green">{profile.client.status}</Badge>
            <Badge>Client since {since}</Badge>
          </div>
        </div>
      </Card>

      <section aria-label="Goal">
        <SectionTitle title="Goal" />
        <Card className="border-lime-200 bg-lime-50/60">
          <p className="text-[15px] font-medium leading-relaxed">{profile.client.goal ?? "No goal set yet — ask your trainer to add one."}</p>
        </Card>
      </section>

      <section aria-label="Details">
        <SectionTitle title="Details" />
        <Card className="!p-2">
          <dl className="divide-y divide-zinc-100 text-sm">
            {[
              ["Trainer", profile.trainer?.name ?? "—"],
              ["Status", profile.client.status],
              ["Email", profile.user.email],
              ["Member since", new Date(profile.client.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <dt className="text-zinc-500">{k}</dt>
                <dd className="truncate font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {profile.trainer ? (
        <section aria-label="Trainer">
          <SectionTitle title="Your trainer" />
          <Card className="flex items-center gap-3">
            <Avatar name={profile.trainer.name} size="md" />
            <div>
              <p className="font-semibold">{profile.trainer.name}</p>
              <p className="text-xs text-zinc-500">Assigned to your program and diet plan</p>
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
