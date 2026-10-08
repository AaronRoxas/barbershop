import { addDays, appointmentDate } from "@/lib/time/booking";

export function monthStart(date: string) { return `${date.slice(0, 7)}-01`; }
export function shiftMonth(date: string, offset: number) {
  const value = new Date(`${monthStart(date)}T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + offset);
  return value.toISOString().slice(0, 10);
}
export function monthDates(month: string) {
  const next = shiftMonth(month, 1);
  const days: string[] = [];
  for (let day = monthStart(month); day < next; day = addDays(day, 1)) days.push(day);
  return days;
}

type Props = {
  month: string; today: string; lastDate: string; selected: string;
  availableDates: Set<string>; loading: boolean;
  onMonthChange: (month: string) => void; onSelect: (date: string) => void;
};

export function BookingCalendar({ month, today, lastDate, selected, availableDates, loading, onMonthChange, onSelect }: Props) {
  const title = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}T12:00:00Z`));
  const days = monthDates(month);
  const padding = new Date(`${days[0]}T12:00:00Z`).getUTCDay();
  const cells = [...Array<string | null>(padding).fill(null), ...days];
  while (cells.length % 7) cells.push(null);
  return <div className="booking-calendar">
    <div className="calendar-header"><button type="button" aria-label="Previous month" disabled={loading || month <= monthStart(today)} onClick={() => onMonthChange(shiftMonth(month, -1))}>←</button>
      <h3 aria-live="polite">{title}</h3><button type="button" aria-label="Next month" disabled={loading || shiftMonth(month, 1) > lastDate} onClick={() => onMonthChange(shiftMonth(month, 1))}>→</button></div>
    <table><caption className="sr-only">Choose an available appointment date in {title}</caption>
      <thead><tr>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <th key={day} scope="col"><abbr title={{ Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" }[day]}>{day}</abbr></th>)}</tr></thead>
      <tbody>{Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>{cells.slice(row * 7, row * 7 + 7).map((day, column) => <td key={day || `blank-${column}`}>
        {day && <button type="button" data-date={day} aria-label={appointmentDate(`${day}T12:00:00Z`, "UTC")}
          aria-pressed={selected === day} aria-current={day === today ? "date" : undefined}
          disabled={loading || day < today || day > lastDate || !availableDates.has(day)} onClick={() => onSelect(day)}>{Number(day.slice(8))}</button>}
      </td>)}</tr>)}</tbody>
    </table><p className="fine-print calendar-help">Select an available day. Unavailable dates are dimmed.</p>
  </div>;
}
