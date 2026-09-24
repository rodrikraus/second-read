import { SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading your feedback">
      <div className="space-y-2">
        <SkeletonLine className="h-7 w-40" />
        <SkeletonLine className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-box border border-base-300 bg-base-100 px-5 py-4">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-7 w-14" />
            <SkeletonLine className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-box border border-base-300 bg-base-100 px-5 py-4">
          <SkeletonLine className="h-5 w-1/2" />
          <SkeletonLine className="h-3.5 w-full" />
          <SkeletonLine className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}
