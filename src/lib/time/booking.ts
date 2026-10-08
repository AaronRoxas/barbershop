export function shopDate(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function appointmentTime(instant: string, timezone: string) {
  return new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "numeric", minute: "2-digit" }).format(new Date(instant));
}
export function appointmentDate(instant: string, timezone: string) {
  return new Intl.DateTimeFormat("en", { timeZone: timezone, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(instant));
}

export const TIME_PERIODS = [
  { id: "morning", label: "Morning", description: "Before 12pm" },
  { id: "afternoon", label: "Afternoon", description: "12pm–6pm" },
  { id: "night", label: "Night", description: "From 6pm" },
] as const;
export type TimePeriod = typeof TIME_PERIODS[number]["id"];
export function timePeriod(instant: string, timezone: string): TimePeriod {
  const hour = Number(new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(new Date(instant)));
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";
}
