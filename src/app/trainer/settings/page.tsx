import { CCard } from "@/components/client/ui";
import { SignOutButton } from "@/components/SignOutButton";
import { requireTrainer } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireTrainer();

  const rows = [
    "Business Profile",
    "Notification Settings",
    "Calendar & Availability",
    "Exercise Library",
    "Food Database",
    "App Preferences",
    "Help & Support",
  ];

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

      <CCard className="!p-2">
        <ul className="divide-y divide-white/5">
          {rows.map((label) => (
            <li key={label} className="flex items-center gap-3 px-3 py-3.5 opacity-70">
              <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
              <span className="text-xs text-zinc-600">Soon</span>
            </li>
          ))}
        </ul>
      </CCard>

      <SignOutButton className="w-full rounded-2xl border border-red-500/30 px-5 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10" />
    </div>
  );
}
