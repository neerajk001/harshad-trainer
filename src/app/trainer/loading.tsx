export default function Loading() {
  const sk = "animate-pulse rounded-xl bg-zinc-800/50";
  return (
    <div className="space-y-5">
      <div className={`${sk} h-8 w-64`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`${sk} h-24`} />
        <div className={`${sk} h-24`} />
        <div className={`${sk} h-24`} />
        <div className={`${sk} h-24`} />
      </div>
      <div className={`${sk} h-56`} />
    </div>
  );
}
