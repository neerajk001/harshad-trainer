export function MultiLineChart({
  series,
  height = 160,
  className = "",
}: {
  series: Array<{ name: string; values: number[]; color?: string }>;
  height?: number;
  className?: string;
}) {
  const colors = ["#f5c518", "#4ade80", "#60a5fa", "#f472b6"];
  const all = series.flatMap((s) => s.values);
  if (all.length === 0) return null;
  const w = 320;
  const h = height;
  const pad = 14;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const maxLen = Math.max(...series.map((s) => s.values.length), 2);
  const stepX = (w - pad * 2) / (maxLen - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" role="img" aria-label="Progress trends">
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={pad} x2={w - pad} y1={pad + t * (h - pad * 2)} y2={pad + t * (h - pad * 2)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {series.map((s, si) => {
        const color = s.color ?? colors[si % colors.length];
        const pts = s.values.map((v, i) => {
          const x = pad + i * stepX;
          const y = pad + (1 - (v - min) / span) * (h - pad * 2);
          return `${x.toFixed(1)} ${y.toFixed(1)}`;
        });
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {pts.map((p, i) => {
              const [x, y] = p.split(" ");
              return <circle key={i} cx={x} cy={y} r="2.5" fill="#0a0a0b" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
