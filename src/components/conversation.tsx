import { formatTime } from "@/lib/dates";

// The customer's message and the reply that went out. The reply is set in the
// serif on a white sheet: it is the thing under review, not part of the tool.
export function Conversation({
  customerName,
  customerMessage,
  customerWroteAt,
  specialistName,
  body,
  sentAt,
}: {
  customerName: string;
  customerMessage: string;
  customerWroteAt: string;
  specialistName: string;
  body: string;
  sentAt: string;
}) {
  return (
    <div className="space-y-4">
      <figure className="rounded-box border border-base-300 bg-base-200/60 px-5 py-4">
        <figcaption className="mb-2 flex items-baseline justify-between text-xs text-base-content/70">
          <span className="font-medium text-base-content/75">{customerName} wrote</span>
          <time className="tabular" dateTime={customerWroteAt}>{formatTime(customerWroteAt)}</time>
        </figcaption>
        <p className="whitespace-pre-line text-base-content/85">{customerMessage}</p>
      </figure>

      <figure className="rounded-box border border-base-300 bg-base-100 px-7 py-6 shadow-[0_1px_2px_oklch(0%_0_0/0.04)]">
        <figcaption className="mb-4 flex items-baseline justify-between text-xs text-base-content/70">
          <span className="font-medium text-base-content/75">{specialistName} replied</span>
          <time className="tabular" dateTime={sentAt}>{formatTime(sentAt)}</time>
        </figcaption>
        <div className="max-w-[62ch] whitespace-pre-line font-serif text-reading text-base-content">{body}</div>
      </figure>
    </div>
  );
}
