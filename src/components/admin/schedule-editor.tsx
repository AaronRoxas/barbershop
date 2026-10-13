"use client";

import { useCallback, useEffect, useState } from "react";
import { WeeklyHours } from "@/components/admin/weekly-hours";
import type { WeeklyHour } from "@/lib/time/weekly-schedule";

export function ScheduleEditor({ barbers, shopHours, barberHours }: {
  barbers: { id: string; name: string; is_active: boolean }[];
  shopHours: WeeklyHour[]; barberHours: (WeeklyHour & { barber_id: string })[];
}) {
  const [selected, setSelected] = useState("");
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const updateDirty = useCallback((id: string, dirty: boolean) => setDrafts((previous) => previous[id] === dirty ? previous : { ...previous, [id]: dirty }), []);
  const dirty = Object.values(drafts).some(Boolean);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute("download")) return;
      const destination = new URL(link.href);
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      if (!window.confirm("Leave this page and discard unsaved weekly hours?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);
  return <article className="admin-record schedule-editor">
    <div className="schedule-editor-heading"><div><h2>Weekly hours</h2><p>Choose a schedule. Each is saved separately.</p></div>
      <label className="schedule-target">Schedule for<select aria-label="Schedule for" value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Shop opening hours{drafts[""] ? " • Unsaved" : ""}</option>
        {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}{barber.is_active ? "" : " (disabled)"}{drafts[barber.id] ? " • Unsaved" : ""}</option>)}
      </select></label>
    </div>
    <div hidden={selected !== ""}><WeeklyHours hours={shopHours} onDirtyChange={updateDirty} /></div>
    {barbers.map((barber) => <div key={barber.id} hidden={selected !== barber.id}>
      <p className="fine-print">{barber.name}&apos;s working hours. Bookings must also fit within shop opening hours.</p>
      <WeeklyHours barber={barber.id} hours={barberHours.filter((h) => h.barber_id === barber.id)} shopHours={shopHours} onDirtyChange={updateDirty} />
    </div>)}
  </article>;
}
