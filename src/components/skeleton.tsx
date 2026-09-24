// A grey bar shaped like the content that is about to arrive, so the page
// doesn't jump when it does.
export function SkeletonLine({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-field bg-base-300/70 ${className}`} />;
}
