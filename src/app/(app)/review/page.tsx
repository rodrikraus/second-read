import type { Metadata } from "next";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
      <p className="text-base-content/70">The review queue lands in the next pull request.</p>
    </section>
  );
}
