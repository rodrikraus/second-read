import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { ScoreBadge } from "@/components/score-badge";
import { getQueue, type QueueReply } from "@/lib/data/review-queue";
import { getViewer } from "@/lib/data/viewer";
import { describeDay, formatTime, formatWait } from "@/lib/dates";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewQueuePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  if (viewer.leads.length === 0) {
    return (
      <Empty title="Reviewing is for team leads">
        Your own scores and the notes on them are in{" "}
        <Link href="/feedback" className="link link-primary">
          My feedback
        </Link>
        .
      </Empty>
    );
  }

  const queue = await getQueue(viewer);
  const reviewed = queue.sample.filter((r) => r.myScore !== null).length;
  const next = queue.sample.find((r) => r.myScore === null);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-base-content/70">{describeDay(queue.day)}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
      </header>

      {queue.sample.length + queue.others.length === 0 ? (
        <Empty title="Nothing went out yet">There are no replies on your brands to review.</Empty>
      ) : (
        <>
          <section className="rounded-box border border-base-300 bg-base-100">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-base-300 px-5 py-4">
              <div className="max-w-2xl space-y-1">
                <h2 className="font-semibold">The daily sample · {queue.sample.length}</h2>
                <p className="text-sm text-base-content/70">
                  Picked at random from everything that went out, and fixed: nobody can redraw it. Review these
                  first, so the numbers a brand sees aren&apos;t the worst replies someone happened to open.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular text-sm text-base-content/70">
                  {reviewed} of {queue.sample.length} reviewed
                </span>
                {next && (
                  <Link href={`/review/${next.id}`} className="btn btn-primary btn-sm">
                    {reviewed === 0 ? "Start reviewing" : "Continue"}
                  </Link>
                )}
              </div>
            </div>
            <ReplyList replies={queue.sample} />
          </section>

          {queue.others.length > 0 && (
            <section className="rounded-box border border-base-300 bg-base-100">
              <div className="space-y-1 border-b border-base-300 px-5 py-4">
                <h2 className="font-semibold">Everything else · {queue.others.length}</h2>
                <p className="text-sm text-base-content/70">Open any of these if something looks off.</p>
              </div>
              <ReplyList replies={queue.others} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReplyList({ replies }: { replies: QueueReply[] }) {
  if (replies.length === 0) {
    return <p className="px-5 py-6 text-sm text-base-content/70">No reply landed in the sample that day.</p>;
  }
  return (
    <ul className="divide-y divide-base-300">
      {replies.map((reply) => (
        <li key={reply.id}>
          <Link
            href={`/review/${reply.id}`}
            className="flex items-center gap-6 px-5 py-3 transition-colors hover:bg-base-200/60"
          >
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="flex items-center gap-2">
                <BrandChip slug={reply.brand.slug} name={reply.brand.name} />
                <span className="truncate font-medium">{reply.subject}</span>
              </span>
              <span className="block truncate text-sm text-base-content/70">
                {reply.customerName} · answered by {reply.specialistName}
              </span>
            </span>
            <span className="hidden shrink-0 text-sm text-base-content/70 md:block">
              {formatTime(reply.sentAt)} · after {formatWait(reply.customerWroteAt, reply.sentAt)}
            </span>
            <span className="w-28 shrink-0 text-right">
              {reply.myScore !== null ? (
                <ScoreBadge score={reply.myScore} />
              ) : (
                <span className="text-sm text-primary">Review →</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md rounded-box border border-dashed border-base-300 bg-base-100 px-8 py-12 text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-base-content/70">{children}</p>
    </div>
  );
}
