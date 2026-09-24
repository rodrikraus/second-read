import { ScoreDot } from "@/components/score-dot";
import { scoreLevels, type Score } from "@/lib/scores";

// A score as a small pill: the coloured dot, the number, and its word.
export function ScoreBadge({ score }: { score: Score }) {
  const level = scoreLevels[score - 1];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-base-300">
      <ScoreDot score={score} />
      <span className="tabular">{score}</span>
      <span className="font-medium text-base-content/75">{level.label}</span>
    </span>
  );
}
