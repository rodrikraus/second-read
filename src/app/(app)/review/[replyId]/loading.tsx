import { SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading the reply">
      <SkeletonLine className="h-4 w-32" />
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-80 max-w-full" />
        <SkeletonLine className="h-7 w-96 max-w-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-3 rounded-box border border-base-300 bg-base-100 px-7 py-6">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonLine key={i} className={`h-3.5 ${i % 3 === 2 ? "w-1/2" : "w-full"}`} />
          ))}
        </div>
        <div className="h-80 rounded-box border border-base-300 bg-base-100" />
      </div>
    </div>
  );
}
