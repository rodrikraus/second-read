import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandChip } from "@/components/brand-chip";
import { Conversation } from "@/components/conversation";
import { ScoreBadge } from "@/components/score-badge";
import { ScoreDot } from "@/components/score-dot";
import { SeverityDot } from "@/components/severity-dot";
import { getMyFeedback, type BrandSummary, type FeedbackItem } from "@/lib/data/feedback";
import { getViewer } from "@/lib/data/viewer";
import { formatShortDay } from "@/lib/dates";
import { describeChange, formatScore } from "@/lib/format";
import { nearestScore, severityLabel } from "@/lib/scores";

export const metadata: Metadata = { title: "My feedback" };

export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  if (viewer.writesFor.length === 0) {
    return (
      <Empty title="My feedback is for specialists">
        The replies you review are in the{" "}
        <Link href="/review" className="link link-primary">
          review queue
        </Link>
        .
      </Empty>
    );
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Math.floor(Number(pageParam)) || 1);
  const feedback = await getMyFeedback(viewer, page);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">My feedback</h1>
        <p className="max-w-2xl text-base-content/70">
          What your leads thought of your replies, newest first. Only you and the lead of each brand can see it. Your
          averages count the daily random sample only, not replies a lead picked out by hand.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {feedback.summaries.map((summary) => (
          <Summary key={summary.brand.id} summary={summary} />
        ))}
      </div>

      {feedback.items.length === 0 ? (
        <Empty title={page > 1 ? "No older reviews" : "No reviews yet"}>
          Every day your leads review a random sample of what went out. When they review one of yours, the score and
          their note show up here.
        </Empty>
      ) : (
        <ol className="space-y-4">
          {feedback.items.map((item) => (
            <li key={item.id}>
              <FeedbackCard item={item} />
            </li>
          ))}
        </ol>
      )}

      {(page > 1 || feedback.hasOlder) && (
        <nav aria-label="More reviews" className="flex justify-between">
          {page > 1 ? (
            <Link href={`/feedback?page=${page - 1}`} className="btn btn-ghost btn-sm font-normal">
              ← Newer reviews
            </Link>
          ) : (
            <span />
          )}
          {feedback.hasOlder && (
            <Link href={`/feedback?page=${page + 1}`} className="btn btn-ghost btn-sm font-normal">
              Older reviews →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Summary({ summary: { brand, recent, previous, topMiss } }: { summary: BrandSummary }) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 px-5 py-4">
      <BrandChip slug={brand.slug} name={brand.name} />
      <p className="mt-3 text-sm text-base-content/70">Your average, last 4 weeks</p>
      <p className="tabular flex items-center gap-2 text-2xl font-semibold tracking-tight">
        {recent.avg !== null && <ScoreDot score={nearestScore(recent.avg)} />}
        {formatScore(recent.avg)}
      </p>
      <p className="text-sm text-base-content/70">
        {recent.reviews === 0
          ? "No sampled reviews in the last 4 weeks"
          : (describeChange(recent.avg, previous.avg, "score") ?? `From ${recent.reviews} sampled reviews`)}
      </p>
      {recent.reviews > 0 && (
        <p className="mt-3 border-t border-base-300 pt-3 text-sm">
          <span className="text-base-content/70">Most often missed: </span>
          {topMiss ?? "nothing"}
        </p>
      )}
    </section>
  );
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <article className="space-y-3 rounded-box border border-base-300 bg-base-100 px-5 py-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ScoreBadge score={item.score} />
        <BrandChip slug={item.brand.slug} name={item.brand.name} />
        <h2 className="font-medium">{item.reply.subject}</h2>
        <p className="ml-auto text-xs text-base-content/70">
          Reviewed by {item.lead}, {formatShortDay(item.reviewedAt)}
          {!item.inSample && " · picked by hand, not in your average"}
        </p>
      </header>

      {item.flags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="What was off">
          {item.flags.map((flag) => (
            <li
              key={flag.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-base-300 px-2 py-0.5 text-xs"
            >
              <SeverityDot severity={flag.severity} />
              {flag.label}
              <span className="sr-only">({severityLabel[flag.severity]})</span>
            </li>
          ))}
        </ul>
      )}

      {item.note ? (
        <blockquote className="whitespace-pre-line border-l-2 border-primary/40 pl-4">{item.note}</blockquote>
      ) : (
        <p className="text-sm text-base-content/70">{item.lead} left no note.</p>
      )}

      <details>
        <summary className="cursor-pointer text-sm text-primary">Read your reply</summary>
        <div className="mt-3">
          <Conversation
            customerName={item.reply.customerName}
            customerMessage={item.reply.customerMessage}
            customerWroteAt={item.reply.customerWroteAt}
            specialistName="You"
            body={item.reply.body}
            sentAt={item.reply.sentAt}
          />
        </div>
      </details>
    </article>
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
