import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { BrandStandard } from "@/components/brand-standard";
import { Conversation } from "@/components/conversation";
import { getReplyForReview } from "@/lib/data/review";
import { getViewer } from "@/lib/data/viewer";
import { formatShortDay, formatWait } from "@/lib/dates";

export const metadata: Metadata = { title: "Review a reply" };

export default async function ReviewReplyPage({ params }: PageProps<"/review/[replyId]">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  const { replyId } = await params;
  const reply = await getReplyForReview(viewer, replyId);
  if (!reply) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/review" className="text-sm text-base-content/70 hover:text-base-content">
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
            Not in the sample · a review would be kept out of the trend
          </span>
        )}
      </header>

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
  );
}
