// The words every lead scores against. They sit next to the buttons, because
// a 3 only means the same thing across leads if everyone reads the same
// sentence before picking it.
export const scoreLevels = [
  { score: 1, label: "Harmful", meaning: "Told the customer something wrong, or would cost us the account." },
  { score: 2, label: "Poor", meaning: "Missed the brand's procedure or the customer's actual question." },
  { score: 3, label: "Acceptable", meaning: "Correct, but the customer may well have to write back." },
  { score: 4, label: "Good", meaning: "Correct, sounds like the brand, and resolves the ticket." },
  { score: 5, label: "Exemplary", meaning: "What we would show a new joiner." },
] as const;

export type Score = (typeof scoreLevels)[number]["score"];

export const severityLabel = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
} as const;

export type Severity = keyof typeof severityLabel;
