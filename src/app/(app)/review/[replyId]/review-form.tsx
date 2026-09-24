import { saveReview } from "@/app/(app)/review/actions";
import { ScoreDot } from "@/components/score-dot";
import { SubmitButton } from "@/components/submit-button";
import type { ReplyForReview } from "@/lib/data/review";
import { scoreLevels, severityLabel } from "@/lib/scores";

const severityDot = {
  critical: "bg-error",
  major: "bg-warning",
  minor: "bg-base-content/30",
} as const;

// A plain HTML form: a score, the criteria the reply missed, and a note to
// the specialist. It posts to the saveReview server action.
// nextId is the next sampled reply still to review that day, if any.
export function ReviewForm({ reply, nextId }: { reply: ReplyForReview; nextId: string | null }) {
  const mine = reply.myReview;
  const specialist = reply.specialistName.split(" ")[0];

  return (
    <form action={saveReview.bind(null, reply.id, nextId)} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold">How good was it?</legend>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {scoreLevels.map((level) => (
            <label
              key={level.score}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-field border border-base-300 px-1 py-2 text-center text-base-content/75 hover:border-base-content/40 has-[:checked]:border-base-content has-[:checked]:bg-base-200 has-[:checked]:text-base-content has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name="score"
                value={level.score}
                defaultChecked={mine?.score === level.score}
                required
                className="sr-only"
              />
              <span className="flex items-center gap-1.5">
                <ScoreDot score={level.score} />
                <span className="tabular text-lg font-semibold leading-none">{level.score}</span>
              </span>
              <span className="text-[0.6875rem] font-medium leading-tight">{level.label}</span>
            </label>
          ))}
        </div>
        <dl className="mt-3 space-y-0.5 text-xs text-base-content/70">
          {scoreLevels.map((level) => (
            <div key={level.score}>
              <dt className="inline font-medium text-base-content/85">{level.score}:</dt>{" "}
              <dd className="inline">{level.meaning}</dd>
            </div>
          ))}
        </dl>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">What was off?</legend>
        <p className="text-xs text-base-content/70">Tick only what it missed. Leave all clear for a clean reply.</p>
        <ul className="mt-3 space-y-1">
          {reply.criteria.map((criterion) => (
            <li key={criterion.id}>
              <label className="flex cursor-pointer gap-3 rounded-field px-2 py-1.5 hover:bg-base-200">
                <input
                  type="checkbox"
                  name="criterionId"
                  value={criterion.id}
                  defaultChecked={mine?.flaggedIds.includes(criterion.id)}
                  className="checkbox checkbox-sm mt-0.5"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm">
                    {criterion.label}
                    <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${severityDot[criterion.severity]}`} />
                    <span className="sr-only">({severityLabel[criterion.severity]})</span>
                  </span>
                  {criterion.guidance && (
                    <span className="block text-xs text-base-content/70">{criterion.guidance}</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label htmlFor="note" className="text-sm font-semibold">
          Note to {specialist}
        </label>
        <p className="text-xs text-base-content/70">{specialist} reads this. Say what to keep doing or do differently.</p>
        <textarea id="note" name="note" rows={4} defaultValue={mine?.note ?? ""} className="textarea mt-2 w-full text-sm" />
      </div>

      <SubmitButton>{nextId ? "Save and next" : mine ? "Update review" : "Save review"}</SubmitButton>
    </form>
  );
}
