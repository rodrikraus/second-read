import type { Score } from "@/lib/scores";

// Full class names, so Tailwind can see every one of them.
const colour = {
  1: "bg-score-1",
  2: "bg-score-2",
  3: "bg-score-3",
  4: "bg-score-4",
  5: "bg-score-5",
} as const;

// The colour of a score lives in this dot; the number and label stay in ink.
export function ScoreDot({ score }: { score: Score }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${colour[score]}`} />;
}
