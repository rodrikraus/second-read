import type { Metadata } from "next";

export const metadata: Metadata = { title: "My feedback" };

export default function FeedbackPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">My feedback</h1>
      <p className="text-base-content/70">A specialist&apos;s scores and notes land in a later pull request.</p>
    </section>
  );
}
