import "server-only";
import { recentAndPrevious, toMissRates, toWeekPoints, type Period } from "@/lib/data/brand-quality";
import type { BrandRef, Viewer } from "@/lib/data/viewer";
import type { Score, Severity } from "@/lib/scores";
import { createClient } from "@/lib/supabase/server";

export type FeedbackItem = {
  id: string;
  score: Score;
  note: string;
  inSample: boolean;
  reviewedAt: string;
  // First name of the lead who wrote it.
  lead: string;
  brand: BrandRef;
  reply: {
    subject: string;
    customerName: string;
    customerMessage: string;
    customerWroteAt: string;
    body: string;
    sentAt: string;
  };
  flags: { label: string; severity: Severity }[];
};

export type BrandSummary = { brand: BrandRef; recent: Period; previous: Period; topMiss: string | null };

export type Feedback = { summaries: BrandSummary[]; items: FeedbackItem[]; hasOlder: boolean };

const PAGE_SIZE = 20;

// A specialist's own reviews, newest first, and how they are doing on each
// brand they write for. Row level security already keeps other people's
// reviews out; the specialist_id filter says the same thing in the query.
export async function getMyFeedback(viewer: Viewer, page: number): Promise<Feedback> {
  const supabase = await createClient();

  const summaryFor = async (brand: BrandRef): Promise<BrandSummary> => {
    const [last4, last8, misses] = await Promise.all([
      supabase.rpc("weekly_scores", { p_brand_id: brand.id, p_specialist_id: viewer.personId, p_weeks: 4 }),
      supabase.rpc("weekly_scores", { p_brand_id: brand.id, p_specialist_id: viewer.personId, p_weeks: 8 }),
      supabase.rpc("criterion_miss_rates", { p_brand_id: brand.id, p_specialist_id: viewer.personId, p_weeks: 4 }),
    ]);
    for (const result of [last4, last8, misses]) {
      if (result.error) throw new Error(`Could not load your numbers on ${brand.name}: ${result.error.message}`);
    }
    return {
      brand,
      ...recentAndPrevious(toWeekPoints(last4.data ?? []), toWeekPoints(last8.data ?? [])),
      topMiss: toMissRates(misses.data ?? []).find((m) => m.recentMisses > 0)?.label ?? null,
    };
  };

  const from = (page - 1) * PAGE_SIZE;
  const [reviews, summaries] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        `id, score, note, selection, created_at, brand_id,
         reviewer:people(full_name),
         reply:replies!inner(subject, customer_name, customer_message, customer_wrote_at, body, sent_at, specialist_id),
         review_flags(criteria(label, severity))`,
      )
      .eq("reply.specialist_id", viewer.personId)
      .in("brand_id", viewer.writesFor.map((b) => b.id))
      .order("created_at", { ascending: false })
      .order("id")
      // One row more than a page, to know whether there is an older page.
      .range(from, from + PAGE_SIZE),
    Promise.all(viewer.writesFor.map(summaryFor)),
  ]);

  if (reviews.error) throw new Error(`Could not load your feedback: ${reviews.error.message}`);

  const brandById = new Map(viewer.writesFor.map((b) => [b.id, b]));
  const rows = reviews.data ?? [];

  return {
    summaries,
    hasOlder: rows.length > PAGE_SIZE,
    items: rows.slice(0, PAGE_SIZE).map((row) => ({
      id: row.id,
      score: row.score as Score,
      note: row.note,
      inSample: row.selection === "sample",
      reviewedAt: row.created_at,
      // A lead who has since left the brand is no longer visible to the specialist.
      lead: row.reviewer?.full_name.split(" ")[0] ?? "Your lead",
      brand: brandById.get(row.brand_id)!,
      reply: {
        subject: row.reply.subject,
        customerName: row.reply.customer_name,
        customerMessage: row.reply.customer_message,
        customerWroteAt: row.reply.customer_wrote_at,
        body: row.reply.body,
        sentAt: row.reply.sent_at,
      },
      flags: row.review_flags.flatMap((f) =>
        f.criteria ? [{ label: f.criteria.label, severity: f.criteria.severity as Severity }] : [],
      ),
    })),
  };
}
