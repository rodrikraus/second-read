import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { BrandStandard } from "@/components/brand-standard";
import { Conversation } from "@/components/conversation";
import { SavedNotice } from "@/components/saved-notice";
import { getReplyForReview } from "@/lib/data/review";
import { getQueue } from "@/lib/data/review-queue";
import { getViewer } from "@/lib/data/viewer";
import { dayOf, formatShortDay, formatWait } from "@/lib/dates";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Review a reply" };

const errors: Record<string, string> = {
  "no-score": "Pick a score before saving.",
  "not-saved": "The review was not saved. Try again, or check this reply is on a brand you lead.",
};

export default async function ReviewReplyPage({ params, searchParams }: PageProps<"/review/[replyId]">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  const { replyId } = await params;
  const reply = await getReplyForReview(viewer, replyId);
  if (!reply) notFound();

  // The next reply in that day's sample the lead hasn't reviewed yet.
  const day = dayOf(reply.sentAt);
  const queue = await getQueue(viewer, day);
  const nextId = queue.sample.find((r) => r.myScore === null && r.id !== reply.id)?.id ?? null;

  const { saved, error } = await searchParams;
  const errorMessage = typeof error === "string" && Object.hasOwn(errors, error) ? errors[error] : null;

  return (
    <div className="space-y-6">
      <Link href={`/review?day=${day}`} className="text-sm text-base-content/70 hover:text-base-content">
        ← Review queue
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/70">
          <BrandChip slug={reply.brand.slug} name={reply.brand.name} />
          <span className="tabular">{reply.ticketRef}</span>
          <span>to {reply.customerName}</span>
          <span>by {reply.specialistName}</span>
          <span>
            sent {formatShortDay(reply.sentAt)}, after {formatWait(reply.customerWroteAt, reply.sentAt)}
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{reply.subject}</h1>
        {reply.inSample ? (
          <span className="inline-block rounded-full bg-primary/8 px-2.5 py-0.5 text-sm font-medium text-primary">
            In the daily sample
          </span>
        ) : (
          <span className="inline-block rounded-full bg-base-300/70 px-2.5 py-0.5 text-sm font-medium text-base-content/75">
            Not in the daily sample
          </span>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-6">
          <Conversation
            customerName={reply.customerName}
            customerMessage={reply.customerMessage}
            customerWroteAt={reply.customerWroteAt}
            specialistName={reply.specialistName}
            body={reply.body}
            sentAt={reply.sentAt}
          />
          <BrandStandard name={reply.brand.name} voice={reply.brand.voice} procedures={reply.brand.procedures} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          {saved === "1" && <SavedNotice />}
          {errorMessage && (
            <p role="alert" className="alert alert-error alert-soft text-sm">
              {errorMessage}
            </p>
          )}
          <div className="rounded-box border border-base-300 bg-base-100 p-5">
            {reply.myReview && (
              <p className="mb-4 text-sm text-base-content/70">
                You reviewed this on {formatShortDay(reply.myReview.updatedAt)}. Saving again updates it.
              </p>
            )}
            <ReviewForm reply={reply} nextId={nextId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
