import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/data/viewer";

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
       brand:brands(id, slug, name, voice, procedures),
       specialist:people(full_name)`,
    )
    .eq("id", replyId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the reply: ${error.message}`);
  if (!reply?.brand || !viewer.leads.some((b) => b.id === reply.brand!.id)) return null;

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
    brand: reply.brand,
    specialistName: reply.specialist?.full_name ?? "Unknown",
  };
}
