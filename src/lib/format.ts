export function formatScore(value: number | null): string {
  return value === null ? "–" : value.toFixed(1);
}

export function formatShare(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

// "▲ 0.4 on the 4 weeks before". Direction in words as well as the arrow.
export function describeChange(current: number | null, previous: number | null, unit: "score" | "share"): string | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  const size = unit === "score" ? Math.abs(diff).toFixed(1) : `${Math.round(Math.abs(diff) * 100)} pts`;
  if ((unit === "score" && Math.abs(diff) < 0.05) || (unit === "share" && Math.abs(diff) < 0.005)) {
    return "Level with the 4 weeks before";
  }
  return `${diff > 0 ? "▲ Up" : "▼ Down"} ${size} on the 4 weeks before`;
}
