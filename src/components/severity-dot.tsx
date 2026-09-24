import type { Severity } from "@/lib/scores";

// Full class names, so Tailwind can see every one of them.
const colour = {
  critical: "bg-error",
  major: "bg-warning",
  minor: "bg-base-content/30",
} as const;

// How much missing a point of the brand standard costs. The dot is only
// colour; wherever it appears, the severity is also written for screen readers.
export function SeverityDot({ severity }: { severity: Severity }) {
  return <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${colour[severity]}`} />;
}
