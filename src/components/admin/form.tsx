"use client";
import { useActionState, type ReactNode } from "react";
import type { AdminAction } from "@/lib/types/admin";

export function AdminForm({ action, children, submit = "Save changes", destructive = false }: {
  action: AdminAction; children: ReactNode; submit?: string; destructive?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="admin-form" aria-busy={pending}>
    <fieldset disabled={pending} className="admin-form-fields" aria-label="Form fields">{children}</fieldset>
    {state.error && <p className="booking-error" role="alert">{state.error}</p>}
    {state.success && <p className="admin-success" role="status">{state.success}</p>}
    <button className={`button ${destructive ? "admin-danger" : "button-dark"}`} disabled={pending}>
      {pending ? "Saving…" : submit}
    </button>
  </form>;
}
