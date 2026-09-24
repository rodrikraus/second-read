// Every time in this version is shown in UTC, and a day is a UTC calendar
// day. A team in Madrid sees "yesterday" end at 02:00 local time. Per-team
// time zones are on the list in DECISIONS.md.

const shortDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function formatShortDay(iso: string): string {
  return shortDay.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return clock.format(new Date(iso));
}

// How long the customer waited for this reply: "45 min", "3 h 10 min", "26 h".
export function formatWait(fromIso: string, toIso: string): string {
  const minutes = Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 10 || rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
