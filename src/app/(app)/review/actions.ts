"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Saves the signed-in lead's review of one reply, then opens the next
// sampled reply to review, or comes back to this one when there is none.
// The database checks the rest: that the reply is on a brand this person
// leads, and that the criteria belong to that brand and are not retired.
export async function saveReview(replyId: string, nextId: string | null, formData: FormData) {
  if (!UUID.test(replyId)) redirect("/review");
  const page = `/review/${replyId}`;

  const score = Number(formData.get("score"));
  const note = String(formData.get("note") ?? "").trim();
  const criterionIds = formData.getAll("criterionId").map(String);

  if (!Number.isInteger(score) || score < 1 || score > 5) redirect(`${page}?error=no-score`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_review", {
    p_reply_id: replyId,
    p_score: score,
    p_note: note,
    p_criterion_ids: criterionIds,
  });
  if (error) redirect(`${page}?error=not-saved`);

  revalidatePath(page);
  const after = nextId && UUID.test(nextId) ? `/review/${nextId}` : page;
  redirect(`${after}?saved=1`);
}
