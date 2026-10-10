export type AdminFormState = { error?: string; success?: string };
export type AdminAction = (state: AdminFormState, form: FormData) => Promise<AdminFormState>;
