"use client";

// Shown when a page inside the app fails to load, for example if the local
// database is down. Nothing the user saved is lost; they can try again.
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-box border border-error/30 bg-base-100 px-8 py-12 text-center">
      <h1 className="font-semibold">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-base-content/70">
        Nothing you saved is lost. If the local database is down, <code className="font-mono text-xs">npm run db:start</code>{" "}
        brings it back.
      </p>
      <button type="button" onClick={reset} className="btn btn-sm btn-primary mt-4">
        Try again
      </button>
    </div>
  );
}
