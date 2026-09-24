import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ScoreDot } from "@/components/score-dot";
import { StatTile } from "@/components/stat-tile";
import { TrendChart } from "@/components/trend-chart";
import { getBrandQuality, type MissRate, type SpecialistRow } from "@/lib/data/brand-quality";
import { getViewer } from "@/lib/data/viewer";
import { describeChange, formatScore, formatShare } from "@/lib/format";
import { severityLabel, type Score } from "@/lib/scores";

export const metadata: Metadata = { title: "Brand quality" };

// Below this share of the sample reviewed, the trend leans on whatever got opened.
const COVERAGE_FLOOR = 0.6;

const severityDot = { critical: "bg-error", major: "bg-warning", minor: "bg-base-content/30" } as const;

// The score level an average rounds to, for its colour dot.
function nearestScore(average: number): Score {
  return Math.min(5, Math.max(1, Math.round(average))) as Score;
}

export default async function BrandPage({ params }: PageProps<"/brands/[slug]">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  const { slug } = await params;
  const quality = await getBrandQuality(viewer, slug);
  if (!quality) notFound();

  const { brand, recent, previous, coverage, trend } = quality;
  const coverageShare = coverage.sampled > 0 ? coverage.reviewed / coverage.sampled : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-base-content/70">Brand quality</p>
        <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
        <p className="max-w-2xl text-base-content/70">
          What you can put in front of {brand.name}. Every number here comes from the daily random sample, never
          from replies someone picked because they looked wrong.
        </p>
      </header>

      {trend.length === 0 ? (
        <div className="mx-auto max-w-md rounded-box border border-dashed border-base-300 bg-base-100 px-8 py-12 text-center">
          <h2 className="font-semibold">No sampled reviews yet</h2>
          <p className="mt-2 text-sm text-base-content/70">
            Once the daily sample for {brand.name} starts getting reviewed, the trend shows up here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Average score, last 4 weeks"
              value={formatScore(recent.avg)}
              detail={describeChange(recent.avg, previous.avg, "score") ?? `${recent.reviews} sampled reviews`}
            />
            <StatTile
              label="Scored 4 or 5, last 4 weeks"
              value={formatShare(recent.metStandard)}
              detail={describeChange(recent.metStandard, previous.metStandard, "share") ?? undefined}
            />
            <StatTile
              label="Sample reviewed, last 4 weeks"
              value={formatShare(coverageShare)}
              detail={`${coverage.reviewed} of ${coverage.sampled} sampled replies`}
              warning={
                coverageShare !== null && coverageShare < COVERAGE_FLOOR
                  ? "Too little of the sample was reviewed for the average to mean much."
                  : undefined
              }
            />
          </div>

          <section aria-labelledby="trend-heading" className="rounded-box border border-base-300 bg-base-100 px-5 py-5">
            <h2 id="trend-heading" className="mb-4 font-semibold">Weekly average score</h2>
            <TrendChart points={trend} title={`${brand.name}: weekly average score of sampled replies`} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="misses-heading" className="rounded-box border border-base-300 bg-base-100">
              <div className="border-b border-base-300 px-5 py-4">
                <h2 id="misses-heading" className="font-semibold">What keeps going wrong</h2>
                <p className="text-sm text-base-content/70">Share of sampled replies that missed each point, last 4 weeks.</p>
              </div>
              <MissList misses={quality.misses} />
            </section>

            <section aria-labelledby="specialists-heading" className="rounded-box border border-base-300 bg-base-100">
              <div className="border-b border-base-300 px-5 py-4">
                <h2 id="specialists-heading" className="font-semibold">By specialist</h2>
                <p className="text-sm text-base-content/70">Sampled replies on {brand.name} only, last 4 weeks.</p>
              </div>
              <SpecialistTable rows={quality.specialists} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function MissList({ misses }: { misses: MissRate[] }) {
  if (misses.length === 0) {
    return <p className="px-5 py-6 text-sm text-base-content/70">Nothing flagged in the sample for 8 weeks.</p>;
  }

  return (
    <ul className="divide-y divide-base-300">
      {misses.map((miss) => (
        <li key={miss.criterionId} className="space-y-2 px-5 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${severityDot[miss.severity]}`} />
              {miss.label}
              <span className="sr-only">({severityLabel[miss.severity]})</span>
            </span>
            <span className="tabular shrink-0 text-sm font-semibold">{formatShare(miss.recentRate)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-base-200" aria-hidden="true">
            <div className="h-1.5 rounded-full bg-base-content/70" style={{ width: `${miss.recentRate * 100}%` }} />
          </div>
          {miss.previousRate !== null && (
            <p className="tabular text-xs text-base-content/70">
              {miss.recentRate > miss.previousRate + 0.005
                ? `▲ Up from ${formatShare(miss.previousRate)}`
                : miss.recentRate < miss.previousRate - 0.005
                  ? `▼ Down from ${formatShare(miss.previousRate)}`
                  : `Level with ${formatShare(miss.previousRate)}`}{" "}
              the 4 weeks before
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function SpecialistTable({ rows }: { rows: SpecialistRow[] }) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-base-content/70">No sampled reviews in the last 8 weeks.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr className="text-xs">
            <th>Specialist</th>
            <th className="text-right">Reviews</th>
            <th className="text-right">Average</th>
            <th className="text-right">Before</th>
            <th>Most often missed</th>
          </tr>
        </thead>
        <tbody className="tabular text-sm">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="font-medium">{row.fullName}</td>
              <td className="text-right">{row.recentReviews}</td>
              <td className="text-right">
                <span className="inline-flex items-center gap-1.5">
                  {row.recentAvg !== null && (
                    <ScoreDot score={nearestScore(row.recentAvg)} />
                  )}
                  {formatScore(row.recentAvg)}
                </span>
              </td>
              <td className="text-right text-base-content/70">{formatScore(row.previousAvg)}</td>
              <td className="text-base-content/75">{row.topMiss ?? "Nothing"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
