// Every time in this version is shown in UTC, and a day is a UTC calendar
// day. A team in Madrid sees "yesterday" end at 02:00 local time. Per-team
// time zones are on the list in DECISIONS.md.

const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

// A calendar day as "YYYY-MM-DD".
export type Day = string;

export function isDay(value: unknown): value is Day {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function today(): Day {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(day: Day, amount: number): Day {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function dayOf(iso: string): Day {
  return new Date(iso).toISOString().slice(0, 10);
}

export function startOfDay(day: Day): string {
  return `${day}T00:00:00Z`;
}

// "Yesterday · Wednesday 23 September", or just the date for older days.
export function describeDay(day: Day): string {
  const date = longDay.format(new Date(startOfDay(day)));
  return day === addDays(today(), -1) ? `Yesterday · ${date}` : date;
}

export function formatShortDay(iso: string): string {
  return shortDay.format(new Date(iso));
}

// Labelled, so nobody reads a UTC time as their local one.
export function formatTime(iso: string): string {
  return `${clock.format(new Date(iso))} UTC`;
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
