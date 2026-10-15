import { auth } from "@/../auth";
import { Landing } from "@/components/marketing/landing";

export default async function Welcome() {
  const session = await auth();
  const dashboardHref = session?.user ? (session.user.role === "trainer" ? "/trainer" : "/client") : undefined;
  return <Landing dashboardHref={dashboardHref} />;
}
