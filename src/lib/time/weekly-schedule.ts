export type WeeklyHour = { weekday: number; opens_at: string; closes_at: string };
export type Period = { id: string; start: string; end: string };
export type ScheduleDay = { open: boolean; periods: Period[] };
export const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export const sortPeriods = (periods: Period[]) => [...periods].sort((a, b) => a.start.localeCompare(b.start));
export function scheduleFromHours(hours: WeeklyHour[]): ScheduleDay[] {
  return Array.from({ length: 7 }, (_, day) => {
    const periods = hours.filter((h) => h.weekday === day + 1).map((h, index) => ({ id: `${day}-${index}`, start: h.opens_at.slice(0, 5), end: h.closes_at.slice(0, 5) }));
    return { open: periods.length > 0, periods: periods.length ? sortPeriods(periods) : [{ id: `${day}-default`, start: "09:00", end: "18:00" }] };
  });
}
export function dayError(day: ScheduleDay): string | undefined {
  if (!day.open) return;
  if (!day.periods.length) return "Add at least one working period.";
  const periods = sortPeriods(day.periods);
  if (periods.some((p) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.end))) return "Choose valid start and end times.";
  if (periods.some((p) => p.start >= p.end)) return "End must be after start. Split overnight hours across calendar days.";
  if (periods.some((p, index) => index > 0 && periods[index - 1].end > p.start)) return "Working periods overlap. Adjust their start or end times.";
  if (periods.length > 10) return "Use no more than 10 working periods per day.";
}
export const serializeDay = (day: ScheduleDay) => day.open ? sortPeriods(day.periods).map((p) => `${p.start}-${p.end}`).join(", ") : "";
export const scheduleSignature = (days: ScheduleDay[]) => JSON.stringify(days.map(serializeDay));
export function splitPeriod(period: Period, id: string): Period[] {
  const middle = Math.floor((toMinutes(period.start) + toMinutes(period.end)) / 2);
  return [{ ...period, end: toTime(middle - 15) }, { id, start: toTime(middle + 15), end: period.end }];
}
