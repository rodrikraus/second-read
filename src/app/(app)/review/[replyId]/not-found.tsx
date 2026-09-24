import Link from "next/link";

// Deliberately the same message whether the reply does not exist or belongs
// to a brand you do not lead: the page should not confirm which.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-box border border-dashed border-base-300 bg-base-100 px-8 py-12 text-center">
      <h1 className="font-semibold">This reply is not in your queue</h1>
      <p className="mt-2 text-sm text-base-content/65">
        It may be on a brand you do not lead, or the link is wrong.
      </p>
      <Link href="/review" className="btn btn-sm btn-ghost mt-4">
        Back to the queue
      </Link>
    </div>
  );
}
