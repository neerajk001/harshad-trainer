import { CCard } from "@/components/client/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { requireTrainer } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireTrainer();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <CCard>
        <p className="text-sm font-semibold">Account</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="truncate font-medium">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd className="font-medium capitalize">{user.role}</dd>
          </div>
        </dl>
      </CCard>

      <SignOutButton className="w-full rounded-lg border border-red-500/30 px-5 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" />
    </div>
  );
}
