import "server-only";
import { addDays, dayOf, isDay, startOfDay, today, type Day } from "@/lib/dates";
import type { Score } from "@/lib/scores";
import { createClient } from "@/lib/supabase/server";
import type { BrandRef, Viewer } from "@/lib/data/viewer";

export type QueueReply = {
  id: string;
  brand: BrandRef;
  specialistName: string;
  subject: string;
  customerName: string;
  customerWroteAt: string;
  sentAt: string;
  // This lead's score, if they already reviewed it.
  myScore: Score | null;
};

export type Queue = {
  day: Day;
  sample: QueueReply[];
  others: QueueReply[];
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Everything sent on one day on the brands this lead leads, the daily sample
// first. Without a day it opens on the last day anything went out: yesterday
// on a normal morning, Friday on a Monday.
export async function getQueue(viewer: Viewer, requestedDay?: string): Promise<Queue> {
  const supabase = await createClient();
  const brandIds = viewer.leads.map((b) => b.id);
  const day = isDay(requestedDay) ? requestedDay : await lastDayWithReplies(supabase, brandIds);

  const { data, error } = await supabase
    .from("replies")
    .select(
      "id, brand_id, subject, customer_name, customer_wrote_at, sent_at, in_sample, specialist:people(full_name), reviews(score, reviewer_id)",
    )
    .in("brand_id", brandIds)
    .gte("sent_at", startOfDay(day))
    .lt("sent_at", startOfDay(addDays(day, 1)))
    .order("sent_at");

  if (error) throw new Error(`Could not load the review queue: ${error.message}`);

  const brandById = new Map(viewer.leads.map((b) => [b.id, b]));
  const rows = data ?? [];
  const toReply = (row: (typeof rows)[number]): QueueReply => ({
    id: row.id,
    brand: brandById.get(row.brand_id)!,
    specialistName: row.specialist?.full_name ?? "Unknown",
    subject: row.subject,
    customerName: row.customer_name,
    customerWroteAt: row.customer_wrote_at,
    sentAt: row.sent_at,
    myScore: (row.reviews.find((r) => r.reviewer_id === viewer.personId)?.score ?? null) as Score | null,
  });

  return {
    day,
    sample: rows.filter((row) => row.in_sample).map(toReply),
    others: rows.filter((row) => !row.in_sample).map(toReply),
  };
}

async function lastDayWithReplies(supabase: Supabase, brandIds: string[]): Promise<Day> {
  const { data } = await supabase
    .from("replies")
    .select("sent_at")
    .in("brand_id", brandIds)
    .lt("sent_at", startOfDay(today()))
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? dayOf(data.sent_at) : addDays(today(), -1);
}
