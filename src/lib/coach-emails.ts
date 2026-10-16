/**
 * Who is allowed to sign in as a coach.
 *
 * There is no public sign-up. Coaches are recognised by their Google email.
 * The first time one of these emails signs in with Google, a trainer account is
 * provisioned automatically. Everyone else must already exist in `users`
 * (clients are added by a coach from the Clients screen).
 *
 * Override with a comma-separated COACH_EMAILS env var if needed.
 */
export const COACH_EMAILS: string[] = (
  process.env.COACH_EMAILS ?? "harshgorule24@gmail.com,neerajkushwaha0401@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isCoachEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return COACH_EMAILS.includes(email.toLowerCase().trim());
}
