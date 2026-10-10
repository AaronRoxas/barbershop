import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label>{label}<input {...props} /></label>;
}
export function TextField({ label, name, value = "", maxLength = 2000 }: { label: string; name: string; value?: string; maxLength?: number }) {
  return <label>{label}<textarea name={name} defaultValue={value} maxLength={maxLength} rows={3} /></label>;
}
export function SelectField({ label, name, value, children }: { label: string; name: string; value?: string; children: ReactNode }) {
  return <label>{label}<select name={name} defaultValue={value}>{children}</select></label>;
}
export function Hidden({ name, value }: { name: string; value: string }) { return <input type="hidden" name={name} value={value} />; }
