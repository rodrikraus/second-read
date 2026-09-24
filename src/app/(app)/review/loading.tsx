import { SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading the review queue">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-56" />
        <SkeletonLine className="h-7 w-28" />
      </div>
      <div className="rounded-box border border-base-300 bg-base-100">
        <div className="space-y-2 border-b border-base-300 px-5 py-4">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-3 w-3/5" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2 border-b border-base-300 px-5 py-4 last:border-0">
            <SkeletonLine className="h-4 w-2/5" />
            <SkeletonLine className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
