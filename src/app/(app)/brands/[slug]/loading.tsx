import { SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading the brand's numbers">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-28" />
        <SkeletonLine className="h-7 w-40" />
        <SkeletonLine className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-2 rounded-box border border-base-300 bg-base-100 px-5 py-4">
            <SkeletonLine className="h-3.5 w-2/3" />
            <SkeletonLine className="h-7 w-16" />
            <SkeletonLine className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-box border border-base-300 bg-base-100" />
    </div>
  );
}
