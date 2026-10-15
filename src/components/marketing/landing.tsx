import Link from "next/link";

export function Landing({ dashboardHref }: { dashboardHref?: string }) {
  const loggedIn = Boolean(dashboardHref);
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink text-zinc-100">
      {/* Ambient hero */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-gold/20 blur-[120px]" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div
          className="absolute inset-x-0 top-0 h-[62%]"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, rgba(245,197,24,0.16) 0%, rgba(10,10,11,0) 60%), linear-gradient(180deg, #111114 0%, #0a0a0b 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 7h14M5 12h9M5 17h5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Repora</span>
          </div>
          <Link
            href={dashboardHref ?? "/login"}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            {loggedIn ? "Dashboard" : "Log in"}
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Personal Training &amp; Nutrition</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight">
            Stronger People <span className="text-gold">Everyday</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
            Personalized training, nutrition and guidance to help you build a stronger, healthier and more confident you.
          </p>

          <Link
            href={dashboardHref ?? "/inquiry"}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-4 text-base font-semibold text-zinc-950 transition hover:brightness-95 active:scale-[0.99]"
          >
            {loggedIn ? "Go to Dashboard" : "Start Your Transformation"}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "R", "P", "S"].map((c, i) => (
                <span
                  key={c}
                  className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink text-xs font-semibold text-zinc-950"
                  style={{ background: ["#f5c518", "#4ade80", "#60a5fa", "#f472b6"][i] }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="text-xs">
              <p className="font-semibold text-zinc-200">50+ clients transformed</p>
              <p className="text-amber-400">★★★★★ 5.0 rating</p>
            </div>
          </div>
        </div>

        <p className="pb-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
          Train Better. Live Better.
        </p>
      </div>
    </div>
  );
}
