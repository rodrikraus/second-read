import type { WeekPoint } from "@/lib/data/brand-quality";

const W = 720;
const H = 220;
const PAD = { top: 12, right: 44, bottom: 28, left: 28 };
// With fewer sampled reviews than this in a week, the average is mostly noise.
const THIN_WEEK = 5;

const weekLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function y(score: number) {
  return PAD.top + ((5 - score) / 4) * (H - PAD.top - PAD.bottom);
}

// The weekly average of sampled scores as one line, drawn on the server with
// no JavaScript. Hovering a point shows its week, value and how many reviews
// it comes from; the same numbers are in the table underneath.
export function TrendChart({ points, title }: { points: WeekPoint[]; title: string }) {
  const width = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (points.length === 1 ? width / 2 : (i / (points.length - 1)) * width);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.avgScore).toFixed(1)}`).join(" ");
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <figure className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        {[1, 2, 3, 4, 5].map((score) => (
          <g key={score}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(score)} y2={y(score)} className="stroke-base-300" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(score)} dy="0.32em" textAnchor="end" className="tabular fill-base-content/60 text-[11px]">
              {score}
            </text>
          </g>
        ))}
        <text x={W - PAD.right + 6} y={y(4)} dy="0.32em" className="fill-base-content/60 text-[11px]">
          Good
        </text>

        {points.map(
          (p, i) =>
            (i % labelEvery === 0 || i === points.length - 1) && (
              <text key={p.week} x={x(i)} y={H - 8} textAnchor="middle" className="fill-base-content/60 text-[11px]">
                {weekLabel.format(new Date(p.week))}
              </text>
            ),
        )}

        <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={p.week}>
            <circle
              cx={x(i)}
              cy={y(p.avgScore)}
              r={4}
              strokeWidth={2}
              className={p.reviews < THIN_WEEK ? "fill-base-100 stroke-primary" : "fill-primary stroke-base-100"}
            />
            {/* A bigger invisible circle, so the hover target is easy to hit. */}
            <circle cx={x(i)} cy={y(p.avgScore)} r={12} fill="transparent">
              <title>{`Week of ${weekLabel.format(new Date(p.week))}: ${p.avgScore.toFixed(1)} from ${p.reviews} sampled reviews`}</title>
            </circle>
          </g>
        ))}
      </svg>

      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/70">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" /> Weekly average, sampled reviews only
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full border-2 border-primary" /> Fewer than {THIN_WEEK} reviews
          that week
        </span>
      </figcaption>

      <details className="text-sm">
        <summary className="cursor-pointer text-base-content/70 hover:text-base-content">Show the numbers</summary>
        <table className="table table-sm mt-2 max-w-lg">
          <thead>
            <tr>
              <th>Week of</th>
              <th className="text-right">Sampled reviews</th>
              <th className="text-right">Average</th>
              <th className="text-right">Scored 4 or 5</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {points.map((p) => (
              <tr key={p.week}>
                <td>{weekLabel.format(new Date(p.week))}</td>
                <td className="text-right">{p.reviews}</td>
                <td className="text-right">{p.avgScore.toFixed(2)}</td>
                <td className="text-right">{Math.round(p.metStandard * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
