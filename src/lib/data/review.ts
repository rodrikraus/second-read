import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Severity } from "@/lib/scores";
import type { Viewer } from "@/lib/data/viewer";

export type Criterion = {
  id: string;
  label: string;
  guidance: string;
  severity: Severity;
};

export type ReplyForReview = {
  id: string;
  subject: string;
  ticketRef: string;
  customerName: string;
  customerMessage: string;
  customerWroteAt: string;
  body: string;
  sentAt: string;
  inSample: boolean;
  brand: { id: string; slug: string; name: string; voice: string; procedures: string };
  specialistName: string;
  // The brand's criteria still in use, in the brand's order.
  criteria: Criterion[];
  // This lead's review of the reply, if they already wrote one.
  myReview: { score: number; note: string; flaggedIds: string[]; updatedAt: string } | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One reply with what a lead needs to judge it. Returns null when the reply
// does not exist, is hidden by row level security, or belongs to a brand this
// person does not lead: all three look the same from outside.
export async function getReplyForReview(viewer: Viewer, replyId: string): Promise<ReplyForReview | null> {
  if (!UUID.test(replyId)) return null;

  const supabase = await createClient();
  const { data: reply, error } = await supabase
    .from("replies")
    .select(
      `id, subject, ticket_ref, customer_name, customer_message, customer_wrote_at, body, sent_at, in_sample,
       brand:brands(id, slug, name, voice, procedures,
         criteria(id, label, guidance, severity, position, retired_at)),
       specialist:people(full_name),
       reviews(score, note, reviewer_id, updated_at, review_flags(criterion_id))`,
    )
    .eq("id", replyId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the reply: ${error.message}`);
  if (!reply?.brand || !viewer.leads.some((b) => b.id === reply.brand!.id)) return null;

  const { criteria, ...brand } = reply.brand;
  const mine = reply.reviews.find((r) => r.reviewer_id === viewer.personId);

  return {
    id: reply.id,
    subject: reply.subject,
    ticketRef: reply.ticket_ref,
    customerName: reply.customer_name,
    customerMessage: reply.customer_message,
    customerWroteAt: reply.customer_wrote_at,
    body: reply.body,
    sentAt: reply.sent_at,
    inSample: Boolean(reply.in_sample),
    brand,
    specialistName: reply.specialist?.full_name ?? "Unknown",
    criteria: criteria
      .filter((c) => c.retired_at === null)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, label: c.label, guidance: c.guidance, severity: c.severity as Severity })),
    myReview: mine
      ? {
          score: mine.score,
          note: mine.note,
          flaggedIds: mine.review_flags.map((f) => f.criterion_id),
          updatedAt: mine.updated_at,
        }
      : null,
  };
}
