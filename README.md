# Barbershop Booking Platform

Reusable, multi-tenant appointment booking for barbershops. See `docs/PROJECT_SPEC.md` and `docs/ARCHITECTURE.md`.

## Phase 1

Application shell only: Next.js, TypeScript, Tailwind, environment validation, and Supabase client helpers. No booking, database schema, or admin auth yet.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in Supabase values in `.env.local` when you start Phase 2. The public pages run without them.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run build` — production build
