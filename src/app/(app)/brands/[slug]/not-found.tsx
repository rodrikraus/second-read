import Link from "next/link";

// The same message whether the brand does not exist or someone else leads it.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-box border border-dashed border-base-300 bg-base-100 px-8 py-12 text-center">
      <h1 className="font-semibold">This is not one of your brands</h1>
      <p className="mt-2 text-sm text-base-content/70">
        Brand pages are open to the team lead of that brand.
      </p>
      <Link href="/" className="btn btn-sm btn-ghost mt-4">
        Back to your start page
      </Link>
    </div>
  );
}
