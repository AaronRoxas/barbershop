"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AdminForm } from "@/components/admin/form";
import { Hidden } from "@/components/admin/fields";
import { saveHours } from "@/app/admin/actions";
import { WEEKDAYS, formatTime } from "@/lib/site/format";
import { dayError, scheduleFromHours, scheduleSignature, serializeDay, sortPeriods, splitPeriod, toMinutes, toTime, type Period, type WeeklyHour } from "@/lib/time/weekly-schedule";
import type { AdminFormState } from "@/lib/types/admin";

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const hour = Number(value.slice(0, 2)), minute = value.slice(3);
  const update = (nextHour: number, nextMinute: string) => onChange(`${String(nextHour).padStart(2, "0")}:${nextMinute}`);
  // React resets native form controls after actions. Keep their reset values in sync
  // with this controlled draft so the displayed times still match the saved hours.
  const preserveSelection = (selected: string | number) => (select: HTMLSelectElement | null) => {
    if (select) for (const option of select.options) option.defaultSelected = option.value === String(selected);
  };
  return <div className="schedule-time" role="group" aria-label={label}>
    <select ref={preserveSelection(hour % 12 || 12)} aria-label={`${label} hour`} value={hour % 12 || 12} onChange={(event) => update(Number(event.target.value) % 12 + (hour >= 12 ? 12 : 0), minute)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
    <span aria-hidden="true">:</span>
    <select ref={preserveSelection(minute)} aria-label={`${label} minute`} value={minute} onChange={(event) => update(hour, event.target.value)}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</option>)}</select>
    <select ref={preserveSelection(hour >= 12 ? "PM" : "AM")} aria-label={`${label} AM or PM`} value={hour >= 12 ? "PM" : "AM"} onChange={(event) => update(hour % 12 + (event.target.value === "PM" ? 12 : 0), minute)}><option>AM</option><option>PM</option></select>
  </div>;
}

export function WeeklyHours({ barber = "", hours, shopHours, onDirtyChange }: {
  barber?: string; hours: WeeklyHour[]; shopHours?: WeeklyHour[]; onDirtyChange?: (id: string, dirty: boolean) => void;
}) {
  const [days, setDays] = useState(() => scheduleFromHours(hours));
  const [saved, setSaved] = useState(days);
  const [source, setSource] = useState<number | null>(null);
  const [targets, setTargets] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const dirty = scheduleSignature(days) !== scheduleSignature(saved);
  const errors = days.map(dayError);
  useEffect(() => { onDirtyChange?.(barber, dirty); }, [barber, dirty, onDirtyChange]);
  useEffect(() => { if (source !== null) dialog.current?.showModal(); else dialog.current?.close(); }, [source]);
  const updatePeriods = (day: number, periods: Period[]) => setDays((previous) => previous.map((value, index) => index === day ? { ...value, periods: sortPeriods(periods) } : value));
  const newId = () => crypto.randomUUID();
  const save = async (state: AdminFormState, form: FormData) => {
    const result = await saveHours(state, form);
    if (result.success) { setSaved(days); setMessage(""); }
    return result;
  };

  return <>
    <AdminForm action={save} submit="Save weekly hours" submitDisabled={!dirty || errors.some(Boolean)}>
      <Hidden name="barber" value={barber} />
      <div className="schedule-toolbar"><span className="fine-print">{barber ? "Regular working availability" : "Regular opening hours"}</span>
        {shopHours && <button type="button" className="text-link" onClick={() => {
          if (dirty && !window.confirm("Replace this unsaved schedule with saved shop hours?")) return;
          setDays(scheduleFromHours(shopHours)); setMessage("Shop hours copied. Adjust shifts and days off before saving.");
        }}>Use shop hours</button>}
      </div>
      <div className="schedule-week">
        <div className="schedule-column-head" aria-hidden="true"><span>Day</span><span>Status</span><span>Hours</span><span>Actions</span></div>
        {WEEKDAYS.map((name, day) => {
          const value = days[day], error = errors[day];
          return <div className="schedule-row" key={name}>
            <Hidden name={`day${day + 1}`} value={serializeDay(value)} />
            <strong className="schedule-day-name">{name}</strong>
            <label className="schedule-status"><input ref={(input) => { if (input) input.defaultChecked = value.open; }} type="checkbox" role="switch" aria-label={`${name} ${barber ? "working" : "open"}`} checked={value.open} onChange={(event) => {
              setDays((previous) => previous.map((v, index) => index === day ? { ...v, open: event.target.checked } : v)); setMessage("");
            }} /><span>{value.open ? barber ? "Working" : "Open" : barber ? "Off" : "Closed"}</span></label>
            <div className="schedule-periods">
              {!value.open ? <span className="schedule-unavailable">{barber ? "Unavailable" : "Closed"}</span> : value.periods.map((period, index) => <div className="schedule-period" key={period.id}>
                {index > 0 && <span className="schedule-gap">Break: {formatTime(value.periods[index - 1].end)} – {formatTime(period.start)}</span>}
                <div className="schedule-period-inputs" aria-describedby={error ? `${uid}-error-${day}` : undefined}>
                  <TimePicker label={`${name} period ${index + 1} start`} value={period.start} onChange={(start) => updatePeriods(day, value.periods.map((p) => p.id === period.id ? { ...p, start } : p))} />
                  <span aria-hidden="true">–</span>
                  <TimePicker label={`${name} period ${index + 1} end`} value={period.end} onChange={(end) => updatePeriods(day, value.periods.map((p) => p.id === period.id ? { ...p, end } : p))} />
                  {value.periods.length > 1 && <button type="button" className="schedule-icon-button" aria-label={`Remove ${name} period ${index + 1}`} onClick={() => updatePeriods(day, value.periods.filter((p) => p.id !== period.id))}>×</button>}
                </div>
              </div>)}
              {error && <p id={`${uid}-error-${day}`} className="schedule-error" role="alert">{error}</p>}
            </div>
            <div className="schedule-row-actions">
              {value.open && <details className="schedule-menu"><summary aria-label={`More actions for ${name}`}>More</summary><div>
                <button type="button" disabled={!!error || value.periods.length >= 10 || !value.periods.some((p) => toMinutes(p.end) - toMinutes(p.start) > 30)} onClick={(event) => {
                  const candidate = value.periods.find((p) => toMinutes(p.end) - toMinutes(p.start) > 30)!;
                  updatePeriods(day, value.periods.flatMap((p) => p.id === candidate.id ? splitPeriod(p, newId()) : [p]));
                  setMessage(`${name}: added a 30-minute break. Adjust the adjacent times as needed.`);
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}>Add break</button>
                <button type="button" disabled={!!error || value.periods.length >= 10 || toMinutes(value.periods.at(-1)!.end) > 1433} onClick={(event) => {
                  const start = toMinutes(value.periods.at(-1)!.end) + 5;
                  updatePeriods(day, [...value.periods, { id: newId(), start: toTime(start), end: toTime(Math.min(start + 60, 1439)) }]);
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}>Add hours</button>
              </div></details>}
              <button type="button" className="text-link" disabled={!!error} aria-label={`Copy ${name} hours`} onClick={() => { setSource(day); setTargets([]); }}>Copy</button>
            </div>
          </div>;
        })}
      </div>
      <p className="fine-print">Breaks are gaps between periods. Split overnight hours across calendar days.</p>
      <div className="schedule-draft"><span role="status">{dirty ? "Unsaved changes" : "No unsaved changes"}</span><button type="button" className="text-link" disabled={!dirty} onClick={() => { setDays(saved); setMessage("Changes discarded."); }}>Cancel changes</button></div>
      {message && <p className="fine-print" role="status">{message}</p>}
    </AdminForm>
    <dialog ref={dialog} className="schedule-dialog" aria-labelledby={`${uid}-copy-title`} onCancel={() => setSource(null)} onClick={(event) => { if (event.target === event.currentTarget) setSource(null); }}>
      <h3 id={`${uid}-copy-title`}>{source === null ? "Copy hours" : `Copy ${WEEKDAYS[source]} hours`}</h3>
      <p>This replaces the selected days, including their {barber ? "working/off" : "open/closed"} status. Save the schedule to apply.</p>
      <div className="schedule-dialog-shortcuts"><button type="button" className="text-link" onClick={() => setTargets([0, 1, 2, 3, 4].filter((day) => day !== source))}>Select weekdays</button><button type="button" className="text-link" onClick={() => setTargets(WEEKDAYS.map((_, i) => i).filter((i) => i !== source))}>All other days</button></div>
      <div className="weekly-copy-days">{WEEKDAYS.map((day, index) => index !== source && <label className="admin-checkbox" key={day}><input type="checkbox" checked={targets.includes(index)} onChange={(event) => setTargets((previous) => event.target.checked ? [...previous, index] : previous.filter((i) => i !== index))} />{day}</label>)}</div>
      <div className="schedule-dialog-footer"><button type="button" className="button button-outline" onClick={() => setSource(null)}>Cancel</button><button type="button" className="button button-dark" disabled={!targets.length} onClick={() => {
        if (source === null) return;
        setDays((previous) => previous.map((day, index) => targets.includes(index) ? { open: previous[source].open, periods: previous[source].periods.map((p) => ({ ...p, id: newId() })) } : day));
        setMessage(`Copied ${WEEKDAYS[source]} to ${targets.map((i) => WEEKDAYS[i]).join(", ")}. Save to apply.`); setSource(null);
      }}>Replace {targets.length || "selected"} days</button></div>
    </dialog>
  </>;
}
