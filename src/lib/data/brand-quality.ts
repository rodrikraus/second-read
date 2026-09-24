import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Severity } from "@/lib/scores";
import type { BrandRef, Viewer } from "@/lib/data/viewer";

export type WeekPoint = { week: string; reviews: number; avgScore: number; metStandard: number };

export type MissRate = {
  criterionId: string;
  label: string;
  severity: Severity;
  recentMisses: number;
  recentRate: number;
  previousRate: number | null;
};

export type SpecialistRow = {
  id: string;
  fullName: string;
  recentReviews: number;
  recentAvg: number | null;
  previousAvg: number | null;
  topMiss: string | null;
};

export type Period = { avg: number | null; metStandard: number | null; reviews: number };

export type BrandQuality = {
  brand: BrandRef;
  trend: WeekPoint[];
  recent: Period;
  previous: Period;
  coverage: { sampled: number; reviewed: number };
  misses: MissRate[];
  specialists: SpecialistRow[];
};

// The last 4 weeks and the 4 before them. The database decides where "last 4
// weeks" starts (private.weeks_back), so this only averages what it returns.
export function recentAndPrevious(last4: WeekPoint[], last8: WeekPoint[]): { recent: Period; previous: Period } {
  const recentWeeks = new Set(last4.map((p) => p.week));
  return { recent: summarise(last4), previous: summarise(last8.filter((p) => !recentWeeks.has(p.week))) };
}

// Weighted by the number of reviews in each week, so a quiet week does not
// count as much as a busy one.
export function summarise(points: WeekPoint[]): Period {
  const reviews = points.reduce((sum, p) => sum + p.reviews, 0);
  if (reviews === 0) return { avg: null, metStandard: null, reviews: 0 };
  return {
    avg: points.reduce((sum, p) => sum + p.avgScore * p.reviews, 0) / reviews,
    metStandard: points.reduce((sum, p) => sum + p.metStandard * p.reviews, 0) / reviews,
    reviews,
  };
}

export function toWeekPoints(rows: { week: string; reviews: number; avg_score: number; met_standard: number }[]): WeekPoint[] {
  return rows.map((row) => ({
    week: row.week,
    reviews: Number(row.reviews),
    avgScore: Number(row.avg_score),
    metStandard: Number(row.met_standard),
  }));
}

export function toMissRates(
  rows: {
    criterion_id: string;
    label: string;
    severity: string;
    recent_misses: number;
    recent_rate: number | null;
    previous_rate: number | null;
  }[],
): MissRate[] {
  return rows.map((row) => ({
    criterionId: row.criterion_id,
    label: row.label,
    severity: row.severity as Severity,
    recentMisses: Number(row.recent_misses),
    recentRate: Number(row.recent_rate ?? 0),
    previousRate: row.previous_rate === null ? null : Number(row.previous_rate),
  }));
}

// Everything on a brand's page. Only for brands the viewer leads; the
// functions underneath run under row level security either way.
export async function getBrandQuality(viewer: Viewer, slug: string): Promise<BrandQuality | null> {
  const brand = viewer.leads.find((b) => b.slug === slug);
  if (!brand) return null;

  const supabase = await createClient();
  const [trend, last4, last8, misses, specialists, coverage] = await Promise.all([
    supabase.rpc("weekly_scores", { p_brand_id: brand.id, p_weeks: 12 }),
    supabase.rpc("weekly_scores", { p_brand_id: brand.id, p_weeks: 4 }),
    supabase.rpc("weekly_scores", { p_brand_id: brand.id, p_weeks: 8 }),
    supabase.rpc("criterion_miss_rates", { p_brand_id: brand.id, p_weeks: 4 }),
    supabase.rpc("specialist_scores", { p_brand_id: brand.id, p_weeks: 4 }),
    supabase.rpc("sample_coverage", { p_brand_id: brand.id, p_weeks: 4 }).single(),
  ]);

  for (const result of [trend, last4, last8, misses, specialists, coverage]) {
    if (result.error) throw new Error(`Could not load ${brand.name}'s numbers: ${result.error.message}`);
  }

  const topMisses = await Promise.all(
    (specialists.data ?? []).map(async (s) => {
      const { data, error } = await supabase.rpc("criterion_miss_rates", {
        p_brand_id: brand.id,
        p_specialist_id: s.specialist_id,
        p_weeks: 4,
      });
      if (error) throw new Error(`Could not load ${brand.name}'s numbers: ${error.message}`);
      const top = toMissRates(data ?? []).find((m) => m.recentMisses > 0);
      return top?.label ?? null;
    }),
  );

  return {
    brand,
    trend: toWeekPoints(trend.data ?? []),
    ...recentAndPrevious(toWeekPoints(last4.data ?? []), toWeekPoints(last8.data ?? [])),
    coverage: {
      sampled: Number(coverage.data?.sampled_replies ?? 0),
      reviewed: Number(coverage.data?.reviewed ?? 0),
    },
    misses: toMissRates(misses.data ?? []).filter((m) => m.recentMisses > 0 || (m.previousRate ?? 0) > 0),
    specialists: (specialists.data ?? []).map((s, i) => ({
      id: s.specialist_id,
      fullName: s.full_name,
      recentReviews: Number(s.recent_reviews),
      recentAvg: s.recent_avg === null ? null : Number(s.recent_avg),
      previousAvg: s.previous_avg === null ? null : Number(s.previous_avg),
      topMiss: topMisses[i],
    })),
  };
}
