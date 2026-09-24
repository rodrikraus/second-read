// A sheet with one line marked: somebody read it twice.
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight">
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
        <rect x="2.5" y="1.5" width="15" height="17" rx="3" className="fill-base-100 stroke-base-content" strokeWidth="1.5" />
        <path d="M6 6.5h8M6 13.5h5" className="stroke-base-content/40" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 10h8" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>Second Read</span>
    </span>
  );
}
